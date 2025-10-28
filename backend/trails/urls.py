from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrailViewSet

router = DefaultRouter()
router.register(r'trails', TrailViewSet, basename='trail')

urlpatterns = [
    path('', include(router.urls)),
]
