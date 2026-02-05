# 🚀 Guia de Instalação - Sistema de Trilhas FAURG

## 📋 Pré-requisitos

- Docker Desktop instalado ([baixar aqui](https://www.docker.com/products/docker-desktop))
- Git (opcional, para clonar o repositório)

---

## 🔧 Instalação

### 1. Clone ou baixe o projeto

```bash
git clone <seu-repositorio>
cd <pasta-do-projeto>
```

### 2. Suba os containers

```bash
docker-compose up -d
```

Aguarde alguns segundos até os containers iniciarem (o banco precisa estar "healthy").

### 3. Crie os usuários iniciais

**No Windows (PowerShell):**
```powershell
.\create_users.ps1
```

**No Linux/Mac:**
```bash
chmod +x create_users.sh
./create_users.sh
```

---

## 🌐 Acessar o sistema

Abra o navegador em: **http://localhost:8080**

### Credenciais de teste:

**Administrador:**
- Email: `admin@trilhas.com`
- Senha: `admin123`

**Aprendiz:**
- Email: `aprendiz@trilhas.com`
- Senha: `aprendiz123`

---

## 🛠️ Comandos úteis

### Ver logs dos containers:
```bash
docker-compose logs -f
```

### Parar os containers:
```bash
docker-compose down
```

### Reiniciar do zero (apaga dados):
```bash
docker-compose down -v
docker-compose up -d
.\create_users.ps1  # Recriar usuários
```

### Acessar o banco de dados:
```bash
docker exec -it trilhas_onboarding_db psql -U postgres -d onboarding
```

---

## 🔍 Troubleshooting

### Containers não sobem:
- Verifique se as portas 8080, 8000 e 5432 estão livres
- Reinicie o Docker Desktop

### Login não funciona:
- Aguarde ~10 segundos após o `docker-compose up`
- Execute o script `create_users.ps1` novamente

### Banco vazio:
- Execute: `.\create_users.ps1`

---

## 📦 Estrutura do projeto

```
.
├── docker-compose.yml          # Orquestração dos containers
├── frontend/                   # Código React + Vite
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
├── backend/                    # (se aplicável)
├── create_users.ps1           # Script de inicialização (Windows)
├── create_users.sh            # Script de inicialização (Linux/Mac)
└── SETUP.md                   # Este arquivo
```

---

## 🎯 Próximos passos

Após o login, você pode:
- Criar trilhas de aprendizado
- Cadastrar módulos e materiais
- Gerenciar usuários (como admin)
- Inscrever-se em trilhas (como aprendiz)

---

## 💡 Suporte

Em caso de dúvidas ou problemas, verifique os logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```
