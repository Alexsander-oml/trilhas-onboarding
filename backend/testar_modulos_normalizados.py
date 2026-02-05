#!/usr/bin/env python
"""
Script para testar se o serializer retorna módulos corretamente.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from onboarding_app.models import Trilha
from onboarding_app.serializers import TrilhaSearchSerializer, TrilhaSerializer

print("\n" + "="*80)
print("🧪 TESTE DE NORMALIZAÇÃO DE MÓDULOS")
print("="*80 + "\n")

# Buscar trilhas com prefetch
trilhas = Trilha.objects.prefetch_related('modulos').all()[:2]

for trilha in trilhas:
    print(f"📋 Trilha: {trilha.titulo} (ID: {trilha.id_trilha})")
    print(f"   Módulos no DB: {trilha.modulos.count()}")
    
    # Testar TrilhaSearchSerializer
    search_serializer = TrilhaSearchSerializer(trilha)
    search_data = search_serializer.data
    
    print(f"\n   🔍 TrilhaSearchSerializer:")
    print(f"      • total_modulos: {search_data.get('total_modulos')}")
    print(f"      • modules presente: {'modules' in search_data}")
    print(f"      • modules length: {len(search_data.get('modules', []))}")
    
    if 'modules' in search_data and search_data['modules']:
        print(f"      • primeiro módulo: {search_data['modules'][0]}")
    
    # Testar TrilhaSerializer
    full_serializer = TrilhaSerializer(trilha)
    full_data = full_serializer.data
    
    print(f"\n   📦 TrilhaSerializer:")
    print(f"      • total_modulos: {full_data.get('total_modulos')}")
    print(f"      • modules presente: {'modules' in full_data}")
    print(f"      • modules length: {len(full_data.get('modules', []))}")
    
    if 'modules' in full_data and full_data['modules']:
        print(f"      • primeiro módulo: {full_data['modules'][0]}")
    
    print("\n" + "-"*80 + "\n")

print("✅ Teste concluído!")
print("="*80 + "\n")
