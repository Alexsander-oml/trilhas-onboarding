# Correção do Endpoint de Inscrição em Trilhas

## Problema Identificado
O usuário Aprendiz não conseguia se inscrever nas trilhas disponíveis. O erro era:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
/api/trails/46/progress/initialize/
```

## Causa Raiz
O endpoint `/api/trails/{id}/progress/initialize/` não existia no backend Django. O frontend estava tentando chamar este endpoint, mas:
1. Não havia uma view definida para processar a inscrição
2. Não havia uma rota configurada no URLs

## Solução Implementada

### 1. Criação da View `InitializeTrailProgressView`
**Arquivo**: `backend/onboarding_app/views.py`

Adicionada nova view que:
- Aceita POST em `/api/trails/{id_trilha}/progress/initialize/`
- Verifica se o usuário já está matriculado na trilha
- Se já existe matrícula, retorna os dados existentes (HTTP 200)
- Se não existe, cria uma nova matrícula com status "EmAndamento" (HTTP 201)
- Trata erros caso a trilha não exista (HTTP 404)

```python
class InitializeTrailProgressView(APIView):
    """
    POST /api/trails/{id_trilha}/progress/initialize/
    
    Cria uma matrícula (inscrição) do usuário autenticado em uma trilha.
    Retorna os dados da matrícula criada ou já existente.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id_trilha):
        try:
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            
            matricula_existente = Matricula.objects.filter(
                id_usuario=request.user,
                id_trilha=trilha
            ).first()
            
            if matricula_existente:
                serializer = MatriculaSerializer(matricula_existente)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            matricula = Matricula.objects.create(
                id_usuario=request.user,
                id_trilha=trilha,
                status="EmAndamento",
                data_inicio=timezone.now()
            )
            
            serializer = MatriculaSerializer(matricula)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Trilha.DoesNotExist:
            return Response(
                {"detail": "Trilha não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### 2. Atualização das URLs
**Arquivo**: `backend/onboarding_app/urls.py`

#### Adicionado import:
```python
from .views import (
    ...
    InitializeTrailProgressView,  # <-- NOVO
    ...
)
```

#### Adicionadas rotas:
```python
# Rota em português (para consistência interna)
path("trilhas/<int:id_trilha>/progress/initialize/", 
     InitializeTrailProgressView.as_view(), 
     name="trilha-progress-initialize"),

# Alias em inglês (para compatibilidade com frontend)
path("trails/<int:id_trilha>/progress/initialize/", 
     InitializeTrailProgressView.as_view(), 
     name="trails-progress-initialize"),
```

### 3. Rotas Adicionais para Compatibilidade
Também foram adicionados outros aliases em inglês para facilitar comunicação com frontend:
- `/trails/search/` → alias para `/trilhas/search/`
- `/trails/<id>/` → alias para `/trilhas/<id>/`
- `/trails/<id>/detalhada/` → alias para `/trilhas/<id>/detalhada/`

## Fluxo de Funcionamento

### Frontend (AprendizHome.tsx)
1. Usuário Aprendiz vê trilha com status "Publicada"
2. Clica no botão "Inscrever"
3. Chama `progressService.initializeTrailProgress(trailId)`
4. Este faz POST para `/api/trails/{trailId}/progress/initialize/`

### Backend (Django)
1. Recebe requisição no endpoint `/api/trails/{id}/progress/initialize/`
2. `InitializeTrailProgressView.post()` é executada
3. Verifica se usuário já tem matrícula
   - **SIM**: Retorna matrícula existente (200 OK)
   - **NÃO**: Cria nova matrícula (201 CREATED)
4. Retorna dados da matrícula via `MatriculaSerializer`

### Frontend (AprendizHome.tsx) - Continuação
5. Recebe resposta com dados da matrícula
6. Atualiza `enrolledIds` para marcar trilha como inscrita
7. Mostra mensagem "Inscrição realizada! Redirecionando..."
8. Redireciona para `/trail/{trailId}` após 700ms

## Estrutura de Dados

### Request (POST)
```json
{}  // Body vazio - usa usuário autenticado do token JWT
```

### Response (201 CREATED ou 200 OK)
```json
{
  "id_matricula": 123,
  "id_usuario": 45,
  "id_trilha": 46,
  "data_inicio": "2026-01-29T18:00:00Z",
  "data_fim": null,
  "status": "EmAndamento",
  "obrigatoria": false,
  "modo_visualizacao": false,
  "permite_refazer": false
}
```

### Response (404 NOT FOUND)
```json
{
  "detail": "Trilha não encontrada."
}
```

## Verificação

### 1. Verificar se servidor Django está rodando
```bash
cd backend
python manage.py runserver
```

Deve aparecer:
```
Django version 5.2.6, using settings 'main.settings'
Starting development server at http://127.0.0.1:8000/
```

### 2. Testar endpoint diretamente (via Postman/curl)
```bash
# Obter token de autenticação primeiro
curl -X POST http://127.0.0.1:8000/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "aprendiz.test@example.com", "password": "testpass123"}'

# Usar o access_token retornado
curl -X POST http://127.0.0.1:8000/api/trails/31/progress/initialize/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Testar no navegador
1. Fazer login como usuário Aprendiz
2. Ir para página inicial (AprendizHome)
3. Verificar se trilhas com status "Publicada" aparecem
4. Clicar em "Inscrever" em uma trilha
5. Deve aparecer mensagem "Inscrição realizada!"
6. Deve redirecionar para a trilha

### 4. Verificar no Django Admin
1. Acessar http://127.0.0.1:8000/admin/
2. Login com usuário admin
3. Ir em "Matriculas"
4. Verificar se a nova matrícula foi criada

## Arquivos Modificados

1. **backend/onboarding_app/views.py**
   - Adicionada classe `InitializeTrailProgressView`
   
2. **backend/onboarding_app/urls.py**
   - Importada `InitializeTrailProgressView`
   - Adicionadas rotas `/trilhas/<id>/progress/initialize/` e `/trails/<id>/progress/initialize/`
   - Adicionados outros aliases em inglês para compatibilidade

## Arquivos Criados (para testes)

1. **backend/create_aprendiz.py**
   - Script para criar usuário de teste com perfil Aprendiz
   
2. **backend/test_inscricao.py**
   - Script para testar endpoint de inscrição programaticamente

## Status Atual

✅ View `InitializeTrailProgressView` criada
✅ Rotas configuradas (português e inglês)
✅ Serializer `MatriculaSerializer` já existente e funcional
✅ Frontend `AprendizHome.tsx` já estava correto
✅ Frontend `progressService.ts` já estava correto
✅ Usuário de teste criado (aprendiz.test@example.com)

## Próximos Passos

1. **Reiniciar servidor Django** (se não estiver rodando)
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Fazer hard refresh no navegador** (Ctrl+F5)
   - Isso limpa o cache e garante que o código mais recente seja carregado

3. **Testar inscrição**
   - Login como Aprendiz
   - Clicar em "Inscrever" em uma trilha

4. **Verificar logs do Django**
   - Deve aparecer: `POST /api/trails/{id}/progress/initialize/ HTTP/1.1" 201` ou `200`

## Troubleshooting

### Erro 404 persiste
- Verificar se servidor Django foi reiniciado
- Verificar se não há erros de sintaxe em `views.py` ou `urls.py`
- Verificar logs do Django para ver se rota foi carregada

### Erro 500 Internal Server Error
- Ver logs do Django no terminal
- Verificar se modelo `Matricula` está correto
- Verificar se `MatriculaSerializer` está funcionando

### Erro 401 Unauthorized
- Verificar se token JWT está válido
- Tentar fazer logout e login novamente

### Trilhas não aparecem
- Verificar se há trilhas com status "Publicada" no banco
- Verificar filtros no AprendizHome
- Verificar endpoint `/api/trails/search/` está retornando dados
