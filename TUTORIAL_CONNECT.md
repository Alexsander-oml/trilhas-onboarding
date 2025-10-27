Tutorial rápido: conectar frontend (Vite/React) ao backend (Django REST Framework)
=================================================================================

Este arquivo é um guia mínimo em PT-BR para alguém que não conhece Vite nem a
arquitetura do projeto conectar a aplicação frontend ao backend que desenvolvemos.

Resumo do que foi adicionado no backend
- Model: `Enrollment` (liga `User` a `trail_id`). Migration: `0002_create_enrollment.py`.
- Serializers: `EnrollmentSerializer`.
- Views/endpoints:
  - GET  /api/user/enrollments/  -> retorna todas as inscrições do usuário autenticado.
  - GET  /api/trails/<id>/progress/ -> retorna a inscrição do usuário para a trilha (404 se não inscrito).
  - POST /api/trails/<id>/progress/initialize/ -> cria/retorna inscrição (201 se criada).
- URLs registradas em `backend/users/urls.py`.

Passo a passo: rodando o backend (Django)
1) Entrar na pasta backend e ativar o virtualenv (Windows PowerShell):

```powershell
Set-Location 'C:\Users\ResTIC55\Documents\Trilhas-Onboarding\backend'
# Se ainda não criou o venv:
python -m venv venv
# Permitir execução temporária (se necessário):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
# Ativar venv
.\venv\Scripts\Activate.ps1
```

2) Instalar dependências (se houver requirements):

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

3) Aplicar migrations (muito importante — cria a tabela users_enrollment):

```powershell
python .\manage.py makemigrations
python .\manage.py migrate
```

4) Rodar o servidor Django em modo desenvolvimento:

```powershell
python .\manage.py runserver 127.0.0.1:8000
```

5) Se algo der errado no migrate/ver tabelas:
- `python .\manage.py showmigrations users` mostra se a migration `0002_create_enrollment`
  já foi aplicada.
- `python .\manage.py dbshell` abre o cliente do DB (psql) para inspecionar tabelas.

Passo a passo: rodando o frontend (Vite/React)
1) Entre na pasta `frontend` e instale dependências (Node + npm/yarn instalado):

```powershell
Set-Location '..\frontend'
npm install
# ou yarn
# yarn
```

2) Variável de ambiente: configure onde o frontend chama o backend.
- Crie um arquivo `.env` na pasta `frontend` com a URL base do backend (exemplo):

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

O código do frontend usa essa variável para a instância axios.

3) Rodar o Vite em dev:

```powershell
npm run dev
# por padrão roda em http://localhost:5173
```

Como o frontend autentica (JWT) e faz chamadas
- Login: POST /api/auth/login/ -> recebe `access` / `refresh`. O frontend guarda o access
  (por exemplo em localStorage) e configura o header Authorization: "Bearer <token>" nas
  requisições axios.
- Certifique-se de que o CORS no backend permita a origem do frontend (em `backend/main/settings.py`
  já configuramos `CORS_ALLOWED_ORIGINS` para localhost:5173).

Exemplos de endpoints úteis (Aprendiz)
- Listar inscrições do usuário (mais eficiente):
  GET /api/user/enrollments/
  - Retorna array de objetos Enrollment: { id, user, trail_id, created_at }

- Checar se usuário está inscrito em uma trilha:
  GET /api/trails/{trail_id}/progress/
  - Se não inscrito retorna 404 com {detail: 'Not enrolled'}

- Inscrever/Inicializar progresso:
  POST /api/trails/{trail_id}/progress/initialize/
  - Cria ou retorna a inscrição. Retorna 201 se criada, 200 se já existia.

Dicas de debug (se algo falhar)
- Verifique logs do servidor Django — eles mostram tracebacks completos quando há 500.
- Cheque se a migration `0002_create_enrollment` está aplicada: `python manage.py showmigrations users`.
- Confirme o token JWT no frontend: se o header Authorization estiver faltando, o backend retorna 401.
- Verifique CORS e a variável `VITE_API_BASE_URL` no frontend.

Notas finais e boas práticas
- Não exponha mensagens de exceção em produção (remova os try/except temporários que retornam str(e)).
- Considere retornar apenas `trail_id` em /api/user/enrollments/ se quiser reduzir payload.
- Se preferir evitar exclusões físicas de usuários, implemente *soft-delete* (campo `is_active`) e ajuste
  endpoints administrativos para alternar o status.

Se quiser, eu também gero um mini exemplo de `progressService` em JS/TS mostrando como chamar os endpoints acima com axios.
