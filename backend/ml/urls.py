from django.urls import path
from . import views

urlpatterns = [
    path('train/', views.TrainModelView.as_view(), name='train_model'),
    path('evaluate/', views.EvaluateModelView.as_view(), name='evaluate_model'),
    path('export/', views.ExportModelView.as_view(), name='export_model'),
]
