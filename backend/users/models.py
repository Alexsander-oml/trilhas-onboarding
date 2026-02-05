from django.db import models
from django.contrib.auth.models import AbstractUser


class Perfil(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    descricao = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nome


class Setor(models.Model):
    """
    Modelo para representar setores da organização.
    Exemplo: TI, RH, Financeiro, etc.
    """

    id_setor = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True, blank=False)
    descricao = models.TextField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Setor"
        verbose_name_plural = "Setores"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class SubSetor(models.Model):
    """
    Modelo para representar sub-setores dentro de um setor.
    Exemplo: TI > Desenvolvimento, TI > Infraestrutura, etc.
    """

    id_subsetor = models.AutoField(primary_key=True)
    setor = models.ForeignKey(
        Setor, on_delete=models.CASCADE, related_name="subsetores", blank=False
    )
    nome = models.CharField(max_length=100, blank=False)
    descricao = models.TextField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Sub-setor"
        verbose_name_plural = "Sub-setores"
        unique_together = ("setor", "nome")
        ordering = ["setor", "nome"]

    def __str__(self):
        return f"{self.setor.nome} > {self.nome}"


class User(AbstractUser):
    """
    Modelo customizado de usuário com campos adicionais obrigatórios.
    
    Campos obrigatórios:
    - email: E-mail único
    - first_name: Primeiro nome
    - last_name: Último nome
    - cargo: Cargo profissional
    - setor: Setor da organização
    - subsetor: Sub-setor da organização
    """

    # Email é obrigatório e único
    email = models.EmailField(unique=True, blank=False)

    # Nome é obrigatório (herdado de AbstractUser, mas agora com blank=False)
    # first_name e last_name já existem em AbstractUser

    # Campos profissionais obrigatórios
    cargo = models.CharField(
        max_length=100, blank=False, help_text="Cargo profissional do usuário"
    )

    setor = models.ForeignKey(
        Setor,
        on_delete=models.PROTECT,
        null=False,
        blank=False,
        related_name="usuarios",
        help_text="Setor da organização",
    )

    subsetor = models.ForeignKey(
        SubSetor,
        on_delete=models.PROTECT,
        null=False,
        blank=False,
        related_name="usuarios",
        help_text="Sub-setor da organização",
    )

    # Campos opcionais (mantidos para compatibilidade)
    unidade = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Unidade/Departamento (opcional)",
    )
    localidade = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Localidade/Cidade (opcional)",
    )
    tipo_contrato = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Tipo de contrato (opcional)",
    )
    data_admissao = models.DateField(
        blank=True, null=True, help_text="Data de admissão (opcional)"
    )

    # Relacionamento com o modelo Perfil
    perfil = models.ForeignKey(
        Perfil,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )

    # Campos de controle
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name", "cargo"]

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ["email"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["setor"]),
            models.Index(fields=["subsetor"]),
            models.Index(fields=["ativo"]),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        """Retorna o nome completo do usuário."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    @property
    def role(self):
        """Retorna o nome do perfil (role) do usuário."""
        return self.perfil.nome if self.perfil else None

    @property
    def setor_nome(self):
        """Retorna o nome do setor."""
        return self.setor.nome if self.setor else None

    @property
    def subsetor_nome(self):
        """Retorna o nome do sub-setor."""
        return self.subsetor.nome if self.subsetor else None

    @property
    def setor_completo(self):
        """Retorna o caminho completo do setor."""
        return str(self.subsetor) if self.subsetor else None


