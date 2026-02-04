"""
Views para o painel do aprendiz.
Inclui rotas para visualizar e atualizar perfil, além do painel completo com progressão e recomendações.
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Prefetch

from .models import User
from .serializers_learner import (
    UserInfoSerializer,
    PerfilUpdateSerializer,
    PainelAprendizSerializer,
)
from onboarding_app.models import Matricula, Notification


class UserInfoView(APIView):
    """
    View para obter informações do usuário logado.
    
    GET /api/users/me/
    Retorna as informações completas do usuário autenticado.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retorna as informações do usuário logado."""
        serializer = UserInfoSerializer(request.user)
        return Response(serializer.data)


class PerfilUpdateView(APIView):
    """
    View para atualizar o perfil do usuário.
    
    PATCH /api/users/perfil/ ou PATCH /api/users/<id>/profile/
    Permite atualizar informações pessoais e profissionais do usuário.
    """
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk=None):
        """Atualiza as informações do perfil do usuário."""
        # Se pk foi fornecido, verificar permissão
        if pk is not None and pk != request.user.id:
            if not request.user.is_staff:
                return Response(
                    {'detail': 'Você não tem permissão para editar este perfil.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = PerfilUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Perfil atualizado com sucesso',
                    'usuario': UserInfoSerializer(request.user).data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class PainelAprendizView(APIView):
    """
    View para o painel completo do aprendiz.
    
    GET /api/users/painel/
    Retorna um painel completo com:
    - Informações do usuário
    - Trilhas matriculadas com progresso
    - Recomendações de atividades para continuar
    - Notificações recentes
    - Resumo geral de progresso
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retorna o painel completo do aprendiz."""
        usuario = request.user
        
        # Obter trilhas matriculadas com progresso
        matriculas = Matricula.objects.filter(
            id_usuario=usuario,
            status="EmAndamento"
        ).select_related('id_trilha')
        
        trilhas = [matricula.id_trilha for matricula in matriculas]
        
        # Obter notificações recentes (últimas 10)
        notificacoes = Notification.objects.filter(
            recipient=usuario
        ).order_by('-created_at')[:10]
        
        # Preparar contexto para serializers
        context = {'usuario': usuario}
        
        # Serializar trilhas com progresso
        trilhas_serializer = [
            {
                'id_trilha': trilha.id_trilha,
                'titulo': trilha.titulo,
                'descricao': trilha.descricao,
                'versao': trilha.versao,
                'status_matricula': matricula.status,
                'data_inicio': matricula.data_inicio,
                'progresso': self._calcular_progresso_trilha(trilha, usuario),
            }
            for trilha, matricula in zip(trilhas, matriculas)
        ]
        
        # Serializar notificações
        notificacoes_serializer = [
            {
                'id_notification': notif.id_notification,
                'notification_type': notif.notification_type,
                'title': notif.title,
                'message': notif.message,
                'is_read': notif.is_read,
                'created_at': notif.created_at,
            }
            for notif in notificacoes
        ]
        
        # Obter recomendações
        recomendacoes = self._obter_recomendacoes(usuario)
        
        # Obter resumo de progresso
        resumo = self._obter_resumo_progresso(usuario)
        
        return Response({
            'usuario': UserInfoSerializer(usuario).data,
            'trilhas_matriculadas': trilhas_serializer,
            'recomendacoes': recomendacoes,
            'notificacoes': notificacoes_serializer,
            'resumo_progresso': resumo,
        })
    
    def _calcular_progresso_trilha(self, trilha, usuario):
        """Calcula o progresso de uma trilha para um usuário."""
        from onboarding_app.models import Progresso
        
        modulos = trilha.modulos.all()
        
        total_atividades = 0
        atividades_concluidas = 0

        for modulo in modulos:
            atividades = modulo.atividades.all()
            total_atividades += atividades.count()

            for atividade in atividades:
                progresso = Progresso.objects.filter(
                    id_usuario=usuario,
                    id_atividade=atividade
                ).first()

                if progresso and progresso.completed_at:
                    atividades_concluidas += 1

        percentual = (atividades_concluidas / total_atividades * 100) if total_atividades > 0 else 0
        
        # Determinar status
        if percentual == 100:
            status_trilha = "Concluída"
        elif percentual >= 50:
            status_trilha = "Em Progresso"
        else:
            status_trilha = "Iniciada"

        return {
            'total_atividades': total_atividades,
            'atividades_concluidas': atividades_concluidas,
            'percentual': round(percentual, 2),
            'status': status_trilha,
        }
    
    def _obter_recomendacoes(self, usuario):
        """
        Retorna recomendações de atividades para continuar.
        Mostra os últimos módulos com atividades incompletas de cada trilha.
        """
        from onboarding_app.models import Progresso
        
        # Obter todas as trilhas matriculadas
        matriculas = Matricula.objects.filter(
            id_usuario=usuario,
            status="EmAndamento"
        ).select_related('id_trilha')
        
        recomendacoes = []
        
        for matricula in matriculas:
            trilha = matricula.id_trilha
            
            # Obter módulos da trilha ordenados por ordem
            modulos = trilha.modulos.all().order_by('ordem')
            
            for modulo in modulos:
                # Obter atividades do módulo
                atividades = modulo.atividades.all().order_by('ordem')
                
                # Encontrar a primeira atividade incompleta
                for atividade in atividades:
                    progresso = Progresso.objects.filter(
                        id_usuario=usuario,
                        id_atividade=atividade
                    ).first()
                    
                    # Se encontrou uma atividade incompleta, adicionar à recomendação
                    if not progresso or not progresso.completed_at:
                        recomendacoes.append({
                            'id_trilha': trilha.id_trilha,
                            'titulo_trilha': trilha.titulo,
                            'id_modulo': modulo.id_modulo,
                            'titulo_modulo': modulo.titulo,
                            'id_atividade': atividade.id_atividade,
                            'titulo_atividade': atividade.titulo,
                            'descricao_atividade': atividade.descricao,
                            'ordem_atividade': atividade.ordem,
                        })
                        break  # Apenas a primeira atividade incompleta por módulo
        
        return recomendacoes
    
    def _obter_resumo_progresso(self, usuario):
        """Retorna um resumo geral do progresso."""
        from onboarding_app.models import Progresso
        
        matriculas = Matricula.objects.filter(
            id_usuario=usuario,
            status="EmAndamento"
        ).select_related('id_trilha')
        
        total_trilhas = matriculas.count()
        trilhas_concluidas = 0
        trilhas_em_progresso = 0
        trilhas_iniciadas = 0
        
        total_atividades = 0
        atividades_concluidas = 0
        
        for matricula in matriculas:
            trilha = matricula.id_trilha
            
            # Calcular progresso da trilha
            modulos = trilha.modulos.all()
            trilha_total = 0
            trilha_concluidas = 0
            
            for modulo in modulos:
                atividades = modulo.atividades.all()
                trilha_total += atividades.count()
                
                for atividade in atividades:
                    progresso = Progresso.objects.filter(
                        id_usuario=usuario,
                        id_atividade=atividade
                    ).first()
                    
                    if progresso and progresso.completed_at:
                        trilha_concluidas += 1
                        atividades_concluidas += 1
                    
                    total_atividades += 1
            
            # Calcular status da trilha
            percentual = (trilha_concluidas / trilha_total * 100) if trilha_total > 0 else 0
            
            if percentual == 100:
                trilhas_concluidas += 1
            elif percentual >= 50:
                trilhas_em_progresso += 1
            else:
                trilhas_iniciadas += 1
        
        percentual_medio = (atividades_concluidas / total_atividades * 100) if total_atividades > 0 else 0
        
        return {
            'total_trilhas_matriculadas': total_trilhas,
            'trilhas_concluidas': trilhas_concluidas,
            'trilhas_em_progresso': trilhas_em_progresso,
            'trilhas_iniciadas': trilhas_iniciadas,
            'total_atividades': total_atividades,
            'atividades_concluidas': atividades_concluidas,
            'percentual_medio': round(percentual_medio, 2),
        }
