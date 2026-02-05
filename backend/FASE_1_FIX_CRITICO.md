# FASE 1: FIX CRÍTICO - COMANDOS PARA EXECUTAR

## ✅ CORREÇÕES JÁ APLICADAS:

1. ✅ views_learner.py - imports corretos
2. ✅ apps.py - signals registrados
3. ✅ admin.py (onboarding_app) - Notification/NotificationPreference registrados
4. ✅ admin.py (users) - Setor/SubSetor/User atualizados

---

## 📋 COMANDOS PARA EXECUTAR AGORA:

### 1. Aplicar Migrations (CRÍTICO)
```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
```

**O que isso faz:**
- Cria tabelas: Notification, NotificationPreference, Setor, SubSetor
- Adiciona campos ao User: setor, subsetor, first_name, last_name, cargo, etc.

---

### 2. Criar Dados Iniciais (Seed Data)

#### a) Criar Perfis
```powershell
python manage.py shell
```

Dentro do shell:
```python
from users.models import Perfil

perfis = [
    {"nome": "Administrador", "descricao": "Acesso total ao sistema"},
    {"nome": "Gestor", "descricao": "Gerencia trilhas e usuários"},
    {"nome": "Autor de Conteúdo", "descricao": "Cria e edita conteúdo"},
    {"nome": "Mentor", "descricao": "Acompanha aprendizes"},
    {"nome": "Aprendiz", "descricao": "Realiza trilhas de aprendizado"},
]

for perfil_data in perfis:
    Perfil.objects.get_or_create(
        nome=perfil_data["nome"],
        defaults={"descricao": perfil_data["descricao"]}
    )

print("✅ Perfis criados!")
exit()
```

#### b) Criar Setores e SubSetores
```powershell
python manage.py shell
```

Dentro do shell:
```python
from users.models import Setor, SubSetor

# Criar Setores
setores_data = [
    {"nome": "Tecnologia da Informação", "descricao": "Desenvolvimento e infraestrutura"},
    {"nome": "Recursos Humanos", "descricao": "Gestão de pessoas"},
    {"nome": "Financeiro", "descricao": "Controladoria e finanças"},
    {"nome": "Operações", "descricao": "Operações e logística"},
]

for setor_data in setores_data:
    Setor.objects.get_or_create(
        nome=setor_data["nome"],
        defaults={"descricao": setor_data["descricao"], "ativo": True}
    )

# Criar SubSetores
subsetores_data = [
    {"setor": "Tecnologia da Informação", "nome": "Desenvolvimento", "descricao": "Desenvolvimento de software"},
    {"setor": "Tecnologia da Informação", "nome": "Infraestrutura", "descricao": "Infraestrutura e redes"},
    {"setor": "Recursos Humanos", "nome": "Recrutamento", "descricao": "Recrutamento e seleção"},
    {"setor": "Recursos Humanos", "nome": "Treinamento", "descricao": "Treinamento e desenvolvimento"},
    {"setor": "Financeiro", "nome": "Contabilidade", "descricao": "Contabilidade geral"},
    {"setor": "Financeiro", "nome": "Tesouraria", "descricao": "Tesouraria e pagamentos"},
]

for sub_data in subsetores_data:
    setor = Setor.objects.get(nome=sub_data["setor"])
    SubSetor.objects.get_or_create(
        setor=setor,
        nome=sub_data["nome"],
        defaults={"descricao": sub_data["descricao"], "ativo": True}
    )

print("✅ Setores e SubSetores criados!")
exit()
```

---

### 3. Criar Superusuário (se não existe)
```powershell
python manage.py createsuperuser
```

**Dados sugeridos:**
- Email: admin@faurg.com
- Username: admin
- Password: admin123 (ou outra senha segura)

**IMPORTANTE:** Depois de criar, você precisa atualizar via admin Django:
1. Acesse: http://localhost:8000/admin/
2. Vá em Users → admin
3. Preencha os campos obrigatórios:
   - First name: Admin
   - Last name: Sistema
   - Cargo: Administrador
   - Setor: (escolha um)
   - SubSetor: (escolha um)
   - Perfil: Administrador

---

### 4. Testar Endpoints com Thunder Client / Postman

#### a) Login
```http
POST http://localhost:8000/api/users/auth/login/
Content-Type: application/json

{
  "email": "admin@faurg.com",
  "password": "admin123"
}
```

**Copie o `access` token da resposta!**

#### b) Informações do Usuário
```http
GET http://localhost:8000/api/users/me/
Authorization: Bearer SEU_TOKEN_AQUI
```

#### c) Painel do Aprendiz
```http
GET http://localhost:8000/api/users/painel/
Authorization: Bearer SEU_TOKEN_AQUI
```

#### d) Status da Importação
```http
GET http://localhost:8000/api/users/import/status/
Authorization: Bearer SEU_TOKEN_AQUI
```

---

### 5. Verificar Erros

Se houver erros, execute:
```powershell
python manage.py check
python manage.py showmigrations
```

---

## 🎯 PRÓXIMOS PASSOS APÓS SUCESSO:

1. ✅ Backend testado e funcionando
2. ⏭️ Criar componentes React no frontend:
   - PainelAprendiz
   - PerfilUpdateForm
   - NotificationCenter
   - ImportUsuariosPage

3. ⏭️ Integrar hooks no frontend:
   - usePainel
   - useNotifications
   - useImportUsers

---

## 🆘 RESOLUÇÃO DE PROBLEMAS COMUNS:

### Erro: "relation 'users_setor' does not exist"
**Solução:** Rode `python manage.py migrate`

### Erro: "User.setor cannot be null"
**Solução:** Crie setores primeiro, depois atualize usuários existentes via admin

### Erro: "Notification model not found"
**Solução:** Verifique se migration 0004 foi aplicada: `python manage.py showmigrations onboarding_app`

### Erro ao criar superuser: "setor is required"
**Solução:** 
1. Crie setores e subsetores primeiro
2. Crie superuser
3. Atualize via admin Django

---

## 📝 CHECKLIST FINAL:

- [ ] Migrations aplicadas (`python manage.py migrate`)
- [ ] Perfis criados (5 perfis)
- [ ] Setores criados (mínimo 1)
- [ ] SubSetores criados (mínimo 1 por setor)
- [ ] Superusuário criado e atualizado
- [ ] Login testado (recebe token)
- [ ] GET /api/users/me/ funcionando
- [ ] GET /api/users/painel/ retorna dados
- [ ] Admin Django acessível
- [ ] Todos os models visíveis no admin

**Quando todos os itens estiverem ✅, o backend está 100% funcional!**
