# Generated migration - Add Quiz system models
# OPERAÇÃO: CreateModel para Questao, Quiz, QuizQuestao, TentativaQuiz, RespostaQuestao
# ORIGEM: 0006_questao_quiz_quizquestao_tentativaquiz_respostaquestao

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('onboarding_app', '0003_materialvideo_materialpdf_materialleitura'),
    ]

    operations = [
        # ==================== BANCO DE QUESTÕES ====================
        # Questao: banco global de questões reutilizáveis
        # Permite criar questões uma vez e usá-las em múltiplos quizzes
        # ORIGEM: 0006_questao_quiz_quizquestao_tentativaquiz_respostaquestao
        
        migrations.CreateModel(
            name='Questao',
            fields=[
                ('id_questao', models.AutoField(primary_key=True, serialize=False)),
                ('enunciado', models.TextField(help_text='Texto da pergunta/enunciado')),
                ('alternativa_a', models.CharField(help_text='Alternativa A', max_length=500)),
                ('alternativa_b', models.CharField(help_text='Alternativa B', max_length=500)),
                ('alternativa_c', models.CharField(help_text='Alternativa C', max_length=500)),
                ('alternativa_d', models.CharField(help_text='Alternativa D', max_length=500)),
                ('gabarito', models.CharField(choices=[('A', 'Alternativa A'), ('B', 'Alternativa B'), ('C', 'Alternativa C'), ('D', 'Alternativa D')], help_text='Alternativa correta', max_length=1)),
                ('feedback', models.TextField(blank=True, help_text='Explicação da resposta correta (exibido após finalização)', null=True)),
                ('keywords', models.TextField(blank=True, help_text='Palavras-chave separadas por vírgula', null=True)),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
                ('data_atualizacao', models.DateTimeField(auto_now=True)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='questoes_criadas', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Questão',
                'verbose_name_plural': 'Questões',
                'ordering': ['-data_criacao'],
            },
        ),
        # ==================== MODELO DE QUIZ ====================
        # Quiz: avaliação com múltiplas questões, configurável
        # Suporta: porcentagem mínima, tempo limite, tentativas, randomização
        
        migrations.CreateModel(
            name='Quiz',
            fields=[
                ('id_quiz', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=255)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('porcentagem_minima_aprovacao', models.FloatField(default=70.0, help_text='Porcentagem mínima para aprovação (ex: 70.0 para 70%)')),
                ('tempo_limite_minutos', models.IntegerField(blank=True, help_text='Tempo limite para completar o quiz em minutos', null=True)),
                ('tentativas_permitidas', models.IntegerField(blank=True, help_text='Número máximo de tentativas (null = ilimitado)', null=True)),
                ('randomizar_questoes', models.BooleanField(default=True, help_text='Randomizar ordem das questões a cada tentativa')),
                ('randomizar_alternativas', models.BooleanField(default=True, help_text='Randomizar ordem das alternativas a cada tentativa')),
                ('mostrar_feedback', models.BooleanField(default=True, help_text='Mostrar feedback após finalização')),
                ('mostrar_gabarito', models.BooleanField(default=True, help_text='Mostrar gabarito após finalização')),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
                ('data_atualizacao', models.DateTimeField(auto_now=True)),
                ('id_atividade', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='quiz', to='onboarding_app.atividade')),
            ],
            options={
                'verbose_name': 'Quiz',
                'verbose_name_plural': 'Quizzes',
            },
        ),
        # ==================== TABELA INTERMEDIÁRIA QUIZ-QUESTÃO ====================
        # QuizQuestao: ManyToMany com ordem entre Quiz e Questao
        # Permite reutilizar questões em múltiplos quizzes mantendo ordem específica
        
        migrations.CreateModel(
            name='QuizQuestao',
            fields=[
                ('id_quiz_questao', models.AutoField(primary_key=True, serialize=False)),
                ('ordem', models.IntegerField(default=0, help_text='Ordem da questão no quiz')),
                ('id_questao', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questao_quizzes', to='onboarding_app.questao')),
                ('id_quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quiz_questoes', to='onboarding_app.quiz')),
            ],
            options={
                'verbose_name': 'Questão do Quiz',
                'verbose_name_plural': 'Questões do Quiz',
                'ordering': ['ordem'],
                'unique_together': {('id_quiz', 'id_questao')},
            },
        ),
        # ==================== ADICIONAR RELACIONAMENTO M2M ====================
        # Adiciona campo questoes em Quiz através de QuizQuestao
        
        migrations.AddField(
            model_name='quiz',
            name='questoes',
            field=models.ManyToManyField(related_name='quizzes', through='onboarding_app.QuizQuestao', to='onboarding_app.questao'),
        ),
        # ==================== FILTROS EM QUESTÃO ====================
        # Adiciona relacionamentos M2M para filtros em Questão (mesmo padrão de Trilha)
        
        migrations.AddField(
            model_name='questao',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='questoes', to='onboarding_app.tag'),
        ),
        migrations.AddField(
            model_name='questao',
            name='areas',
            field=models.ManyToManyField(blank=True, related_name='questoes', to='onboarding_app.area'),
        ),
        migrations.AddField(
            model_name='questao',
            name='cargos',
            field=models.ManyToManyField(blank=True, related_name='questoes', to='onboarding_app.cargo'),
        ),
        migrations.AddField(
            model_name='questao',
            name='unidades',
            field=models.ManyToManyField(blank=True, related_name='questoes', to='onboarding_app.unidade'),
        ),
        migrations.AddField(
            model_name='questao',
            name='competencias',
            field=models.ManyToManyField(blank=True, related_name='questoes', to='onboarding_app.competencia'),
        ),
        # ==================== TENTATIVA DE QUIZ ====================
        # TentativaQuiz: registro de cada tentativa do usuário em um quiz
        # Armazena: data/hora, questões na ordem apresentada, resultado (nota, aprovado, status)
        
        migrations.CreateModel(
            name='TentativaQuiz',
            fields=[
                ('id_tentativa', models.AutoField(primary_key=True, serialize=False)),
                ('data_inicio', models.DateTimeField(auto_now_add=True)),
                ('data_fim', models.DateTimeField(blank=True, null=True)),
                ('total_questoes', models.IntegerField(default=0)),
                ('total_acertos', models.IntegerField(default=0)),
                ('nota', models.FloatField(default=0.0, help_text='Nota percentual (0-100)')),
                ('aprovado', models.BooleanField(default=False)),
                ('ordem_questoes', models.TextField(blank=True, help_text='IDs das questões na ordem apresentada (separados por vírgula)', null=True)),
                ('status', models.CharField(choices=[('EmAndamento', 'Em Andamento'), ('Finalizada', 'Finalizada'), ('Expirada', 'Expirada')], default='EmAndamento', max_length=20)),
                ('id_quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tentativas', to='onboarding_app.quiz')),
                ('id_usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tentativas_quiz', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Tentativa de Quiz',
                'verbose_name_plural': 'Tentativas de Quiz',
                'ordering': ['-data_inicio'],
            },
        ),
        # ==================== RESPOSTA DE QUESTÃO ====================
        # RespostaQuestao: registro de resposta individual de cada questão em uma tentativa
        # Armazena: resposta do usuário, ordem das alternativas (anti-cola), resultado
        
        migrations.CreateModel(
            name='RespostaQuestao',
            fields=[
                ('id_resposta', models.AutoField(primary_key=True, serialize=False)),
                ('resposta_usuario', models.CharField(blank=True, help_text='Letra da alternativa escolhida (A, B, C ou D)', max_length=1, null=True)),
                ('ordem_alternativas', models.CharField(blank=True, help_text="Ordem das alternativas apresentadas (ex: 'BDAC')", max_length=10, null=True)),
                ('correta', models.BooleanField(default=False)),
                ('data_resposta', models.DateTimeField(blank=True, null=True)),
                ('id_questao', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='respostas', to='onboarding_app.questao')),
                ('id_tentativa', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='respostas', to='onboarding_app.tentativaquiz')),
            ],
            options={
                'verbose_name': 'Resposta de Questão',
                'verbose_name_plural': 'Respostas de Questões',
                'unique_together': {('id_tentativa', 'id_questao')},
            },
        ),
    ]
