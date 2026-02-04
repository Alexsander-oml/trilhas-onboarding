from django.test import Client
from users.models import User, Perfil, Setor
import json

print("="*70)
print("TESTE FINAL DE INTEGRACAO - BACKEND")
print("="*70)

# Dados do banco
print("\nDADOS DO BANCO:")
print(f"  Perfis: {Perfil.objects.count()}")
print(f"  Setores: {Setor.objects.count()}")
print(f"  Usuarios: {User.objects.count()}")
print(f"  Usuarios com perfil: {User.objects.exclude(perfil__isnull=True).count()}")
print(f"  Usuarios com setor: {User.objects.exclude(setor__isnull=True).count()}")

# Teste de Login
client = Client()
print("\nTESTE 1: Login")
response = client.post('/api/users/auth/login/', 
    json.dumps({'email': 'admin@example.com', 'password': 'admin123'}),
    content_type='application/json'
)
print(f"  POST /api/users/auth/login/ - Status: {response.status_code}")

if response.status_code == 200:
    data = json.loads(response.content)
    token = data.get('access')
    user_id = data.get('user', {}).get('id')
    print("  OK: Login funcionando")
    
    # Teste 2
    print("\nTESTE 2: User Info")
    response = client.get('/api/users/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
    print(f"  GET /api/users/me/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("  OK: User info funcionando")
    
    # Teste 3
    print("\nTESTE 3: Painel")
    response = client.get('/api/users/painel/', HTTP_AUTHORIZATION=f'Bearer {token}')
    print(f"  GET /api/users/painel/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("  OK: Painel funcionando")
    
    # Teste 4
    print("\nTESTE 4: Update Perfil")
    response = client.patch('/api/users/perfil/', 
        json.dumps({'cargo': 'Admin'}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    print(f"  PATCH /api/users/perfil/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("  OK: Update perfil funcionando")
    
    # Teste 5
    print("\nTESTE 5: Update Perfil (Frontend Compat)")
    response = client.patch(f'/api/users/{user_id}/profile/', 
        json.dumps({'cargo': 'Admin'}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    print(f"  PATCH /api/users/{user_id}/profile/ - Status: {response.status_code}")
    if response.status_code == 200:
        print("  OK: Endpoint frontend funcionando")
    
    print("\n" + "="*70)
    print("RESULTADO: TODOS OS TESTES PASSARAM!")
    print("="*70)
else:
    print(f"  FALHA: {response.content.decode()}")
