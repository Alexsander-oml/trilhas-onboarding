"""
View para verificar status de matrícula e controle de visualização
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Matricula, Trilha, User


class StatusMatriculaView(APIView):
    """
    GET /api/matricula/{id_trilha}/status/
    Retorna o status da matrícula do usuário na trilha, incluindo:
    - modo_visualizacao (se está finalizada e não pode mais interagir)
    - permite_refazer (se admin pode refazer)
    - progresso_percentual (0-100)
    - status da matrícula
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, id_trilha):
        try:
            usuario = request.user
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            
            try:
                matricula = Matricula.objects.get(id_usuario=usuario, id_trilha=trilha)
                
                # Calcular progresso atual
                progresso_percentual = matricula.calcular_progresso_percentual()
                
                # Verificar e atualizar se necessário
                matricula.verificar_e_finalizar_trilha()
                matricula.refresh_from_db()
                
                # Obter perfil do usuário
                perfil_usuario = getattr(usuario, 'perfil', None)
                if perfil_usuario:
                    perfil_nome = perfil_usuario.nome if hasattr(perfil_usuario, 'nome') else str(perfil_usuario)
                else:
                    perfil_nome = "Aprendiz"
                
                return Response({
                    "id_matricula": matricula.id_matricula,
                    "id_trilha": trilha.id_trilha,
                    "titulo_trilha": trilha.titulo,
                    "status": matricula.status,
                    "modo_visualizacao": matricula.modo_visualizacao,
                    "permite_refazer": matricula.permite_refazer,
                    "pode_interagir": matricula.pode_interagir_com_materiais(),
                    "progresso_percentual": progresso_percentual,
                    "data_inicio": matricula.data_inicio.isoformat() if matricula.data_inicio else None,
                    "data_fim": matricula.data_fim.isoformat() if matricula.data_fim else None,
                    "perfil_usuario": perfil_nome,
                    "is_admin": perfil_nome in ["Administrador", "Gestor"]
                }, status=status.HTTP_200_OK)
                
            except Matricula.DoesNotExist:
                # Admin/Gestor pode acessar sem matrícula para testes
                is_admin = perfil_nome in ["Administrador", "Gestor"]
                if is_admin:
                    return Response({
                        "id_matricula": 0,
                        "id_trilha": trilha.id_trilha,
                        "titulo_trilha": trilha.titulo,
                        "status": "EmAndamento",
                        "modo_visualizacao": False,
                        "permite_refazer": False,
                        "pode_interagir": True,
                        "progresso_percentual": 0,
                        "data_inicio": None,
                        "data_fim": None,
                        "perfil_usuario": perfil_nome,
                        "is_admin": True
                    }, status=status.HTTP_200_OK)
                
                return Response({
                    "error": "Matrícula não encontrada",
                    "message": "Você não está matriculado nesta trilha",
                    "id_trilha": trilha.id_trilha,
                    "titulo_trilha": trilha.titulo
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Trilha.DoesNotExist:
            return Response({
                "error": "Trilha não encontrada"
            }, status=status.HTTP_404_NOT_FOUND)


class RefazerTrilhaView(APIView):
    """
    POST /api/matricula/{id_trilha}/refazer/
    Permite que administradores refaçam a trilha mantendo o histórico.
    Desativa modo_visualizacao para permitir nova interação.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id_trilha):
        try:
            usuario = request.user
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            
            # Verificar se é admin
            perfil_usuario = getattr(usuario, 'perfil', None)
            if perfil_usuario:
                perfil_nome = perfil_usuario.nome if hasattr(perfil_usuario, 'nome') else str(perfil_usuario)
            else:
                perfil_nome = "Aprendiz"
            
            if perfil_nome not in ["Administrador", "Gestor"]:
                return Response({
                    "error": "Permissão negada",
                    "message": "Apenas administradores podem refazer trilhas"
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                matricula = Matricula.objects.get(id_usuario=usuario, id_trilha=trilha)
                
                if not matricula.permite_refazer:
                    return Response({
                        "error": "Trilha não permite refazer",
                        "message": "Esta trilha ainda não foi finalizada ou não está disponível para refazer"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Desativar modo visualização para permitir refazer
                matricula.modo_visualizacao = False
                matricula.status = "EmAndamento"
                # NÃO apagar data_fim nem progresso - mantém histórico
                matricula.save()
                
                return Response({
                    "message": "Trilha liberada para refazer",
                    "id_matricula": matricula.id_matricula,
                    "status": matricula.status,
                    "modo_visualizacao": matricula.modo_visualizacao,
                    "progresso_percentual": matricula.calcular_progresso_percentual(),
                    "observacao": "Seu progresso anterior foi mantido. Você pode continuar de onde parou."
                }, status=status.HTTP_200_OK)
                
            except Matricula.DoesNotExist:
                return Response({
                    "error": "Matrícula não encontrada",
                    "message": "Você não está matriculado nesta trilha"
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Trilha.DoesNotExist:
            return Response({
                "error": "Trilha não encontrada"
            }, status=status.HTTP_404_NOT_FOUND)


class ResetarProgressoView(APIView):
    """
    POST /api/matricula/{id_trilha}/resetar/
    Permite que administradores resetem completamente o progresso da trilha.
    CUIDADO: Esta ação apaga todo o histórico de progresso!
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id_trilha):
        try:
            usuario = request.user
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            
            # Verificar se é admin
            perfil_usuario = getattr(usuario, 'perfil', None)
            if perfil_usuario:
                perfil_nome = perfil_usuario.nome if hasattr(perfil_usuario, 'nome') else str(perfil_usuario)
            else:
                perfil_nome = "Aprendiz"
            
            if perfil_nome not in ["Administrador", "Gestor"]:
                return Response({
                    "error": "Permissão negada",
                    "message": "Apenas administradores podem resetar progresso"
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                matricula = Matricula.objects.get(id_usuario=usuario, id_trilha=trilha)
                
                # Apagar todos os progressos das atividades desta trilha
                from .models import Progresso
                modulos = trilha.modulos.all()
                progressos_apagados = 0
                
                for modulo in modulos:
                    atividades = modulo.atividades.all()
                    for atividade in atividades:
                        progressos = Progresso.objects.filter(
                            id_usuario=usuario,
                            id_atividade=atividade
                        )
                        count = progressos.count()
                        progressos.delete()
                        progressos_apagados += count
                
                # Resetar matrícula
                matricula.status = "EmAndamento"
                matricula.data_fim = None
                matricula.modo_visualizacao = False
                matricula.permite_refazer = False
                matricula.save()
                
                return Response({
                    "message": "Progresso resetado com sucesso",
                    "id_matricula": matricula.id_matricula,
                    "status": matricula.status,
                    "progressos_apagados": progressos_apagados,
                    "observacao": "Todo o histórico de progresso foi removido. Você pode começar do zero."
                }, status=status.HTTP_200_OK)
                
            except Matricula.DoesNotExist:
                return Response({
                    "error": "Matrícula não encontrada",
                    "message": "Você não está matriculado nesta trilha"
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Trilha.DoesNotExist:
            return Response({
                "error": "Trilha não encontrada"
            }, status=status.HTTP_404_NOT_FOUND)
