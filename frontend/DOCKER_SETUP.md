# Instruções para rodar o projeto com Docker

## Pré-requisitos
- Docker Desktop instalado
- `docker ps` respondendo (você já confirmou)

## Como usar

### 1️⃣ Na raiz do projeto (onde está o docker-compose.yml)
```powershell
docker-compose up --build
```

### 2️⃣ Aguarde a inicialização
- PostgreSQL: Aguarda até estar saudável ✓
- Backend: Executa migrations e inicia Gunicorn 🚀
- Frontend: Build e inicia Nginx 🌐

### 3️⃣ Acesso
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:8000
- **Banco de Dados**: localhost:5432

## Parar os containers
```powershell
docker-compose down
```

## Remover volumes (limpar banco de dados)
```powershell
docker-compose down -v
```

## Verificar status
```powershell
docker ps
```

## Variáveis importantes
- `VITE_API_BASE_URL`: Automaticamente configurado como `http://backend:8000/api` (serviço do backend)
- `CORS_ALLOWED_ORIGINS`: Inclui o frontend (http://frontend:80)
- `DB_HOST`: `db` (nome do serviço PostgreSQL)

## Estrutura de network
Todos os serviços rodam na rede `trilhas_network`, permitindo comunicação pelo nome do serviço.
