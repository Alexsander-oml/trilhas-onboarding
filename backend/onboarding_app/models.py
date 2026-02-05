from django.db import models
from django.contrib.postgres.fields import ArrayField
from users.models import User
import os
import random

# ==================== MODELOS DE FILTROS ====================
# Esses modelos são utilizados como campos de filtro para Trilhas e Questões
# Permitem categorizar e segmentar conteúdo por diferentes critérios organizacionais

class Tag(models.Model):
    """
    Modelo para tags que podem ser associadas às trilhas e questões.
    """
    id_tag = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"

    def __str__(self):
        return self.nome


class Area(models.Model):
    """
    Modelo para áreas/departamentos da organização.
    """
    id_area = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Área"
        verbose_name_plural = "Áreas"

    def __str__(self):
        return self.nome


class Cargo(models.Model):
    """
    Modelo para cargos da organização.
    """
    id_cargo = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Cargo"
        verbose_name_plural = "Cargos"

    def __str__(self):
        return self.nome


class Unidade(models.Model):
    """
    Modelo para unidades/filiais da organização.
    """
    id_unidade = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Unidade"
        verbose_name_plural = "Unidades"

    def __str__(self):
        return self.nome


class Competencia(models.Model):
    """
    Modelo para competências que podem ser desenvolvidas nas trilhas.
    """
    id_competencia = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Competência"
        verbose_name_plural = "Competências"

    def __str__(self):
        return self.nome


# ==================== MODELOS DE TRILHA E CONTEÚDO ====================
# Trilha: Estrutura completa de aprendizado composta por Módulos
# Modulo: Agrupamento de Atividades dentro de uma Trilha
# Atividade: Unidade de aprendizado que contém um tipo de material (Vídeo, PDF, Leitura ou Quiz)
# Material: Conteúdo específico associado a uma Atividade (Video, PDF, Leitura)

class Trilha(models.Model):
    id_trilha = models.AutoField(primary_key=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="trilhas_criadas")
    id_trilha_pai = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="versoes")
    versao = models.CharField(max_length=255, null=False, blank=False)
    STATUS_CHOICES = [
        ("Rascunho", "Rascunho"),
        ("Publicada", "Publicada"),
        ("Arquivada", "Arquivada"),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Rascunho")
    titulo = models.CharField(max_length=255, null=True, blank=True)
    descricao = models.TextField(null=True, blank=True)
    objetivos = models.TextField(null=True, blank=True)
    publico_alvo = models.CharField(max_length=255, null=True, blank=True)
    prazo_recomendado = models.IntegerField(null=True, blank=True)
    changelog = models.TextField(null=True, blank=True)
    data_vigencia_inicio = models.DateTimeField(null=True, blank=True)
    data_vigencia_fim = models.DateTimeField(null=True, blank=True)
    is_template = models.BooleanField(default=False)
    
    # Campos para filtros de pesquisa
    tags = models.ManyToManyField(Tag, blank=True, related_name="trilhas")
    areas = models.ManyToManyField(Area, blank=True, related_name="trilhas")
    cargos = models.ManyToManyField(Cargo, blank=True, related_name="trilhas")
    unidades = models.ManyToManyField(Unidade, blank=True, related_name="trilhas")
    competencias = models.ManyToManyField(Competencia, blank=True, related_name="trilhas")

    def __str__(self):
        return f"{self.titulo} (Versão: {self.versao})"

    def verificar_conclusao_usuario(self, usuario):
        """
        Verifica se o usuário concluiu todos os módulos da trilha.
        Uma trilha é considerada concluída quando todos os seus módulos estão concluídos.
        """
        modulos = self.modulos.all()
        for modulo in modulos:
            if not modulo.verificar_conclusao_usuario(usuario):
                return False
        return True


class Modulo(models.Model):
    id_modulo = models.AutoField(primary_key=True)
    id_trilha = models.ForeignKey(Trilha, on_delete=models.CASCADE, related_name="modulos")
    titulo = models.CharField(max_length=255, null=True, blank=True)
    descricao = models.TextField(null=True, blank=True)
    ordem = models.IntegerField(null=True, blank=True)
    id_modulo_pre_requisito = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="modulos_dependentes")

    def __str__(self):
        return f"{self.titulo} (Trilha: {self.id_trilha.titulo})"

    def verificar_conclusao_usuario(self, usuario):
        """
        Verifica se o usuário concluiu todas as atividades do módulo.
        Um módulo só é concluído se todas as atividades (incluindo quizzes) foram aprovadas.
        """
        atividades = self.atividades.all()
        for atividade in atividades:
            if not atividade.verificar_conclusao_usuario(usuario):
                return False
        return True


class Atividade(models.Model):
    id_atividade = models.AutoField(primary_key=True)
    id_modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="atividades")
    titulo = models.CharField(max_length=255, null=True, blank=True)
    descricao = models.TextField(null=True, blank=True)
    ordem = models.IntegerField(null=True, blank=True)
    nota_minima = models.FloatField(null=True, blank=True)
    id_atividade_pre_requisito = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="atividades_dependentes")
    limite_tentativas = models.IntegerField(null=True, blank=True)
    limite_tempo_minutos = models.IntegerField(null=True, blank=True)
    prazo_correcao_sla_horas = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.titulo} (Módulo: {self.id_modulo.titulo})"

    def get_material(self):
        """
        Retorna o material associado a esta atividade, se existir.
        Verifica os quatro tipos de material: Vídeo, PDF, Leitura e Quiz.
        """
        if hasattr(self, 'material_video'):
            try:
                return self.material_video
            except MaterialVideo.DoesNotExist:
                pass
        if hasattr(self, 'material_pdf'):
            try:
                return self.material_pdf
            except MaterialPDF.DoesNotExist:
                pass
        if hasattr(self, 'material_leitura'):
            try:
                return self.material_leitura
            except MaterialLeitura.DoesNotExist:
                pass
        if hasattr(self, 'quiz'):
            try:
                return self.quiz
            except Quiz.DoesNotExist:
                pass
        return None

    def verificar_conclusao_usuario(self, usuario):
        """
        Verifica se o usuário concluiu esta atividade.
        Para atividades com Quiz, verifica se o usuário foi aprovado.
        Para outras atividades, verifica o registro de progresso.
        """
        # Verificar se há um quiz associado
        try:
            quiz = self.quiz
            return quiz.usuario_aprovado(usuario)
        except Quiz.DoesNotExist:
            pass

        # Para atividades sem quiz, verificar o progresso normal
        try:
            progresso = Progresso.objects.get(id_usuario=usuario, id_atividade=self)
            return progresso.completed_at is not None
        except Progresso.DoesNotExist:
            return False


# ==================== MODELOS DE MATERIAL ====================
# Suportam diferentes tipos de conteúdo para atividades
# OneToOne com Atividade: cada atividade tem apenas um tipo de material

class MaterialVideo(models.Model):
    """
    Material do tipo Vídeo.
    Suporta tanto URLs externas quanto arquivos de vídeo (.mp4, .mkv).
    """
    id_material = models.AutoField(primary_key=True)
    id_atividade = models.OneToOneField(
        Atividade, 
        on_delete=models.CASCADE, 
        related_name="material_video"
    )
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(null=True, blank=True)
    duracao = models.FloatField(null=True, blank=True, help_text="Duração do vídeo em minutos")
    
    # Campo para URL externa (YouTube, Vimeo, etc.)
    url = models.URLField(max_length=2000, null=True, blank=True)
    
    # Campo para upload de arquivo de vídeo
    arquivo = models.FileField(
        upload_to='materiais/videos/', 
        null=True, 
        blank=True,
        help_text="Formatos suportados: .mp4, .mkv"
    )
    
    # Campo calculado para indicar o tipo de fonte
    FONTE_CHOICES = [
        ("url", "URL Externa"),
        ("arquivo", "Arquivo Local"),
    ]
    fonte = models.CharField(max_length=10, choices=FONTE_CHOICES, editable=False, default="url")

    class Meta:
        verbose_name = "Material de Vídeo"
        verbose_name_plural = "Materiais de Vídeo"

    def __str__(self):
        return f"Vídeo: {self.titulo} (Atividade: {self.id_atividade.titulo})"

    def save(self, *args, **kwargs):
        if self.arquivo:
            self.fonte = "arquivo"
        elif self.url:
            self.fonte = "url"
        super().save(*args, **kwargs)

    def get_video_source(self):
        if self.fonte == "arquivo" and self.arquivo:
            return self.arquivo.url
        return self.url

    @property
    def is_url(self):
        return self.fonte == "url"

    @property
    def is_arquivo(self):
        return self.fonte == "arquivo"


class MaterialPDF(models.Model):
    """
    Material do tipo PDF.
    Armazena o arquivo PDF e salva o caminho.
    """
    id_material = models.AutoField(primary_key=True)
    id_atividade = models.OneToOneField(
        Atividade, 
        on_delete=models.CASCADE, 
        related_name="material_pdf"
    )
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(null=True, blank=True)
    
    arquivo = models.FileField(
        upload_to='materiais/pdfs/',
        help_text="Formato suportado: .pdf"
    )

    class Meta:
        verbose_name = "Material PDF"
        verbose_name_plural = "Materiais PDF"

    def __str__(self):
        return f"PDF: {self.titulo} (Atividade: {self.id_atividade.titulo})"

    def get_caminho_arquivo(self):
        if self.arquivo:
            return self.arquivo.path
        return None

    def get_url_arquivo(self):
        if self.arquivo:
            return self.arquivo.url
        return None


class MaterialLeitura(models.Model):
    """
    Material do tipo Leitura.
    Armazena um texto longo para leitura.
    """
    id_material = models.AutoField(primary_key=True)
    id_atividade = models.OneToOneField(
        Atividade, 
        on_delete=models.CASCADE, 
        related_name="material_leitura"
    )
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(null=True, blank=True)
    conteudo = models.TextField(help_text="Texto completo do material de leitura")

    class Meta:
        verbose_name = "Material de Leitura"
        verbose_name_plural = "Materiais de Leitura"

    def __str__(self):
        return f"Leitura: {self.titulo} (Atividade: {self.id_atividade.titulo})"


# ==================== MODELOS DE QUIZ ====================

class Questao(models.Model):
    """
    Banco de Questões Global.
    Questões podem ser reutilizadas em múltiplos quizzes.
    """
    id_questao = models.AutoField(primary_key=True)
    criado_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="questoes_criadas"
    )
    
    # Conteúdo da questão
    enunciado = models.TextField(help_text="Texto da pergunta/enunciado")
    alternativa_a = models.CharField(max_length=500, help_text="Alternativa A")
    alternativa_b = models.CharField(max_length=500, help_text="Alternativa B")
    alternativa_c = models.CharField(max_length=500, help_text="Alternativa C")
    alternativa_d = models.CharField(max_length=500, help_text="Alternativa D")
    
    GABARITO_CHOICES = [
        ("A", "Alternativa A"),
        ("B", "Alternativa B"),
        ("C", "Alternativa C"),
        ("D", "Alternativa D"),
    ]
    gabarito = models.CharField(
        max_length=1, 
        choices=GABARITO_CHOICES,
        help_text="Alternativa correta"
    )
    
    feedback = models.TextField(
        null=True, 
        blank=True,
        help_text="Explicação da resposta correta (exibido após finalização)"
    )
    
    # Metadados para filtro/busca (usando campos de texto simples para compatibilidade)
    keywords = models.TextField(
        null=True, 
        blank=True,
        help_text="Palavras-chave separadas por vírgula"
    )
    
    # Relacionamentos com entidades de filtro
    tags = models.ManyToManyField(Tag, blank=True, related_name="questoes")
    areas = models.ManyToManyField(Area, blank=True, related_name="questoes")
    cargos = models.ManyToManyField(Cargo, blank=True, related_name="questoes")
    unidades = models.ManyToManyField(Unidade, blank=True, related_name="questoes")
    competencias = models.ManyToManyField(Competencia, blank=True, related_name="questoes")
    
    # Metadados
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Questão"
        verbose_name_plural = "Questões"
        ordering = ['-data_criacao']

    def __str__(self):
        return f"Questão {self.id_questao}: {self.enunciado[:50]}..."

    def get_alternativas(self):
        """Retorna as alternativas como lista."""
        return [
            {"letra": "A", "texto": self.alternativa_a},
            {"letra": "B", "texto": self.alternativa_b},
            {"letra": "C", "texto": self.alternativa_c},
            {"letra": "D", "texto": self.alternativa_d},
        ]

    def get_alternativas_randomizadas(self):
        """Retorna as alternativas em ordem aleatória com mapeamento."""
        alternativas = self.get_alternativas()
        random.shuffle(alternativas)
        return alternativas

    def verificar_resposta(self, resposta):
        """Verifica se a resposta está correta."""
        return resposta.upper() == self.gabarito


class Quiz(models.Model):
    """
    Material do tipo Quiz/Avaliação.
    Associado a uma atividade e contém múltiplas questões.
    """
    id_quiz = models.AutoField(primary_key=True)
    id_atividade = models.OneToOneField(
        Atividade, 
        on_delete=models.CASCADE, 
        related_name="quiz"
    )
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(null=True, blank=True)
    
    # Configurações do Quiz
    porcentagem_minima_aprovacao = models.FloatField(
        default=70.0,
        help_text="Porcentagem mínima para aprovação (ex: 70.0 para 70%)"
    )
    tempo_limite_minutos = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Tempo limite para completar o quiz em minutos"
    )
    tentativas_permitidas = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Número máximo de tentativas (null = ilimitado)"
    )
    randomizar_questoes = models.BooleanField(
        default=True,
        help_text="Randomizar ordem das questões a cada tentativa"
    )
    randomizar_alternativas = models.BooleanField(
        default=True,
        help_text="Randomizar ordem das alternativas a cada tentativa"
    )
    mostrar_feedback = models.BooleanField(
        default=True,
        help_text="Mostrar feedback após finalização"
    )
    mostrar_gabarito = models.BooleanField(
        default=True,
        help_text="Mostrar gabarito após finalização"
    )
    
    # Questões do Quiz
    questoes = models.ManyToManyField(
        Questao, 
        through='QuizQuestao',
        related_name="quizzes"
    )
    
    # Metadados
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"Quiz: {self.titulo} (Atividade: {self.id_atividade.titulo})"

    def get_total_questoes(self):
        """Retorna o total de questões do quiz."""
        return self.questoes.count()

    def calcular_nota(self, acertos):
        """Calcula a nota percentual baseada nos acertos."""
        total = self.get_total_questoes()
        if total == 0:
            return 0
        return (acertos / total) * 100

    def verificar_aprovacao(self, nota):
        """Verifica se a nota atinge a porcentagem mínima."""
        return nota >= self.porcentagem_minima_aprovacao

    def usuario_aprovado(self, usuario):
        """Verifica se o usuário já foi aprovado neste quiz."""
        tentativa_aprovada = TentativaQuiz.objects.filter(
            id_quiz=self,
            id_usuario=usuario,
            aprovado=True
        ).exists()
        return tentativa_aprovada

    def get_tentativas_usuario(self, usuario):
        """Retorna o número de tentativas do usuário."""
        return TentativaQuiz.objects.filter(
            id_quiz=self,
            id_usuario=usuario
        ).count()

    def usuario_pode_tentar(self, usuario):
        """Verifica se o usuário ainda pode fazer tentativas."""
        if self.tentativas_permitidas is None:
            return True
        return self.get_tentativas_usuario(usuario) < self.tentativas_permitidas


class QuizQuestao(models.Model):
    """
    Tabela intermediária para relacionar Quiz e Questão.
    Permite definir a ordem das questões no quiz.
    """
    id_quiz_questao = models.AutoField(primary_key=True)
    id_quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="quiz_questoes")
    id_questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name="questao_quizzes")
    ordem = models.IntegerField(default=0, help_text="Ordem da questão no quiz")

    class Meta:
        verbose_name = "Questão do Quiz"
        verbose_name_plural = "Questões do Quiz"
        ordering = ['ordem']
        unique_together = ('id_quiz', 'id_questao')

    def __str__(self):
        return f"Quiz {self.id_quiz.id_quiz} - Questão {self.id_questao.id_questao} (Ordem: {self.ordem})"


class TentativaQuiz(models.Model):
    """
    Registro de tentativa de um usuário em um quiz.
    Armazena as respostas, nota e status de aprovação.
    """
    id_tentativa = models.AutoField(primary_key=True)
    id_quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="tentativas")
    id_usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tentativas_quiz")
    
    # Timestamps
    data_inicio = models.DateTimeField(auto_now_add=True)
    data_fim = models.DateTimeField(null=True, blank=True)
    
    # Resultados
    total_questoes = models.IntegerField(default=0)
    total_acertos = models.IntegerField(default=0)
    nota = models.FloatField(default=0.0, help_text="Nota percentual (0-100)")
    aprovado = models.BooleanField(default=False)
    
    # Ordem randomizada das questões (armazena IDs em ordem)
    ordem_questoes = models.TextField(
        null=True, 
        blank=True,
        help_text="IDs das questões na ordem apresentada (separados por vírgula)"
    )
    
    # Status
    STATUS_CHOICES = [
        ("EmAndamento", "Em Andamento"),
        ("Finalizada", "Finalizada"),
        ("Expirada", "Expirada"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="EmAndamento")

    class Meta:
        verbose_name = "Tentativa de Quiz"
        verbose_name_plural = "Tentativas de Quiz"
        ordering = ['-data_inicio']

    def __str__(self):
        return f"Tentativa {self.id_tentativa} - {self.id_usuario.email} - Quiz {self.id_quiz.titulo}"

    def gerar_ordem_questoes(self):
        """
        Gera a ordem randomizada das questões para esta tentativa.
        """
        questoes_ids = list(
            self.id_quiz.quiz_questoes.values_list('id_questao', flat=True)
        )
        if self.id_quiz.randomizar_questoes:
            random.shuffle(questoes_ids)
        self.ordem_questoes = ','.join(map(str, questoes_ids))
        self.save()
        return questoes_ids

    def get_ordem_questoes(self):
        """Retorna a lista de IDs das questões na ordem desta tentativa."""
        if not self.ordem_questoes:
            return []
        return [int(id) for id in self.ordem_questoes.split(',')]

    def calcular_resultado(self):
        """
        Calcula o resultado final da tentativa.
        """
        respostas = self.respostas.all()
        self.total_questoes = respostas.count()
        self.total_acertos = respostas.filter(correta=True).count()
        self.nota = self.id_quiz.calcular_nota(self.total_acertos)
        self.aprovado = self.id_quiz.verificar_aprovacao(self.nota)
        self.save()

# ==================== MODELOS DE MATRÍCULA E PROGRESSO ====================
# Matricula: Registro de inscrição do usuário em uma trilha (com status de progresso)
# Progresso: Acompanhamento individual de conclusão de cada atividade
# Permite rastrear o percurso do usuário pela trilha
class RespostaQuestao(models.Model):
    """
    Resposta individual de uma questão em uma tentativa.
    """
    id_resposta = models.AutoField(primary_key=True)
    id_tentativa = models.ForeignKey(
        TentativaQuiz, 
        on_delete=models.CASCADE, 
        related_name="respostas"
    )
    id_questao = models.ForeignKey(
        Questao, 
        on_delete=models.CASCADE, 
        related_name="respostas"
    )
    
    # Resposta do usuário
    resposta_usuario = models.CharField(
        max_length=1, 
        null=True, 
        blank=True,
        help_text="Letra da alternativa escolhida (A, B, C ou D)"
    )
    
    # Ordem das alternativas apresentadas (para anti-cola)
    ordem_alternativas = models.CharField(
        max_length=10, 
        null=True, 
        blank=True,
        help_text="Ordem das alternativas apresentadas (ex: 'BDAC')"
    )
    
    # Resultado
    correta = models.BooleanField(default=False)
    
    # Timestamp
    data_resposta = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Resposta de Questão"
        verbose_name_plural = "Respostas de Questões"
        unique_together = ('id_tentativa', 'id_questao')

    def __str__(self):
        status = "Correta" if self.correta else "Incorreta"
        return f"Resposta - Tentativa {self.id_tentativa.id_tentativa} - Questão {self.id_questao.id_questao} - {status}"

    def gerar_ordem_alternativas(self):
        """
        Gera ordem randomizada das alternativas para esta resposta.
        """
        letras = ['A', 'B', 'C', 'D']
        if self.id_tentativa.id_quiz.randomizar_alternativas:
            random.shuffle(letras)
        self.ordem_alternativas = ''.join(letras)
        self.save()
        return letras

    def get_alternativas_ordenadas(self):
        """
        Retorna as alternativas na ordem definida para esta resposta.
        """
        if not self.ordem_alternativas:
            return self.id_questao.get_alternativas()
        
        mapa = {
            'A': self.id_questao.alternativa_a,
            'B': self.id_questao.alternativa_b,
            'C': self.id_questao.alternativa_c,
            'D': self.id_questao.alternativa_d,
        }
        
        return [
            {"letra": letra, "texto": mapa[letra], "letra_original": letra}
            for letra in self.ordem_alternativas
        ]

    def verificar_e_salvar_resposta(self, resposta):
        """
        Verifica a resposta e salva o resultado.
        A resposta deve ser a letra da posição (1ª, 2ª, 3ª, 4ª alternativa apresentada).
        """
        from django.utils import timezone
        
        self.resposta_usuario = resposta.upper() if resposta else None
        self.data_resposta = timezone.now()
        
        if self.resposta_usuario and self.ordem_alternativas:
            # Mapear a posição da resposta para a letra original
            posicao_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            if self.resposta_usuario in posicao_map:
                posicao = posicao_map[self.resposta_usuario]
                if posicao < len(self.ordem_alternativas):
                    letra_original = self.ordem_alternativas[posicao]
                    self.correta = letra_original == self.id_questao.gabarito
        
        self.save()
        return self.correta


# ==================== MODELOS DE MATRÍCULA E PROGRESSO ====================

class Matricula(models.Model):
    id_matricula = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="matriculas")
    id_trilha = models.ForeignKey(Trilha, on_delete=models.CASCADE, related_name="matriculas")
    data_inicio = models.DateTimeField(null=True, blank=True)
    data_fim = models.DateTimeField(null=True, blank=True)
    STATUS_CHOICES = [
        ("EmAndamento", "Em Andamento"),
        ("Concluida", "Concluída"),
        ("Cancelada", "Cancelada"),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="EmAndamento")
    obrigatoria = models.BooleanField(default=False)
    
    # Controle de visualização e refazer trilha
    modo_visualizacao = models.BooleanField(
        default=False,
        help_text="Se True, usuário pode apenas visualizar (sem registrar novo progresso)"
    )
    permite_refazer = models.BooleanField(
        default=False,
        help_text="Se True, admin pode refazer a trilha mantendo histórico"
    )

    def __str__(self):
        return f"Matrícula {self.id_matricula} - Usuário: {self.id_usuario.email} - Trilha: {self.id_trilha.titulo}"

    def calcular_progresso_percentual(self):
        """
        Calcula o percentual de conclusão da trilha (0-100).
        Baseado no número de atividades concluídas.
        """
        total_atividades = 0
        atividades_concluidas = 0
        
        modulos = self.id_trilha.modulos.all()
        for modulo in modulos:
            atividades = modulo.atividades.all()
            total_atividades += atividades.count()
            
            for atividade in atividades:
                if atividade.verificar_conclusao_usuario(self.id_usuario):
                    atividades_concluidas += 1
        
        if total_atividades == 0:
            return 0
        
        return int((atividades_concluidas / total_atividades) * 100)
    
    def verificar_e_finalizar_trilha(self):
        """
        Verifica se a trilha atingiu 100% e marca como finalizada.
        Para Aprendizes: ativa modo_visualizacao automaticamente.
        Para Admins: permite opção de refazer mantendo histórico.
        """
        from django.utils import timezone
        
        progresso = self.calcular_progresso_percentual()
        
        if progresso >= 100 and self.status != "Concluida":
            self.status = "Concluida"
            self.data_fim = timezone.now()
            
            # Verificar perfil do usuário
            perfil_usuario = getattr(self.id_usuario, 'perfil', None)
            if perfil_usuario:
                perfil_nome = perfil_usuario.nome if hasattr(perfil_usuario, 'nome') else str(perfil_usuario)
            else:
                perfil_nome = "Aprendiz"
            
            # Aprendiz: ativa modo visualização automaticamente
            if perfil_nome == "Aprendiz":
                self.modo_visualizacao = True
            # Admin/Gestor: permite refazer mantendo histórico
            elif perfil_nome in ["Administrador", "Gestor"]:
                self.permite_refazer = True
            
            self.save()
            return True
        
        return False
    
    def pode_interagir_com_materiais(self):
        """
        Verifica se o usuário pode interagir com os materiais da trilha.
        Retorna False se estiver em modo_visualizacao (Aprendiz com trilha finalizada).
        """
        return not self.modo_visualizacao
    
    def atualizar_status(self):
        """
        Atualiza o status da matrícula baseado na conclusão da trilha.
        """
        return self.verificar_e_finalizar_trilha()


class Progresso(models.Model):
    id_progresso = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="progressos")
    id_atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name="progressos")
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('id_usuario', 'id_atividade')
        verbose_name = "Progresso"
        verbose_name_plural = "Progressos"
    
    def __str__(self):
        status = "Concluída" if self.completed_at else "Não concluída"
        return f"Progresso - Usuário: {self.id_usuario.email} - Atividade: {self.id_atividade.titulo} - {status}"


# ==================== MODELO DE CERTIFICADO ====================

class Certificado(models.Model):
    """
    Modelo para certificados de conclusão de trilhas.
    Gerado automaticamente quando um usuário completa 100% de uma trilha com 70%+ de aproveitamento.
    """
    id_certificado = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="certificados")
    id_trilha = models.ForeignKey(Trilha, on_delete=models.CASCADE, related_name="certificados")
    codigo_verificacao = models.CharField(max_length=32, unique=True, db_index=True)
    data_emissao = models.DateTimeField(auto_now_add=True)
    link_pdf = models.CharField(max_length=500, null=True, blank=True)
    
    class Meta:
        unique_together = ('id_usuario', 'id_trilha')
        verbose_name = "Certificado"
        verbose_name_plural = "Certificados"
        ordering = ['-data_emissao']
    
    def __str__(self):
        return f"Certificado - {self.id_usuario.username} - {self.id_trilha.titulo} - {self.codigo_verificacao}"
    
    def gerar_codigo_verificacao(self):
        """Gera um código único de verificação de 32 caracteres"""
        import uuid
        return uuid.uuid4().hex.upper()
    
    def save(self, *args, **kwargs):
        if not self.codigo_verificacao:
            self.codigo_verificacao = self.gerar_codigo_verificacao()
        super().save(*args, **kwargs)


# ==================== MODELOS DE NOTIFICAÇÕES ====================
# Importados de módulo separado para manter o arquivo principal organizado.
# Este import garante que o Django registre os models no app.
from .models_notifications import Notification, NotificationPreference  # noqa: E402,F401