"""
Serializers para Notificações.
Responsáveis por serializar dados de notificações para a API.
"""

from rest_framework import serializers
from .models_notifications import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para listar e detalhar notificações.
    """
    recipient_email = serializers.CharField(
        source="recipient.email",
        read_only=True,
        help_text="Email do usuário destinatário",
    )
    related_track_title = serializers.CharField(
        source="related_track.titulo",
        read_only=True,
        allow_null=True,
        help_text="Título da trilha relacionada",
    )
    related_module_title = serializers.CharField(
        source="related_module.titulo",
        read_only=True,
        allow_null=True,
        help_text="Título do módulo relacionado",
    )
    related_activity_title = serializers.CharField(
        source="related_activity.titulo",
        read_only=True,
        allow_null=True,
        help_text="Título da atividade relacionada",
    )

    class Meta:
        model = Notification
        fields = [
            "id_notification",
            "recipient_email",
            "notification_type",
            "title",
            "message",
            "is_read",
            "read_at",
            "created_at",
            "related_track_title",
            "related_module_title",
            "related_activity_title",
        ]
        read_only_fields = [
            "id_notification",
            "recipient_email",
            "notification_type",
            "title",
            "message",
            "is_read",
            "read_at",
            "created_at",
            "related_track_title",
            "related_module_title",
            "related_activity_title",
        ]


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para atualizar status de notificação (marcar como lida).
    """

    class Meta:
        model = Notification
        fields = ["is_read"]

    def update(self, instance, validated_data):
        """
        Atualiza o status de leitura da notificação.
        """
        if "is_read" in validated_data:
            is_read = validated_data["is_read"]
            if is_read:
                instance.mark_as_read()
            else:
                instance.mark_as_unread()

        return instance


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar notificações (com menos campos).
    """

    class Meta:
        model = Notification
        fields = [
            "id_notification",
            "notification_type",
            "title",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer para gerenciar preferências de notificação do usuário.
    """
    user_email = serializers.CharField(
        source="user.email",
        read_only=True,
        help_text="Email do usuário",
    )

    class Meta:
        model = NotificationPreference
        fields = [
            "id_preference",
            "user_email",
            "enrollment_enabled",
            "track_completed_enabled",
            "deadline_reminders_enabled",
            "quiz_results_enabled",
            "activity_completed_enabled",
            "system_notifications_enabled",
            "email_enabled",
            "push_enabled",
            "updated_at",
        ]
        read_only_fields = [
            "id_preference",
            "user_email",
            "updated_at",
        ]


class NotificationStatsSerializer(serializers.Serializer):
    """
    Serializer para retornar estatísticas de notificações do usuário.
    """
    total_notifications = serializers.IntegerField(help_text="Total de notificações")
    unread_count = serializers.IntegerField(help_text="Número de notificações não lidas")
    read_count = serializers.IntegerField(help_text="Número de notificações lidas")
    notifications_by_type = serializers.DictField(
        child=serializers.IntegerField(),
        help_text="Contagem de notificações por tipo",
    )
