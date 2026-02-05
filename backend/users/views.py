from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics, status
from .serializers import UserSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.perfil.nome if user.perfil else None
        return token
    
    def validate(self, attrs):
        # Accept 'email' in payload for projects using email as USERNAME_FIELD
        # If client sent 'email' but the serializer expects 'username', map it.
        if 'email' in attrs and 'username' not in attrs:
            attrs['username'] = attrs['email']
        
        data = super().validate(attrs)
        
        # Add user data to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.perfil.nome if self.user.perfil else None,
            'perfil': {
                'id_perfil': self.user.perfil.id_perfil if self.user.perfil else None,
                'nome': self.user.perfil.nome if self.user.perfil else None,
            } if self.user.perfil else None
        }
        
        return data

class UserLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserRegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer



from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .permissions import IsRole, IsSelfOrAdmin
from .serializers import DashboardSerializer, UserSerializer

class ProfileDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # O DashboardSerializer faz a lógica de mapeamento de funcionalidades
        serializer = DashboardSerializer(request.user)
        return Response(serializer.data)


class CurrentUserView(APIView):
    """Retorna os dados do usuário autenticado (compatibilidade com frontend).

    GET /api/auth/user/ -> dados do usuário atual
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """Logout endpoint - invalida refresh token (opcional)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Django REST Framework SimpleJWT não mantém blacklist por padrão
        # Se você tiver rest_framework_simplejwt.token_blacklist instalado,
        # pode adicionar o token à blacklist aqui
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')

        if not user.check_password(current_password):
            return Response(
                {"error": "Senha atual incorreta"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response({"message": "Senha alterada com sucesso"}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Request password reset (sends email - stub for now)."""
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        # TODO: Implement email sending logic
        return Response(
            {"message": "Se o email existir, você receberá instruções de redefinição"},
            status=status.HTTP_200_OK
        )


class UserEnrollmentsView(APIView):
    """Get enrollments for authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from onboarding_app.models import Matricula
        from onboarding_app.serializers import MatriculaSerializer
        
        # Buscar todas as matrículas do usuário
        matriculas = Matricula.objects.filter(
            id_usuario=request.user
        ).select_related('id_trilha').order_by('-data_inicio')
        
        # Serializar as matrículas
        serializer = MatriculaSerializer(matriculas, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSelfOrAdmin]
    
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil_nome = request.user.perfil.nome if request.user.perfil else "Sem perfil"
        return Response({"message": f"Bem-vindo, {request.user.username}! Você é um {perfil_nome}."})




from .admin_serializers import AdminUserRegisterSerializer

class AdminUserRegisterView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsRole]
    required_roles = ["Administrador"]
    serializer_class = AdminUserRegisterSerializer


class AdminUsersListView(generics.ListAPIView):
    """List all users - Admin only."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all().select_related('perfil').order_by('-id')


