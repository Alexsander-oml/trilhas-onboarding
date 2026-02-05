# 📜 Modelos Django Recomendados para Certificação

Este arquivo fornece a estrutura recomendada para criar os modelos Django 
que irão persistir os certificados no banco de dados.

## Modelo Certificate (Django)

```python
# backend/certificates/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Certificate(models.Model):
    """
    Modelo para armazenar certificados de conclusão de trilhas
    """
    
    STATUS_CHOICES = [
        ('issued', 'Emitido'),
        ('revoked', 'Revogado'),
        ('expired', 'Expirado'),
    ]
    
    # IDs
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    verification_code = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Código único para verificação do certificado"
    )
    
    # Relações
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    trail = models.ForeignKey(
        'onboarding_app.Trilha',  # Ajuste conforme sua app
        on_delete=models.PROTECT,
        related_name='certificates'
    )
    
    # Dados do Certificado
    trail_name = models.CharField(
        max_length=255,
        help_text="Nome da trilha no momento de conclusão"
    )
    student_name = models.CharField(
        max_length=255,
        help_text="Nome completo do aluno"
    )
    
    # Períodos
    start_date = models.DateField()
    end_date = models.DateField()
    workload = models.IntegerField(
        help_text="Carga horária total em horas"
    )
    
    # Metadados
    issued_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='issued'
    )
    
    # Auditoria
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['user', 'issued_at']),
            models.Index(fields=['verification_code']),
            models.Index(fields=['trail', 'status']),
        ]
    
    def __str__(self):
        return f"{self.student_name} - {self.trail_name}"
    
    def save(self, *args, **kwargs):
        # Gerar código de verificação único
        if not self.verification_code:
            import string
            import random
            chars = string.ascii_uppercase + string.digits
            code = 'CERT-' + ''.join(random.choices(chars, k=12))
            while Certificate.objects.filter(verification_code=code).exists():
                code = 'CERT-' + ''.join(random.choices(chars, k=12))
            self.verification_code = code
        
        super().save(*args, **kwargs)
```

## Serializer (Django REST Framework)

```python
# backend/certificates/serializers.py

from rest_framework import serializers
from .models import Certificate
from django.contrib.auth.models import User

class CertificateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    trail_id = serializers.IntegerField(source='trail.id')
    
    class Meta:
        model = Certificate
        fields = [
            'id',
            'user_id',
            'trail_id',
            'trail_name',
            'student_name',
            'start_date',
            'end_date',
            'workload',
            'issued_at',
            'verification_code',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user_id',
            'issued_at',
            'verification_code',
            'created_at',
            'updated_at',
        ]
    
    def create(self, validated_data):
        # Obter o usuário autenticado
        request = self.context.get('request')
        user = request.user if request else None
        
        if not user or user.is_anonymous:
            raise serializers.ValidationError("Usuário não autenticado")
        
        # Verificar se a trilha foi completada
        trail = validated_data.get('trail')
        completion = self.verify_trail_completion(user, trail)
        
        if completion < 100:
            raise serializers.ValidationError(
                f"Trilha não foi completada (completude: {completion}%)"
            )
        
        # Criar certificado
        certificate = Certificate.objects.create(
            user=user,
            **validated_data
        )
        
        return certificate
    
    def verify_trail_completion(self, user, trail):
        """
        Verifica a taxa de conclusão da trilha para o usuário
        Ajuste conforme sua lógica de negócio
        """
        # TODO: Implementar lógica de verificação
        # Este é um exemplo placeholder
        return 100
```

## ViewSet (Django REST Framework)

```python
# backend/certificates/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Certificate
from .serializers import CertificateSerializer

class CertificateViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar certificados
    
    list - Listar certificados do usuário
    create - Criar novo certificado (após conclusão)
    retrieve - Obter detalhes do certificado
    verify - Verificar autenticidade do certificado
    """
    
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['issued_at', 'trail_name']
    ordering = ['-issued_at']
    
    def get_queryset(self):
        """
        Retorna apenas certificados do usuário autenticado
        """
        return Certificate.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        GET /api/certificates/me/
        
        Retorna todos os certificados do usuário autenticado
        """
        certificates = self.get_queryset()
        serializer = self.get_serializer(certificates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def verify(self, request):
        """
        POST /api/certificates/verify/
        
        Verifica a autenticidade de um certificado pelo código
        
        Body:
        {
            "verification_code": "CERT-XXXXX-XXXXX"
        }
        """
        code = request.data.get('verification_code')
        
        try:
            certificate = Certificate.objects.get(verification_code=code)
            serializer = self.get_serializer(certificate)
            return Response({
                'valid': True,
                'certificate': serializer.data
            })
        except Certificate.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Código de verificação inválido'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """
        POST /api/certificates/{id}/revoke/
        
        Revoga um certificado (apenas para admins)
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Permissão negada'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        certificate = self.get_object()
        certificate.status = 'revoked'
        certificate.save()
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/certificates/
        
        Cria um novo certificado após conclusão de trilha
        """
        return super().create(request, *args, **kwargs)
```

## URLs (Django)

```python
# backend/certificates/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CertificateViewSet

router = DefaultRouter()
router.register(r'certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

## Adicionar ao settings.py

```python
# backend/main/settings.py

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'django_filters',
    'certificates',  # Nova app
]

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

## Migrations

```bash
python manage.py makemigrations certificates
python manage.py migrate certificates
```

## Admin

```python
# backend/certificates/admin.py

from django.contrib import admin
from .models import Certificate

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'trail_name', 'issued_at', 'status', 'verification_code')
    list_filter = ('status', 'issued_at', 'trail')
    search_fields = ('student_name', 'trail_name', 'verification_code')
    readonly_fields = ('id', 'verification_code', 'issued_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('id', 'user', 'trail', 'status')
        }),
        ('Dados do Certificado', {
            'fields': ('trail_name', 'student_name', 'verification_code')
        }),
        ('Período', {
            'fields': ('start_date', 'end_date', 'workload')
        }),
        ('Auditoria', {
            'fields': ('issued_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
```

## Endpoints Disponíveis

```
GET    /api/certificates/          - Listar certificados do usuário
GET    /api/certificates/me/       - Listar certificados do usuário (alternativo)
GET    /api/certificates/{id}/     - Detalhes de um certificado
POST   /api/certificates/          - Criar novo certificado
PUT    /api/certificates/{id}/     - Atualizar certificado
PATCH  /api/certificates/{id}/     - Atualizar parcialmente
DELETE /api/certificates/{id}/     - Deletar certificado

POST   /api/certificates/verify/   - Verificar autenticidade
POST   /api/certificates/{id}/revoke/ - Revogar certificado
```

## Exemplo de Requisição para Criar Certificado

```bash
curl -X POST http://127.0.0.1:8000/api/certificates/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trail_id": 42,
    "trail_name": "Trilha de Onboarding",
    "student_name": "João Silva",
    "start_date": "2024-01-15",
    "end_date": "2024-01-31",
    "workload": 40
  }'
```

## Testando Localmente

```python
# shell do Django
python manage.py shell

from django.contrib.auth.models import User
from certificates.models import Certificate
from onboarding_app.models import Trilha

user = User.objects.first()
trail = Trilha.objects.first()

cert = Certificate.objects.create(
    user=user,
    trail=trail,
    trail_name=trail.titulo,
    student_name=user.get_full_name(),
    start_date='2024-01-15',
    end_date='2024-01-31',
    workload=40
)

print(f"Certificado criado: {cert.verification_code}")
```

---

**Próximos Passos:**
1. Criar app `certificates` no Django: `python manage.py startapp certificates`
2. Copiar modelos e serializers acima
3. Executar migrations
4. Descomentar código de integração no frontend
5. Testar com Postman ou curl
