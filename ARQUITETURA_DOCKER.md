# 🏗️ Arquitetura do Setup Docker

Este documento mostra visualmente como todos os componentes funcionam juntos com Docker.

---

## 🔄 Fluxo de Arquivos & Componentes

```
┌────────────────────────────────────────────────────────────────┐
│                    SEU REPOSITÓRIO GITHUB                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  docker-compose.yml                                        │ │
│  │  ├─ Define 3 serviços que rodam em containers             │ │
│  │  └─ Orquestra rede e volumes                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                 │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  backend/   │  │  frontend/  │  │  postgres   │            │
│  │ Dockerfile  │  │ Dockerfile  │  │ (imagem)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                 │
│                           ▼                                     │
│                  ┌─────────────────┐                            │
│                  │  docker build   │                            │
│                  │  docker run     │                            │
│                  └─────────────────┘                            │
│                           │                                     │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                    DOCKER COMPOSE UP
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  CONTAINER   │      │  CONTAINER   │      │  CONTAINER   │
│   BACKEND    │      │  FRONTEND    │      │  DATABASE    │
│              │      │              │      │              │
│ Port 8000    │      │ Port 8080    │      │ Port 5432    │
│ :8000        │      │ :80          │      │ :5432        │
│              │      │              │      │              │
│ Django       │      │ React+Nginx  │      │ PostgreSQL   │
│ Gunicorn     │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
      │                     │                     │
      │   Network: trilhas_network                │
      └─────────────────────┼─────────────────────┘
                            │
            Todos conseguem se comunicar
         pelo nome do serviço (db, backend, frontend)
```

---

## 🌐 Conexões entre Serviços

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
│                    http://localhost                          │
├─────────────────────────────────────────────────────────────┤
│                           ▲                                   │
│                           │ HTTP                             │
│                           ▼                                   │
│           ┌───────────────────────────┐                      │
│           │  FRONTEND (Port 8080)     │                      │
│           │                           │                      │
│           │ React App + Nginx         │                      │
│           │ Localhost:8080    ────────┼──┐                   │
│           └───────────────────────────┘  │                   │
│                           │               │                   │
│                           │ HTTP Request │                   │
│                           │ /api/...     │                   │
│                           ▼               │                   │
│        ┌──────────────────────────────────┼────┐             │
│        │  Docker Network: trilhas_network │    │             │
│        │      (todas conseguem falar)     │    │             │
│        │                                  │    │             │
│        │  Rota: http://backend:8000/api  ◄────┘             │
│        │                                  │                   │
│        │     ┌────────────────────────┐  │                   │
│        │     │  BACKEND (Port 8000)   │  │                   │
│        │     │                        │  │                   │
│        │     │ Django + Gunicorn      │  │                   │
│        │     │ http://localhost:8000  │  │                   │
│        │     │ localhost:8000 ────────┼──┘                   │
│        │     │        │               │                       │
│        │     │        │ SQL           │                       │
│        │     │        ▼               │                       │
│        │     │  ┌──────────────┐     │                       │
│        │     │  │ DATABASE     │     │                       │
│        │     │  │ postgres:5432│     │                       │
│        │     │  │              │     │                       │
│        │     │  │ Data persists│     │                       │
│        │     │  │ in volume    │     │                       │
│        │     │  └──────────────┘     │                       │
│        │     │                        │                       │
│        │     │ Rota: db (nome svc)   │                       │
│        │     │ Porta: 5432           │                       │
│        │     └────────────────────────┘                       │
│        │                                  │                   │
│        └──────────────────────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Volume & Dados Persistentes

```
┌──────────────────────────────────────────────────────────┐
│              DOCKER VOLUMES                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  postgres_data:                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  /var/lib/postgresql/data (dentro container)      │ │
│  │              ▲                                      │ │
│  │              │ Mapeado para                        │ │
│  │              ▼                                      │ │
│  │  postgres_data (no host)                           │ │
│  │                                                    │ │
│  │  ✅ Persiste quando container para                │ │
│  │  ✅ Pode ser compartilhado                        │ │
│  │  ✅ docker-compose down -v para deletar           │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  backend/ (source code)                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ./backend (no host)                               │ │
│  │      ▲                                              │ │
│  │      │ Mapeado para                                │ │
│  │      ▼                                              │ │
│  │  /app (dentro container)                           │ │
│  │                                                    │ │
│  │  ✅ Mudanças sincronizam em tempo real             │ │
│  │  ✅ Perfeito para desenvolvimento                  │ │
│  │  ✅ Comentado em docker-compose para produção     │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Lifecycle - O que Acontece ao Fazer `docker-compose up`

```
PASSO 1: BUILD
┌────────────────────────────────────────┐
│ docker-compose build                   │
├────────────────────────────────────────┤
│ • Cria imagem backend (Python 3.11)   │
│ • Cria imagem frontend (Node 20)      │
│ • Seta variáveis de ambiente          │
│ • Instala dependências                │
└────────────────────────────────────────┘
              ▼
PASSO 2: UP
┌────────────────────────────────────────┐
│ docker-compose up                      │
├────────────────────────────────────────┤
│ 1. Cria rede trilhas_network          │
│ 2. INICIA DB                           │
│    └─ 5432 ready                      │
│ 3. INICIA BACKEND (quando DB online)  │
│    └─ Migrations automáticas           │
│    └─ Gunicorn :8000                   │
│ 4. INICIA FRONTEND (quando BE online) │
│    └─ Build React completado          │
│    └─ Nginx :80 (port 8080 host)     │
└────────────────────────────────────────┘
              ▼
PRONTO PARA USAR!
┌────────────────────────────────────────┐
│ ✅ Frontend:  http://localhost:8080   │
│ ✅ Backend:   http://localhost:8000   │
│ ✅ API:       http://localhost:8000/api│
│ ✅ Database:  localhost:5432          │
└────────────────────────────────────────┘
```

---

## 🛑 Shutdown - O que Acontece ao Fazer `docker-compose down`

```
docker-compose down
        │
        ▼
    STEP 1: STOP
    ┌─────────────────┐
    │ Parar containers│
    │ - Frontend      │
    │ - Backend       │
    │ - Database      │
    └─────────────────┘
        │
        ▼
    STEP 2: REMOVE
    ┌─────────────────┐
    │ Remover         │
    │ - Containers    │
    │ - Network       │
    │ ✅ Dados BD     │ (persiste se NÃO usar -v)
    └─────────────────┘
        │
        ▼
    DONE!
    
    └─ Para remover volume (limpar BD):
       └─ docker-compose down -v
```

---

## 📋 Checklist de Portas

```
┌──────────────────────────────────────────────────────────┐
│              PORTAS & ACESSOS                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SERVIÇO      CONTAINER   HOST         ACESSO           │
│  ────────────────────────────────────────────────────────│
│  Frontend     :80         :8080        ✅ http://...    │
│  Backend      :8000       :8000        ✅ http://...    │
│  Database     :5432       :5432        ✅ psql/tools    │
│                                                          │
│  Dentro Docker Network (serviço para serviço):          │
│  ────────────────────────────────────────────────────────│
│  Frontend → Backend: http://backend:8000/api            │
│  Backend → DB: postgresql://db:5432/onboarding          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ Variáveis que Conectam Tudo

```
┌─────────────────────────────────────────────────┐
│  ENVIRONMENT VARIABLES (docker-compose.yml)    │
├─────────────────────────────────────────────────┤
│                                                 │
│  DATABASE CONNECTION:                           │
│  DB_HOST=db                  ← Nome do service │
│  DB_PORT=5432               ← Porta padrão     │
│  DB_NAME=onboarding                            │
│  DB_USER=postgres                              │
│  DB_PASSWORD=admin                             │
│                                                 │
│  BACKEND (para Frontend):                       │
│  CORS_ALLOWED_ORIGINS=                         │
│    http://frontend:80       ← Frontend service │
│                                                 │
│  FRONTEND (para Backend):                       │
│  VITE_API_BASE_URL=                            │
│    http://backend:8000/api  ← Backend service  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Resumo Visual: Do Código ao Browser

```
SEU CÓDIGO LOCAL
    │
    ├─ backend/ ────────┐
    │                    │
    ├─ frontend/ ───────┤ (volumes mapeados)
    │                    │
    └─ docker-compose   ─┤
                         │
              ┌──────────┴──────────┐
              DOCKER BUILD          │
              DOCKER RUN            │
              │                     │
              ▼                     ▼
        ┌──────────────┐   ┌──────────────┐
        │  Containers  │   │  Containers  │
        │   rodando    │   │   rodando    │
        └──────────────┘   └──────────────┘
              │          Communication
              └────────────────────────────┐
                                           ▼
                            ┌─────────────────────┐
                            │  http://localhost:  │
                            │  8080 (seu browser) │
                            └─────────────────────┘
```

---

## ✅ Verificação Final

Após rodar `docker-compose up`, você pode verificar tudo com:

```bash
# Ver containers rodando
docker ps

# Saída esperada:
# CONTAINER ID  IMAGE              NAMES
# xxxxx         ...backend         trilhas_onboarding_backend
# xxxxx         ...frontend        trilhas_onboarding_frontend
# xxxxx         postgres:16-alpine trilhas_onboarding_db

# Ver rede
docker network ls
#❌ trilhas_onboarding_trilhas_network

# Verificar volumes
docker volume ls
#❌ trilhas_onboarding_postgres_data
```

---

**Esta é a "visão 30.000 pés" da arquitetura. Para detalhes práticos, veja README_DOCKER.md**
