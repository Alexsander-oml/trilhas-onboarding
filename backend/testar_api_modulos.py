"""
Testar se a API retorna módulos após adicionar ao serializer
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from onboarding_app.models import Trilha
from onboarding_app.serializers import TrilhaSerializer
import json

trilha = Trilha.objects.get(id_trilha=29)

print("=" * 80)
print(f"🔍 TESTANDO SERIALIZER COM MÓDULOS: {trilha.titulo}")
print("=" * 80)

serializer = TrilhaSerializer(trilha)
data = serializer.data

print(f"\n✅ Serializer executado com sucesso!")
print(f"\n📊 Campos retornados:")
print(f"   - id: {data.get('id')}")
print(f"   - titulo: {data.get('titulo')}")
print(f"   - total_modulos: {data.get('total_modulos')}")
print(f"   - modules: {type(data.get('modules'))}")

if 'modules' in data:
    modules = data['modules']
    print(f"\n📦 MÓDULOS RETORNADOS: {len(modules)}")
    for i, mod in enumerate(modules, 1):
        print(f"   {i}. ID: {mod.get('id')} | Nome: {mod.get('name')} | Título: {mod.get('titulo')}")
else:
    print("\n❌ CAMPO 'modules' NÃO ENCONTRADO!")

print("\n" + "=" * 80)
print("📄 Resposta JSON completa (primeiros 500 chars):")
print("=" * 80)
json_str = json.dumps(data, indent=2, ensure_ascii=False)
print(json_str[:500] + "...")
