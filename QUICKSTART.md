# 🚀 Quick Start - Trilhas Onboarding

## ⏱️ 3 Passos (2 minutos)

### 1️⃣ Preparar
```bash
# Copiar arquivos de variáveis
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2️⃣ Subir (com Docker)
```bash
docker-compose up --build
```

### 3️⃣ Acessar
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:8000

---

## 🛑 Parar
```bash
docker-compose down
```

---

## ❓ Problemas?

| Problema | Solução |
|----------|---------|
| Porta em uso | Change port in `docker-compose.yml` |
| Banco não conecta | Run `docker-compose down -v && docker-compose up --build` |
| Ver logs | `docker-compose logs -f backend` |

---

**📚 [Documentação Completa →](./README_DOCKER.md)**
