"""
Comentários das alterações (resumo):

- Adicionamos endpoints mínimos para gerenciar "enrollments" (inscrições em trilhas):
    - GET /api/trails/<trail_id>/progress/  -> checa se o usuário está inscrito
    - POST /api/trails/<trail_id>/progress/initialize/ -> cria/retorna inscrição
    - GET /api/user/enrollments/ -> retorna todas as inscrições do usuário atual

- Criamos o model `Enrollment`, serializer e migration `0002_create_enrollment.py`.
- Corrigimos import nas URLs para evitar NameError.
- Temporariamente adicionamos tratamento de exceções em algumas views durante
    a depuração para expor mensagens de erro (remover em produção).

Esses comentários ajudam quem for integrar o frontend (Vite/React) a saber
quais endpoints estão disponíveis e qual o comportamento esperado.
"""

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer, AdminUserRegisterSerializer
from .permissions import IsRole
from .models import User
from .models import Enrollment
from .serializers import EnrollmentSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

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
    serializer_class = AdminUserRegisterSerializer


class AdminUserListView(generics.ListAPIView):
    """Lista usuários (acesso restrito a Administradores)."""
    permission_classes = [IsAuthenticated, IsRole]
    required_roles = ["Administrador"]
    serializer_class = UserSerializer

    def get_queryset(self):
        # permitir filtros no futuro (ex: ?role=Mentor)
        role = self.request.query_params.get('role')
        qs = User.objects.all().order_by('id')
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Recuperar, atualizar ou deletar um usuário (acesso restrito a Administradores)."""
    permission_classes = [IsAuthenticated, IsRole]
    required_roles = ["Administrador"]
    serializer_class = UserSerializer
    queryset = User.objects.all()


class AdminUserBulkDeleteView(APIView):
    """Excluir múltiplos usuários em uma única requisição (acesso restrito a Administradores)."""
    permission_classes = [IsAuthenticated, IsRole]
    required_roles = ["Administrador"]

    def post(self, request):
        ids = request.data.get('ids')
        if not isinstance(ids, (list, tuple)):
            return Response({'detail': 'Field "ids" must be a list of integer ids.'}, status=400)

        # Convert to ints and filter out invalid
        try:
            ids = [int(i) for i in ids]
        except Exception:
            return Response({'detail': 'Invalid id in list.'}, status=400)

        qs = User.objects.filter(id__in=ids)
        deleted_count = qs.count()
        qs.delete()
        return Response({'deleted': deleted_count})


class CurrentUserView(APIView):
    """
    Retorna o usuário atualmente autenticado.
    Endpoint útil para o frontend obter o perfil completo após login.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TrailProgressView(APIView):
    """Retorna a inscrição (enrollment) do usuário autenticado para a trilha informada.
    GET /api/trails/<trail_id>/progress/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, trail_id: int):
        try:
            user = request.user
            enrollment = Enrollment.objects.filter(user=user, trail_id=trail_id).first()
            if not enrollment:
                return Response({'detail': 'Not enrolled'}, status=404)
            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data)
        except Exception as e:
            # Retornar a mensagem da exceção para facilitar depuração (temporário)
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InitializeTrailProgressView(APIView):
    """Cria uma inscrição para a trilha para o usuário autenticado.
    POST /api/trails/<trail_id>/progress/initialize/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, trail_id: int):
        try:
            user = request.user
            enrollment, created = Enrollment.objects.get_or_create(user=user, trail_id=trail_id)
            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data, status=(status.HTTP_201_CREATED if created else status.HTTP_200_OK))
        except Exception as e:
            # Retornar a mensagem da exceção para facilitar depuração (temporário)
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserEnrollmentsView(APIView):
    """Retorna todas as inscrições do usuário autenticado.
    GET /api/user/enrollments/
    Retorna lista de EnrollmentSerializer para o usuário atual.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            qs = Enrollment.objects.filter(user=user)
            serializer = EnrollmentSerializer(qs, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Retornar a mensagem da exceção para facilitar depuração (temporário)
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
