import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from users.models import User, Perfil

# Atualizar todos os usuários com perfis
usuarios_perfis = {
    'admin@example.com': 'Administrador',
    'aprendiz@gmail.com': 'Aprendiz',
    'gestor@gmail.com': 'Gestor',
    'mentor@example.com': 'Mentor',
    'autor@gmail.com': 'Autor de Conteúdo',
}

for email, perfil_nome in usuarios_perfis.items():
    try:
        user = User.objects.get(email=email)
        perfil, created = Perfil.objects.get_or_create(nome=perfil_nome)
        user.perfil = perfil
        user.save()
        print(f'✓ {email} → {perfil_nome}')
    except User.DoesNotExist:
        print(f'✗ Usuário {email} não encontrado')

print('\nTodos os perfis atualizados!')
