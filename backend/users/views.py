from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics
from .serializers import UserSerializer

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



from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import IsRole

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated, IsRole]
    required_roles = ["Administrador", "Gestor", "Mentor"]

    def get(self, request):
        return Response({"message": f"Bem-vindo, {request.user.username}! Você é um {request.user.role}."})




from .admin_serializers import AdminUserRegisterSerializer

class AdminUserRegisterView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsRole]
    required_roles = ["Administrador"]
    serializer_class = AdminUserRegisterSerializer


