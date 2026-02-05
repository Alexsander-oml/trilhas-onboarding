"""
Management Command para associar perfis aos usuários.

Este comando atribui o perfil "Aprendiz" a todos os usuários que não possuem um perfil.
Útil para resolver o erro: AttributeError: 'NoneType' object has no attribute 'nome'

Uso:
    python manage.py assign_perfil_to_users
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Perfil

User = get_user_model()


class Command(BaseCommand):
    help = 'Associa o perfil "Aprendiz" a todos os usuários que não possuem um perfil'

    def add_arguments(self, parser):
        parser.add_argument(
            "--perfil",
            type=str,
            default="Aprendiz",
            help="Nome do perfil a ser atribuído (padrão: Aprendiz)",
        )

    def handle(self, *args, **options):
        perfil_nome = options["perfil"]

        self.stdout.write(
            self.style.SUCCESS(
                f'Iniciando atribuição de perfil "{perfil_nome}" aos usuários...'
            )
        )

        try:
            # Obter o perfil
            try:
                perfil = Perfil.objects.get(nome=perfil_nome)
            except Perfil.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Perfil "{perfil_nome}" não encontrado. '
                        f'Perfis disponíveis: {", ".join(Perfil.objects.values_list("nome", flat=True))}'
                    )
                )
                return

            # Encontrar usuários sem perfil
            users_without_perfil = User.objects.filter(perfil__isnull=True)
            count = users_without_perfil.count()

            if count == 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        "✓ Todos os usuários já possuem um perfil atribuído."
                    )
                )
                return

            # Atribuir perfil
            users_without_perfil.update(perfil=perfil)

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Perfil "{perfil_nome}" atribuído com sucesso a {count} usuário(s).'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"✗ Erro ao atribuir perfil: {str(e)}")
            )
