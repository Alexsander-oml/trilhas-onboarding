# Sistema de Login Django com DRF e SimpleJWT

Este projeto implementa um sistema de autenticação e autorização baseado em papéis utilizando Django REST Framework (DRF) e SimpleJWT, com PostgreSQL como banco de dados.

## Funcionalidades

*   **Autenticação de Usuário:** Login com e-mail e senha, gerando tokens JWT (Access e Refresh).
*   **Autorização Baseada em Papéis:** Os tokens JWT incluem o papel do usuário, permitindo controle de acesso a rotas protegidas.
*   **Modelos de Usuário Personalizados:** O modelo de usuário foi estendido para incluir um campo `role` (papel).
*   **Gerenciamento de Usuários por Administrador:** Um administrador pode registrar novos usuários com papéis específicos.
*   **PostgreSQL:** Configurado como o banco de dados principal.

## Papéis de Usuário

Os seguintes papéis são definidos no sistema:

*   **Aprendiz**
*   **Mentor**
*   **Gestor**
*   **Autor de conteúdo**
*   **Administrador**

## Configuração do Ambiente

### Pré-requisitos

Certifique-se de ter o Python 3.11 e o PostgreSQL instalados em seu sistema.

### Passos para Configuração

1.  **Clone o repositório (se aplicável) ou crie o projeto Django:**

    ```bash
    django-admin startproject mysite
    cd mysite
    ```

2.  **Crie e ative um ambiente virtual:**

    ```bash
    python3.11 -m venv venv
    source venv/bin/activate
    ```

3.  **Instale as dependências:**

    ```bash
    pip install Django djangorestframework djangorestframework-simplejwt psycopg2-binary
    ```

4.  **Configuração do PostgreSQL:**

    Certifique-se de que o serviço PostgreSQL esteja em execução. Crie o banco de dados e o usuário conforme as informações fornecidas:

    ```bash
    sudo service postgresql start
    sudo -u postgres psql -c "CREATE DATABASE onboarding;"
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'admin';"
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'admin';" # Garante que a senha está definida
    ```

    Edite o arquivo `pg_hba.conf` (geralmente em `/etc/postgresql/14/main/pg_hba.conf`) para permitir autenticação `md5` para conexões locais. Adicione as seguintes linhas (ou modifique as existentes):

    ```
    host    all             all             127.0.0.1/32            md5
    host    all             all             ::1/128                 md5
    ```

    Após a edição, reinicie o PostgreSQL:

    ```bash
    sudo service postgresql restart
    ```

5.  **Configuração do Django `settings.py`:**

    No arquivo `mysite/settings.py`, configure o banco de dados e adicione os aplicativos `rest_framework`, `rest_framework_simplejwt` e `users` em `INSTALLED_APPS`. Adicione também as configurações do SimpleJWT e o modelo de usuário personalizado.

    ```python
    # mysite/settings.py

    INSTALLED_APPS = [
        # ...
        'rest_framework',
        'rest_framework_simplejwt',
        'users',
    ]

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': 'onboarding',
            'USER': 'postgres',
            'PASSWORD': 'admin',
            'HOST': 'localhost',
            'PORT': '5432',
        }
    }

    AUTH_USER_MODEL = 'users.User'

    REST_FRAMEWORK = {
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        )
    }

    from datetime import timedelta

    SIMPLE_JWT = {
        'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
        'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
        'ROTATE_REFRESH_TOKENS': False,
        'BLACKLIST_AFTER_ROTATION': False,
        'UPDATE_LAST_LOGIN': False,

        'ALGORITHM': 'HS256',
        'SIGNING_KEY': SECRET_KEY,
        'VERIFYING_KEY': None,
        'AUDIENCE': None,
        'ISSUER': None,
        'JWK_URL': None,
        'LEEWAY': 0,

        'AUTH_HEADER_TYPES': ('Bearer',),
        'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
        'USER_ID_FIELD': 'id',
        'USER_ID_CLAIM': 'user_id',
        'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

        'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
        'TOKEN_TYPE_CLAIM': 'token_type',
        'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

        'JTI_CLAIM': 'jti',

        'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
        'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
        'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
    }
    ```

6.  **Crie o aplicativo `users` e defina o modelo de usuário:**

    ```bash
    python3.11 manage.py startapp users
    ```

    No arquivo `users/models.py`, defina o modelo `User`:

    ```python
    # users/models.py

    from django.db import models
    from django.contrib.auth.models import AbstractUser

    class User(AbstractUser):
        ROLE_CHOICES = (
            ("Aprendiz", "Aprendiz"),
            ("Mentor", "Mentor"),
            ("Gestor", "Gestor"),
            ("Autor de conteúdo", "Autor de conteúdo"),
            ("Administrador", "Administrador"),
        )
        email = models.EmailField(unique=True)
        role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="Aprendiz")

        USERNAME_FIELD = "email"
        REQUIRED_FIELDS = ["username", "role"]

        def __str__(self):
            return self.email
    ```

7.  **Crie e aplique as migrações:**

    ```bash
    python3.11 manage.py makemigrations users
    python3.11 manage.py migrate
    ```

8.  **Crie o superusuário administrador:**

    ```bash
    python3.11 manage.py create_superuser_with_role --email admin@example.com --username admin --password admin --role Administrador
    ```

9.  **Defina Serializers, Views e URLs para autenticação e registro:**

    Crie `users/serializers.py`:

    ```python
    # users/serializers.py

    from rest_framework import serializers
    from .models import User

    class UserSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ("id", "username", "email", "role", "password")
            extra_kwargs = {"password": {"write_only": True}}

        def create(self, validated_data):
            user = User.objects.create_user(
                email=validated_data["email"],
                username=validated_data["username"],
                password=validated_data["password"],
                role=validated_data.get("role", "Aprendiz")
            )
            return user

    class AdminUserRegisterSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ("id", "username", "email", "role", "password")
            extra_kwargs = {"password": {"write_only": True}}

        def create(self, validated_data):
            user = User.objects.create_user(
                email=validated_data["email"],
                username=validated_data["username"],
                password=validated_data["password"],
                role=validated_data.get("role", "Aprendiz")
            )
            return user
    ```

    Crie `users/permissions.py`:

    ```python
    # users/permissions.py

    from rest_framework.permissions import BasePermission

    class IsRole(BasePermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False

            required_roles = getattr(view, 'required_roles', None)

            if required_roles is None:
                return True

            return request.user.role in required_roles
    ```

    No arquivo `users/views.py`:

    ```python
    # users/views.py

    from rest_framework_simplejwt.views import TokenObtainPairView
    from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
    from rest_framework import generics
    from rest_framework.permissions import IsAuthenticated
    from rest_framework.response import Response
    from rest_framework.views import APIView
    from .serializers import UserSerializer
    from .permissions import IsRole

    class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
        @classmethod
        def get_token(cls, user):
            token = super().get_token(user)
            token["role"] = user.role
            return token

    class UserLoginView(TokenObtainPairView):
        serializer_class = CustomTokenObtainPairSerializer

    class UserRegisterView(generics.CreateAPIView):
        serializer_class = UserSerializer

    class ProtectedView(APIView):
        permission_classes = [IsAuthenticated, IsRole]
        required_roles = ["Administrador", "Gestor"]

        def get(self, request):
            return Response({"message": f"Bem-vindo, {request.user.username}! Você é um {request.user.role}."})

    class AdminUserRegisterView(generics.CreateAPIView):
        permission_classes = [IsAuthenticated, IsRole]
        required_roles = ["Administrador"]
        serializer_class = UserSerializer # Usar UserSerializer para registro
    ```

    No arquivo `users/urls.py`:

    ```python
    # users/urls.py

    from django.urls import path
    from rest_framework_simplejwt.views import TokenRefreshView
    from .views import UserLoginView, UserRegisterView, ProtectedView, AdminUserRegisterView

    urlpatterns = [
        path("auth/login/", UserLoginView.as_view(), name="token_obtain_pair"),
        path("auth/login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
        path("auth/register/", UserRegisterView.as_view(), name="user_register"),
        path("protected/", ProtectedView.as_view(), name="protected_view"),
        path("admin/register/", AdminUserRegisterView.as_view(), name="admin_user_register"),
    ]
    ```

    No arquivo `mysite/urls.py`, inclua as URLs do aplicativo `users`:

    ```python
    # mysite/urls.py

    from django.contrib import admin
    from django.urls import path, include

    urlpatterns = [
        path("admin/", admin.site.urls),
        path("api/", include("users.urls")),
    ]
    ```

10. **Comando de gerenciamento personalizado:**

    Crie o diretório `users/management/commands` e o arquivo `users/management/commands/create_superuser_with_role.py`:

    ```python
    # users/management/commands/create_superuser_with_role.py

    from django.core.management.base import BaseCommand
    from users.models import User

    class Command(BaseCommand):
        help = 'Cria um superusuário com um papel específico.'

        def add_arguments(self, parser):
            parser.add_argument('--email', type=str, required=True, help='O email do superusuário.')
            parser.add_argument('--username', type=str, required=True, help='O nome de usuário do superusuário.')
            parser.add_argument('--password', type=str, required=True, help='A senha do superusuário.')
            parser.add_argument('--role', type=str, default='Administrador', help='O papel do superusuário (padrão: Administrador).')

        def handle(self, *args, **options):
            email = options['email']
            username = options['username']
            password = options['password']
            role = options['role']

            if not User.objects.filter(email=email).exists():
                User.objects.create_superuser(email=email, username=username, password=password, role=role)
                self.stdout.write(self.style.SUCCESS(f'Superusuário {email} com papel {role} criado com sucesso!'))
            else:
                self.stdout.write(self.style.WARNING(f'Superusuário com email {email} já existe.'))
    ```

## Como Testar

1.  **Inicie o servidor Django:**

    ```bash
    python3.11 manage.py runserver 0.0.0.0:8000
    ```

2.  **Login do Administrador (exemplo com `curl`):**

    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"email": "admin@example.com", "password": "admin"}' http://127.0.0.1:8000/api/auth/login/
    ```

    Isso retornará um token de acesso e um token de atualização. Copie o `access` token.

3.  **Acessar rota protegida (exemplo com `curl`):**

    ```bash
    ACCESS_TOKEN="<SEU_ACCESS_TOKEN>"
    curl -X GET -H "Authorization: Bearer $ACCESS_TOKEN" http://127.0.0.1:8000/api/protected/
    ```

    Se o login for bem-sucedido e o token for válido, você verá uma mensagem de boas-vindas com o papel do usuário.

4.  **Registrar novo usuário como Administrador (exemplo com `curl`):**

    ```bash
    ACCESS_TOKEN="<SEU_ACCESS_TOKEN>"
    curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" -d '{"username": "novo_mentor", "email": "mentor@example.com", "password": "mentorpass", "role": "Mentor"}' http://127.0.0.1:8000/api/admin/register/
    ```

    Isso criará um novo usuário com o papel de Mentor.

## Próximos Passos

*   Implementar mais funcionalidades para cada papel.
*   Adicionar testes unitários e de integração mais abrangentes.
*   Configurar um servidor de produção (Gunicorn, Nginx, etc.).
*   Implementar recuperação de senha e edição de perfil.


