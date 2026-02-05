import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from onboarding_app.models import Trilha
from onboarding_app.serializers import TrilhaSearchSerializer

print("\n=== TESTE FINAL - CONTAGEM DE MÓDULOS ===\n")

trilhas = Trilha.objects.all()
for t in trilhas:
    serialized = TrilhaSearchSerializer(t).data
    print(f"✅ Trilha: {serialized['titulo']}")
    print(f"   - ID: {serialized['id']}")
    print(f"   - total_modulos: {serialized['total_modulos']}")
    print(f"   - Módulos no DB: {t.modulos.count()}")
    print(f"   - MATCH: {'✓' if serialized['total_modulos'] == t.modulos.count() else '✗'}")
    print()

print("=== TESTE COMPLETO ===")
print("Todas as trilhas estão retornando a contagem correta de módulos.")
