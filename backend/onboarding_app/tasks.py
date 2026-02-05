"""
Tarefas agendadas (cron jobs) para notificações.
Executadas periodicamente para verificar prazos e enviar lembretes.
"""

from datetime import timedelta
from django.utils import timezone
from .models import Matricula
from .services import NotificationService


def send_deadline_reminders():
    """
    Rotina de Lembretes de Prazo.

    Executa diariamente (ex: todo dia às 08:00).

    Lógica:
    - Busca todas as matrículas ativas onde data_conclusao - data_atual seja igual a 15, 7 ou 1
    - Para cada registro encontrado, gera uma Notification para o aprendiz
    """

    now = timezone.now()
    reminders_sent = 0

    active_enrollments = Matricula.objects.filter(
        status="EmAndamento"
    ).select_related("id_usuario", "id_trilha")

    for enrollment in active_enrollments:
        try:
            if not enrollment.data_fim:
                if enrollment.id_trilha.prazo_recomendado:
                    deadline = enrollment.data_inicio + timedelta(
                        days=enrollment.id_trilha.prazo_recomendado
                    )
                else:
                    continue
            else:
                deadline = enrollment.data_fim

            days_remaining = (deadline - now).days

            if days_remaining in [15, 7, 1]:
                if not _reminder_already_sent(enrollment, days_remaining):
                    NotificationService.notify_deadline_reminder(
                        user=enrollment.id_usuario,
                        enrollment=enrollment,
                        days_remaining=days_remaining,
                    )
                    reminders_sent += 1

        except Exception as e:
            print(f"Erro ao enviar lembrete para matrícula {enrollment.id_matricula}: {e}")

    print(f"Lembretes de prazo enviados: {reminders_sent}")
    return reminders_sent


def _reminder_already_sent(enrollment, days_remaining):
    """
    Verifica se um lembrete já foi enviado para este enrollment neste dia.
    """
    from .models import Notification

    notification_type_map = {
        15: "deadline_15days",
        7: "deadline_7days",
        1: "deadline_1day",
    }

    notification_type = notification_type_map.get(days_remaining)
    if not notification_type:
        return False

    today = timezone.now().date()

    return Notification.objects.filter(
        recipient=enrollment.id_usuario,
        notification_type=notification_type,
        related_enrollment=enrollment,
        created_at__date=today,
    ).exists()


def cleanup_old_notifications(days=90):
    """
    Limpa notificações antigas (mais de X dias).
    """
    from .models import Notification

    cutoff_date = timezone.now() - timedelta(days=days)

    deleted_count, _ = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_read=True,
    ).delete()

    print(f"Notificações antigas removidas: {deleted_count}")
    return deleted_count
