from rest_framework import serializers
from .models import User, Perfil

class AdminUserRegisterSerializer(serializers.ModelSerializer):
    perfil = serializers.PrimaryKeyRelatedField(queryset=Perfil.objects.all(), required=False)
    perfil_nome = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "perfil",
            "perfil_nome",
            "password",
            "cargo",
            "unidade",
            "localidade",
            "tipo_contrato",
            "data_admissao"
        )
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        perfil_nome = validated_data.pop("perfil_nome", None)
        perfil = validated_data.pop("perfil", None)
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)

        if perfil_nome:
            perfil, created = Perfil.objects.get_or_create(nome=perfil_nome)
            user.perfil = perfil
        elif perfil:
            user.perfil = perfil
        else:
            # Define o perfil padrão como 'Aprendiz' se nenhum for fornecido
            perfil, created = Perfil.objects.get_or_create(nome="Aprendiz")
            user.perfil = perfil

        user.save()
        return user

    def update(self, instance, validated_data):
        perfil_nome = validated_data.pop("perfil_nome", None)
        perfil = validated_data.pop("perfil", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if perfil_nome:
            perfil, created = Perfil.objects.get_or_create(nome=perfil_nome)
            instance.perfil = perfil
        elif perfil:
            instance.perfil = perfil

        instance.save()
        return instance


