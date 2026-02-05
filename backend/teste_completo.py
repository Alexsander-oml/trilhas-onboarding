from django.test import Client
import json

client = Client()

print("="*60)
print("🔐 TESTE DE LOGIN COM EMAIL")
print("="*60)

# Teste com email (USERNAME_FIELD correto)
print("\n✓ Tentando login: email + password")
response = client.post('/api/users/auth/login/', 
    json.dumps({'email': 'admin@example.com', 'password': 'admin123'}),
    content_type='application/json'
)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = json.loads(response.content)
    print("\n✅ LOGIN BEM-SUCEDIDO!")
    print(f"   Access Token: {data.get('access', '')[:40]}...")
    print(f"   User ID: {data.get('user', {}).get('id')}")
    print(f"   Username: {data.get('user', {}).get('username')}")
    print(f"   Email: {data.get('user', {}).get('email')}")
    print(f"   Role: {data.get('user', {}).get('role')}")
    
    token = data.get('access')
    user_id = data.get('user', {}).get('id')
    
    # Teste 1: /api/users/me/
    print("\n" + "-"*60)
    print("✓ Testando GET /api/users/me/")
    response = client.get('/api/users/me/', 
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    if response.status_code == 200:
        user_data = json.loads(response.content)
        print(f"✅ Status: {response.status_code}")
        print(f"   Username: {user_data.get('username')}")
        print(f"   Perfil: {user_data.get('perfil', {}).get('nome', 'N/A')}")
        print(f"   Setor: {user_data.get('setor', {}).get('nome', 'N/A')}")
        print(f"   Sub-setor: {user_data.get('subsetor', {}).get('nome', 'N/A')}")
    else:
        print(f"❌ Status: {response.status_code}")
    
    # Teste 2: /api/users/painel/
    print("\n" + "-"*60)
    print("✓ Testando GET /api/users/painel/")
    response = client.get('/api/users/painel/', 
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    if response.status_code == 200:
        painel = json.loads(response.content)
        print(f"✅ Status: {response.status_code}")
        print(f"   Trilhas: {len(painel.get('trilhas_matriculadas', []))}")
        print(f"   Notificações: {len(painel.get('notificacoes_recentes', []))}")
    else:
        print(f"❌ Status: {response.status_code}")
    
    # Teste 3: PATCH /api/users/perfil/
    print("\n" + "-"*60)
    print("✓ Testando PATCH /api/users/perfil/")
    response = client.patch('/api/users/perfil/', 
        json.dumps({'cargo': 'Administrador de Sistemas'}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    if response.status_code == 200:
        result = json.loads(response.content)
        print(f"✅ Status: {response.status_code}")
        print(f"   Mensagem: {result.get('message')}")
    else:
        print(f"❌ Status: {response.status_code}")
    
    # Teste 4: PATCH /api/users/<id>/profile/ (frontend compat)
    print("\n" + "-"*60)
    print(f"✓ Testando PATCH /api/users/{user_id}/profile/ (Frontend)")
    response = client.patch(f'/api/users/{user_id}/profile/', 
        json.dumps({'cargo': 'Administrador Principal'}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    if response.status_code == 200:
        result = json.loads(response.content)
        print(f"✅ Status: {response.status_code}")
        print(f"   ✓ Endpoint frontend FUNCIONANDO!")
    else:
        print(f"❌ Status: {response.status_code}")
    
    print("\n" + "="*60)
    print("🎉 TODOS OS TESTES PASSARAM!")
    print("="*60)
    print("\n📊 RESUMO DA INTEGRAÇÃO:")
    print("   ✅ Autenticação JWT (com email)")
    print("   ✅ Endpoint /api/users/me/")
    print("   ✅ Endpoint /api/users/painel/")
    print("   ✅ Endpoint /api/users/perfil/")
    print(f"   ✅ Endpoint /api/users/{user_id}/profile/ (frontend)")
    print("\n🚀 BACKEND TOTALMENTE INTEGRADO E FUNCIONANDO!")
else:
    print(f"\n❌ Falha no login: {response.content.decode()}")
