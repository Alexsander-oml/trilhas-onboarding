# ✅ Checklist para Upload no GitHub

Complete este checklist antes de fazer o push para o GitHub:

## 🔒 Segurança

- ✅ [ ] Remover arquivos `.env` (manter apenas `.env.example`)
  ```bash
  git rm --cached backend/.env frontend/.env
  ```

- ✅ [ ] Remover arquivos sensíveis:
  ```bash
  git rm --cached backend/detailed_response.json
  git rm --cached backend/venv -r  # Se existir
  ```

- ✅ [ ] Verificar `.gitignore` (ver abaixo)

- ✅ [ ] Mudar `SECRET_KEY` em produção (não usar a do exemplo)

## 📦 Dependências

- ✅ [ ] Backend: `requirements.txt` atualizado
  ```bash
  cd backend
  pip freeze > requirements.txt
  ```

- ✅ [ ] Frontend: `package.json` e `package-lock.json` presentes
  ```bash
  cd frontend
  npm ci
  ```

## 📄 Documentação

- ✅ [ ] README.md na raiz - ✅ CRIADO
- ✅ [ ] README_DOCKER.md - ✅ CRIADO  
- ✅ [ ] backend/.env.example - ✅ CRIADO
- ✅ [ ] frontend/.env.example - ✅ EXISTENTE
- ✅ [ ] docker-compose.yml com comentários - ✅ EXISTENTE
- ✅ [ ] Dockerfile (backend e frontend) - ✅ EXISTENTES

## 🐳 Docker

- ✅ [ ] `docker-compose.yml` testado localmente:
  ```bash
  docker-compose up --build
  ```

- ✅ [ ] Frontend accessible: http://localhost:8080
- ✅ [ ] Backend accessible: http://localhost:8000/api
- ✅ [ ] Database connected and migrations ran

## 🔍 Verificações Finais

- ✅ [ ] Remover arquivos de teste/debug:
  ```bash
  # Remover arquivos de teste na raiz
  git rm --cached check_*.py
  git rm --cached test_*.py
  git rm --cached create_*.py
  git rm --cached quick_*.py
  # ... (ou adicionar ao .gitignore)
  ```

- ✅ [ ] Limpar `__pycache__` e `node_modules`:
  ```bash
  find . -type d -name __pycache__ -exec rm -rf {} +
  cd frontend && rm -rf node_modules dist
  ```

- ✅ [ ] Verificar se `.gitignore` ignora:
  ```
  .env
  .env.local
  /node_modules/
  /dist/
  __pycache__/
  *.pyc
  venv/
  .Python
  postgres_data/
  /*.log
  db.sqlite3
  ```

## 🚀 Fazer o Push

```bash
# 1. Verificar status
git status

# 2. Adicionar arquivos
git add .

# 3. Commit
git commit -m "docs: preparar para upload no GitHub com suporte Docker"

# 4. Push
git push origin main
```

## 📋 Exemplo de .gitignore bem configurado

Verifique se o seu `.gitignore` na raiz contém:

```ignore
# Environment variables
.env
.env.local
.env.*.local

# Node
node_modules/
npm-debug.log*
/dist/
/build/

# Python
__pycache__/
*.py[cod]
*.so
venv/
ENV/
env/
.Python
*.egg-info/

# Django
*.log
db.sqlite3
/media/
/staticfiles/

# IDE
.vscode/
.idea/
*.swp

# Docker
postgres_data/

# OS
.DS_Store
Thumbs.db

# Local test files
/test_*.py
/check_*.py
/quick_*.py
/create_*.py
```

## 🎯 O que Fazer Após o Push

1. [ ] Habilitar GitHub Actions (se quiser CI/CD)
2. [ ] Adicionar tópicos: `django`, `react`, `docker`, `onboarding`
3. [ ] Escrever uma boa descrição do repositório
4. [ ] Adicionar link para documentação
5. [ ] Considerar adicionar licença (LICENSE.md)

---

**Data**: Fevereiro 2026
**Status**: ✅ Pronto para upload

Qualquer arquivo que você não quer que apareça no GitHub, adicione ao `.gitignore`:
```bash
echo "seu-arquivo.txt" >> .gitignore
```
