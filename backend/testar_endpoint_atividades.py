import requests

# Login
login_response = requests.post('http://localhost:8000/api/users/auth/login/', json={
    'username': 'admin',
    'password': '123'
})

if login_response.status_code == 200:
    token = login_response.json()['access']
    print(f"✅ Login bem-sucedido")
    
    # Buscar atividades do módulo 81 (da trilha 45)
    response = requests.get(
        'http://localhost:8000/api/modulos/81/atividades/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if response.status_code == 200:
        atividades = response.json()
        print(f"\n✅ Atividades do módulo 81:")
        for ativ in atividades:
            print(f"  - ID: {ativ['id_atividade']} - {ativ['titulo']}")
            if 'quiz' in ativ:
                print(f"    Quiz: {ativ['quiz']}")
    else:
        print(f"❌ Erro: {response.status_code}")
        print(response.text)
else:
    print(f"❌ Erro no login: {login_response.status_code}")
