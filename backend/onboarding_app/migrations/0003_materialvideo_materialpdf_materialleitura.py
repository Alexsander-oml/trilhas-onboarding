# Generated migration - Add Material models (Video, PDF, Leitura)
# OPERAÇÃO: CreateModel para MaterialVideo, MaterialPDF, MaterialLeitura
# ORIGEM: 0004_materialvideo_materialpdf_materialleitura

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding_app', '0002_add_metadata'),
    ]

    operations = [
        # ==================== MODELOS DE MATERIAL ====================
        # MaterialVideo, MaterialPDF, MaterialLeitura
        # Modelos OneToOne com Atividade para suportar diferentes tipos de conteúdo
        # ORIGEM: 0004_materialvideo_materialpdf_materialleitura
        
        migrations.CreateModel(
            name='MaterialVideo',
            fields=[
                ('id_material', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=255)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('duracao', models.FloatField(blank=True, help_text='Duração do vídeo em minutos', null=True)),
                ('url', models.URLField(blank=True, max_length=2000, null=True)),
                ('arquivo', models.FileField(blank=True, help_text='Formatos suportados: .mp4, .mkv', null=True, upload_to='materiais/videos/')),
                ('fonte', models.CharField(choices=[('url', 'URL Externa'), ('arquivo', 'Arquivo Local')], default='url', editable=False, max_length=10)),
                ('id_atividade', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='material_video', to='onboarding_app.atividade')),
            ],
            options={
                'verbose_name': 'Material de Vídeo',
                'verbose_name_plural': 'Materiais de Vídeo',
            },
        ),
        migrations.CreateModel(
            name='MaterialPDF',
            fields=[
                ('id_material', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=255)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('arquivo', models.FileField(help_text='Formato suportado: .pdf', upload_to='materiais/pdfs/')),
                ('id_atividade', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='material_pdf', to='onboarding_app.atividade')),
            ],
            options={
                'verbose_name': 'Material PDF',
                'verbose_name_plural': 'Materiais PDF',
            },
        ),
        migrations.CreateModel(
            name='MaterialLeitura',
            fields=[
                ('id_material', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=255)),
                ('descricao', models.TextField(blank=True, null=True)),
                ('conteudo', models.TextField(help_text='Texto completo do material de leitura')),
                ('id_atividade', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='material_leitura', to='onboarding_app.atividade')),
            ],
            options={
                'verbose_name': 'Material de Leitura',
                'verbose_name_plural': 'Materiais de Leitura',
            },
        ),
    ]
