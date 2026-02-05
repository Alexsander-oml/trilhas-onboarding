from rest_framework import serializers
from .models import (
    Trilha, Modulo, Atividade, Matricula, Progresso,
    MaterialVideo, MaterialPDF, MaterialLeitura,
    Tag, Area, Cargo, Unidade, Competencia,
    Questao, Quiz, QuizQuestao, TentativaQuiz, RespostaQuestao
)
import os
import json


# ==================== SERIALIZERS DE FILTROS ====================

class TagSerializer(serializers.ModelSerializer):
    """Serializer para Tags."""
    class Meta:
        model = Tag
        fields = ['id_tag', 'nome']


class AreaSerializer(serializers.ModelSerializer):
    """Serializer para Áreas."""
    class Meta:
        model = Area
        fields = ['id_area', 'nome', 'descricao']


class CargoSerializer(serializers.ModelSerializer):
    """Serializer para Cargos."""
    class Meta:
        model = Cargo
        fields = ['id_cargo', 'nome', 'descricao']


class UnidadeSerializer(serializers.ModelSerializer):
    """Serializer para Unidades."""
    class Meta:
        model = Unidade
        fields = ['id_unidade', 'nome', 'descricao']


class CompetenciaSerializer(serializers.ModelSerializer):
    """Serializer para Competências."""
    class Meta:
        model = Competencia
        fields = ['id_competencia', 'nome', 'descricao']


# ==================== SERIALIZERS DE TRILHA ====================

class ModuloSimplificadoSerializer(serializers.ModelSerializer):
    """Serializer simplificado para módulos (usado em trilhas)."""
    id = serializers.IntegerField(source='id_modulo', read_only=True)
    name = serializers.CharField(source='titulo', read_only=True)
    description = serializers.CharField(source='descricao', read_only=True)
    order = serializers.IntegerField(source='ordem', read_only=True)
    
    class Meta:
        model = Modulo
        fields = ['id', 'id_modulo', 'name', 'titulo', 'description', 'descricao', 'order', 'ordem']


class TrilhaSerializer(serializers.ModelSerializer):
    """Serializer completo para Trilha com suporte a campos ManyToMany."""
    id = serializers.IntegerField(source='id_trilha', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    areas = AreaSerializer(many=True, read_only=True)
    cargos = CargoSerializer(many=True, read_only=True)
    unidades = UnidadeSerializer(many=True, read_only=True)
    competencias = CompetenciaSerializer(many=True, read_only=True)
    modules = ModuloSimplificadoSerializer(source='modulos', many=True, read_only=True)
    total_modulos = serializers.SerializerMethodField()
    
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, write_only=True, required=False, source='tags'
    )
    area_ids = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(), many=True, write_only=True, required=False, source='areas'
    )
    cargo_ids = serializers.PrimaryKeyRelatedField(
        queryset=Cargo.objects.all(), many=True, write_only=True, required=False, source='cargos'
    )
    unidade_ids = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), many=True, write_only=True, required=False, source='unidades'
    )
    competencia_ids = serializers.PrimaryKeyRelatedField(
        queryset=Competencia.objects.all(), many=True, write_only=True, required=False, source='competencias'
    )

    class Meta:
        model = Trilha
        fields = [
            'id', 'id_trilha', 'criado_por', 'id_trilha_pai', 'versao', 'status',
            'titulo', 'descricao', 'objetivos', 'publico_alvo', 'prazo_recomendado',
            'changelog', 'data_vigencia_inicio', 'data_vigencia_fim', 'is_template',
            'tags', 'areas', 'cargos', 'unidades', 'competencias',
            'tag_ids', 'area_ids', 'cargo_ids', 'unidade_ids', 'competencia_ids',
            'modules', 'total_modulos'
        ]
        read_only_fields = ('criado_por',)

    def get_total_modulos(self, obj):
        return obj.modulos.count()

    def create(self, validated_data):
        """Criar trilha e processar módulos do changelog."""
        # Extrair campos ManyToMany
        tags = validated_data.pop('tags', [])
        areas = validated_data.pop('areas', [])
        cargos = validated_data.pop('cargos', [])
        unidades = validated_data.pop('unidades', [])
        competencias = validated_data.pop('competencias', [])
        
        # Extrair e processar changelog
        changelog_str = validated_data.get('changelog', '')
        modules_data = []
        if changelog_str:
            try:
                changelog = json.loads(changelog_str)
                modules_data = changelog.get('modules', [])
            except (json.JSONDecodeError, AttributeError):
                pass
        
        # Criar trilha
        trilha = Trilha.objects.create(**validated_data)
        
        # Associar campos ManyToMany
        if tags:
            trilha.tags.set(tags)
        if areas:
            trilha.areas.set(areas)
        if cargos:
            trilha.cargos.set(cargos)
        if unidades:
            trilha.unidades.set(unidades)
        if competencias:
            trilha.competencias.set(competencias)
        
        # Criar módulos
        self._create_modules_from_data(trilha, modules_data)
        
        return trilha

    def update(self, instance, validated_data):
        """Atualizar trilha e processar módulos do changelog."""
        # Extrair campos ManyToMany
        tags = validated_data.pop('tags', None)
        areas = validated_data.pop('areas', None)
        cargos = validated_data.pop('cargos', None)
        unidades = validated_data.pop('unidades', None)
        competencias = validated_data.pop('competencias', None)
        
        # Extrair e processar changelog
        changelog_str = validated_data.get('changelog', '')
        modules_data = []
        if changelog_str:
            try:
                changelog = json.loads(changelog_str)
                modules_data = changelog.get('modules', [])
            except (json.JSONDecodeError, AttributeError):
                pass
        
        # Atualizar campos básicos da trilha
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Atualizar campos ManyToMany
        if tags is not None:
            instance.tags.set(tags)
        if areas is not None:
            instance.areas.set(areas)
        if cargos is not None:
            instance.cargos.set(cargos)
        if unidades is not None:
            instance.unidades.set(unidades)
        if competencias is not None:
            instance.competencias.set(competencias)
        
        # Atualizar módulos
        self._update_modules_from_data(instance, modules_data)
        
        return instance

    def _create_modules_from_data(self, trilha, modules_data):
        """Criar módulos a partir dos dados do changelog."""
        for idx, module_data in enumerate(modules_data):
            Modulo.objects.create(
                id_trilha=trilha,
                titulo=module_data.get('name', f'Módulo {idx + 1}'),
                descricao=module_data.get('description', ''),
                ordem=idx + 1
            )

    def _update_modules_from_data(self, trilha, modules_data):
        """Atualizar módulos existentes e criar novos conforme necessário."""
        # Manter track dos módulos existentes
        existing_modules = {m.id_modulo: m for m in trilha.modulos.all()}
        processed_module_ids = set()
        
        # Processar cada módulo dos dados
        for idx, module_data in enumerate(modules_data):
            module_id = module_data.get('id')
            module_name = module_data.get('name', f'Módulo {idx + 1}')
            materials_data = module_data.get('materials', [])
            
            # Se tem ID e existe no banco, atualizar
            if module_id and module_id in existing_modules:
                modulo = existing_modules[module_id]
                modulo.titulo = module_name
                modulo.descricao = module_data.get('description', '')
                modulo.ordem = idx + 1
                modulo.save()
                processed_module_ids.add(module_id)
                
                # Atualizar atividades/materiais do módulo
                self._update_activities_from_data(modulo, materials_data)
            else:
                # Criar novo módulo
                modulo = Modulo.objects.create(
                    id_trilha=trilha,
                    titulo=module_name,
                    descricao=module_data.get('description', ''),
                    ordem=idx + 1
                )
                processed_module_ids.add(modulo.id_modulo)
                
                # Criar atividades/materiais do novo módulo
                self._update_activities_from_data(modulo, materials_data)
        
        # Remover módulos que não estão mais na lista
        for module_id in existing_modules:
            if module_id not in processed_module_ids:
                existing_modules[module_id].delete()

    def _update_activities_from_data(self, modulo, materials_data):
        """Atualizar atividades/materiais dentro de um módulo."""
        # Manter track das atividades existentes
        existing_activities = {a.id_atividade: a for a in modulo.atividades.all()}
        processed_activity_ids = set()
        
        # Processar cada material dos dados
        for order_idx, material in enumerate(materials_data):
            material_id = material.get('id')
            material_name = material.get('name', f'Material {order_idx + 1}')
            material_type = material.get('type', 'link')
            
            # Se tem ID e existe no banco, atualizar
            if material_id and material_id in existing_activities:
                atividade = existing_activities[material_id]
                atividade.titulo = material_name
                atividade.descricao = material.get('description', '')
                atividade.ordem = order_idx + 1
                atividade.save()
                processed_activity_ids.add(material_id)
            else:
                # Criar nova atividade (sem material por enquanto)
                atividade = Atividade.objects.create(
                    id_modulo=modulo,
                    titulo=material_name,
                    descricao=material.get('description', ''),
                    ordem=order_idx + 1,
                )
                processed_activity_ids.add(atividade.id_atividade)
        
        # Remover atividades que não estão mais na lista
        for activity_id in existing_activities:
            if activity_id not in processed_activity_ids:
                existing_activities[activity_id].delete()


class TrilhaSearchSerializer(serializers.ModelSerializer):
    """Serializer otimizado para resultados de pesquisa de trilhas."""
    id = serializers.IntegerField(source='id_trilha', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    areas = AreaSerializer(many=True, read_only=True)
    cargos = CargoSerializer(many=True, read_only=True)
    unidades = UnidadeSerializer(many=True, read_only=True)
    competencias = CompetenciaSerializer(many=True, read_only=True)
    modules = ModuloSimplificadoSerializer(source='modulos', many=True, read_only=True)
    criado_por_nome = serializers.SerializerMethodField()
    total_modulos = serializers.SerializerMethodField()

    class Meta:
        model = Trilha
        fields = [
            'id', 'id_trilha', 'titulo', 'descricao', 'objetivos', 'status',
            'versao', 'publico_alvo', 'prazo_recomendado', 'is_template',
            'data_vigencia_inicio', 'data_vigencia_fim', 'changelog',
            'tags', 'areas', 'cargos', 'unidades', 'competencias',
            'modules', 'criado_por_nome', 'total_modulos'
        ]

    def get_criado_por_nome(self, obj):
        return obj.criado_por.username if obj.criado_por else None

    def get_total_modulos(self, obj):
        return obj.modulos.count()


class ModuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulo
        fields = '__all__'


# ==================== SERIALIZERS DE MATERIAIS ====================

class MaterialVideoSerializer(serializers.ModelSerializer):
    fonte = serializers.CharField(read_only=True)
    video_source = serializers.SerializerMethodField()

    class Meta:
        model = MaterialVideo
        fields = [
            'id_material', 'id_atividade', 'titulo', 'descricao', 
            'duracao', 'url', 'arquivo', 'fonte', 'video_source'
        ]
        read_only_fields = ('fonte',)

    def get_video_source(self, obj):
        source = obj.get_video_source()
        # Se for um arquivo (começa com /media/), construir URL absoluta
        if source and source.startswith('/media/'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(source)
        return source

    def validate(self, data):
        url = data.get('url')
        arquivo = data.get('arquivo')

        if not url and not arquivo:
            raise serializers.ValidationError(
                "É necessário fornecer uma URL ou um arquivo de vídeo."
            )
        if url and arquivo:
            raise serializers.ValidationError(
                "Forneça apenas uma fonte: URL ou arquivo, não ambos."
            )
        if arquivo:
            ext = os.path.splitext(arquivo.name)[1].lower()
            if ext not in ['.mp4', '.mkv']:
                raise serializers.ValidationError(
                    "Formato de arquivo não suportado. Use .mp4 ou .mkv."
                )
        return data


class MaterialPDFSerializer(serializers.ModelSerializer):
    caminho_arquivo = serializers.SerializerMethodField()
    url_arquivo = serializers.SerializerMethodField()

    class Meta:
        model = MaterialPDF
        fields = [
            'id_material', 'id_atividade', 'titulo', 'descricao', 
            'arquivo', 'caminho_arquivo', 'url_arquivo'
        ]

    def get_caminho_arquivo(self, obj):
        return obj.get_caminho_arquivo()

    def get_url_arquivo(self, obj):
        if obj.arquivo:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None

    def validate_arquivo(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext != '.pdf':
            raise serializers.ValidationError(
                "Formato de arquivo não suportado. Use apenas .pdf."
            )
        return value


class MaterialLeituraSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialLeitura
        fields = ['id_material', 'id_atividade', 'titulo', 'descricao', 'conteudo']


# ==================== SERIALIZERS DE QUESTÃO (BANCO DE QUESTÕES) ====================

class QuestaoSerializer(serializers.ModelSerializer):
    """Serializer completo para Questão do Banco de Questões."""
    tags = TagSerializer(many=True, read_only=True)
    areas = AreaSerializer(many=True, read_only=True)
    cargos = CargoSerializer(many=True, read_only=True)
    unidades = UnidadeSerializer(many=True, read_only=True)
    competencias = CompetenciaSerializer(many=True, read_only=True)
    
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, write_only=True, required=False, source='tags'
    )
    area_ids = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(), many=True, write_only=True, required=False, source='areas'
    )
    cargo_ids = serializers.PrimaryKeyRelatedField(
        queryset=Cargo.objects.all(), many=True, write_only=True, required=False, source='cargos'
    )
    unidade_ids = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), many=True, write_only=True, required=False, source='unidades'
    )
    competencia_ids = serializers.PrimaryKeyRelatedField(
        queryset=Competencia.objects.all(), many=True, write_only=True, required=False, source='competencias'
    )
    
    criado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = Questao
        fields = [
            'id_questao', 'criado_por', 'criado_por_nome',
            'enunciado', 'alternativa_a', 'alternativa_b', 
            'alternativa_c', 'alternativa_d', 'gabarito', 'feedback',
            'keywords', 'tags', 'areas', 'cargos', 'unidades', 'competencias',
            'tag_ids', 'area_ids', 'cargo_ids', 'unidade_ids', 'competencia_ids',
            'data_criacao', 'data_atualizacao', 'ativo'
        ]
        read_only_fields = ('criado_por', 'data_criacao', 'data_atualizacao')

    def get_criado_por_nome(self, obj):
        return obj.criado_por.username if obj.criado_por else None


class QuestaoSearchSerializer(serializers.ModelSerializer):
    """Serializer resumido para busca de questões."""
    tags = TagSerializer(many=True, read_only=True)
    areas = AreaSerializer(many=True, read_only=True)
    competencias = CompetenciaSerializer(many=True, read_only=True)

    class Meta:
        model = Questao
        fields = [
            'id_questao', 'enunciado', 'keywords',
            'tags', 'areas', 'competencias', 'data_criacao'
        ]


class QuestaoParaTentativaSerializer(serializers.ModelSerializer):
    """
    Serializer para exibir questão durante uma tentativa.
    NÃO inclui gabarito nem feedback.
    """
    alternativas = serializers.SerializerMethodField()

    class Meta:
        model = Questao
        fields = ['id_questao', 'enunciado', 'alternativas']

    def get_alternativas(self, obj):
        # Se houver ordem de alternativas no contexto, usar ela
        ordem = self.context.get('ordem_alternativas')
        if ordem:
            mapa = {
                'A': obj.alternativa_a,
                'B': obj.alternativa_b,
                'C': obj.alternativa_c,
                'D': obj.alternativa_d,
            }
            return [
                {"posicao": chr(65 + i), "texto": mapa[letra]}
                for i, letra in enumerate(ordem)
            ]
        return obj.get_alternativas()


class QuestaoComFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer para exibir questão com feedback após finalização.
    Inclui gabarito e feedback.
    """
    alternativas = serializers.SerializerMethodField()

    class Meta:
        model = Questao
        fields = ['id_questao', 'enunciado', 'alternativas', 'gabarito', 'feedback']

    def get_alternativas(self, obj):
        return obj.get_alternativas()


# ==================== SERIALIZERS DE QUIZ ====================

class QuizQuestaoSerializer(serializers.ModelSerializer):
    """Serializer para relação Quiz-Questão."""
    questao = QuestaoSearchSerializer(source='id_questao', read_only=True)

    class Meta:
        model = QuizQuestao
        fields = ['id_quiz_questao', 'id_quiz', 'id_questao', 'ordem', 'questao']


class QuizSerializer(serializers.ModelSerializer):
    """Serializer completo para Quiz."""
    questoes_detalhes = serializers.SerializerMethodField()
    total_questoes = serializers.SerializerMethodField()
    
    # Para adicionar questões
    questao_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Quiz
        fields = [
            'id_quiz', 'id_atividade', 'titulo', 'descricao',
            'porcentagem_minima_aprovacao', 'tempo_limite_minutos',
            'tentativas_permitidas', 'randomizar_questoes', 'randomizar_alternativas',
            'mostrar_feedback', 'mostrar_gabarito',
            'questoes_detalhes', 'total_questoes', 'questao_ids',
            'data_criacao', 'data_atualizacao'
        ]
        read_only_fields = ('data_criacao', 'data_atualizacao')

    def get_questoes_detalhes(self, obj):
        quiz_questoes = obj.quiz_questoes.all().order_by('ordem')
        return QuizQuestaoSerializer(quiz_questoes, many=True).data

    def get_total_questoes(self, obj):
        return obj.get_total_questoes()

    def create(self, validated_data):
        questao_ids = validated_data.pop('questao_ids', [])
        quiz = Quiz.objects.create(**validated_data)
        
        for ordem, questao_id in enumerate(questao_ids, start=1):
            QuizQuestao.objects.create(
                id_quiz=quiz,
                id_questao_id=questao_id,
                ordem=ordem
            )
        
        return quiz

    def update(self, instance, validated_data):
        questao_ids = validated_data.pop('questao_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if questao_ids is not None:
            # Remover questões antigas e adicionar novas
            instance.quiz_questoes.all().delete()
            for ordem, questao_id in enumerate(questao_ids, start=1):
                QuizQuestao.objects.create(
                    id_quiz=instance,
                    id_questao_id=questao_id,
                    ordem=ordem
                )
        
        return instance


class QuizParaTentativaSerializer(serializers.ModelSerializer):
    """Serializer para iniciar uma tentativa de quiz."""
    class Meta:
        model = Quiz
        fields = [
            'id_quiz', 'titulo', 'descricao',
            'porcentagem_minima_aprovacao', 'tempo_limite_minutos',
            'tentativas_permitidas'
        ]


# ==================== SERIALIZERS DE TENTATIVA ====================

class RespostaQuestaoSerializer(serializers.ModelSerializer):
    """Serializer para resposta de questão."""
    questao_enunciado = serializers.SerializerMethodField()

    class Meta:
        model = RespostaQuestao
        fields = [
            'id_resposta', 'id_tentativa', 'id_questao',
            'resposta_usuario', 'correta', 'data_resposta',
            'questao_enunciado'
        ]
        read_only_fields = ('correta', 'data_resposta')

    def get_questao_enunciado(self, obj):
        return obj.id_questao.enunciado[:100] + "..." if len(obj.id_questao.enunciado) > 100 else obj.id_questao.enunciado


class RespostaQuestaoComFeedbackSerializer(serializers.ModelSerializer):
    """Serializer para resposta com feedback após finalização."""
    questao = QuestaoComFeedbackSerializer(source='id_questao', read_only=True)
    alternativas_apresentadas = serializers.SerializerMethodField()

    class Meta:
        model = RespostaQuestao
        fields = [
            'id_resposta', 'id_questao', 'resposta_usuario', 
            'correta', 'questao', 'alternativas_apresentadas'
        ]

    def get_alternativas_apresentadas(self, obj):
        return obj.get_alternativas_ordenadas()


class TentativaQuizSerializer(serializers.ModelSerializer):
    """Serializer para tentativa de quiz."""
    quiz_titulo = serializers.SerializerMethodField()
    usuario_email = serializers.SerializerMethodField()

    class Meta:
        model = TentativaQuiz
        fields = [
            'id_tentativa', 'id_quiz', 'id_usuario',
            'quiz_titulo', 'usuario_email',
            'data_inicio', 'data_fim',
            'total_questoes', 'total_acertos', 'nota', 'aprovado', 'status'
        ]
        read_only_fields = (
            'data_inicio', 'data_fim', 'total_questoes', 
            'total_acertos', 'nota', 'aprovado'
        )

    def get_quiz_titulo(self, obj):
        return obj.id_quiz.titulo

    def get_usuario_email(self, obj):
        return obj.id_usuario.email


class TentativaQuizDetalhadaSerializer(serializers.ModelSerializer):
    """Serializer detalhado para tentativa com respostas."""
    respostas = RespostaQuestaoComFeedbackSerializer(many=True, read_only=True)
    quiz = QuizParaTentativaSerializer(source='id_quiz', read_only=True)

    class Meta:
        model = TentativaQuiz
        fields = [
            'id_tentativa', 'id_quiz', 'quiz',
            'data_inicio', 'data_fim',
            'total_questoes', 'total_acertos', 'nota', 'aprovado', 'status',
            'respostas'
        ]


class IniciarTentativaSerializer(serializers.Serializer):
    """Serializer para iniciar uma nova tentativa."""
    id_quiz = serializers.IntegerField()


class ResponderQuestaoSerializer(serializers.Serializer):
    """Serializer para responder uma questão."""
    id_questao = serializers.IntegerField()
    resposta = serializers.CharField(max_length=1)

    def validate_resposta(self, value):
        if value.upper() not in ['A', 'B', 'C', 'D']:
            raise serializers.ValidationError(
                "Resposta inválida. Use A, B, C ou D."
            )
        return value.upper()


# ==================== SERIALIZER DE ATIVIDADE COM MATERIAL ====================

class AtividadeSerializer(serializers.ModelSerializer):
    """Serializer de Atividade que inclui o material associado."""
    material_video = MaterialVideoSerializer(read_only=True)
    material_pdf = MaterialPDFSerializer(read_only=True)
    material_leitura = MaterialLeituraSerializer(read_only=True)
    quiz = QuizSerializer(read_only=True)
    material = serializers.SerializerMethodField()

    class Meta:
        model = Atividade
        fields = [
            'id_atividade', 'id_modulo', 'titulo', 'descricao', 'ordem',
            'nota_minima', 'id_atividade_pre_requisito', 'limite_tentativas',
            'limite_tempo_minutos', 'prazo_correcao_sla_horas',
            'material_video', 'material_pdf', 'material_leitura', 'quiz', 'material'
        ]

    def get_material(self, obj):
        # Obter o contexto para passar aos serializers filhos
        context = self.context
        
        if hasattr(obj, 'material_video'):
            try:
                material = obj.material_video
                material_data = MaterialVideoSerializer(material, context=context).data
                return {
                    'type': 'video',
                    'id': material.id_material,
                    'name': material_data.get('titulo', 'Vídeo'),
                    'description': material_data.get('descricao', ''),
                    'url': material_data.get('video_source') or material_data.get('url'),
                    'duration': material_data.get('duracao'),
                }
            except MaterialVideo.DoesNotExist:
                pass

        if hasattr(obj, 'material_pdf'):
            try:
                material = obj.material_pdf
                material_data = MaterialPDFSerializer(material, context=context).data
                return {
                    'type': 'pdf',
                    'id': material.id_material,
                    'name': material_data.get('titulo', 'PDF'),
                    'description': material_data.get('descricao', ''),
                    'url': material_data.get('url_arquivo') or material_data.get('arquivo'),
                }
            except MaterialPDF.DoesNotExist:
                pass

        if hasattr(obj, 'material_leitura'):
            try:
                material = obj.material_leitura
                material_data = MaterialLeituraSerializer(material, context=context).data
                return {
                    'type': 'reading',
                    'id': material.id_material,
                    'name': material_data.get('titulo', 'Leitura'),
                    'description': material_data.get('descricao', ''),
                    'content': material_data.get('conteudo', ''),
                }
            except MaterialLeitura.DoesNotExist:
                pass

        if hasattr(obj, 'quiz'):
            try:
                quiz = obj.quiz
                quiz_data = QuizSerializer(quiz, context=context).data
                
                # Transformar questões detalhes em formato simplificado para o frontend
                questoes = []
                for q_detalhe in quiz_data.get('questoes_detalhes', []):
                    questao = q_detalhe.get('questao', {})
                    questoes.append({
                        'id_questao': questao.get('id_questao'),
                        'pergunta': questao.get('enunciado', ''),
                        'alternativa_a': questao.get('alternativa_a', ''),
                        'alternativa_b': questao.get('alternativa_b', ''),
                        'alternativa_c': questao.get('alternativa_c', ''),
                        'alternativa_d': questao.get('alternativa_d', ''),
                        'gabarito': questao.get('gabarito', ''),
                        'feedback': questao.get('feedback', ''),
                    })
                
                return {
                    'type': 'quiz',
                    'id': quiz.id_quiz,
                    'name': quiz_data.get('titulo', 'Quiz'),
                    'description': quiz_data.get('descricao', ''),
                    'quizData': {
                        'questions': questoes,
                        'passingScore': quiz_data.get('porcentagem_minima_aprovacao', 70),
                        'timeLimit': quiz_data.get('tempo_limite_minutos'),
                        'attemptsAllowed': quiz_data.get('tentativas_permitidas'),
                        'shuffleQuestions': quiz_data.get('randomizar_questoes', False),
                        'shuffleOptions': quiz_data.get('randomizar_alternativas', False),
                    }
                }
            except Quiz.DoesNotExist:
                pass

        return None


class MatriculaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Matricula
        fields = '__all__'


class ProgressoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progresso
        fields = '__all__'
        read_only_fields = ('id_usuario', 'id_atividade')