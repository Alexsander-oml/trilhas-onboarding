# Generated migration - Add Matricula and Progresso models
# OPERAÇÃO: CreateModel para Matricula e Progresso
# Modelos de rastreamento de progresso do usuário nas trilhas

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('onboarding_app', '0004_quiz'),
    ]

    operations = [
        # ==================== MODELO DE MATRÍCULA ====================
        # Matricula: registro de inscrição do usuário em uma trilha
        # Armazena: status de progresso (EmAndamento, Concluida, Cancelada)
        # Marca se trilha é obrigatória e datas de início/fim
        
        migrations.CreateModel(
            name='Matricula',
            fields=[
                ('id_matricula', models.AutoField(primary_key=True, serialize=False)),
                ('data_inicio', models.DateTimeField(blank=True, null=True)),
                ('data_fim', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('EmAndamento', 'Em Andamento'), ('Concluida', 'Concluída'), ('Cancelada', 'Cancelada')], default='EmAndamento', max_length=50)),
                ('obrigatoria', models.BooleanField(default=False)),
                ('id_usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matriculas', to=settings.AUTH_USER_MODEL)),
                ('id_trilha', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matriculas', to='onboarding_app.trilha')),
            ],
        ),
        # ==================== MODELO DE PROGRESSO ====================
        # Progresso: acompanhamento de conclusão de cada atividade individual
        # Armazena apenas a data de conclusão (completed_at)
        # unique_together: garante um progresso por usuário/atividade
        
        migrations.CreateModel(
            name='Progresso',
            fields=[
                ('id_progresso', models.AutoField(primary_key=True, serialize=False)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('id_atividade', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progressos', to='onboarding_app.atividade')),
                ('id_usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progressos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Progresso',
                'verbose_name_plural': 'Progressos',
                'unique_together': {('id_usuario', 'id_atividade')},
            },
        ),
    ]
