# 🐳 Como Rodar o Projeto com Docker

Este documento explica como configurar e rodar todo o projeto (Backend + Frontend + Banco de Dados) com Docker em sua máquina.

## 📋 Pré-requisitos

- **Docker Desktop** instalado ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (já vem com Docker Desktop)
- ~[Máximo 5GB de espaço em disco]

### Verificar se está tudo pronto:
```powershell
docker --version
docker-compose --version
```

---

## 🚀 Iniciando o Projeto

### 1️⃣ Clonar o repositório e navegar até a raiz
```powershell
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2️⃣ Configurar variáveis de ambiente

**Backend:**
```powershell
cp backend/.env.example backend/.env
```
Edite `backend/.env` se necessário (padrões já estão configurados para desenvolvimento)

**Frontend:**
```powershell
cp frontend/.env.example frontend/.env
```

### 3️⃣ Subir os containers
```powershell
docker-compose up --build
```

Isso vai:
- ✅ Criar e iniciar banco de dados PostgreSQL
- ✅ Executar migrations do Django automaticamente
- ✅ Compilar e servir a aplicação React

### 4️⃣ Acessar a aplicação

| Serviço | URL |
|---------|-----|
| Frontend (React) | [http://localhost:8080](http://localhost:8080) |
| Backend (Django) | [http://localhost:8000](http://localhost:8000) |
| API | [http://localhost:8000/api](http://localhost:8000/api) |
| Admin Django | [http://localhost:8000/admin](http://localhost:8000/admin) |

---

## 🛑 Parando o Projeto

```powershell
# Parar containers (mantém dados)
docker-compose down

# Parar e remover volumes (limpa banco de dados)
docker-compose down -v

# Verificar containers rodando
docker ps
```

---

## 🔍 Troubleshooting

### Porta 8080 ou 8000 já está em uso?
```powershell
# Liberar a porta:
# Windows: abra Task Manager, ache o processo e encerre-o
# Ou cambie as portas no docker-compose.yml
```

### Banco de dados não conecta?
```powershell
# Verificar logs do banco:
docker-compose logs db

# Remover e recriar volume do banco:
docker-compose down -v
docker-compose up --build
```

### Erro no build do frontend/backend?
```powershell
# Rebuild completo:
docker-compose build --no-cache
docker-compose up
```

### Ver logs de um serviço específico:
```powershell
docker-compose logs backend   # Django logs
docker-compose logs frontend  # Nginx logs
docker-compose logs db        # PostgreSQL logs
```

---

## 📝 Estrutura do Projeto

```
.
├── docker-compose.yml          # Orquestração dos containers
├── backend/
│   ├── Dockerfile             # Imagem Django
│   ├── requirements.txt        # Dependências Python
│   ├── .env.example            # Variáveis de exemplo
│   └── manage.py               # Django CLI
├── frontend/
│   ├── Dockerfile             # Imagem Node/Nginx
│   ├── package.json            # Dependências Node
│   ├── .env.example            # Variáveis de exemplo
│   └── nginx.conf              # Configuração do servidor
└── README.md                   # Este arquivo
```

---

## 🔑 Variáveis Importantes

### Backend (`.env`)
- `SECRET_KEY`: Chave secreta do Django (mude em produção!)
- `DEBUG`: Modo debug (False em produção)
- `DB_HOST`: Deve ser `db` (nome do serviço Docker)
- `CORS_ALLOWED_ORIGINS`: URLs permitidas para CORS

### Frontend (`.env`)
- `VITE_API_BASE_URL`: Aponta para `http://localhost:8000/api` em desenvolvimento ou `http://backend:8000/api` no Docker

---

## 📚 Documentação Adicional

- [Docker Setup Detalhado](./frontend/DOCKER_SETUP.md)
- [Guia de Integração da API](./frontend/INTEGRATION_GUIDE.md)
- [Arquitetura do Projeto](./frontend/ARCHITECTURE_DETAILS.md)

---

## ❓ Dúvidas?

Para mais detalhes sobre a arquitetura ou API, consulte a documentação no repositório.

---

**Versão**: v1.0  
**Última atualização**: Fevereiro 2026
