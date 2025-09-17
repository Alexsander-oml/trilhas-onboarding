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
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
