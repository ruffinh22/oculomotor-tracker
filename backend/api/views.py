from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpResponse
from .models import Patient, EyeTrackingTest, MLPrediction
from .serializers import PatientSerializer, EyeTrackingTestSerializer, EyeTrackingTestCreateSerializer
from ml.predictor import EyeTrackingPredictor
from .pdf_generator import generate_patient_report_pdf, generate_test_report_pdf

class RegisterView(APIView):
    """Vue d'enregistrement utilisateur"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        age = request.data.get('age')

        if not username or not email or not password:
            return Response(
                {'error': 'Les champs username, email et password sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Ce nom d\'utilisateur existe déjà'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Cet email existe déjà'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )
                patient = Patient.objects.create(user=user, age=age)
            
            return Response(
                {
                    'message': 'Utilisateur créé avec succès',
                    'user_id': user.id,
                    'username': user.username
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """Vue de connexion"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username et password requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {'error': 'Identifiants invalides'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Génère les tokens JWT
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            status=status.HTTP_200_OK
        )


class PatientViewSet(viewsets.ModelViewSet):
    """ViewSet pour les patients"""
    permission_classes = [IsAuthenticated]
    serializer_class = PatientSerializer
    
    def get_queryset(self):
        """Les admins voient tous les patients, les patients ne voient que leur propre dossier"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin voit tous les patients
            return Patient.objects.all()
        else:
            # Patient voit uniquement son propre dossier
            return Patient.objects.filter(user=user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Retourne les données du patient courant"""
        try:
            patient = Patient.objects.get(user=request.user)
            serializer = self.get_serializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Profil patient non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def results(self, request):
        """Retourne tous les résultats de tests du patient"""
        try:
            patient = Patient.objects.get(user=request.user)
            tests = EyeTrackingTest.objects.filter(patient=patient).order_by('-created_at')
            serializer = EyeTrackingTestSerializer(tests, many=True)
            return Response({
                'patient': PatientSerializer(patient).data,
                'tests': serializer.data,
                'total_tests': len(tests)
            })
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Profil patient non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def export_pdf(self, request):
        """Exporte tous les résultats en PDF"""
        try:
            patient = Patient.objects.get(user=request.user)
            tests = EyeTrackingTest.objects.filter(patient=patient).order_by('-created_at')
            
            pdf_buffer = generate_patient_report_pdf(patient, tests)
            
            response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Resultats_{patient.user.username}_{patient.id}.pdf"'
            return response
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Profil patient non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EyeTrackingTestViewSet(viewsets.ModelViewSet):
    """ViewSet pour les tests de suivi oculaire"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EyeTrackingTestCreateSerializer
        return EyeTrackingTestSerializer

    def get_queryset(self):
        """Les admins voient tous les tests, les patients ne voient que leurs propres tests"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin voit tous les tests
            return EyeTrackingTest.objects.all()
        else:
            # Patient voit uniquement ses propres tests
            try:
                patient = Patient.objects.get(user=user)
                return EyeTrackingTest.objects.filter(patient=patient)
            except Patient.DoesNotExist:
                return EyeTrackingTest.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        """Crée un test et lance la prédiction ML"""
        user = self.request.user
        test_data = serializer.validated_data
        raw_data = test_data.get('raw_data', {})
        
        # Détermine le patient
        patient_id = test_data.get('patient_id')
        if patient_id:
            # Si un patient_id est spécifié, l'utilisateur doit être admin ou être ce patient
            patient = Patient.objects.get(id=patient_id)
            if not user.is_staff and patient.user != user:
                from rest_framework import serializers as drf_serializers
                raise drf_serializers.ValidationError('Vous n\'avez pas la permission de créer un test pour ce patient')
        else:
            # Sinon, crée le test pour l'utilisateur courant
            patient = Patient.objects.get(user=user)

        # Crée le test avec les valeurs fournies et les valeurs par défaut
        test = serializer.save(
            patient=patient,
            # Valeurs fournies par le frontend
            duration=test_data.get('duration', 0),
            gaze_time=test_data.get('gaze_time', 0),
            tracking_percentage=test_data.get('tracking_percentage', 0),
            fixation_count=test_data.get('fixation_count', 0),
            avg_fixation_duration=test_data.get('avg_fixation_duration', 0),
            max_fixation_duration=test_data.get('max_fixation_duration', 0),
            min_fixation_duration=test_data.get('min_fixation_duration', 0),
            gaze_stability=test_data.get('gaze_stability', 0),
            gaze_consistency=test_data.get('gaze_consistency', 0),
            # Valeurs par défaut
            result='poor',
            clinical_evaluation='En attente',
            left_eye_open=raw_data.get('eyeStatus', {}).get('leftEyeOpen', False),
            right_eye_open=raw_data.get('eyeStatus', {}).get('rightEyeOpen', False),
            raw_data=raw_data
        )

        # Lance la prédiction ML
        try:
            predictor = EyeTrackingPredictor()
            prediction = predictor.predict(test)
            
            # Sauvegarde la prédiction
            MLPrediction.objects.create(
                test=test,
                predicted_result=prediction['result'],
                confidence_score=prediction['confidence'],
                features=prediction.get('features', {}),
                anomaly_detected=prediction.get('anomaly_detected', False),
                anomaly_score=prediction.get('anomaly_score', 0.0)
            )
            
            # Met à jour le test avec les résultats de la prédiction
            test.result = prediction['result']
            test.clinical_evaluation = prediction['clinical_evaluation']
            test.recommended_follow_up = prediction['recommended_follow_up']
            test.tracking_percentage = prediction.get('tracking_percentage', 0)
            test.gaze_stability = prediction.get('gaze_stability', 0)
            test.gaze_consistency = prediction.get('gaze_consistency', 0)
            test.save()
        except Exception as e:
            print(f"Erreur lors de la prédiction ML: {str(e)}")

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Exporte un test spécifique en PDF"""
        try:
            test = self.get_object()
            patient = test.patient
            
            # Vérifier que l'utilisateur a accès à ce test
            if patient.user != request.user:
                return Response(
                    {'error': 'Accès refusé'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            pdf_buffer = generate_test_report_pdf(patient, test)
            
            response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Test_{test.id}_{test.created_at.strftime("%d%m%Y")}.pdf"'
            return response
        except EyeTrackingTest.DoesNotExist:
            return Response(
                {'error': 'Test non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Retourne les statistiques du patient"""
        user = request.user
        patient = Patient.objects.get(user=user)
        tests = self.get_queryset()

        if tests.count() == 0:
            return Response({
                'total_tests': 0,
                'message': 'Aucun test disponible'
            })

        excellent_count = tests.filter(result=EyeTrackingTest.EXCELLENT).count()
        good_count = tests.filter(result=EyeTrackingTest.GOOD).count()
        acceptable_count = tests.filter(result=EyeTrackingTest.ACCEPTABLE).count()
        poor_count = tests.filter(result=EyeTrackingTest.POOR).count()

        avg_tracking = tests.aggregate(models.Avg('tracking_percentage'))['tracking_percentage__avg']
        avg_stability = tests.aggregate(models.Avg('gaze_stability'))['gaze_stability__avg']

        return Response({
            'total_tests': tests.count(),
            'results': {
                'excellent': excellent_count,
                'good': good_count,
                'acceptable': acceptable_count,
                'poor': poor_count
            },
            'averages': {
                'tracking_percentage': round(avg_tracking, 2),
                'gaze_stability': round(avg_stability, 2)
            }
        })


class RefreshTokenView(APIView):
    """Vue pour rafraîchir le token JWT"""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response(
                {
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Token invalide ou expiré'},
                status=status.HTTP_401_UNAUTHORIZED
            )


# Import models pour les statistiques
from django.db import models
