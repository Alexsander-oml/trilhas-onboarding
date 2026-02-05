"""
Serializers para o painel do aprendiz.
Inclui serializers para perfil, informações do usuário e painel completo.
"""

from rest_framework import serializers
from .models import User, Perfil, Setor, SubSetor
from onboarding_app.models import Matricula, Trilha, Modulo, Atividade, Progresso, Notification


class PerfilUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualizar informações do perfil do aprendiz."""
    
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)
    subsetor_nome = serializers.CharField(source='subsetor.nome', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'first_name',
            'last_name',
            'cargo',
            'setor',
            'setor_nome',
            'subsetor',
            'subsetor_nome',
            'unidade',
            'localidade',
            'tipo_contrato',
            'data_admissao',
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'cargo': {'required': True},
            'setor': {'required': True},
            'subsetor': {'required': True},
        }

    def validate(self, data):
        """Valida se o sub-setor pertence ao setor selecionado."""
        setor = data.get('setor')
        subsetor = data.get('subsetor')
        
        if setor and subsetor:
            if subsetor.setor != setor:
                raise serializers.ValidationError(
                    "O sub-setor selecionado não pertence ao setor escolhido."
                )
        
        return data


class UserInfoSerializer(serializers.ModelSerializer):
    """Serializer para exibir informações do usuário."""
    
    perfil_nome = serializers.CharField(source='perfil.nome', read_only=True)
    setor_nome = serializers.CharField(source='setor.nome', read_only=True)
    subsetor_nome = serializers.CharField(source='subsetor.nome', read_only=True)
    setor_completo = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'perfil_nome',
            'cargo',
            'setor',
            'setor_nome',
            'subsetor',
            'subsetor_nome',
            'setor_completo',
            'unidade',
            'localidade',
            'tipo_contrato',
            'data_admissao',
            'date_joined',
            'last_login',
        )
        read_only_fields = (
            'id',
            'email',
            'username',
            'date_joined',
            'last_login',
            'setor_nome',
            'subsetor_nome',
            'setor_completo',
        )


class AtividadeRecomendacaoSerializer(serializers.ModelSerializer):
    """Serializer para atividades recomendadas."""
    
    modulo_titulo = serializers.CharField(source='id_modulo.titulo', read_only=True)
    
    class Meta:
        model = Atividade
        fields = (
            'id_atividade',
            'titulo',
            'descricao',
            'modulo_titulo',
            'ordem',
        )


class ModuloRecomendacaoSerializer(serializers.ModelSerializer):
    """Serializer para módulos com recomendações de atividades."""
    
    proxima_atividade = serializers.SerializerMethodField()
    
    class Meta:
        model = Modulo
        fields = (
            'id_modulo',
            'titulo',
            'descricao',
            'proxima_atividade',
        )
    
    def get_proxima_atividade(self, obj):
        """Retorna a próxima atividade a ser feita no módulo."""
        usuario = self.context.get('usuario')
        
        if not usuario:
            return None
        
        # Obter todas as atividades do módulo ordenadas
        atividades = obj.atividades.all().order_by('ordem')
        
        for atividade in atividades:
            # Verificar se a atividade foi concluída
            progresso = Progresso.objects.filter(
                id_usuario=usuario,
                id_atividade=atividade
            ).first()
            
            # Se não foi concluída, retornar como recomendação
            if not progresso or not progresso.completed_at:
                return AtividadeRecomendacaoSerializer(atividade).data
        
        # Se todas foram concluídas, retornar None
        return None


class TrilhaProgressaoSerializer(serializers.ModelSerializer):
    """Serializer para trilha com progresso."""
    
    progresso = serializers.SerializerMethodField()
    status_matricula = serializers.SerializerMethodField()
    data_inicio = serializers.SerializerMethodField()
    
    class Meta:
        model = Trilha
        fields = (
            'id_trilha',
            'titulo',
            'descricao',
            'versao',
            'status_matricula',
            'data_inicio',
            'progresso',
        )
    
    def get_progresso(self, obj):
        """Calcula o progresso da trilha."""
        usuario = self.context.get('usuario')
        
        if not usuario:
            return None
        
        # Obter todos os módulos da trilha
        modulos = obj.modulos.all()
        
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
    
    def get_status_matricula(self, obj):
        """Retorna o status da matrícula."""
        usuario = self.context.get('usuario')
        
        if not usuario:
            return None
        
        matricula = Matricula.objects.filter(
            id_usuario=usuario,
            id_trilha=obj
        ).first()
        
        return matricula.status if matricula else None
    
    def get_data_inicio(self, obj):
        """Retorna a data de início da matrícula."""
        usuario = self.context.get('usuario')
        
        if not usuario:
            return None
        
        matricula = Matricula.objects.filter(
            id_usuario=usuario,
            id_trilha=obj
        ).first()
        
        return matricula.data_inicio if matricula else None


class NotificacaoSimpleSerializer(serializers.ModelSerializer):
    """Serializer simples para notificações."""
    
    class Meta:
        model = Notification
        fields = (
            'id_notification',
            'notification_type',
            'title',
            'message',
            'is_read',
            'created_at',
        )


class PainelAprendizSerializer(serializers.Serializer):
    """Serializer para o painel completo do aprendiz."""
    
    usuario = UserInfoSerializer(read_only=True)
    trilhas_matriculadas = TrilhaProgressaoSerializer(many=True, read_only=True)
    recomendacoes = serializers.SerializerMethodField()
    notificacoes = NotificacaoSimpleSerializer(many=True, read_only=True)
    resumo_progresso = serializers.SerializerMethodField()
    
    def get_recomendacoes(self, obj):
        """
        Retorna recomendações de atividades para continuar.
        Mostra os últimos módulos com atividades incompletas de cada trilha.
        """
        usuario = obj
        
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
    
    def get_resumo_progresso(self, obj):
        """Retorna um resumo geral do progresso."""
        usuario = obj
        
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
