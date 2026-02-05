"""
Configuração do Django Admin para Notificações.
"""

from django.contrib import admin
from .models_notifications import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Admin para gerenciar Notificações.
    """
    list_display = [
        "id_notification",
        "recipient",
        "notification_type",
        "title",
        "is_read",
        "created_at",
    ]
    list_filter = [
        "notification_type",
        "is_read",
        "created_at",
    ]
    search_fields = [
        "recipient__email",
        "title",
        "message",
    ]
    readonly_fields = [
        "id_notification",
        "created_at",
        "read_at",
    ]
    fieldsets = (
        (
            "Informações Básicas",
            {
                "fields": (
                    "id_notification",
                    "recipient",
                    "notification_type",
                    "title",
                    "message",
                )
            },
        ),
        (
            "Status de Leitura",
            {
                "fields": (
                    "is_read",
                    "read_at",
                )
            },
        ),
        (
            "Relacionamentos",
            {
                "fields": (
                    "related_track",
                    "related_module",
                    "related_activity",
                    "related_enrollment",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )
    ordering = ["-created_at"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """
    Admin para gerenciar Preferências de Notificação.
    """
    list_display = [
        "id_preference",
        "user",
        "enrollment_enabled",
        "track_completed_enabled",
        "deadline_reminders_enabled",
        "quiz_results_enabled",
        "activity_completed_enabled",
        "system_notifications_enabled",
        "email_enabled",
        "push_enabled",
    ]
    list_filter = [
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
    search_fields = [
        "user__email",
        "user__username",
    ]
    readonly_fields = [
        "id_preference",
        "updated_at",
    ]
    fieldsets = (
        (
            "Usuário",
            {
                "fields": (
                    "id_preference",
                    "user",
                )
            },
        ),
        (
            "Preferências de Notificação",
            {
                "fields": (
                    "enrollment_enabled",
                    "track_completed_enabled",
                    "deadline_reminders_enabled",
                    "quiz_results_enabled",
                    "activity_completed_enabled",
                    "system_notifications_enabled",
                )
            },
        ),
        (
            "Canais de Notificação",
            {
                "fields": (
                    "email_enabled",
                    "push_enabled",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("updated_at",),
                "classes": ("collapse",),
            },
        ),
    )
    ordering = ["-updated_at"]
