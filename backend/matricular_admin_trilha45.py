#!/usr/bin/env python
"""
Script para matricular o usuário admin na trilha 45
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from onboarding_app.models import Matricula, Trilha
from users.models import User

# Buscar usuário e trilha
user = User.objects.get(id=1)  # admin
trilha = Trilha.objects.get(id_trilha=45)

# Criar matrícula
matricula, created = Matricula.objects.get_or_create(
    id_usuario=user,
    id_trilha=trilha,
    defaults={'status': 'EmAndamento'}
)

if created:
    print(f"✅ Matrícula criada: {user.username} -> {trilha.titulo}")
else:
    print(f"ℹ️ Matrícula já existia: {user.username} -> {trilha.titulo}")

print(f"\n📊 Status: {matricula.status}")
print(f"📅 Data de início: {matricula.data_inicio}")
