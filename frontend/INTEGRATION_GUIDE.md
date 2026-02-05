# Guia de Integração Frontend + Backend

## 📋 Estrutura Preparada

O frontend foi preparado com uma estrutura robusta para integração com o backend Django:

### 🔧 Configurações Implementadas

1. **Axios + Interceptors**
   - Configuração automática de headers
   - Refresh token automático
   - Tratamento de erros padronizado

2. **React Query (TanStack Query)**
   - Cache inteligente de dados
   - Sincronização automática
   - Otimistic updates
   - Background refetch

3. **TypeScript Interfaces**
   - Tipagem completa dos modelos Django
   - Interfaces para requests/responses
   - Validação em tempo de compilação

4. **Sistema de Autenticação**
   - JWT tokens com refresh automático
   - Context de autenticação
   - Interceptors para requisições

5. **Error Handling**
   - Tratamento centralizado de erros
   - Notificações visuais
   - Mapeamento de erros Django

## 🚀 Próximos Passos para Integração

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com URLs reais do backend
VITE_API_BASE_URL=https://sua-api.com/api
```

### 2. Modelos Django Sugeridos

Com base nas interfaces TypeScript criadas, os modelos Django devem incluir:

**User Profile:**
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    position = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
```

**Trail Model:**
```python
class Trail(models.Model):
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('draft', 'Rascunho'),
        ('paused', 'Pausado'),
        ('archived', 'Arquivado'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Iniciante'),
        ('intermediate', 'Intermediário'),
        ('advanced', 'Avançado'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    objectives = models.TextField()
    target_audience = models.CharField(max_length=200)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    estimated_duration = models.IntegerField()  # em horas
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    thumbnail = models.ImageField(upload_to='trail_thumbnails/', null=True, blank=True)
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_trails')
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='updated_trails')
```

### 3. API Endpoints Esperados

O frontend está configurado para consumir estes endpoints:

```
# Autenticação
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/refresh/
POST /api/auth/logout/
GET  /api/auth/user/
POST /api/auth/change-password/
POST /api/auth/reset-password/

# Trilhas
GET    /api/trails/
POST   /api/trails/
GET    /api/trails/{id}/
PATCH  /api/trails/{id}/
DELETE /api/trails/{id}/
POST   /api/trails/{id}/duplicate/
POST   /api/trails/{id}/publish/
POST   /api/trails/{id}/enroll/
GET    /api/trails/{id}/stats/

# Progresso
GET  /api/trails/{id}/progress/
POST /api/trails/{id}/progress/initialize/
GET  /api/enrollments/{id}/modules/
POST /api/materials/{id}/start/
POST /api/material-progress/{id}/complete/

# Quiz
POST /api/materials/{id}/quiz/start/
POST /api/quiz-attempts/{id}/answer/
POST /api/quiz-attempts/{id}/finish/
```

### 4. Serializers Django REST Framework

Exemplo de serializer para Trail:

```python
from rest_framework import serializers
from .models import Trail, Module, Material

class TrailSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    completion_rate = serializers.SerializerMethodField()
    total_enrollments = serializers.SerializerMethodField()
    
    class Meta:
        model = Trail
        fields = '__all__'
        
    def get_completion_rate(self, obj):
        # Calcular taxa de conclusão
        return obj.calculate_completion_rate()
        
    def get_total_enrollments(self, obj):
        return obj.enrollments.count()
```

### 5. ViewSets Django

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class TrailViewSet(viewsets.ModelViewSet):
    queryset = Trail.objects.all()
    serializer_class = TrailSerializer
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        trail = self.get_object()
        # Lógica de matrícula
        return Response({'status': 'enrolled'})
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        trail = self.get_object()
        # Retornar estatísticas
        return Response({
            'total_enrollments': trail.enrollments.count(),
            'completion_rate': trail.calculate_completion_rate(),
            # ... outras estatísticas
        })
```

### 6. CORS Configuration

No Django settings.py:

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    # ...
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

# Para desenvolvimento
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
]

# Para produção
CORS_ALLOWED_ORIGINS = [
    "https://seu-dominio.com",
]
```

## 🔄 Migração dos Contexts Existentes

### Substituir TrailsContext

O `TrailsContext` atual pode ser gradualmente substituído pelos hooks do React Query:

```typescript
// Antes (TrailsContext)
const { trails, addTrail, updateTrail } = useTrails();

// Depois (React Query hooks)
const { data: trails, isLoading } = useTrails();
const createMutation = useCreateTrail();
const updateMutation = useUpdateTrail();
```

### Substituir ProgressContext

```typescript
// Antes (ProgressContext)
const { updateMaterialProgress } = useProgress();

// Depois (React Query hooks)
const updateProgress = useUpdateMaterialProgress();
```

## 🧪 Testando a Integração

### 1. Mock do Backend (Desenvolvimento)

Você pode usar MSW (Mock Service Worker) para simular o backend:

```bash
npm install msw --save-dev
```

### 2. Interceptar Requisições

Temporariamente, modifique o `api.ts` para logar todas as requisições:

```typescript
api.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});
```

### 3. Validar Tipos

Use o TypeScript para validar se os dados do backend estão corretos:

```typescript
// Isso falhará se os tipos não coincidirem
const trails: Trail[] = await trailService.getTrails();
```

## ⚠️ Pontos de Atenção

1. **Paginação**: O backend deve retornar dados no formato `PaginatedResponse`
2. **Timestamps**: Use ISO strings para datas (`2024-01-15T10:30:00Z`)
3. **File Uploads**: Configure MEDIA_URL e MEDIA_ROOT no Django
4. **Permissions**: Implemente permissions adequadas nas ViewSets
5. **Rate Limiting**: Configure throttling para APIs críticas

## 🔒 Segurança

1. **JWT Secret**: Use um secret forte em produção
2. **HTTPS**: Sempre use HTTPS em produção
3. **CORS**: Configure origins específicos, não use "*"
4. **File Validation**: Valide tipos e tamanhos de arquivo
5. **Input Sanitization**: Use serializers do DRF para validação

## 📈 Performance

1. **Database Queries**: Use select_related e prefetch_related
2. **Caching**: Implemente cache Redis para dados frequentes
3. **File Storage**: Use CDN para arquivos estáticos
4. **Pagination**: Limite resultados por página (ex: 20 itens)

## 🔧 Ferramentas Úteis

1. **Django REST Framework Browsable API**: Para testar endpoints
2. **React Query Devtools**: Para debug de cache e queries
3. **Axios DevTools**: Para monitorar requests
4. **Postman/Insomnia**: Para testar API independentemente

---

Com essa estrutura, a integração será muito mais suave e o desenvolvimento mais produtivo! 🚀