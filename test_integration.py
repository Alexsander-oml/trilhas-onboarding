#!/usr/bin/env python
"""Script para testar integração backend-frontend"""
import requests
import time
import json

time.sleep(2)

base_url = 'http://127.0.0.1:8000/api'

print("=" * 70)
print("TESTE DE INTEGRAÇÃO - BACKEND")
print("=" * 70)

# Teste 1: Trilhas
print("\n[TEST 1] GET /api/trilhas/search/")
try:
    r = requests.get(f'{base_url}/trilhas/search/')
    print(f"✅ Status: {r.status_code}")
    data = r.json()
    print(f"📦 Response type: {type(data)}")
    if isinstance(data, list):
        print(f"   Items: {len(data)}")
    elif isinstance(data, dict):
        print(f"   Keys: {list(data.keys())}")
except Exception as e:
    print(f"❌ Erro: {e}")

# Teste 2: Tags
print("\n[TEST 2] GET /api/filtros/tags/")
try:
    r = requests.get(f'{base_url}/filtros/tags/')
    print(f"✅ Status: {r.status_code}")
    data = r.json()
    if isinstance(data, dict):
        print(f"   Keys: {list(data.keys())[:5]}")
except Exception as e:
    print(f"❌ Erro: {e}")

# Teste 3: Areas
print("\n[TEST 3] GET /api/filtros/areas/")
try:
    r = requests.get(f'{base_url}/filtros/areas/')
    print(f"✅ Status: {r.status_code}")
except Exception as e:
    print(f"❌ Erro: {e}")

# Teste 4: Questões
print("\n[TEST 4] GET /api/questoes/search/")
try:
    r = requests.get(f'{base_url}/questoes/search/')
    print(f"✅ Status: {r.status_code}")
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n" + "=" * 70)
print("TESTES CONCLUÍDOS!")
print("=" * 70)
