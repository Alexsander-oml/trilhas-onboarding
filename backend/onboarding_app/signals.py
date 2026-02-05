"""
Signals para gatilhos imediatos (event-driven) de notificações.
Disparados automaticamente quando eventos ocorrem no banco de dados.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Matricula, Progresso
from .services import NotificationService


@receiver(post_save, sender=Matricula)
def notify_on_enrollment(sender, instance, created, **kwargs):
    """
    Dispara notificação quando um usuário é matriculado em uma trilha.
    """
    if created:
        NotificationService.notify_enrollment(
            user=instance.id_usuario,
            enrollment=instance,
        )


@receiver(post_save, sender=Progresso)
def notify_on_activity_completion(sender, instance, created, **kwargs):
    """
    Dispara notificação quando um usuário completa uma atividade.
    """
    if created and instance.completed_at:
        try:
            activity = instance.id_atividade

            NotificationService.notify_activity_completed(
                user=instance.id_usuario,
                activity=activity,
                score=100,
            )

            _check_module_completion(instance.id_usuario, activity.id_modulo)

        except Exception as e:
            print(f"Erro ao notificar conclusão de atividade: {e}")


def _check_module_completion(user, module):
    """
    Verifica se todas as atividades de um módulo foram concluídas.
    """
    try:
        total_activities = module.atividades.count()
        completed_activities = Progresso.objects.filter(
            id_usuario=user,
            id_atividade__id_modulo=module,
            completed_at__isnull=False,
        ).count()

        if total_activities > 0 and completed_activities == total_activities:
            NotificationService.notify_module_completed(
                user=user,
                module=module,
                track=module.id_trilha,
            )

            _check_track_completion(user, module.id_trilha)

    except Exception as e:
        print(f"Erro ao verificar conclusão do módulo: {e}")


def _check_track_completion(user, track):
    """
    Verifica se todos os módulos de uma trilha foram concluídos.
    """
    try:
        total_modules = track.modulos.count()
        completed_modules = 0

        for module in track.modulos.all():
            total_activities = module.atividades.count()
            if total_activities == 0:
                completed_modules += 1
                continue

            completed_activities = Progresso.objects.filter(
                id_usuario=user,
                id_atividade__id_modulo=module,
                completed_at__isnull=False,
            ).count()

            if completed_activities == total_activities:
                completed_modules += 1

        if total_modules > 0 and completed_modules == total_modules:
            try:
                enrollment = Matricula.objects.get(
                    id_usuario=user,
                    id_trilha=track,
                )

                NotificationService.notify_track_completed(
                    user=user,
                    enrollment=enrollment,
                    score=100,
                )

                enrollment.status = "Concluida"
                enrollment.data_fim = timezone.now()
                enrollment.save()

            except Matricula.DoesNotExist:
                print(f"Matrícula não encontrada para usuário {user} e trilha {track}")

    except Exception as e:
        print(f"Erro ao verificar conclusão da trilha: {e}")
