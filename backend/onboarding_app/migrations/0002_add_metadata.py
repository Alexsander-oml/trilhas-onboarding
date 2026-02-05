# Generated migration - Add filter models and M2M relationships
# OPERAÇÃO: CreateModel para Tag, Area, Cargo, Unidade, Competencia
# OPERAÇÃO: AddField para relacionamentos ManyToMany em Trilha

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding_app', '0001_initial'),
    ]

    operations = [
        # ==================== MODELOS DE FILTROS ====================
        # Tag, Area, Cargo, Unidade, Competencia
        # Usados para categorizar e filtrar Trilhas e Questões
        # ORIGEM: 0005_tag_area_cargo_unidade_competencia_trilha_filters
        
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id_tag', models.AutoField(primary_key=True, serialize=False)),
                ('nome', models.CharField(max_length=100, unique=True)),
            ],
            options={
                'verbose_name': 'Tag',
                'verbose_name_plural': 'Tags',
            },
        ),
        migrations.CreateModel(
            name='Area',
            fields=[
                ('id_area', models.AutoField(primary_key=True, serialize=False)),
                ('nome', models.CharField(max_length=100, unique=True)),
                ('descricao', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Área',
                'verbose_name_plural': 'Áreas',
            },
        ),
        migrations.CreateModel(
            name='Cargo',
            fields=[
                ('id_cargo', models.AutoField(primary_key=True, serialize=False)),
                ('nome', models.CharField(max_length=100, unique=True)),
                ('descricao', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Cargo',
                'verbose_name_plural': 'Cargos',
            },
        ),
        migrations.CreateModel(
            name='Unidade',
            fields=[
                ('id_unidade', models.AutoField(primary_key=True, serialize=False)),
                ('nome', models.CharField(max_length=100, unique=True)),
                ('descricao', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Unidade',
                'verbose_name_plural': 'Unidades',
            },
        ),
        migrations.CreateModel(
            name='Competencia',
            fields=[
                ('id_competencia', models.AutoField(primary_key=True, serialize=False)),
                ('nome', models.CharField(max_length=100, unique=True)),
                ('descricao', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Competência',
                'verbose_name_plural': 'Competências',
            },
        ),
        # ==================== RELACIONAMENTOS M2M EM TRILHA ====================
        # Adiciona campos ManyToMany para filtros
        # Permite categorizar trilhas por tags, áreas, cargos, unidades e competências
        
        migrations.AddField(
            model_name='trilha',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='trilhas', to='onboarding_app.tag'),
        ),
        migrations.AddField(
            model_name='trilha',
            name='areas',
            field=models.ManyToManyField(blank=True, related_name='trilhas', to='onboarding_app.area'),
        ),
        migrations.AddField(
            model_name='trilha',
            name='cargos',
            field=models.ManyToManyField(blank=True, related_name='trilhas', to='onboarding_app.cargo'),
        ),
        migrations.AddField(
            model_name='trilha',
            name='unidades',
            field=models.ManyToManyField(blank=True, related_name='trilhas', to='onboarding_app.unidade'),
        ),
        migrations.AddField(
            model_name='trilha',
            name='competencias',
            field=models.ManyToManyField(blank=True, related_name='trilhas', to='onboarding_app.competencia'),
        ),
    ]
