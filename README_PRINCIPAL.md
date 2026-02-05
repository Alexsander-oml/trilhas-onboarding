# 🎓 Trilhas de Onboarding - Plataforma de Aprendizado

Uma plataforma completa de gerenciamento de trilhas de aprendizado com certificação automática. Inclui backend Django + PostgreSQL e frontend React/TypeScript com suporte a Docker.

## 🚀 Quick Start com Docker

A forma mais rápida de testar é usando Docker:

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/trilhas-onboarding.git
cd trilhas-onboarding

# 2. Copiar arquivos de exemplo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Subir o projeto
docker-compose up --build

# 4. Acessar
# Frontend: http://localhost:8080
# Backend: http://localhost:8000
```

**👉 [Guia completo de Docker](./README_DOCKER.md)**

---

## 📦 Tecnologias

### Backend
- Python 3.11
- Django 5.0
- PostgreSQL 16
- REST API (DRF)
- Gunicorn + Nginx

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Nginx (production)

---

## 📁 Estrutura do Projeto

```
trilhas-onboarding/
├── backend/                    # API Django
│   ├── requirements.txt         # Deps Python
│   ├── .env.example             # Variáveis de exemplo
│   ├── Dockerfile               # Build Docker
│   ├── main/                    # Configuração Django
│   ├── onboarding_app/          # App principal
│   ├── manage.py                # Django CLI
│   └── ...
├── frontend/                   # React + TypeScript
│   ├── package.json             # Deps Node
│   ├── .env.example             # Variáveis de exemplo
│   ├── Dockerfile               # Build Docker
│   ├── src/                     # Código React
│   ├── public/                  # Assets
│   └── ...
├── docker-compose.yml           # Orquestração
├── README.md                    # Este arquivo
└── README_DOCKER.md             # Guia Docker
```

---

## ✨ Features Principais

✅ **Trilhas de Aprendizado**
- Criar e gerenciar trilhas com módulos
- Progressão automática de aprendizado
- Atividades e quizzes interativos

✅ **Sistema de Certificados**
- Geração automática de certificados em PDF
- Validação de conclusão de trilhas
- Histórico de certificados

✅ **Controle de Acesso**
- Sistema de usuários e roles
- Admin dashboard
- Insights de progresso

✅ **Pronto para Produção**
- Docker containerizado
- Variáveis de ambiente seguras
- Build otimizado para produção

---

## 🔧 Setup Local (Sem Docker)

Se preferir rodar localmente:

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Documentação

| Documento | Descrição |
|-----------|-----------|
| [README_DOCKER.md](./README_DOCKER.md) | Guia completo de Docker |
| [frontend/DOCKER_SETUP.md](./frontend/DOCKER_SETUP.md) | Setup detalhado |
| [frontend/ARCHITECTURE_DETAILS.md](./frontend/ARCHITECTURE_DETAILS.md) | Arquitetura do projeto |
| [frontend/INTEGRATION_GUIDE.md](./frontend/INTEGRATION_GUIDE.md) | Guia de API |

---

## 🗄️ Variáveis de Ambiente

### Backend (`.env`)
```env
SECRET_KEY=sua-chave-secreta
DEBUG=False
DB_HOST=db
DB_NAME=onboarding
DB_USER=postgres
DB_PASSWORD=seu-password
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://frontend:80
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🐛 Troubleshooting

**Erro ao conectar no banco?**
```bash
docker-compose down -v
docker-compose up --build
```

**Porta já em uso?**
Edite as portas em `docker-compose.yml`

**Ver logs:**
```bash
docker-compose logs -f backend   # Backend
docker-compose logs -f frontend  # Frontend
docker-compose logs -f db        # Database
```

---

## 📝 Licença

[Especificar sua licença aqui]

---

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Faça um Fork
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️**
