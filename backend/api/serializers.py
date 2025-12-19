from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, EyeTrackingTest, MLPrediction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tests_count = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ['id', 'user', 'age', 'tests_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tests_count(self, obj):
        return obj.tests.count()


class MLPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLPrediction
        fields = ['predicted_result', 'confidence_score', 'anomaly_detected', 'anomaly_score', 'created_at']
        read_only_fields = ['created_at']


class EyeTrackingTestSerializer(serializers.ModelSerializer):
    ml_prediction = MLPredictionSerializer(read_only=True)
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = EyeTrackingTest
        fields = [
            'id',
            'patient',
            'patient_name',
            'test_date',
            'duration',
            'gaze_time',
            'tracking_percentage',
            'fixation_count',
            'avg_fixation_duration',
            'max_fixation_duration',
            'min_fixation_duration',
            'avg_eye_screen_distance',
            'gaze_stability',
            'gaze_consistency',
            'left_eye_open',
            'right_eye_open',
            'result',
            'clinical_evaluation',
            'recommended_follow_up',
            'ml_prediction',
            'created_at'
        ]
        read_only_fields = ['id', 'test_date', 'created_at', 'result', 'clinical_evaluation', 'recommended_follow_up', 'ml_prediction']

    def get_patient_name(self, obj):
        """Retourne le nom complet du patient"""
        if obj.patient and obj.patient.user:
            first_name = obj.patient.user.first_name or ''
            last_name = obj.patient.user.last_name or ''
            full_name = f"{first_name} {last_name}".strip()
            return full_name if full_name else obj.patient.user.username
        return "— —"


class EyeTrackingTestCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de tests avec les données brutes"""
    patient_id = serializers.IntegerField(required=False, write_only=True)
    
    class Meta:
        model = EyeTrackingTest
        fields = [
            'patient_id',
            'duration',
            'gaze_time',
            'tracking_percentage',
            'fixation_count',
            'avg_fixation_duration',
            'max_fixation_duration',
            'min_fixation_duration',
            'gaze_stability',
            'gaze_consistency',
            'raw_data'
        ]
