from rest_framework import serializers
from .models import User, Perfil, Setor, SubSetor
from .permissions import DASHBOARD_FUNCTIONALITIES  # Importa o mapeamento de funcionalidades


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = (
            "id_perfil",
            "nome",
            "descricao"
        )


class SetorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setor
        fields = (
            "id_setor",
            "nome",
            "descricao",
            "ativo"
        )


class SubSetorSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)
    
    class Meta:
        model = SubSetor
        fields = (
            "id_subsetor",
            "setor",
            "setor_nome",
            "nome",
            "descricao",
            "ativo"
        )


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para usuário com campos obrigatórios:
    - email
    - first_name
    - last_name
    - cargo
    - setor
    - subsetor
    """
    perfil = PerfilSerializer(read_only=True)
    perfil_nome = serializers.CharField(write_only=True, required=False)
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)
    subsetor_nome = serializers.CharField(source='subsetor.nome', read_only=True)
    setor_completo = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "perfil",
            "perfil_nome",
            "password",
            "cargo",
            "setor",
            "setor_nome",
            "subsetor",
            "subsetor_nome",
            "setor_completo",
            "unidade",
            "localidade",
            "tipo_contrato",
            "data_admissao",
            "ativo",
            "date_joined",
            "last_login"
        )
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
            "cargo": {"required": True},
            "setor": {"required": True},
            "subsetor": {"required": True},
            "date_joined": {"read_only": True},
            "last_login": {"read_only": True}
        }

    def validate_setor(self, value):
        """Valida se o setor existe e está ativo."""
        if not value.ativo:
            raise serializers.ValidationError("O setor selecionado está inativo.")
        return value

    def validate_subsetor(self, value):
        """Valida se o sub-setor existe, está ativo e pertence ao setor selecionado."""
        if not value.ativo:
            raise serializers.ValidationError("O sub-setor selecionado está inativo.")
        return value

    def validate(self, data):
        """Valida se o sub-setor pertence ao setor selecionado."""
        setor = data.get('setor')
        subsetor = data.get('subsetor')
        
        if setor and subsetor:
            if subsetor.setor != setor:
                raise serializers.ValidationError(
                    "O sub-setor selecionado não pertence ao setor escolhido."
                )
        
        return data

    def create(self, validated_data):
        perfil_nome = validated_data.pop("perfil_nome", None)
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)

        if perfil_nome:
            perfil, created = Perfil.objects.get_or_create(nome=perfil_nome)
            user.perfil = perfil
        else:
            # Define o perfil padrão como 'Aprendiz' se nenhum for fornecido
            perfil, created = Perfil.objects.get_or_create(nome="Aprendiz")
            user.perfil = perfil

        user.save()
        return user

    def update(self, instance, validated_data):
        perfil_nome = validated_data.pop("perfil_nome", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if perfil_nome:
            perfil, created = Perfil.objects.get_or_create(nome=perfil_nome)
            instance.perfil = perfil

        instance.save()
        return instance


class DashboardSerializer(serializers.Serializer):
    """Serializer para o painel de perfil do usuário."""
    usuario = UserSerializer(read_only=True)
    funcionalidades = serializers.SerializerMethodField()

    def get_funcionalidades(self, obj):
        """
        Retorna a lista de funcionalidades baseada no perfil do usuário.
        'obj' é a instância do User.
        """
        perfil_nome = obj.perfil.nome if obj.perfil else "Aprendiz"
        
        # Retorna a lista de funcionalidades mapeadas no permissions.py
        return DASHBOARD_FUNCTIONALITIES.get(perfil_nome, [])

    class Meta:
        fields = ('usuario', 'funcionalidades')
