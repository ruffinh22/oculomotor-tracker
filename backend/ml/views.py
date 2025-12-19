from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from api.models import EyeTrackingTest
from .predictor import EyeTrackingPredictor
import numpy as np
from sklearn.preprocessing import label_binarize

class TrainModelView(APIView):
    """Vue pour entraîner le modèle ML"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        try:
            # Récupère tous les tests
            tests = EyeTrackingTest.objects.all()
            
            if tests.count() < 10:
                return Response(
                    {'error': 'Au moins 10 tests sont nécessaires pour entraîner le modèle'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Prépare les données
            predictor = EyeTrackingPredictor()
            
            X = []
            y = []
            
            result_map = {'excellent': 0, 'good': 1, 'acceptable': 2, 'poor': 3}
            
            for test in tests:
                features = predictor.extract_features({
                    'duration': test.duration,
                    'gaze_time': test.gaze_time,
                    'fixation_count': test.fixation_count,
                    'raw_data': test.raw_data
                })
                X.append(features)
                y.append(result_map.get(test.result, 3))
            
            X = np.array(X)
            y = label_binarize(y, classes=[0, 1, 2, 3])
            
            # Entraîne le modèle
            predictor.train_model(X, y, epochs=50)
            
            # Sauvegarde le modèle
            predictor.save_model('/app/ml_models/eye_tracking_model.h5')
            
            return Response(
                {'message': 'Modèle entraîné avec succès'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EvaluateModelView(APIView):
    """Vue pour évaluer le modèle ML"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            predictor = EyeTrackingPredictor()
            tests = EyeTrackingTest.objects.all()
            
            correct_predictions = 0
            total_predictions = 0
            
            for test in tests:
                prediction = predictor.predict(test)
                if prediction['result'] == test.result:
                    correct_predictions += 1
                total_predictions += 1
            
            accuracy = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0
            
            return Response(
                {
                    'total_tests': total_predictions,
                    'correct_predictions': correct_predictions,
                    'accuracy': round(accuracy, 2)
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExportModelView(APIView):
    """Vue pour exporter le modèle"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        try:
            predictor = EyeTrackingPredictor()
            export_path = request.data.get('path', '/app/ml_models/eye_tracking_model_export.h5')
            predictor.save_model(export_path)
            
            return Response(
                {'message': f'Modèle exporté vers {export_path}'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
