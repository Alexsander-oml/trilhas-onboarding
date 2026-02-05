from django.db import models
from django.utils import timezone
from users.models import User


class Notification(models.Model):
    """
    Modelo central de Notificações, desacoplado das outras entidades.
    Garante performance e histórico completo de notificações.
    """
    NOTIFICATION_TYPES = [
        ("enrollment", "Matrícula em Trilha"),
        ("track_completed", "Conclusão de Trilha"),
        ("deadline_15days", "Lembrete - 15 dias para conclusão"),
        ("deadline_7days", "Lembrete - 7 dias para conclusão"),
        ("deadline_1day", "Lembrete - 1 dia para conclusão"),
        ("quiz_result", "Resultado de Quiz"),
        ("module_completed", "Módulo Concluído"),
        ("activity_completed", "Atividade Concluída"),
        ("system", "Notificação do Sistema"),
    ]

    id_notification = models.AutoField(primary_key=True)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="Usuário destinatário da notificação",
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        default="system",
        help_text="Tipo de notificação para categorização e filtros",
    )
    title = models.CharField(
        max_length=255,
        help_text="Título/Assunto da notificação",
    )
    message = models.TextField(
        help_text="Corpo da mensagem da notificação",
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Indica se a notificação foi lida",
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Data/hora em que a notificação foi lida",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Data/hora de criação da notificação",
    )

    # Campos opcionais para rastreabilidade
    related_track = models.ForeignKey(
        "Trilha",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Trilha relacionada (se aplicável)",
    )
    related_module = models.ForeignKey(
        "Modulo",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Módulo relacionado (se aplicável)",
    )
    related_activity = models.ForeignKey(
        "Atividade",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Atividade relacionada (se aplicável)",
    )
    related_enrollment = models.ForeignKey(
        "Matricula",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Matrícula relacionada (se aplicável)",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "-created_at"]),
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["notification_type"]),
        ]
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"

    def __str__(self):
        return f"[{self.notification_type}] {self.title} - {self.recipient.email}"

    def mark_as_read(self):
        """Marca a notificação como lida"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])

    def mark_as_unread(self):
        """Marca a notificação como não lida"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=["is_read", "read_at"])


class NotificationPreference(models.Model):
    """
    Modelo para armazenar preferências de notificação do usuário.
    Permite que cada usuário controle quais tipos de notificação deseja receber.
    """
    id_preference = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="notification_preference",
        help_text="Usuário dono da preferência",
    )

    # Preferências por tipo de notificação
    enrollment_enabled = models.BooleanField(
        default=True,
        help_text="Receber notificações de matrícula",
    )
    track_completed_enabled = models.BooleanField(
        default=True,
        help_text="Receber notificações de conclusão de trilha",
    )
    deadline_reminders_enabled = models.BooleanField(
        default=True,
        help_text="Receber lembretes de prazo",
    )
    quiz_results_enabled = models.BooleanField(
        default=True,
        help_text="Receber notificações de resultado de quiz",
    )
    activity_completed_enabled = models.BooleanField(
        default=True,
        help_text="Receber notificações de atividade concluída",
    )
    system_notifications_enabled = models.BooleanField(
        default=True,
        help_text="Receber notificações do sistema",
    )

    # Canais de notificação (para futuras integrações)
    email_enabled = models.BooleanField(
        default=False,
        help_text="Enviar notificações por email",
    )
    push_enabled = models.BooleanField(
        default=False,
        help_text="Enviar notificações push",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Data/hora da última atualização",
    )

    class Meta:
        verbose_name = "Preferência de Notificação"
        verbose_name_plural = "Preferências de Notificação"

    def __str__(self):
        return f"Preferências de {self.user.email}"

    @classmethod
    def get_or_create_for_user(cls, user):
        """Obtém ou cria as preferências padrão para um usuário"""
        preference, created = cls.objects.get_or_create(user=user)
        return preference
