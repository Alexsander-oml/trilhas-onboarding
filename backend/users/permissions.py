# mysite/users/permissions.py

from rest_framework import permissions

# Mapeamento de funcionalidades por Perfil
# Define quais funcionalidades de alto nível (para o Dashboard) cada perfil tem acesso.
# As chaves são os nomes dos perfis (como definidos no modelo Perfil).
# Os valores são listas de dicionários, onde cada dicionário representa uma funcionalidade.
DASHBOARD_FUNCTIONALITIES = {
    "Administrador": [
        {"nome": "Gerenciar Usuários", "descricao": "Criar, editar e excluir contas de usuários e atribuir perfis.", "url_name": "admin-user-list", "icon": "users"},
        {"nome": "Publicar e Gerenciar Trilhas", "descricao": "Criar, editar e publicar trilhas, módulos e atividades.", "url_name": "trilha-list", "icon": "book"},
        {"nome": "Gerenciar Conteúdo", "descricao": "Acesso total para criar e editar todos os tipos de conteúdo.", "url_name": "conteudo-list", "icon": "file-text"},
        {"nome": "Visualizar Matrículas", "descricao": "Acompanhar o progresso e matrículas de todos os usuários.", "url_name": "matricula-list", "icon": "list-check"},
    ],
    "Gestor": [
        {"nome": "Publicar e Gerenciar Trilhas", "descricao": "Criar, editar e publicar trilhas, módulos e atividades.", "url_name": "trilha-list", "icon": "book"},
        {"nome": "Gerenciar Conteúdo", "descricao": "Acesso para criar e editar conteúdo nas trilhas sob sua gestão.", "url_name": "conteudo-list", "icon": "file-text"},
        {"nome": "Matricular Usuários", "descricao": "Inscrever usuários em trilhas específicas.", "url_name": "matricula-list", "icon": "user-plus"},
    ],
    "Autor de Conteúdo": [
        {"nome": "Publicar e Gerenciar Trilhas", "descricao": "Criar, editar e publicar trilhas, módulos e atividades.", "url_name": "trilha-list", "icon": "book"},
        {"nome": "Gerenciar Conteúdo", "descricao": "Acesso para criar e editar conteúdo nas trilhas sob sua autoria.", "url_name": "conteudo-list", "icon": "file-text"},
    ],
    "Mentor": [
        {"nome": "Acompanhar Aprendizes", "descricao": "Visualizar o progresso dos aprendizes sob sua mentoria.", "url_name": "matricula-list", "icon": "user-graduate"},
        {"nome": "Minhas Trilhas", "descricao": "Acessar as trilhas em que está matriculado.", "url_name": "trilha-list", "icon": "book-open"},
    ],
    "Aprendiz": [
        {"nome": "Minhas Trilhas", "descricao": "Acessar e continuar as trilhas em que está matriculado.", "url_name": "matricula-list", "icon": "book-open"},
        {"nome": "Editar Perfil", "descricao": "Atualizar informações pessoais.", "url_name": "user-detail", "icon": "user-edit"},
    ],
}

class IsAdminOrGestor(permissions.BasePermission):
    """
    Permissão customizada para permitir acesso apenas a Administradores ou Gestores.
    
    CORREÇÃO: Verifica se o usuário tem um perfil associado antes de acessar o atributo 'nome'.
    Se o usuário não tiver perfil, retorna False (acesso negado).
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            # Verificar se o usuário tem um perfil associado
            if request.user.perfil is None:
                return False
            # Assume que o modelo User tem um campo 'perfil' que é uma FK para o modelo Perfil
            return request.user.perfil.nome in ["Administrador", "Gestor"]
        return False

class IsAdminOrGestorOrAutor(permissions.BasePermission):
    """
    Permissão customizada para permitir acesso a Administradores, Gestores ou Autores de Conteúdo.
    
    CORREÇÃO: Verifica se o usuário tem um perfil associado antes de acessar o atributo 'nome'.
    Se o usuário não tiver perfil, retorna False (acesso negado).
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            # Verificar se o usuário tem um perfil associado
            if request.user.perfil is None:
                return False
            return request.user.perfil.nome in ["Administrador", "Gestor", "Autor de Conteúdo"]
        return False

class IsAdmin(permissions.BasePermission):
    """
    Permissão customizada para permitir acesso apenas a Administradores.
    
    CORREÇÃO: Verifica se o usuário tem um perfil associado antes de acessar o atributo 'nome'.
    Se o usuário não tiver perfil, retorna False (acesso negado).
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            # Verificar se o usuário tem um perfil associado
            if request.user.perfil is None:
                return False
            return request.user.perfil.nome == "Administrador"
        return False

class IsSelfOrAdmin(permissions.BasePermission):
    """
    Permissão customizada para permitir acesso ao próprio usuário ou a um Administrador.
    
    CORREÇÃO: Verifica se o usuário tem um perfil associado antes de acessar o atributo 'nome'.
    """
    def has_object_permission(self, request, view, obj):
        # Permissão de leitura é permitida para todos
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permissão de escrita/edição
        if request.user.is_authenticated:
            # Verificar se o usuário tem um perfil associado
            if request.user.perfil is None:
                return False
            
            # Administrador tem acesso total
            if request.user.perfil.nome == "Administrador":
                return True
            
            # O próprio usuário pode editar seu objeto
            if hasattr(obj, 'user') and obj.user == request.user:
                return True
            
            # Se for o próprio objeto User
            if isinstance(obj, request.user.__class__) and obj == request.user:
                return True
                
        return False

# Mantendo a permissão IsRole, caso seja usada em outros lugares
class IsRole(permissions.BasePermission):
    """
    Permissão baseada em roles/perfis.
    
    CORREÇÃO: Verifica se o usuário tem um perfil associado antes de acessar o atributo 'nome'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        required_roles = getattr(view, 'required_roles', None)

        if required_roles is None:
            return True

        # Verificar se o usuário tem um perfil associado
        if request.user.perfil is None:
            return False

        return request.user.perfil.nome in required_roles
