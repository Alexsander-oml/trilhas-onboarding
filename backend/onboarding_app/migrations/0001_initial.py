# Generated migration - Initial models: Trilha, Modulo, Atividade
# OPERAÇÃO: CreateModel para modelos base da estrutura de aprendizado

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ==================== MODELOS BASE - TRILHA, MODULO, ATIVIDADE ====================
        # Estrutura hierárquica principal do sistema de aprendizado
        # Trilha > Modulo > Atividade
        
        migrations.CreateModel(
            name='Trilha',
            fields=[
                ('id_trilha', models.AutoField(primary_key=True, serialize=False)),
                ('versao', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('Rascunho', 'Rascunho'), ('Publicada', 'Publicada'), ('Arquivada', 'Arquivada')], default='Rascunho', max_length=50)),
                ('titulo', models.CharField(blank=True, max_length=255, null=True)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('objetivos', models.TextField(blank=True, null=True)),
                ('publico_alvo', models.CharField(blank=True, max_length=255, null=True)),
                ('prazo_recomendado', models.IntegerField(blank=True, null=True)),
                ('changelog', models.TextField(blank=True, null=True)),
                ('data_vigencia_inicio', models.DateTimeField(blank=True, null=True)),
                ('data_vigencia_fim', models.DateTimeField(blank=True, null=True)),
                ('is_template', models.BooleanField(default=False)),
                ('criado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='trilhas_criadas', to=settings.AUTH_USER_MODEL)),
                ('id_trilha_pai', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='versoes', to='onboarding_app.trilha')),
            ],
        ),
        migrations.CreateModel(
            name='Modulo',
            fields=[
                ('id_modulo', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(blank=True, max_length=255, null=True)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('ordem', models.IntegerField(blank=True, null=True)),
                ('id_modulo_pre_requisito', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='modulos_dependentes', to='onboarding_app.modulo')),
                ('id_trilha', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='modulos', to='onboarding_app.trilha')),
            ],
        ),
        migrations.CreateModel(
            name='Atividade',
            fields=[
                ('id_atividade', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(blank=True, max_length=255, null=True)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('ordem', models.IntegerField(blank=True, null=True)),
                ('nota_minima', models.FloatField(blank=True, null=True)),
                ('limite_tentativas', models.IntegerField(blank=True, null=True)),
                ('limite_tempo_minutos', models.IntegerField(blank=True, null=True)),
                ('prazo_correcao_sla_horas', models.IntegerField(blank=True, null=True)),
                ('id_atividade_pre_requisito', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='atividades_dependentes', to='onboarding_app.atividade')),
                ('id_modulo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='atividades', to='onboarding_app.modulo')),
            ],
        ),
    ]
