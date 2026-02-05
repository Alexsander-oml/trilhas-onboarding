"""
Views para endpoints de Notificações.
Implementa listagem, detalhes, marcação como lida e gerenciamento de preferências.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from .models_notifications import Notification, NotificationPreference
from .serializers_notifications import (
    NotificationSerializer,
    NotificationUpdateSerializer,
    NotificationListSerializer,
    NotificationPreferenceSerializer,
    NotificationStatsSerializer,
)
from .services import NotificationService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para gerenciar notificações do usuário logado.
    
    Endpoints:
    - GET /api/notifications/ - Listar notificações paginadas
    - GET /api/notifications/{id}/ - Detalhar notificação
    - PATCH /api/notifications/{id}/read/ - Marcar como lida
    - POST /api/notifications/mark-all-as-read/ - Marcar todas como lidas
    - GET /api/notifications/stats/ - Obter estatísticas
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = None  # Pode ser configurado globalmente

    def get_queryset(self):
        """
        Retorna apenas as notificações do usuário logado.
        """
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related(
            "related_track",
            "related_module",
            "related_activity",
            "related_enrollment"
        )

    def list(self, request, *args, **kwargs):
        """
        Lista notificações do usuário com filtros opcionais.
        
        Query Parameters:
        - unread_only: bool - Retorna apenas notificações não lidas
        - notification_type: str - Filtra por tipo
        - limit: int - Limite de resultados (padrão: 50)
        """
        queryset = self.get_queryset()
        
        # Filtro: apenas não lidas
        unread_only = request.query_params.get("unread_only", "false").lower() == "true"
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        # Filtro: por tipo de notificação
        notification_type = request.query_params.get("notification_type")
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Limite de resultados
        limit = int(request.query_params.get("limit", 50))
        queryset = queryset[:limit]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": len(serializer.data),
            "results": serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        """
        Retorna detalhes de uma notificação específica.
        Marca automaticamente como lida ao visualizar.
        """
        instance = self.get_object()
        
        # Verificar permissão: apenas o destinatário pode ver
        if instance.recipient != request.user:
            return Response(
                {"detail": "Você não tem permissão para acessar esta notificação."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Marcar como lida
        instance.mark_as_read()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_as_read(self, request, pk=None):
        """
        Marca uma notificação como lida.
        
        Endpoint: PATCH /api/notifications/{id}/read/
        """
        notification = self.get_object()
        
        # Verificar permissão
        if notification.recipient != request.user:
            return Response(
                {"detail": "Você não tem permissão para atualizar esta notificação."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        
        return Response({
            "detail": "Notificação marcada como lida.",
            "notification": serializer.data
        })

    @action(detail=False, methods=["post"], url_path="mark-all-as-read")
    def mark_all_as_read(self, request):
        """
        Marca todas as notificações do usuário como lidas.
        
        Endpoint: POST /api/notifications/mark-all-as-read/
        """
        NotificationService.mark_all_as_read(request.user)
        
        unread_count = NotificationService.get_unread_count(request.user)
        
        return Response({
            "detail": "Todas as notificações foram marcadas como lidas.",
            "unread_count": unread_count
        })

    @action(detail=False, methods=["get"], url_path="stats")
    def get_stats(self, request):
        """
        Retorna estatísticas de notificações do usuário.
        
        Endpoint: GET /api/notifications/stats/
        """
        queryset = self.get_queryset()
        
        total_notifications = queryset.count()
        unread_count = queryset.filter(is_read=False).count()
        read_count = queryset.filter(is_read=True).count()
        
        # Contagem por tipo
        notifications_by_type = dict(
            queryset.values("notification_type").annotate(
                count=Count("id_notification")
            ).values_list("notification_type", "count")
        )
        
        data = {
            "total_notifications": total_notifications,
            "unread_count": unread_count,
            "read_count": read_count,
            "notifications_by_type": notifications_by_type,
        }
        
        serializer = NotificationStatsSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=["delete"], url_path="clear-all")
    def clear_all(self, request):
        """
        Deleta todas as notificações lidas do usuário.
        
        Endpoint: DELETE /api/notifications/clear-all/
        """
        deleted_count, _ = Notification.objects.filter(
            recipient=request.user,
            is_read=True
        ).delete()
        
        return Response({
            "detail": f"{deleted_count} notificação(ões) deletada(s).",
            "deleted_count": deleted_count
        })


class NotificationPreferenceViewSet(viewsets.ViewSet):
    """
    ViewSet para gerenciar preferências de notificação do usuário.
    
    Endpoints:
    - GET /api/notification-preferences/ - Obter preferências
    - PATCH /api/notification-preferences/ - Atualizar preferências
    """
    
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Retorna as preferências de notificação do usuário.
        
        Endpoint: GET /api/notification-preferences/
        """
        preference = NotificationPreference.get_or_create_for_user(request.user)
        serializer = NotificationPreferenceSerializer(preference)
        return Response(serializer.data)

    def partial_update(self, request):
        """
        Atualiza as preferências de notificação do usuário.
        
        Endpoint: PATCH /api/notification-preferences/
        
        Body:
        {
            "enrollment_enabled": true,
            "track_completed_enabled": true,
            "deadline_reminders_enabled": true,
            ...
        }
        """
        preference = NotificationPreference.get_or_create_for_user(request.user)
        serializer = NotificationPreferenceSerializer(
            preference,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "detail": "Preferências atualizadas com sucesso.",
                "preferences": serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationUnreadCountView(viewsets.ViewSet):
    """
    View para obter contagem de notificações não lidas.
    
    Endpoint:
    - GET /api/notifications/unread-count/ - Obter contagem
    """
    
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Retorna a contagem de notificações não lidas.
        
        Endpoint: GET /api/notifications/unread-count/
        """
        unread_count = NotificationService.get_unread_count(request.user)
        
        return Response({
            "unread_count": unread_count
        })
