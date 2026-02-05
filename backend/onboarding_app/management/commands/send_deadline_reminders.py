"""
Management Command para enviar lembretes de prazo.
Pode ser executado manualmente ou agendado via cron job.

Uso:
    python manage.py send_deadline_reminders
"""

from django.core.management.base import BaseCommand
from onboarding_app.tasks import send_deadline_reminders


class Command(BaseCommand):
    help = "Envia lembretes de prazo para usuários com matrículas ativas"

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS("Iniciando envio de lembretes de prazo...")
        )

        try:
            reminders_sent = send_deadline_reminders()

            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ {reminders_sent} lembrete(s) de prazo enviado(s) com sucesso."
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"✗ Erro ao enviar lembretes: {str(e)}")
            )
