BACKEND INTEGRATION BRIEF
=========================

Objetivo
-------
Este documento reúne todas as informações necessárias para que a equipe de backend (ou o Copilot do backend) implemente/ajuste a API Django de forma compatível com o frontend disponível no repositório `FAURG-Trilhas-Onboarding/frontend` (branch `feature/TO-28/install-vite`).

Entregáveis esperados
---------------------
- Endpoints REST (auth, users, trails, modules, materials, enrollments, progress, quizzes, uploads) compatíveis com os tipos do frontend
- CORS configurado para a origem do frontend (ex.: http://localhost:5178)
- JWT auth endpoints (/auth/login/, /auth/refresh/, /auth/register/ opcional) com payloads conforme descrito
- Uploads funcionando e retornando URLs acessíveis à aplicação
- (Opcional) docker-compose para Postgres + Django para ambiente local
- Fixtures (opcional) com usuários, trilhas e exemplos para teste

Arquivos chave no frontend
--------------------------
- Tipos / contrato API: `src/types/api.ts` (copie/consuma este arquivo para garantir shapes exatas)
- Axios client: `src/services/api.ts` (implementa interceptor / formato de requests esperado)
- Hooks & services que chamam a API: `src/hooks/useApi.ts`, `src/services/*Service.ts`
- Exemplo de integração e requests: `INTEGRATION_API_EXAMPLES.md` (já incluído no repo)

Recomendações de comunicação
---------------------------
- O frontend espera JSON com campos em camelCase (ex.: `createdAt`, `updatedAt`). Se o backend usar snake_case (padrão DRF), por favor informe e/ou configure um conversor (djangorestframework-camel-case) ou switch no frontend.
- Authorization: Bearer tokens (Authorization: Bearer <access>) para todas as rotas protegidas.
- Refresh tokens: `/auth/refresh/` deve aceitar `{ refresh }` e retornar `{ access }`.
- Erros de validação: retornar no formato DRF (`{ field: ["error"] }`) ou `ApiError` padrão — o frontend já trata ambos.

Contrato de API (resumo)
------------------------
Use o arquivo `src/types/api.ts` como contrato definitivo. Abaixo um resumo dos endpoints prioritários e shapes.

Auth
- POST /auth/login/
  - Request: { username: string, password: string }
  - Response 200: { access: string, refresh: string, user: User }

- POST /auth/refresh/
  - Request: { refresh: string }
  - Response 200: { access: string }

- POST /auth/register/ (opcional)
  - Request: RegisterData
  - Response: AuthResponse ou 201 created user

Users
- GET /users/me/
  - Response: User

Trails (trilhas)
- GET /trails/?page=&pageSize=&search=&tags=&status=&ordering=
  - Response: PaginatedResponse<Trail>
- GET /trails/{id}/
  - Response: Trail (deve incluir `modules: Module[]` e `materials: Material[]` dentro dos módulos ou diretamente)
- POST /trails/ (admin)
- PUT/PATCH /trails/{id}/
- DELETE /trails/{id}/

Modules & Materials
- GET /trails/{trailId}/modules/
- POST /trails/{trailId}/modules/
- GET/PUT/PATCH/DELETE /modules/{moduleId}/
- GET /modules/{moduleId}/materials/
- POST /modules/{moduleId}/materials/ or POST /materials/ (opcional)
- GET /materials/{materialId}/
- POST /materials/{materialId}/complete/  (marca material como completo/atualiza progresso)
  - Request: { position?: number, timeSpent?: number, score?: number }
  - Response: MaterialProgress

Enrollments & Progress
- POST /trails/{id}/enroll/
  - Request: {} (corpo vazio) ou com meta dados
  - Response: TrailEnrollment
- GET /users/{id}/enrollments/ ou GET /trails/{id}/enrollments/
  - Response: TrailEnrollment[]
- GET /progress/enrollments/{enrollmentId}/summary/ (opcional)
  - Response: UserProgressSummary

Quiz
- POST /materials/{materialId}/quizzes/{quizId}/start/
  - Response: QuizAttempt (iniciado, com id)
- POST /materials/{materialId}/quizzes/{quizId}/answer/
  - Request: { attempt: number, question: number, selectedOption?: number, textAnswer?: string }
  - Response: QuizAnswer or partial state
- POST /materials/{materialId}/quizzes/{quizId}/finish/
  - Request: { attempt: number }
  - Response: QuizAttempt (final)

Uploads
- POST /uploads/ (multipart/form-data)
  - Field: file
  - Response: { url: string, fileName: string, fileSize: number, contentType: string }

Erros
- 400/422: corpo com campos de validação { field: ["msg"] }
- 401: quando token inválido — frontend tenta refresh via /auth/refresh/
- Em endpoints críticos retorne formato legível: { message: string, code?: string }

Variáveis de ambiente (sugeridas)
--------------------------------
Backend (Django):
- SECRET_KEY
- DEBUG (True/False)
- DATABASE_URL OR POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT
- CORS_ALLOWED_ORIGINS (ex.: http://localhost:5178)
- ACCESS_TOKEN_MINUTES, REFRESH_TOKEN_DAYS (para SimpleJWT)
- MEDIA_ROOT, MEDIA_URL
- DJANGO_SUPERUSER_USERNAME etc. (para fixtures)

Frontend (já presente):
- VITE_API_BASE_URL (ex.: http://localhost:8000/api)

Config snippets (Django)
------------------------
settings.py (trecho recomendado):

```py
import os
from datetime import timedelta
import dj_database_url

SECRET_KEY = os.environ.get('SECRET_KEY', 'replace-me-for-dev')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

DATABASES = {
    'default': dj_database_url.parse(
        os.environ.get('DATABASE_URL', 'postgres://postgres:postgres@db:5432/postgres'),
        conn_max_age=600
    )
}

INSTALLED_APPS += ['corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', *MIDDLEWARE]
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5178').split(',')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('ACCESS_TOKEN_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('REFRESH_TOKEN_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

CamelCase vs snake_case
-----------------------
- O frontend está tipado com camelCase (`createdAt`, `updatedAt`, `progressPercentage`).
- Se o backend preferir manter snake_case (ex.: `created_at`), recomendo instalar `djangorestframework-camel-case` e configurar:

```py
# settings.py
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)
REST_FRAMEWORK['DEFAULT_PARSER_CLASSES'] = (
    'djangorestframework_camel_case.parser.CamelCaseJSONParser',
    'rest_framework.parsers.FormParser',
    'rest_framework.parsers.MultiPartParser',
)
```

Caso o backend não queira usar camelCase, o frontend pode mapear chaves, mas é mais simples manter o JSON em camelCase do backend.

Docker-compose (opcional)
--------------------------
Exemplo mínimo para desenvolvimento local (Postgres + Django + pgAdmin):

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: changeme
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - appnet

  web:
    build: .
    command: >
      sh -c "python manage.py migrate --noinput &&\
             python manage.py collectstatic --noinput &&\
             gunicorn project.wsgi:application -b 0.0.0.0:8000"
    environment:
      DATABASE_URL: postgres://appuser:changeme@db:5432/appdb
      SECRET_KEY: changeme
      DEBUG: "True"
      CORS_ALLOWED_ORIGINS: http://localhost:5178
    ports:
      - "8000:8000"
    depends_on:
      - db
    networks:
      - appnet

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - appnet

volumes:
  pgdata:

networks:
  appnet:
```

Upload de arquivos e URLs
-------------------------
- O endpoint `/uploads/` deve retornar `url` absoluto ou relativo consistente com `MEDIA_URL`.
- O frontend espera poder buscar e usar `UploadResponse.url` diretamente em tags `<video>`, `<img>` ou links.

Token rotation e refresh
------------------------
- O frontend usa o fluxo: guardar `access` e `refresh` no localStorage, usar `access` no header Authorization; caso receba 401, chamar `/auth/refresh/` com `{ refresh }` e receber `{ access }` (possivelmente novo refresh se ROTATE_REFRESH_TOKENS estiver ativo).
- Se o backend retorna novo refresh token no `/auth/refresh/`, o frontend precisa receber e persistir o novo refresh token também.

Checklist de aceitação (para o backend marcar quando pronto)
-----------------------------------------------------------
- [ ] Implementados endpoints listados neste documento
- [ ] `src/types/api.ts` compatível (ou mapeamento documentado)
- [ ] CORS configurado para `http://localhost:5178` (dev)
- [ ] Uploads funcionando e `UploadResponse.url` acessível
- [ ] Testes manuais realizados: login, refresh, listar trilhas, enroll, marcar material como completo, iniciar/responder/finalizar quiz
- [ ] (Opcional) Fixtures adicionados para facilitar testes

Como enviar isso ao frontend / colaboração
------------------------------------------
- Você pode abrir um PR no repositório backend contendo as alterações propostas em `settings.py`, as views/serializers/endpoints e fixtures.
- Se preferir, envie ao time frontend o link do commit/PR para que eu (frontend) valide e rode os testes.

Arquivos no frontend que ajudam o backend a entender os contratos
----------------------------------------------------------------
- `src/types/api.ts` — tipagens completas (o contrato)
- `INTEGRATION_API_EXAMPLES.md` — exemplos curl + Axios (já incluído no repo)
- `src/services/api.ts` — cliente Axios usado pelo frontend (para ver headers esperados e refresh flow)
- `src/hooks/useApi.ts` — usa hooks React Query e mostra keys/endpoints usados

Pedido de ação sugerido para o backend (tarefas prioritárias)
------------------------------------------------------------
1. Implementar endpoints auth (login/refresh) e users/me — validar contract com `src/types/api.ts`.
2. Implementar endpoints /trails/ com nested modules e materials e endpoints de enroll.
3. Implementar endpoint /materials/{id}/complete/ para atualizar `MaterialProgress`.
4. Implementar uploads e garantir que as URLs retornadas sejam acessíveis.
5. Configurar CORS e JWT (SimpleJWT) e documentar rotinas de refresh (se ROTATE_REFRESH_TOKENS true, avisar para frontend).
6. Fornecer fixtures ou endpoints para criar usuários de teste (admin/demo) e trilhas.

Conteúdo anexado no repo (frontend)
-----------------------------------
- `INTEGRATION_API_EXAMPLES.md` (exemplos práticos já comitados)
- `src/types/api.ts` (tipos usados como contrato)

Precisa de algo mais para mandar ao Copilot backend?
---------------------------------------------------
Posso também gerar:
- Uma coleção Postman/Insomnia pronta (export JSON)
- Um script `scripts/test-api.js` que automaticamente valida os endpoints usando Node+axios
- Fixtures JSON (ex.: `fixtures/initial_data.json`) com usuários, trilhas e exemplos

Diga qual artefato complementar você deseja que eu gere e eu crio/commito no repositório ("collection", "script", "fixtures" ou "nenhum").
