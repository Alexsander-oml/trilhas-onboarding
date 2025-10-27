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


class Enrollment(models.Model):
    """
    Simple enrollment model linking a user to a trail id.
    We store trail_id as an integer because trails are managed on the frontend
    or in another service in this simplified setup.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    trail_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'trail_id')

    def __str__(self):
        return f"Enrollment user={self.user_id} trail={self.trail_id}"

# Nota: a tabela para esse model é criada pela migration
# `backend/users/migrations/0002_create_enrollment.py`.
# Se você receber um erro do tipo "relation 'users_enrollment' does not exist",
# significa que a migration 0002 não foi aplicada no banco atual; rode:
#   python manage.py migrate users
# dentro do diretório `backend` com o virtualenv ativado.
