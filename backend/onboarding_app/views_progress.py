"""
Views para cálculo e exibição de progressão de trilhas.
Permite visualizar o progresso de todas as trilhas matriculadas em porcentagem.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import timedelta

from .models import Matricula, Progresso, Trilha, Modulo, Atividade
from .serializers import (
    MatriculaSerializer,
    TrilhaSerializer,
    ProgressoSerializer,
)


class ProgressaoViewSet(viewsets.ViewSet):
    """
    ViewSet para gerenciar e calcular progressão de trilhas.
    
    Endpoints:
    - GET /api/progressao/minhas-trilhas/ - Lista trilhas matriculadas com progresso
    - GET /api/progressao/trilha/{id_trilha}/ - Progresso detalhado de uma trilha
    - GET /api/progressao/modulo/{id_modulo}/ - Progresso detalhado de um módulo
    - GET /api/progressao/resumo/ - Resumo geral de progressão
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=["get"])
    def minhas_trilhas(self, request):
        """
        Lista todas as trilhas matriculadas do usuário com progresso em porcentagem.
        """
        usuario = request.user
        
        # Obter todas as matrículas do usuário
        matriculas = Matricula.objects.filter(id_usuario=usuario).select_related("id_trilha")
        
        trilhas_com_progresso = []
        
        for matricula in matriculas:
            trilha = matricula.id_trilha
            
            # Contar total de atividades na trilha
            total_atividades = Atividade.objects.filter(
                id_modulo__id_trilha=trilha
            ).count()
            
            # Contar atividades concluídas pelo usuário
            atividades_concluidas = Progresso.objects.filter(
                id_usuario=usuario,
                id_atividade__id_modulo__id_trilha=trilha,
                completed_at__isnull=False
            ).count()
            
            # Calcular percentual
            percentual = (atividades_concluidas / total_atividades * 100) if total_atividades > 0 else 0
            
            # Determinar status
            if percentual == 100:
                status_trilha = "Concluída"
            elif percentual > 0:
                status_trilha = "Em Progresso"
            else:
                status_trilha = "Iniciada"
            
            trilhas_com_progresso.append({
                "id_trilha": trilha.id_trilha,
                "titulo": trilha.titulo,
                "descricao": trilha.descricao,
                "progresso": {
                    "total_atividades": total_atividades,
                    "atividades_concluidas": atividades_concluidas,
                    "percentual": round(percentual, 2),
                    "status": status_trilha
                }
            })
        
        return Response({
            "count": len(trilhas_com_progresso),
            "trilhas": trilhas_com_progresso
        })
    
    @action(detail=False, methods=["get"])
    def trilha(self, request):
        """
        Obtém progresso detalhado de uma trilha específica.
        Parâmetro: id_trilha
        """
        id_trilha = request.query_params.get("id_trilha")
        
        if not id_trilha:
            return Response(
                {"erro": "Parâmetro id_trilha é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            trilha = Trilha.objects.get(id_trilha=id_trilha)
        except Trilha.DoesNotExist:
            return Response(
                {"erro": "Trilha não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        usuario = request.user
        
        # Obter módulos da trilha
        modulos = Modulo.objects.filter(id_trilha=trilha).order_by("ordem")
        
        modulos_com_progresso = []
        
        for modulo in modulos:
            # Contar atividades do módulo
            total_atividades = Atividade.objects.filter(id_modulo=modulo).count()
            
            # Contar atividades concluídas
            atividades_concluidas = Progresso.objects.filter(
                id_usuario=usuario,
                id_atividade__id_modulo=modulo,
                completed_at__isnull=False
            ).count()
            
            # Calcular percentual
            percentual = (atividades_concluidas / total_atividades * 100) if total_atividades > 0 else 0
            
            modulos_com_progresso.append({
                "id_modulo": modulo.id_modulo,
                "titulo": modulo.titulo,
                "descricao": modulo.descricao,
                "progresso": {
                    "total_atividades": total_atividades,
                    "atividades_concluidas": atividades_concluidas,
                    "percentual": round(percentual, 2)
                }
            })
        
        # Calcular progresso geral da trilha
        total_atividades_trilha = Atividade.objects.filter(
            id_modulo__id_trilha=trilha
        ).count()
        
        atividades_concluidas_trilha = Progresso.objects.filter(
            id_usuario=usuario,
            id_atividade__id_modulo__id_trilha=trilha,
            completed_at__isnull=False
        ).count()
        
        percentual_trilha = (atividades_concluidas_trilha / total_atividades_trilha * 100) if total_atividades_trilha > 0 else 0
        
        return Response({
            "trilha": {
                "id_trilha": trilha.id_trilha,
                "titulo": trilha.titulo,
                "descricao": trilha.descricao,
                "progresso_geral": {
                    "total_atividades": total_atividades_trilha,
                    "atividades_concluidas": atividades_concluidas_trilha,
                    "percentual": round(percentual_trilha, 2)
                }
            },
            "modulos": modulos_com_progresso
        })
    
    @action(detail=False, methods=["get"])
    def modulo(self, request):
        """
        Obtém progresso detalhado de um módulo específico.
        Parâmetro: id_modulo
        """
        id_modulo = request.query_params.get("id_modulo")
        
        if not id_modulo:
            return Response(
                {"erro": "Parâmetro id_modulo é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            modulo = Modulo.objects.get(id_modulo=id_modulo)
        except Modulo.DoesNotExist:
            return Response(
                {"erro": "Módulo não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        usuario = request.user
        
        # Obter atividades do módulo
        atividades = Atividade.objects.filter(id_modulo=modulo).order_by("ordem")
        
        atividades_com_progresso = []
        
        for atividade in atividades:
            # Verificar se atividade foi concluída
            progresso = Progresso.objects.filter(
                id_usuario=usuario,
                id_atividade=atividade
            ).first()
            
            atividades_com_progresso.append({
                "id_atividade": atividade.id_atividade,
                "titulo": atividade.titulo,
                "descricao": atividade.descricao,
                "concluida": progresso is not None and progresso.completed_at is not None,
                "data_conclusao": progresso.completed_at if progresso else None
            })
        
        # Calcular progresso do módulo
        total_atividades = len(atividades)
        atividades_concluidas = sum(1 for a in atividades_com_progresso if a["concluida"])
        percentual = (atividades_concluidas / total_atividades * 100) if total_atividades > 0 else 0
        
        return Response({
            "modulo": {
                "id_modulo": modulo.id_modulo,
                "titulo": modulo.titulo,
                "descricao": modulo.descricao,
                "progresso": {
                    "total_atividades": total_atividades,
                    "atividades_concluidas": atividades_concluidas,
                    "percentual": round(percentual, 2)
                }
            },
            "atividades": atividades_com_progresso
        })
    
    @action(detail=False, methods=["get"])
    def resumo(self, request):
        """
        Retorna um resumo geral de progressão do usuário.
        """
        usuario = request.user
        
        # Contar trilhas
        total_trilhas = Matricula.objects.filter(id_usuario=usuario).count()
        
        # Contar trilhas concluídas
        trilhas_concluidas = 0
        trilhas_em_progresso = 0
        trilhas_iniciadas = 0
        
        matriculas = Matricula.objects.filter(id_usuario=usuario).select_related("id_trilha")
        
        for matricula in matriculas:
            trilha = matricula.id_trilha
            
            total_atividades = Atividade.objects.filter(
                id_modulo__id_trilha=trilha
            ).count()
            
            atividades_concluidas = Progresso.objects.filter(
                id_usuario=usuario,
                id_atividade__id_modulo__id_trilha=trilha,
                completed_at__isnull=False
            ).count()
            
            percentual = (atividades_concluidas / total_atividades * 100) if total_atividades > 0 else 0
            
            if percentual == 100:
                trilhas_concluidas += 1
            elif percentual > 0:
                trilhas_em_progresso += 1
            else:
                trilhas_iniciadas += 1
        
        # Contar atividades totais e concluídas
        total_atividades_usuario = Atividade.objects.filter(
            id_modulo__id_trilha__matriculas__id_usuario=usuario
        ).distinct().count()
        
        atividades_concluidas_usuario = Progresso.objects.filter(
            id_usuario=usuario,
            completed_at__isnull=False
        ).count()
        
        percentual_medio = (atividades_concluidas_usuario / total_atividades_usuario * 100) if total_atividades_usuario > 0 else 0
        
        return Response({
            "resumo_progresso": {
                "total_trilhas_matriculadas": total_trilhas,
                "trilhas_concluidas": trilhas_concluidas,
                "trilhas_em_progresso": trilhas_em_progresso,
                "trilhas_iniciadas": trilhas_iniciadas,
                "total_atividades": total_atividades_usuario,
                "atividades_concluidas": atividades_concluidas_usuario,
                "percentual_medio": round(percentual_medio, 2)
            }
        })
