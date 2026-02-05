"""Comparar endpoint normal vs detalhado"""
import requests

BASE_URL = "http://127.0.0.1:8000"

def get_token():
    response = requests.post(
        f"{BASE_URL}/api/users/auth/login/",
        json={"email": "admin@example.com", "password": "SenhaSegura123"}
    )
    if response.status_code == 200:
        return response.json().get('access')
    return None

token = get_token()
headers = {"Authorization": f"Bearer {token}"}

print("=" * 80)
print("COMPARAÇÃO: ENDPOINT NORMAL vs DETALHADO")
print("=" * 80)

# Testar endpoint NORMAL (sem /detalhada/)
print("\n🔍 ENDPOINT NORMAL: /api/trilhas/35/")
print("-" * 80)
response = requests.get(f"{BASE_URL}/api/trilhas/35/", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    modules = data.get('modules', [])
    print(f"Total de módulos: {len(modules)}")
    if modules:
        first_module = modules[0]
        print(f"Primeiro módulo: {first_module.get('name', 'N/A')}")
        materials = first_module.get('materials', [])
        print(f"Materiais no primeiro módulo: {len(materials)}")
        if materials:
            print(f"  Tipos: {[m.get('type') for m in materials]}")
        else:
            print(f"  ⚠️  SEM MATERIAIS!")
else:
    print(f"Erro: {response.text}")

# Testar endpoint DETALHADO (com /detalhada/)
print("\n🔍 ENDPOINT DETALHADO: /api/trilhas/35/detalhada/")
print("-" * 80)
response = requests.get(f"{BASE_URL}/api/trilhas/35/detalhada/", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    modules = data.get('modules', [])
    print(f"Total de módulos: {len(modules)}")
    if modules:
        first_module = modules[0]
        print(f"Primeiro módulo: {first_module.get('name', 'N/A')}")
        materials = first_module.get('materials', [])
        print(f"Materiais no primeiro módulo: {len(materials)}")
        if materials:
            print(f"  Tipos: {[m.get('type') for m in materials]}")
        else:
            print(f"  ⚠️  SEM MATERIAIS!")
else:
    print(f"Erro: {response.text}")

print("\n" + "=" * 80)
