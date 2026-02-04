# Generated migration for adding Setor, SubSetor and making fields required

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_perfil_remove_user_role_user_cargo_and_more"),
    ]

    operations = [
        # Criar modelo Setor
        migrations.CreateModel(
            name="Setor",
            fields=[
                ("id_setor", models.AutoField(primary_key=True, serialize=False)),
                ("nome", models.CharField(max_length=100, unique=True)),
                ("descricao", models.TextField(blank=True, null=True)),
                ("ativo", models.BooleanField(default=True)),
                ("data_criacao", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Setor",
                "verbose_name_plural": "Setores",
            },
        ),
        # Criar modelo SubSetor
        migrations.CreateModel(
            name="SubSetor",
            fields=[
                ("id_subsetor", models.AutoField(primary_key=True, serialize=False)),
                ("nome", models.CharField(max_length=100)),
                ("descricao", models.TextField(blank=True, null=True)),
                ("ativo", models.BooleanField(default=True)),
                ("data_criacao", models.DateTimeField(auto_now_add=True)),
                (
                    "setor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subsetores",
                        to="users.setor",
                    ),
                ),
            ],
            options={
                "verbose_name": "Sub-setor",
                "verbose_name_plural": "Sub-setores",
                "unique_together": {("setor", "nome")},
            },
        ),
        # Adicionar campos ao User
        migrations.AddField(
            model_name="user",
            name="setor",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="usuarios",
                to="users.setor",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="subsetor",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="usuarios",
                to="users.subsetor",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="ativo",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="user",
            name="data_atualizacao",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="user",
            name="data_criacao",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        # Alterar campos para permitir blank/null temporariamente
        migrations.AlterField(
            model_name="user",
            name="first_name",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AlterField(
            model_name="user",
            name="last_name",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AlterField(
            model_name="user",
            name="cargo",
            field=models.CharField(
                blank=True,
                null=True,
                default="",
                help_text="Cargo profissional do usuário",
                max_length=100,
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(blank=True, max_length=254, unique=True),
        ),
        # Adicionar índices
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["email"], name="users_user_email_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["setor"], name="users_user_setor_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["subsetor"], name="users_user_subsetor_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["ativo"], name="users_user_ativo_idx"),
        ),
    ]
