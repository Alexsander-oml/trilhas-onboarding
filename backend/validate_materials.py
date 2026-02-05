"""Script de validação final dos materiais"""
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

def test_trail(trail_id):
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/trilhas/{trail_id}/detalhada/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Trilha {trail_id}: {response.status_code}")
        return
    
    data = response.json()
    print(f"\n✅ Trilha {trail_id}: {data.get('titulo', 'N/A')}")
    
    for module in data.get('modules', []):
        materials = module.get('materials', [])
        if materials:
            print(f"   📦 {module.get('name')}: {len(materials)} materiais")
            types = [m.get('type') for m in materials]
            print(f"      Tipos: {', '.join(set(types))}")

print("=" * 60)
print("VALIDAÇÃO DE MATERIAIS POR TRILHA")
print("=" * 60)

for tid in [31, 32, 33, 34, 35]:
    test_trail(tid)

print("\n" + "=" * 60)
print("✅ VALIDAÇÃO CONCLUÍDA")
print("=" * 60)
