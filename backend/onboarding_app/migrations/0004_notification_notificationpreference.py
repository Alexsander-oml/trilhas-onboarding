"""
Migração para criar modelos de Notificação e NotificationPreference.
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("onboarding_app", "0003_materialvideo_materialpdf_materialleitura"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id_notification", models.AutoField(primary_key=True, serialize=False)),
                (
                    "notification_type",
                    models.CharField(
                        choices=[
                            ("enrollment", "Matrícula em Trilha"),
                            ("track_completed", "Conclusão de Trilha"),
                            ("deadline_15days", "Lembrete - 15 dias para conclusão"),
                            ("deadline_7days", "Lembrete - 7 dias para conclusão"),
                            ("deadline_1day", "Lembrete - 1 dia para conclusão"),
                            ("quiz_result", "Resultado de Quiz"),
                            ("module_completed", "Módulo Concluído"),
                            ("activity_completed", "Atividade Concluída"),
                            ("system", "Notificação do Sistema"),
                        ],
                        default="system",
                        help_text="Tipo de notificação para categorização e filtros",
                        max_length=50,
                    ),
                ),
                (
                    "title",
                    models.CharField(help_text="Título/Assunto da notificação", max_length=255),
                ),
                (
                    "message",
                    models.TextField(help_text="Corpo da mensagem da notificação"),
                ),
                (
                    "is_read",
                    models.BooleanField(default=False, help_text="Indica se a notificação foi lida"),
                ),
                (
                    "read_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="Data/hora em que a notificação foi lida",
                        null=True,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        help_text="Data/hora de criação da notificação",
                    ),
                ),
                (
                    "related_activity",
                    models.ForeignKey(
                        blank=True,
                        help_text="Atividade relacionada (se aplicável)",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="notifications",
                        to="onboarding_app.atividade",
                    ),
                ),
                (
                    "related_enrollment",
                    models.ForeignKey(
                        blank=True,
                        help_text="Matrícula relacionada (se aplicável)",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="notifications",
                        to="onboarding_app.matricula",
                    ),
                ),
                (
                    "related_module",
                    models.ForeignKey(
                        blank=True,
                        help_text="Módulo relacionado (se aplicável)",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="notifications",
                        to="onboarding_app.modulo",
                    ),
                ),
                (
                    "related_track",
                    models.ForeignKey(
                        blank=True,
                        help_text="Trilha relacionada (se aplicável)",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="notifications",
                        to="onboarding_app.trilha",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        help_text="Usuário destinatário da notificação",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Notificação",
                "verbose_name_plural": "Notificações",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                ("id_preference", models.AutoField(primary_key=True, serialize=False)),
                (
                    "enrollment_enabled",
                    models.BooleanField(
                        default=True, help_text="Receber notificações de matrícula"
                    ),
                ),
                (
                    "track_completed_enabled",
                    models.BooleanField(
                        default=True, help_text="Receber notificações de conclusão de trilha"
                    ),
                ),
                (
                    "deadline_reminders_enabled",
                    models.BooleanField(default=True, help_text="Receber lembretes de prazo"),
                ),
                (
                    "quiz_results_enabled",
                    models.BooleanField(
                        default=True, help_text="Receber notificações de resultado de quiz"
                    ),
                ),
                (
                    "activity_completed_enabled",
                    models.BooleanField(
                        default=True, help_text="Receber notificações de atividade concluída"
                    ),
                ),
                (
                    "system_notifications_enabled",
                    models.BooleanField(default=True, help_text="Receber notificações do sistema"),
                ),
                (
                    "email_enabled",
                    models.BooleanField(default=False, help_text="Enviar notificações por email"),
                ),
                (
                    "push_enabled",
                    models.BooleanField(default=False, help_text="Enviar notificações push"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, help_text="Data/hora da última atualização"
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        help_text="Usuário dono da preferência",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_preference",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Preferência de Notificação",
                "verbose_name_plural": "Preferências de Notificação",
            },
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["recipient", "-created_at"], name="onboarding__recipie_idx"),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["recipient", "is_read"], name="onboarding__recipie_is_read_idx"),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["notification_type"], name="onboarding__notifi_type_idx"),
        ),
    ]
