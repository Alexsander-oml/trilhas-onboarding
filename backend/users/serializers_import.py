"""
Serializers para importação de usuários do Excel.
"""

from rest_framework import serializers
from .models import User, Setor, SubSetor, Perfil
import pandas as pd
from django.db import transaction


class UsuarioImportacaoSerializer(serializers.Serializer):
    """
    Serializer para validar dados de um usuário durante importação.
    """
    nome_completo = serializers.CharField(max_length=300, required=True)
    cargo = serializers.CharField(max_length=100, required=True)
    setor = serializers.CharField(max_length=100, required=True)
    subsetor = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Valida se o email é único."""
        value = value.lower().strip()
        if User.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("Este email já está registrado.")
        return value

    def validate_setor(self, value):
        """Valida se o setor existe."""
        value = value.strip()
        if not Setor.objects.filter(nome=value, ativo=True).exists():
            raise serializers.ValidationError(f"Setor não encontrado: {value}")
        return value

    def validate_subsetor(self, value):
        """Valida se o sub-setor existe."""
        value = value.strip()
        if not SubSetor.objects.filter(nome=value, ativo=True).exists():
            raise serializers.ValidationError(f"Sub-setor não encontrado: {value}")
        return value

    def validate(self, data):
        """Valida se o sub-setor pertence ao setor selecionado."""
        setor_nome = data.get('setor', '').strip()
        subsetor_nome = data.get('subsetor', '').strip()

        try:
            setor = Setor.objects.get(nome=setor_nome, ativo=True)
            subsetor = SubSetor.objects.get(setor=setor, nome=subsetor_nome, ativo=True)
        except Setor.DoesNotExist:
            raise serializers.ValidationError(f"Setor não encontrado: {setor_nome}")
        except SubSetor.DoesNotExist:
            raise serializers.ValidationError(
                f"Sub-setor '{subsetor_nome}' não encontrado em '{setor_nome}'"
            )

        data['setor_obj'] = setor
        data['subsetor_obj'] = subsetor

        return data


class ArquivoImportacaoSerializer(serializers.Serializer):
    """
    Serializer para validar arquivo de importação.
    """
    arquivo = serializers.FileField(required=True)
    sheet_name = serializers.CharField(max_length=100, required=False, default='CADASTROS')
    skip_errors = serializers.BooleanField(required=False, default=False)
    dry_run = serializers.BooleanField(required=False, default=False)

    def validate_arquivo(self, value):
        """Valida se o arquivo é um Excel válido."""
        if not value.name.endswith('.xlsx'):
            raise serializers.ValidationError("O arquivo deve estar em formato .xlsx")

        try:
            # Tentar ler o arquivo
            df = pd.read_excel(value)
            if df.empty:
                raise serializers.ValidationError("O arquivo está vazio")
        except Exception as e:
            raise serializers.ValidationError(f"Erro ao ler arquivo: {str(e)}")

        return value

    def processar_importacao(self):
        """Processa a importação de usuários."""
        arquivo = self.validated_data['arquivo']
        sheet_name = self.validated_data.get('sheet_name', 'CADASTROS')
        skip_errors = self.validated_data.get('skip_errors', False)
        dry_run = self.validated_data.get('dry_run', False)

        try:
            # Ler arquivo
            df = pd.read_excel(arquivo, sheet_name=sheet_name)

            # Limpar linhas vazias
            df = df.dropna(how='all')

            # Encontrar linha de cabeçalho
            header_row = None
            for idx, row in df.iterrows():
                if 'NOME COMPLETO' in str(row.values):
                    header_row = idx
                    break

            if header_row is None:
                raise ValueError('Cabeçalho não encontrado. Procure por "NOME COMPLETO"')

            # Usar linha como cabeçalho
            df = pd.read_excel(arquivo, sheet_name=sheet_name, header=header_row)

            # Limpar espaços em branco nos nomes das colunas
            df.columns = df.columns.str.strip()

            # Validar colunas obrigatórias
            colunas_obrigatorias = ['NOME COMPLETO', 'CARGO', 'SETOR', 'SUBSETOR', 'E-MAIL @FAURG']
            colunas_faltantes = [col for col in colunas_obrigatorias if col not in df.columns]

            if colunas_faltantes:
                raise ValueError(f'Colunas faltantes: {", ".join(colunas_faltantes)}')

            # Obter perfil padrão
            try:
                perfil_padrao = Perfil.objects.get(nome='Aprendiz')
            except Perfil.DoesNotExist:
                raise ValueError('Perfil "Aprendiz" não encontrado')

            # Processar usuários
            usuarios_criados = 0
            usuarios_atualizados = 0
            erros = []
            usuarios_processados = []

            with transaction.atomic():
                for idx, row in df.iterrows():
                    try:
                        # Extrair dados
                        nome_completo = str(row['NOME COMPLETO']).strip()
                        cargo = str(row['CARGO']).strip()
                        setor_nome = str(row['SETOR']).strip()
                        subsetor_nome = str(row['SUBSETOR']).strip()
                        email = str(row['E-MAIL @FAURG']).strip().lower()

                        # Validar dados
                        if not nome_completo or nome_completo == 'nan':
                            erros.append({
                                'linha': idx + 2,
                                'email': email,
                                'erro': 'Nome completo vazio'
                            })
                            continue

                        if not email or email == 'nan' or '@' not in email:
                            erros.append({
                                'linha': idx + 2,
                                'email': email,
                                'erro': f'Email inválido: {email}'
                            })
                            continue

                        if not cargo or cargo == 'nan':
                            erros.append({
                                'linha': idx + 2,
                                'email': email,
                                'erro': 'Cargo vazio'
                            })
                            continue

                        # Buscar setor
                        try:
                            setor = Setor.objects.get(nome=setor_nome, ativo=True)
                        except Setor.DoesNotExist:
                            erros.append({
                                'linha': idx + 2,
                                'email': email,
                                'erro': f'Setor não encontrado: {setor_nome}'
                            })
                            continue

                        # Buscar sub-setor
                        try:
                            subsetor = SubSetor.objects.get(setor=setor, nome=subsetor_nome, ativo=True)
                        except SubSetor.DoesNotExist:
                            erros.append({
                                'linha': idx + 2,
                                'email': email,
                                'erro': f'Sub-setor não encontrado: {subsetor_nome} em {setor_nome}'
                            })
                            continue

                        # Separar nome e sobrenome
                        partes_nome = nome_completo.split()
                        if len(partes_nome) >= 2:
                            first_name = partes_nome[0]
                            last_name = ' '.join(partes_nome[1:])
                        else:
                            first_name = nome_completo
                            last_name = ''

                        # Gerar username
                        username = email.split('@')[0]

                        # Verificar se usuário já existe
                        usuario_existente = User.objects.filter(email=email).first()

                        if usuario_existente:
                            # Atualizar
                            usuario_existente.first_name = first_name
                            usuario_existente.last_name = last_name
                            usuario_existente.cargo = cargo
                            usuario_existente.setor = setor
                            usuario_existente.subsetor = subsetor

                            if not dry_run:
                                usuario_existente.save()

                            usuarios_atualizados += 1
                            usuarios_processados.append({
                                'email': email,
                                'nome': nome_completo,
                                'acao': 'atualizado'
                            })

                        else:
                            # Criar novo
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
                            senha_temporaria = User.objects.make_random_password(length=12)
                            usuario.set_password(senha_temporaria)

                            if not dry_run:
                                usuario.save()

                            usuarios_criados += 1
                            usuarios_processados.append({
                                'email': email,
                                'nome': nome_completo,
                                'acao': 'criado'
                            })

                    except Exception as e:
                        if not skip_errors:
                            raise
                        erros.append({
                            'linha': idx + 2,
                            'email': email if 'email' in locals() else 'desconhecido',
                            'erro': str(e)
                        })

            return {
                'sucesso': True,
                'usuarios_criados': usuarios_criados,
                'usuarios_atualizados': usuarios_atualizados,
                'total_processado': usuarios_criados + usuarios_atualizados,
                'erros': erros,
                'usuarios_processados': usuarios_processados,
                'dry_run': dry_run,
            }

        except Exception as e:
            return {
                'sucesso': False,
                'erro': str(e),
            }
