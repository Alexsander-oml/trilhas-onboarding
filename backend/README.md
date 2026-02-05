# Sistema de Onboarding com Django REST Framework

Este projeto implementa um sistema de autenticação e autorização baseado em papéis utilizando Django REST Framework e SimpleJWT, além de funcionalidades para gerenciamento de trilhas de onboarding, módulos, atividades e conteúdos.

## Estrutura do Projeto

- `onboarding/`: Módulo de configurações do projeto.
- `users/`: Aplicativo Django para gerenciamento de usuários, autenticação e autorização.
- `onboarding_app/`: Aplicativo Django para gerenciamento de trilhas, módulos, atividades, conteúdos e matrículas.

## Configuração do Ambiente

1.  **Clone o repositório (ou descompacte o arquivo `mysite_updated.zip`):**

    ```bash
    # Se for um repositório git
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DO_PROJETO>
    # Se for o arquivo zip
    unzip onboarding_project_refactored.zip
    cd onboarding_project
    ```

2.  **Crie e ative um ambiente virtual:**

    ```bash
    python -m venv venv
    # No Windows
    .\venv\Scripts\activate
    # No Linux/macOS
    source venv/bin/activate
    ```

3.  **Instale as dependências:**

    ```bash
    pip install Django djangorestframework djangorestframework-simplejwt psycopg2-binary
    ```

4.  **Configuração do PostgreSQL:**

    Certifique-se de ter o PostgreSQL instalado e rodando. Crie um banco de dados chamado `onboarding` e um usuário `postgres` com a senha `admin` (ou ajuste as configurações em `onboarding/settings.py`).

    **No Windows:**
    *   Inicie o serviço PostgreSQL via Gerenciador de Serviços ou `net start postgresql-x64-XX`.
    *   Se necessário, use `psql` ou pgAdmin para criar o banco de dados `onboarding` e o usuário `postgres` com a senha `admin`.

    **No Linux/WSL:**
    ```bash
    sudo service postgresql start
    sudo -u postgres psql -c "CREATE DATABASE onboarding;"
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'admin';"
    sudo -u postgres psql -c "ALTER ROLE postgres SET client_encoding TO 'utf8';"
    sudo -u postgres psql -c "ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';"
    sudo -u postgres psql -c "ALTER ROLE postgres SET timezone TO 'UTC';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE onboarding TO postgres;"
    ```

5.  **Aplique as migrações do banco de dados:**

    ```bash
    # Exclua os arquivos de migração antigos (exceto __init__.py) em users/migrations/ e onboarding_app/migrations/
    # Em seguida, execute na ordem correta:
    python manage.py makemigrations users
    python manage.py makemigrations onboarding_app
    python manage.py migrate
    ```

6.  **Crie os perfis iniciais (Administrador, Gestor, Autor de Conteúdo, Aprendiz, Mentor):**

    Você pode criar esses perfis manualmente através do painel de administração do Django (`http://127.0.0.1:8000/admin/`) na seção `Users` -> `Perfis`.

    *   `Nome: Administrador`, `Descrição: Usuário com acesso total.`
    *   `Nome: Gestor`, `Descrição: Usuário que pode gerenciar trilhas e matricular usuários.`
    *   `Nome: Autor de Conteúdo`, `Descrição: Usuário que pode criar e editar trilhas e conteúdos.`
    *   `Nome: Aprendiz`, `Descrição: Usuário padrão.`
    *   `Nome: Mentor`, `Descrição: Usuário que pode orientar aprendizes.`

7.  **Crie um superusuário administrador:**

    ```bash
    python manage.py create_superuser_with_role --email admin@example.com --username admin --password admin --role Administrador
    ```

8.  **Inicie o servidor de desenvolvimento:**

    ```bash
    python manage.py runserver
    ```

## Endpoints da API

Todos os endpoints estão sob `/api/`.

### Autenticação e Usuários

*   **`GET, PUT, PATCH, DELETE /api/users/<id>/`**: Visualiza, atualiza ou exclui um usuário específico.
    *   **Permissão:** Apenas o próprio usuário ou um `Administrador` pode acessar/modificar.
    *   **PUT/PATCH Corpo da Requisição (JSON):** `{"email": "novo.email@example.com", ...}`
    *   **Cabeçalho:** `Authorization: Bearer <SEU_ACCESS_TOKEN>`

*   **`POST /api/auth/login/`**: Realiza o login e retorna tokens JWT (`access` e `refresh`).

*   **`POST /api/auth/login/`**: Realiza o login e retorna tokens JWT (`access` e `refresh`).
    *   **Corpo da Requisição (JSON):** `{"email": "seu_email", "password": "sua_senha"}`
*   **`POST /api/auth/register/`**: Registra um novo usuário. O papel padrão é `Aprendiz`.
    *   **Corpo da Requisição (JSON):** `{"username": "seu_username", "email": "seu_email", "password": "sua_senha"}`
*   **`POST /api/admin/register/`**: Registra um novo usuário com um papel específico (apenas para `Administrador`).
    *   **Corpo da Requisição (JSON):** `{"username": "novo_usuario", "email": "email@example.com", "password": "senha", "perfil_nome": "Gestor"}`
    *   **Cabeçalho:** `Authorization: Bearer <TOKEN_ADMINISTRADOR>`
*   **`GET /api/users/dashboard/`**: Retorna o painel de perfil do usuário logado, incluindo informações do usuário e a lista de funcionalidades disponíveis dinamicamente, baseada no seu papel (role).
    *   **Cabeçalho:** `Authorization: Bearer <SEU_ACCESS_TOKEN>`
*   **`GET /api/protected/`**: Rota de exemplo protegida. Apenas usuários com papel `Administrador` ou `Gestor` podem acessar.
    *   **Cabeçalho:** `Authorization: Bearer <SEU_ACCESS_TOKEN>`

### Gerenciamento de Trilhas

*   **`POST /api/trilhas/create/`**: Cria uma nova trilha. Requer papéis `Administrador`, `Gestor` ou `Autor de Conteúdo`.
    *   **Corpo da Requisição (JSON):** Exemplo:
        ```json
        {
            "versao": "1.0",
            "status": "Rascunho",
            "titulo": "Trilha de Onboarding para Desenvolvedores",
            "descricao": "Trilha completa para novos desenvolvedores.",
            "objetivos": "Aprender as ferramentas e processos da empresa.",
            "publico_alvo": "Desenvolvedores Júnior",
            "prazo_recomendado": 30,
            "is_template": false
        }
        ```
    *   **Cabeçalho:** `Authorization: Bearer <TOKEN_AUTORIZADO>`
*   **`GET /api/trilhas/<id_trilha>/`**: Retorna detalhes de uma trilha específica.
*   **`PUT /api/trilhas/<id_trilha>/`**: Atualiza uma trilha existente. Requer papéis `Administrador`, `Gestor` ou `Autor de Conteúdo`.
    *   **Cabeçalho:** `Authorization: Bearer <TOKEN_AUTORIZADO>`
*   **`DELETE /api/trilhas/<id_trilha>/`**: Exclui uma trilha existente. Requer papéis `Administrador`, `Gestor` ou `Autor de Conteúdo`.
    *   **Cabeçalho:** `Authorization: Bearer <TOKEN_AUTORIZADO>`

### Gerenciamento de Conteúdos

*   **`POST /api/conteudos/create/`**: Cria um novo conteúdo para uma atividade. Requer papéis `Administrador`, `Gestor` ou `Autor de Conteúdo`.
    *   **Corpo da Requisição (JSON):** Exemplo:
        ```json
        {
            "id_atividade": 1,  // ID da atividade à qual o conteúdo pertence
            "tipo": "Texto",    // 

