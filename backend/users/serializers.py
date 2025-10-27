from rest_framework import serializers
from .models import User
from .models import Enrollment

# Serializers adicionados:
# - UserSerializer / AdminUserRegisterSerializer: criar/atualizar usuários (hash de senha tratado)
# - EnrollmentSerializer: serializa o model Enrollment usado pelo frontend para checar/initializar inscrições


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
            role=validated_data.get("role", "Aprendiz"),
        )
        return user

    def update(self, instance, validated_data):
        # Handle password separately so it gets hashed
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


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
            role=validated_data.get("role", "Aprendiz"),
        )
        return user


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ('id', 'user', 'trail_id', 'created_at')
        read_only_fields = ('id', 'created_at')
