"""
Management command para importar usuários de um arquivo Excel (XLSX).

Uso:
    python manage.py import_users_from_excel caminho/para/arquivo.xlsx

Colunas esperadas (ignorando ADMISSÃO e TEMPO DE FAURG):
    - NOME COMPLETO (obrigatório)
    - CARGO (obrigatório)
    - SETOR (obrigatório)
    - SUBSETOR (obrigatório)
    - E-MAIL @FAURG (obrigatório)
"""

import os
import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from users.models import User, Setor, SubSetor, Perfil
from django.utils.text import slugify


class Command(BaseCommand):
    help = "Importa usuários de um arquivo Excel (XLSX)"

    def add_arguments(self, parser):
        parser.add_argument(
            "arquivo",
            type=str,
            help="Caminho do arquivo Excel a importar"
        )
        parser.add_argument(
            "--sheet",
            type=str,
            default="CADASTROS",
            help="Nome da planilha (padrão: CADASTROS)"
        )
        parser.add_argument(
            "--skip-errors",
            action="store_true",
            help="Continuar importação mesmo com erros"
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simular importação sem salvar"
        )

    def handle(self, *args, **options):
        arquivo = options["arquivo"]
        sheet_name = options["sheet"]
        skip_errors = options["skip_errors"]
        dry_run = options["dry_run"]

        # Validar arquivo
        if not os.path.exists(arquivo):
            raise CommandError(f"Arquivo não encontrado: {arquivo}")

        if not arquivo.endswith(".xlsx"):
            raise CommandError("O arquivo deve estar em formato .xlsx")

        try:
            # Ler arquivo Excel
            self.stdout.write(f"Lendo arquivo: {arquivo}")
            df = pd.read_excel(arquivo, sheet_name=sheet_name)

            # Limpar linhas vazias
            df = df.dropna(how="all")

            # Encontrar linha de cabeçalho
            header_row = None
            for idx, row in df.iterrows():
                if "NOME COMPLETO" in str(row.values):
                    header_row = idx
                    break

            if header_row is None:
                raise CommandError('Cabeçalho não encontrado. Procure por "NOME COMPLETO"')

            # Usar linha como cabeçalho
            df = pd.read_excel(arquivo, sheet_name=sheet_name, header=header_row)

            # Limpar espaços em branco nos nomes das colunas
            df.columns = df.columns.str.strip()

            # Validar colunas obrigatórias
            colunas_obrigatorias = [
                "NOME COMPLETO",
                "CARGO",
                "SETOR",
                "SUBSETOR",
                "E-MAIL @FAURG"
            ]
            colunas_faltantes = [
                col for col in colunas_obrigatorias if col not in df.columns
            ]

            if colunas_faltantes:
                raise CommandError(f"Colunas faltantes: {', '.join(colunas_faltantes)}")

            self.stdout.write(self.style.SUCCESS("✓ Arquivo lido com sucesso"))
            self.stdout.write(f"Total de registros: {len(df)}")

            # Obter perfil padrão (Aprendiz)
            try:
                perfil_padrao = Perfil.objects.get(nome="Aprendiz")
            except Perfil.DoesNotExist:
                raise CommandError('Perfil "Aprendiz" não encontrado. Crie primeiro.')

            # Processar usuários
            usuarios_criados = 0
            usuarios_atualizados = 0
            erros = []

            with transaction.atomic():
                for idx, row in df.iterrows():
                    try:
                        # Extrair dados
                        nome_completo = str(row["NOME COMPLETO"]).strip()
                        cargo = str(row["CARGO"]).strip()
                        setor_nome = str(row["SETOR"]).strip()
                        subsetor_nome = str(row["SUBSETOR"]).strip()
                        email = str(row["E-MAIL @FAURG"]).strip().lower()

                        # Validar dados
                        if not nome_completo or nome_completo == "nan":
                            erros.append(f"Linha {idx + 2}: Nome completo vazio")
                            continue

                        if not email or email == "nan" or "@" not in email:
                            erros.append(f"Linha {idx + 2}: Email inválido: {email}")
                            continue

                        if not cargo or cargo == "nan":
                            erros.append(f"Linha {idx + 2}: Cargo vazio")
                            continue

                        # Buscar setor
                        try:
                            setor = Setor.objects.get(nome=setor_nome)
                        except Setor.DoesNotExist:
                            erros.append(
                                f"Linha {idx + 2}: Setor não encontrado: {setor_nome}"
                            )
                            continue

                        # Buscar sub-setor
                        try:
                            subsetor = SubSetor.objects.get(
                                setor=setor, nome=subsetor_nome
                            )
                        except SubSetor.DoesNotExist:
                            erros.append(
                                f"Linha {idx + 2}: Sub-setor não encontrado: {subsetor_nome} em {setor_nome}"
                            )
                            continue

                        # Separar nome e sobrenome
                        partes_nome = nome_completo.split()
                        if len(partes_nome) >= 2:
                            first_name = partes_nome[0]
                            last_name = " ".join(partes_nome[1:])
                        else:
                            first_name = nome_completo
                            last_name = ""

                        # Gerar username a partir do email
                        username = email.split("@")[0]

                        # Verificar se usuário já existe
                        usuario_existente = User.objects.filter(email=email).first()

                        if usuario_existente:
                            # Atualizar usuário existente
                            usuario_existente.first_name = first_name
                            usuario_existente.last_name = last_name
                            usuario_existente.cargo = cargo
                            usuario_existente.setor = setor
                            usuario_existente.subsetor = subsetor

                            if not dry_run:
                                usuario_existente.save()

                            usuarios_atualizados += 1
                            self.stdout.write(f"  ↻ Atualizado: {email}")

                        else:
                            # Criar novo usuário
                            usuario = User(
                                email=email,
                                username=username,
                                first_name=first_name,
                                last_name=last_name,
                                cargo=cargo,
                                setor=setor,
                                subsetor=subsetor,
                                perfil=perfil_padrao,
                                is_active=True,
                            )

                            # Gerar senha aleatória
                            senha_temporaria = User.objects.make_random_password(
                                length=12
                            )
                            usuario.set_password(senha_temporaria)

                            if not dry_run:
                                usuario.save()

                            usuarios_criados += 1
                            self.stdout.write(f"  ✓ Criado: {email}")

                    except Exception as e:
                        erros.append(f"Linha {idx + 2}: {str(e)}")
                        if not skip_errors:
                            raise

            # Relatório final
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("RELATÓRIO DE IMPORTAÇÃO"))
            self.stdout.write("=" * 60)

            if dry_run:
                self.stdout.write(
                    self.style.WARNING("⚠ MODO DRY-RUN (nenhuma alteração foi salva)")
                )

            self.stdout.write(
                f"Usuários criados: {self.style.SUCCESS(str(usuarios_criados))}"
            )
            self.stdout.write(
                f"Usuários atualizados: {self.style.SUCCESS(str(usuarios_atualizados))}"
            )
            self.stdout.write(f"Total processado: {usuarios_criados + usuarios_atualizados}")

            if erros:
                self.stdout.write(
                    f"\n{self.style.ERROR(f'Erros encontrados: {len(erros)}')}"
                )
                for erro in erros[:10]:  # Mostrar apenas os 10 primeiros erros
                    self.stdout.write(f"  ✗ {erro}")
                if len(erros) > 10:
                    self.stdout.write(f"  ... e mais {len(erros) - 10} erros")

            self.stdout.write("=" * 60)

            if usuarios_criados + usuarios_atualizados > 0:
                self.stdout.write(self.style.SUCCESS("✓ Importação concluída com sucesso!"))
            else:
                self.stdout.write(self.style.WARNING("⚠ Nenhum usuário foi importado"))

        except pd.errors.ParserError as e:
            raise CommandError(f"Erro ao ler arquivo Excel: {str(e)}")
        except Exception as e:
            raise CommandError(f"Erro durante importação: {str(e)}")
