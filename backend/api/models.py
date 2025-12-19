from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    """Modèle Patient"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    age = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'


class EyeTrackingTest(models.Model):
    """Modèle Test de suivi oculaire"""
    EXCELLENT = 'excellent'
    GOOD = 'good'
    ACCEPTABLE = 'acceptable'
    POOR = 'poor'

    RESULT_CHOICES = [
        (EXCELLENT, 'Excellent'),
        (GOOD, 'Bon'),
        (ACCEPTABLE, 'Acceptable'),
        (POOR, 'Faible'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='tests')
    test_date = models.DateTimeField(auto_now_add=True)
    
    # Données du test
    duration = models.FloatField(help_text="Durée totale en secondes")
    gaze_time = models.FloatField(help_text="Temps de fixation en secondes")
    tracking_percentage = models.FloatField(help_text="Pourcentage de suivi")
    
    # Fixations
    fixation_count = models.IntegerField()
    avg_fixation_duration = models.FloatField(help_text="Durée moyenne des fixations en ms")
    max_fixation_duration = models.FloatField(help_text="Durée max des fixations en ms")
    min_fixation_duration = models.FloatField(help_text="Durée min des fixations en ms")
    
    # Distance œil-écran
    avg_eye_screen_distance = models.FloatField(help_text="Distance moyenne en cm", null=True, blank=True)
    
    # Stabilité et cohérence
    gaze_stability = models.FloatField(help_text="Score de stabilité (0-1)")
    gaze_consistency = models.FloatField(help_text="Score de cohérence (0-1)")
    
    # Yeux
    left_eye_open = models.BooleanField()
    right_eye_open = models.BooleanField()
    
    # Résultat
    result = models.CharField(max_length=20, choices=RESULT_CHOICES)
    clinical_evaluation = models.TextField()
    recommended_follow_up = models.BooleanField(default=False)
    
    # Données brutes (JSON)
    raw_data = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Test {self.id} - {self.patient} - {self.test_date}"

    class Meta:
        verbose_name = 'Test de suivi oculaire'
        verbose_name_plural = 'Tests de suivi oculaire'
        ordering = ['-test_date']


class MLPrediction(models.Model):
    """Modèle pour les prédictions ML"""
    test = models.OneToOneField(EyeTrackingTest, on_delete=models.CASCADE, related_name='ml_prediction')
    
    # Prédictions du modèle
    predicted_result = models.CharField(max_length=20, choices=EyeTrackingTest.RESULT_CHOICES)
    confidence_score = models.FloatField(help_text="Confiance de la prédiction (0-1)")
    
    # Features utilisées
    features = models.JSONField()
    
    # Métriques
    anomaly_detected = models.BooleanField(default=False)
    anomaly_score = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Prédiction ML'
        verbose_name_plural = 'Prédictions ML'
