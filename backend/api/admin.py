from django.contrib import admin
from .models import Patient, EyeTrackingTest, MLPrediction


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'created_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('created_at',)


@admin.register(EyeTrackingTest)
class EyeTrackingTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'test_date', 'result', 'tracking_percentage')
    list_filter = ('result', 'test_date')
    search_fields = ('patient__user__username',)
    readonly_fields = ('test_date', 'created_at')


@admin.register(MLPrediction)
class MLPredictionAdmin(admin.ModelAdmin):
    list_display = ('test', 'predicted_result', 'confidence_score', 'anomaly_detected')
    list_filter = ('predicted_result', 'anomaly_detected')
    readonly_fields = ('created_at',)
