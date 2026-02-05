"""
URLs para endpoints de Notificações.
Inclua este arquivo no urls.py principal do projeto.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views_notifications import (
    NotificationViewSet,
    NotificationPreferenceViewSet,
    NotificationUnreadCountView,
)

# Criar router para ViewSets
router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(
    r"notification-preferences",
    NotificationPreferenceViewSet,
    basename="notification-preference",
)
router.register(
    r"notifications/unread-count",
    NotificationUnreadCountView,
    basename="notification-unread-count",
)

urlpatterns = router.urls

# URLs adicionais podem ser adicionadas aqui se necessário
# urlpatterns += [
#     path('notifications/custom/', custom_view, name='custom-notification'),
# ]
