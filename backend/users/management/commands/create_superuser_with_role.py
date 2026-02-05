from django.core.management.base import BaseCommand
from users.models import User, Perfil

class Command(BaseCommand):
    help = 'Cria um superusuário com um papel específico.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='O email do superusuário.')
        parser.add_argument('--username', type=str, required=True, help='O nome de usuário do superusuário.')
        parser.add_argument('--password', type=str, required=True, help='A senha do superusuário.')
        parser.add_argument('--role', type=str, default='Administrador', help='O papel do superusuário (padrão: Administrador).')

    def handle(self, *args, **options):
        email = options['email']
        username = options['username']
        password = options['password']
        role_name = options['role']

        if not User.objects.filter(email=email).exists():
            perfil, created = Perfil.objects.get_or_create(nome=role_name)
            user = User.objects.create_superuser(
                email=email,
                username=username,
                password=password,
                perfil=perfil
            )
            self.stdout.write(self.style.SUCCESS(f'Superusuário {email} com papel {role_name} criado com sucesso!'))
        else:
            self.stdout.write(self.style.WARNING(f'Superusuário com email {email} já existe.'))


