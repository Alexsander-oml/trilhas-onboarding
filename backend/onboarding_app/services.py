"""
Service Layer para Notificações.
Responsável por validar destinatários, montar templates e persistir notificações.
"""

from django.utils import timezone
from .models import Notification, NotificationPreference


class NotificationService:
    """
    Serviço centralizado para gerenciar notificações.
    Valida preferências do usuário, monta mensagens e persiste no banco.
    """

    MESSAGE_TEMPLATES = {
        "enrollment": {
            "title": "Você foi matriculado em uma trilha",
            "message": "Você foi matriculado na trilha '{track_title}'. Prazo recomendado: {deadline_days} dias.",
        },
        "track_completed": {
            "title": "Trilha concluída com sucesso!",
            "message": "{learner_name} concluiu a trilha '{track_title}' com uma nota de {score}%.",
        },
        "deadline_15days": {
            "title": "Lembrete: 15 dias para conclusão",
            "message": "Faltam 15 dias para você concluir a trilha '{track_title}'. Não deixe para última hora!",
        },
        "deadline_7days": {
            "title": "Lembrete: 7 dias para conclusão",
            "message": "Faltam apenas 7 dias para você concluir a trilha '{track_title}'. Acelere seus estudos!",
        },
        "deadline_1day": {
            "title": "Lembrete: Último dia!",
            "message": "Hoje é o último dia para você concluir a trilha '{track_title}'. Não perca o prazo!",
        },
        "quiz_result": {
            "title": "Resultado do Quiz",
            "message": "Você obteve {score}% no quiz '{quiz_title}'. Status: {status}.",
        },
        "module_completed": {
            "title": "Módulo concluído",
            "message": "Parabéns! Você concluiu o módulo '{module_title}' da trilha '{track_title}'.",
        },
        "activity_completed": {
            "title": "Atividade concluída",
            "message": "Você concluiu a atividade '{activity_title}'. Nota: {score}%.",
        },
        "system": {
            "title": "Notificação do Sistema",
            "message": "{message}",
        },
    }

    @staticmethod
    def create_notification(
        recipient,
        notification_type,
        title=None,
        message=None,
        related_track=None,
        related_module=None,
        related_activity=None,
        related_enrollment=None,
        **template_context,
    ):
        """
        Cria uma notificação para um usuário.
        """

        if not NotificationService._should_send_notification(recipient, notification_type):
            return None

        template = NotificationService.MESSAGE_TEMPLATES.get(notification_type, {})

        final_title = title or template.get("title", "Notificação")
        final_message = message or template.get("message", "")

        try:
            final_message = final_message.format(**template_context)
        except KeyError as e:
            print(f"Aviso: Chave de template não fornecida: {e}")

        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=final_title,
            message=final_message,
            related_track=related_track,
            related_module=related_module,
            related_activity=related_activity,
            related_enrollment=related_enrollment,
        )

        return notification

    @staticmethod
    def _should_send_notification(user, notification_type):
        """
        Verifica se o usuário deseja receber notificações deste tipo.
        """
        try:
            preference = NotificationPreference.objects.get(user=user)
        except NotificationPreference.DoesNotExist:
            preference = NotificationPreference.get_or_create_for_user(user)

        preference_map = {
            "enrollment": preference.enrollment_enabled,
            "track_completed": preference.track_completed_enabled,
            "deadline_15days": preference.deadline_reminders_enabled,
            "deadline_7days": preference.deadline_reminders_enabled,
            "deadline_1day": preference.deadline_reminders_enabled,
            "quiz_result": preference.quiz_results_enabled,
            "module_completed": preference.activity_completed_enabled,
            "activity_completed": preference.activity_completed_enabled,
            "system": preference.system_notifications_enabled,
        }

        return preference_map.get(notification_type, True)

    @staticmethod
    def notify_enrollment(user, enrollment):
        """Notifica um usuário sobre sua matrícula em uma trilha."""
        return NotificationService.create_notification(
            recipient=user,
            notification_type="enrollment",
            related_track=enrollment.id_trilha,
            related_enrollment=enrollment,
            track_title=enrollment.id_trilha.titulo,
            deadline_days=enrollment.id_trilha.prazo_recomendado or "N/A",
        )

    @staticmethod
    def notify_track_completed(user, enrollment, score):
        """Notifica sobre a conclusão de uma trilha."""
        return NotificationService.create_notification(
            recipient=user,
            notification_type="track_completed",
            related_track=enrollment.id_trilha,
            related_enrollment=enrollment,
            learner_name=user.get_full_name() or user.email,
            track_title=enrollment.id_trilha.titulo,
            score=score,
        )

    @staticmethod
    def notify_deadline_reminder(user, enrollment, days_remaining):
        """Notifica um usuário sobre prazo de conclusão."""
        notification_type_map = {
            15: "deadline_15days",
            7: "deadline_7days",
            1: "deadline_1day",
        }

        notification_type = notification_type_map.get(days_remaining, "system")

        return NotificationService.create_notification(
            recipient=user,
            notification_type=notification_type,
            related_track=enrollment.id_trilha,
            related_enrollment=enrollment,
            track_title=enrollment.id_trilha.titulo,
        )

    @staticmethod
    def notify_quiz_result(user, quiz_title, score, passed):
        """Notifica um usuário sobre o resultado de um quiz."""
        status = "Aprovado" if passed else "Reprovado"

        return NotificationService.create_notification(
            recipient=user,
            notification_type="quiz_result",
            quiz_title=quiz_title,
            score=score,
            status=status,
        )

    @staticmethod
    def notify_module_completed(user, module, track):
        """Notifica um usuário sobre conclusão de módulo."""
        return NotificationService.create_notification(
            recipient=user,
            notification_type="module_completed",
            related_module=module,
            related_track=track,
            module_title=module.titulo,
            track_title=track.titulo,
        )

    @staticmethod
    def notify_activity_completed(user, activity, score):
        """Notifica um usuário sobre conclusão de atividade."""
        return NotificationService.create_notification(
            recipient=user,
            notification_type="activity_completed",
            related_activity=activity,
            activity_title=activity.titulo,
            score=score,
        )

    @staticmethod
    def notify_system(user, title, message):
        """Envia uma notificação do sistema para um usuário."""
        return NotificationService.create_notification(
            recipient=user,
            notification_type="system",
            title=title,
            message=message,
        )

    @staticmethod
    def get_user_notifications(user, unread_only=False, limit=50):
        """Obtém notificações de um usuário."""
        queryset = Notification.objects.filter(recipient=user)

        if unread_only:
            queryset = queryset.filter(is_read=False)

        return queryset[:limit]

    @staticmethod
    def mark_notification_as_read(notification):
        """Marca uma notificação como lida."""
        notification.mark_as_read()

    @staticmethod
    def mark_all_as_read(user):
        """Marca todas as notificações de um usuário como lidas."""
        Notification.objects.filter(recipient=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )

    @staticmethod
    def get_unread_count(user):
        """Obtém a contagem de notificações não lidas de um usuário."""
        return Notification.objects.filter(recipient=user, is_read=False).count()
