from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'tests', views.EyeTrackingTestViewSet, basename='test')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/refresh/', views.RefreshTokenView.as_view(), name='refresh'),
]
