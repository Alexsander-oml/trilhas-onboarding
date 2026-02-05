#!/bin/bash
# Script para criar usuários iniciais no Django

echo "Criando usuários de teste..."

# Criar usuário admin
docker exec trilhas_onboarding_backend python manage.py shell -c "
from users.models import User, Perfil
try:
    perfil = Perfil.objects.get(nome='Administrador')
    User.objects.create_user(
        username='admin',
        email='admin@trilhas.com',
        password='admin123',
        perfil=perfil,
        is_active=True,
        ativo=True,
        is_staff=True,
        is_superuser=True
    )
    print('✅ Admin criado')
except Exception as e:
    print(f'Admin já existe ou erro: {e}')
"

# Criar usuário aprendiz
docker exec trilhas_onboarding_backend python manage.py shell -c "
from users.models import User, Perfil
try:
    perfil = Perfil.objects.get(nome='Aprendiz')
    User.objects.create_user(
        username='aprendiz',
        email='aprendiz@trilhas.com',
        password='aprendiz123',
        perfil=perfil,
        is_active=True,
        ativo=True
    )
    print('✅ Aprendiz criado')
except Exception as e:
    print(f'Aprendiz já existe ou erro: {e}')
"

echo "✅ Usuários criados com sucesso!"
