# Integration API Examples

Este documento reúne exemplos práticos para integrar o frontend (repo: `frontend`, branch `feature/TO-28/install-vite`) com o backend Django.

Ele cobre:
- Contrato de endpoints usados pelo frontend
- Exemplos `curl` para testes rápidos
- Snippets em Axios/JS para uso direto no frontend
- Snippet completo de interceptor Axios para refresh token
- Variáveis de ambiente necessárias
- Regras CORS e security notes
- Checklist de verificação para o backend

> Observação: o frontend usa `VITE_API_BASE_URL` (em `import.meta.env.VITE_API_BASE_URL`). Substitua pelos valores de ambiente do backend (ex.: `http://localhost:8000/api`).

---

## 1) Endpoints principais (resumo)

- POST `/auth/login/` — Req: `{ username, password }` => Res: `AuthResponse` { access, refresh, user }
- POST `/auth/refresh/` — Req: `{ refresh }` => Res: `{ access }`
- POST `/auth/register/` — Req: `RegisterData`
- GET `/users/me/` — retorna `User` do tipo definido em `src/types/api.ts`
- GET `/trails/` — `PaginatedResponse<Trail>`
- GET `/trails/{id}/` — detalha `Trail` com módulos e materiais
- POST `/trails/{id}/enroll/` — cria `TrailEnrollment`
- POST `/materials/{materialId}/complete/` — atualiza/cria `MaterialProgress`
- POST `/materials/{m}/quizzes/{q}/start/` — inicia tentativa (retorna `QuizAttempt` parcial)
- POST `/materials/{m}/quizzes/{q}/answer/` — enviar resposta a uma questão
- POST `/materials/{m}/quizzes/{q}/finish/` — finaliza tentativa e retorna resultado
- POST `/uploads/` (multipart/form-data) — retorna `UploadResponse` { url, fileName, fileSize, contentType }

Todos os erros devem retornar um JSON compatível com `ApiError` ou formato de validação do Django (ex.: `{field: ["error"]}`).

---

## 2) Variáveis de ambiente importantes

Frontend (arquivo `.env` / `.env.example`):

- `VITE_API_BASE_URL` — ex.: `http://localhost:8000/api`

Backend (Django):

- `SECRET_KEY`
- `DEBUG` (True/False)
- `DATABASE_URL` ou (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`)
- `CORS_ALLOWED_ORIGINS` — incluir `http://localhost:5178` durante desenvolvimento do frontend
- `ACCESS_TOKEN_MINUTES`, `REFRESH_TOKEN_DAYS` (opcional para SimpleJWT)
- `MEDIA_URL`, `MEDIA_ROOT` (para uploads)

---

## 3) Exemplos `curl`

Substitua `API_BASE_URL` e tokens conforme necessário.

```bash
API_BASE_URL="http://localhost:8000/api"
```

Login

```bash
curl -sS -X POST "$API_BASE_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo"}'
```

Refresh

```bash
curl -sS -X POST "$API_BASE_URL/auth/refresh/" \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<REFRESH_TOKEN>"}'
```

Get current user

```bash
curl -sS "$API_BASE_URL/users/me/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

List trails

```bash
curl -sS "$API_BASE_URL/trails/?page=1&pageSize=10" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Enroll in trail

```bash
curl -sS -X POST "$API_BASE_URL/trails/123/enroll/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Mark material complete

```bash
curl -sS -X POST "$API_BASE_URL/materials/456/complete/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"position": 125, "timeSpent":240, "score": 90}'
```

Upload file

```bash
curl -sS -X POST "$API_BASE_URL/uploads/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@./meuvideo.mp4"
```
```

---

## 4) Snippets Axios / JS (para usar diretamente no frontend)

### Configuração básica

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
});
```

### Login

```js
export async function login(username, password) {
  const res = await api.post('/auth/login/', { username, password });
  const { access, refresh, user } = res.data;
  localStorage.setItem('authToken', access);
  localStorage.setItem('refreshToken', refresh);
  return user;
}
```

### Listar trilhas

```js
export async function listTrails(params = {}) {
  const token = localStorage.getItem('authToken');
  const res = await api.get('/trails/', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data; // PaginatedResponse<Trail>
}
```

### Upload de arquivo

```js
export async function uploadFile(file, onProgress) {
  const token = localStorage.getItem('authToken');
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/uploads/', form, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (evt) => {
      const progress = Math.round((evt.loaded / evt.total) * 100);
      if (onProgress) onProgress(progress);
    }
  });
  return res.data; // UploadResponse
}
```

---

## 5) Snippet Axios com interceptor de refresh (padrão seguro)

> Observação: este snippet espera que `/auth/refresh/` receba `{ refresh }` e retorne `{ access }`.

```js
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(e => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      try {
        const r = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh: refreshToken });
        const newAccess = r.data.access;
        localStorage.setItem('authToken', newAccess);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
```

---

## 6) CORS, segurança e mapeamento de chaves

- O backend deve permitir o origin do frontend (`http://localhost:5178`) em `CORS_ALLOWED_ORIGINS`.
- Permitir cabeçalho `Authorization` (Bearer) nas allowed headers.
- Se o backend enviar snake_case (padrão DRF), temos 2 opções:
  1. Configurar DRF para retornar camelCase (usar `djangorestframework-camel-case`) — recomendo para conveniência do frontend.
  2. Ou o frontend faz mapeamento snake_case → camelCase ao receber a resposta. Informe qual preferência.

Segurança de tokens:
- localStorage é prático mas vulnerável a XSS. Para maior segurança, considerar cookies httpOnly + CSRF (requer fluxo diferente no frontend: `withCredentials: true`).

---

## 7) Checklist de verificação para o backend

- [ ] `POST /auth/login/` retorna `access`, `refresh`, `user` (200)
- [ ] `POST /auth/refresh/` aceita refresh e retorna novo `access` (200)
- [ ] `GET /users/me/` protegido por JWT e retorna `User`
- [ ] `GET /trails/` retorna `PaginatedResponse<Trail>` com `modules` e `materials`
- [ ] `POST /trails/{id}/enroll/` cria `TrailEnrollment` para usuário autenticado
- [ ] `POST /materials/{id}/complete/` atualiza `MaterialProgress`
- [ ] `POST /uploads/` aceita multipart e retorna `UploadResponse.url` acessível
- [ ] CORS configurado para `http://localhost:5178` e aceita `Authorization` header

---

## 8) Próximos passos (opções)

- Eu posso gerar uma coleção Postman/Insomnia com os exemplos acima (export JSON) — útil para o backend testar rapidamente.
- Eu posso adicionar um script de teste em `scripts/test-api.js` que roda chamadas básicas via Node (axios) — útil para CI local.
- Se você quiser, comito esse arquivo (`INTEGRATION_API_EXAMPLES.md`) no repositório agora (faço o commit separado). 

---

Se quiser que eu crie e commite o `INTEGRATION_API_EXAMPLES.md` agora no repositório, responda "comitar" ou apenas confirme. Caso prefira que eu gere também Postman/Insomnia, diga "collection" e eu gero também.
