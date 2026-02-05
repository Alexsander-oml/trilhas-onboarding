"""
Views para importação de usuários do Excel.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from .serializers_import import ArquivoImportacaoSerializer
from .permissions import IsAdminOrGestor


class ImportarUsuariosView(APIView):
    """
    View para importar usuários de um arquivo Excel.

    POST /api/users/import/
    
    Parâmetros:
    - arquivo: arquivo .xlsx (obrigatório)
    - sheet_name: nome da planilha (padrão: CADASTROS)
    - skip_errors: continuar em caso de erro (padrão: false)
    - dry_run: simular sem salvar (padrão: false)
    
    Resposta:
    {
        "sucesso": true,
        "usuarios_criados": 10,
        "usuarios_atualizados": 5,
        "total_processado": 15,
        "erros": [],
        "usuarios_processados": [
            {
                "email": "usuario@example.com",
                "nome": "Nome do Usuário",
                "acao": "criado"
            }
        ],
        "dry_run": false
    }
    """
    permission_classes = [IsAuthenticated, IsAdminOrGestor]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """Processa o upload e importação de usuários."""
        
        # Validar permissão
        if not (request.user.is_staff or request.user.is_superuser):
            # Verificar se é Gestor
            if not (request.user.perfil and request.user.perfil.nome in ['Administrador', 'Gestor']):
                return Response(
                    {'erro': 'Você não tem permissão para importar usuários.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Validar arquivo
        if 'arquivo' not in request.FILES:
            return Response(
                {'erro': 'Arquivo não fornecido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Criar serializer
        serializer = ArquivoImportacaoSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'erros': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Processar importação
        resultado = serializer.processar_importacao()

        if not resultado.get('sucesso', False):
            return Response(
                {'erro': resultado.get('erro', 'Erro desconhecido')},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retornar resultado
        return Response(resultado, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrGestor])
def status_importacao(request):
    """
    Retorna informações sobre o status da importação.
    
    GET /api/users/import/status/
    """
    from .models import User
    from django.utils import timezone
    from datetime import timedelta

    # Usuários criados nos últimos 7 dias
    sete_dias_atras = timezone.now() - timedelta(days=7)
    usuarios_recentes = User.objects.filter(data_criacao__gte=sete_dias_atras).count()

    return Response({
        'usuarios_totais': User.objects.count(),
        'usuarios_ativos': User.objects.filter(ativo=True, is_active=True).count(),
        'usuarios_inativos': User.objects.filter(ativo=False).count(),
        'usuarios_criados_7_dias': usuarios_recentes,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrGestor])
def validar_arquivo_importacao(request):
    """
    Valida um arquivo de importação sem processar.
    
    POST /api/users/import/validar/
    
    Retorna informações sobre o arquivo e possíveis erros.
    """
    import pandas as pd
    from io import BytesIO

    if 'arquivo' not in request.FILES:
        return Response(
            {'erro': 'Arquivo não fornecido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    arquivo = request.FILES['arquivo']

    # Validar extensão
    if not arquivo.name.endswith('.xlsx'):
        return Response(
            {'erro': 'O arquivo deve estar em formato .xlsx'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Ler arquivo
        df = pd.read_excel(arquivo)

        # Encontrar linha de cabeçalho
        header_row = None
        for idx, row in df.iterrows():
            if 'NOME COMPLETO' in str(row.values):
                header_row = idx
                break

        if header_row is None:
            return Response(
                {'erro': 'Cabeçalho não encontrado. Procure por "NOME COMPLETO"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Usar linha como cabeçalho
        df = pd.read_excel(arquivo, header=header_row)
        df.columns = df.columns.str.strip()

        # Validar colunas
        colunas_obrigatorias = ['NOME COMPLETO', 'CARGO', 'SETOR', 'SUBSETOR', 'E-MAIL @FAURG']
        colunas_faltantes = [col for col in colunas_obrigatorias if col not in df.columns]

        if colunas_faltantes:
            return Response({
                'valido': False,
                'erro': f'Colunas faltantes: {", ".join(colunas_faltantes)}',
                'colunas_encontradas': list(df.columns),
                'colunas_obrigatorias': colunas_obrigatorias,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Contar linhas válidas
        df_limpo = df.dropna(subset=['NOME COMPLETO', 'E-MAIL @FAURG'])
        total_linhas = len(df_limpo)

        return Response({
            'valido': True,
            'total_registros': total_linhas,
            'colunas_encontradas': list(df.columns),
            'colunas_obrigatorias': colunas_obrigatorias,
            'colunas_ignoradas': ['ADMISSÃO', 'TEMPO DE FAURG'],
            'primeira_linha': df_limpo.iloc[0].to_dict() if len(df_limpo) > 0 else None,
        })

    except Exception as e:
        return Response(
            {'erro': f'Erro ao ler arquivo: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
