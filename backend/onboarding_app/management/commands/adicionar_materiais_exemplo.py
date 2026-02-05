"""
Comando Django para adicionar materiais de exemplo em todas as trilhas existentes.
"""
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from onboarding_app.models import (
    Trilha, Modulo, Atividade, 
    MaterialVideo, MaterialPDF, MaterialLeitura, 
    Quiz, Questao, QuizQuestao
)

class Command(BaseCommand):
    help = 'Adiciona materiais de exemplo em todas as trilhas existentes'

    # Dados de exemplo para cada tipo de material
    MATERIAL_EXAMPLES = {
        'video': {
            'titulo': 'Vídeo Exemplo',
            'descricao': 'Um exemplo de vídeo educacional para demonstrar o recurso de vídeos',
            'url': 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            'duracao': 3.33,
        },
        'pdf': {
            'titulo': 'PDF Exemplo',
            'descricao': 'Um exemplo de documento PDF para demonstrar o recurso de PDFs',
            'nome_arquivo': 'pdf_exemplo.pdf',
        },
        'leitura': {
            'titulo': 'Leitura Exemplo',
            'descricao': 'Um exemplo de material de leitura',
            'conteudo': '''Lorem Ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Benefícios da Leitura:
• Melhora a compreensão e interpretação
• Expande o vocabulário
• Estimula a criatividade
• Reduz o estresse
• Melhora a memória

Conclusão:
A leitura é uma das atividades mais importantes para o desenvolvimento intelectual e emocional. Recomenda-se a leitura regular como parte da educação contínua.''',
        },
        'quiz': {
            'titulo': 'Quiz Exemplo',
            'descricao': 'Um exemplo de quiz para avaliar conhecimento',
            'questoes': [
                {
                    'enunciado': 'Qual é a importância da educação continuada?',
                    'alternativa_a': 'Não é importante',
                    'alternativa_b': 'Desenvolver habilidades e conhecimentos',
                    'alternativa_c': 'Apenas para preencher tempo',
                    'alternativa_d': 'Perder tempo com aulas',
                    'gabarito': 'B',
                    'feedback': 'Correto! A educação continuada é fundamental para o desenvolvimento profissional e pessoal.',
                },
                {
                    'enunciado': 'Qual é o primeiro passo para aprender algo novo?',
                    'alternativa_a': 'Desistir imediatamente',
                    'alternativa_b': 'Ter disposição e curiosidade',
                    'alternativa_c': 'Criticar tudo que aprende',
                    'alternativa_d': 'Ignorar os materiais',
                    'gabarito': 'B',
                    'feedback': 'Exato! A disposição e curiosidade são essenciais para o aprendizado.',
                },
            ]
        },
        'exercicio': {
            'titulo': 'Exercício Exemplo',
            'descricao': 'Um exemplo de atividade prática',
            'conteudo': '''Exercício Prático: Responda as questões abaixo

1. O que você aprendeu nesta trilha?
2. Como você pode aplicar este conhecimento em seu trabalho?
3. Quais são os três pontos principais que você retém?

Instruções:
- Responda cada questão com pelo menos 3 linhas
- Seja específico e detalhado
- Revise sua resposta antes de enviar''',
        },
        'apresentacao': {
            'titulo': 'Apresentação Exemplo',
            'descricao': 'Um exemplo de material em formato de apresentação',
            'url': 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMwSKhBBaKZrdYaFv50lul2_mZAmJI4/edit',
        }
    }

    def criar_material_video(self, modulo, ordem):
        """Criar uma atividade com material de vídeo"""
        try:
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=self.MATERIAL_EXAMPLES['video']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['video']['descricao'],
                ordem=ordem,
                nota_minima=0,
                limite_tentativas=None,
                limite_tempo_minutos=None,
            )
            
            MaterialVideo.objects.create(
                id_atividade=atividade,
                titulo=self.MATERIAL_EXAMPLES['video']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['video']['descricao'],
                url=self.MATERIAL_EXAMPLES['video']['url'],
                duracao=self.MATERIAL_EXAMPLES['video']['duracao'],
            )
            
            return True
        except Exception as e:
            self.stdout.write(f"   ❌ Erro ao criar vídeo: {str(e)}")
            return False

    def criar_material_pdf(self, modulo, ordem):
        """Criar uma atividade com material PDF"""
        try:
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=self.MATERIAL_EXAMPLES['pdf']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['pdf']['descricao'],
                ordem=ordem,
                nota_minima=0,
                limite_tentativas=None,
                limite_tempo_minutos=None,
            )
            
            # Criar um arquivo PDF vazio como exemplo
            pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(PDF Exemplo) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000273 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n369\n%%EOF'
            
            pdf_file = ContentFile(pdf_content, name='pdf_exemplo.pdf')
            
            MaterialPDF.objects.create(
                id_atividade=atividade,
                titulo=self.MATERIAL_EXAMPLES['pdf']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['pdf']['descricao'],
                arquivo=pdf_file,
            )
            
            return True
        except Exception as e:
            self.stdout.write(f"   ❌ Erro ao criar PDF: {str(e)}")
            return False

    def criar_material_leitura(self, modulo, ordem):
        """Criar uma atividade com material de leitura"""
        try:
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=self.MATERIAL_EXAMPLES['leitura']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['leitura']['descricao'],
                ordem=ordem,
                nota_minima=0,
                limite_tentativas=None,
                limite_tempo_minutos=None,
            )
            
            MaterialLeitura.objects.create(
                id_atividade=atividade,
                titulo=self.MATERIAL_EXAMPLES['leitura']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['leitura']['descricao'],
                conteudo=self.MATERIAL_EXAMPLES['leitura']['conteudo'],
            )
            
            return True
        except Exception as e:
            self.stdout.write(f"   ❌ Erro ao criar leitura: {str(e)}")
            return False

    def criar_material_quiz(self, modulo, ordem):
        """Criar uma atividade com quiz"""
        try:
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=self.MATERIAL_EXAMPLES['quiz']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['quiz']['descricao'],
                ordem=ordem,
                nota_minima=70.0,
                limite_tentativas=3,
                limite_tempo_minutos=15,
            )
            
            quiz = Quiz.objects.create(
                id_atividade=atividade,
                titulo=self.MATERIAL_EXAMPLES['quiz']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['quiz']['descricao'],
                porcentagem_minima_aprovacao=70.0,
                tempo_limite_minutos=15,
                tentativas_permitidas=3,
                randomizar_questoes=True,
                randomizar_alternativas=True,
                mostrar_feedback=True,
                mostrar_gabarito=True,
            )
            
            # Adicionar questões ao quiz
            for idx, questao_data in enumerate(self.MATERIAL_EXAMPLES['quiz']['questoes'], 1):
                questao = Questao.objects.create(
                    enunciado=questao_data['enunciado'],
                    alternativa_a=questao_data['alternativa_a'],
                    alternativa_b=questao_data['alternativa_b'],
                    alternativa_c=questao_data['alternativa_c'],
                    alternativa_d=questao_data['alternativa_d'],
                    gabarito=questao_data['gabarito'],
                    feedback=questao_data['feedback'],
                    ativo=True,
                )
                
                QuizQuestao.objects.create(
                    id_quiz=quiz,
                    id_questao=questao,
                    ordem=idx,
                )
            
            return True
        except Exception as e:
            self.stdout.write(f"   ❌ Erro ao criar quiz: {str(e)}")
            return False

    def criar_material_exercicio(self, modulo, ordem):
        """Criar uma atividade de exercício (como leitura)"""
        try:
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=self.MATERIAL_EXAMPLES['exercicio']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['exercicio']['descricao'],
                ordem=ordem,
                nota_minima=0,
                limite_tentativas=None,
                limite_tempo_minutos=None,
            )
            
            MaterialLeitura.objects.create(
                id_atividade=atividade,
                titulo=self.MATERIAL_EXAMPLES['exercicio']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['exercicio']['descricao'],
                conteudo=self.MATERIAL_EXAMPLES['exercicio']['conteudo'],
            )
            
            return True
        except Exception as e:
            self.stdout.write(f"   ❌ Erro ao criar exercício: {str(e)}")
            return False

    def criar_material_apresentacao(self, modulo, ordem):
        """Criar uma atividade com material de apresentação"""
        try:
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=self.MATERIAL_EXAMPLES['apresentacao']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['apresentacao']['descricao'],
                ordem=ordem,
                nota_minima=0,
                limite_tentativas=None,
                limite_tempo_minutos=None,
            )
            
            MaterialVideo.objects.create(
                id_atividade=atividade,
                titulo=self.MATERIAL_EXAMPLES['apresentacao']['titulo'],
                descricao=self.MATERIAL_EXAMPLES['apresentacao']['descricao'],
                url=self.MATERIAL_EXAMPLES['apresentacao']['url'],
                duracao=None,
            )
            
            return True
        except Exception as e:
            self.stdout.write(f"   ❌ Erro ao criar apresentação: {str(e)}")
            return False

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("📚 ADICIONANDO MATERIAIS DE EXEMPLO EM TODAS AS TRILHAS"))
        self.stdout.write("=" * 80)
        self.stdout.write("")

        trilhas = Trilha.objects.all()

        if not trilhas.exists():
            self.stdout.write(self.style.ERROR("❌ Nenhuma trilha encontrada no banco de dados!"))
            self.stdout.write("=" * 80)
            return

        total_trilhas = trilhas.count()
        trilhas_processadas = 0
        materiais_adicionados = 0

        for trilha in trilhas:
            self.stdout.write(f"📚 Trilha: {trilha.titulo} (ID: {trilha.id_trilha})")
            
            # Buscar ou criar primeiro módulo
            modulos = trilha.modulos.all()
            
            if not modulos.exists():
                # Criar um módulo padrão se não existir
                modulo = Modulo.objects.create(
                    id_trilha=trilha,
                    titulo=f"Módulo Exemplo - {trilha.titulo}",
                    descricao="Módulo com materiais de exemplo",
                    ordem=1,
                )
                self.stdout.write(f"   ✅ Módulo criado: {modulo.titulo}")
            else:
                modulo = modulos.first()
                self.stdout.write(f"   📌 Usando módulo: {modulo.titulo}")
            
            # Adicionar materiais
            tipos_material = ['video', 'pdf', 'leitura', 'quiz', 'exercicio', 'apresentacao']
            funcoes_criar = {
                'video': self.criar_material_video,
                'pdf': self.criar_material_pdf,
                'leitura': self.criar_material_leitura,
                'quiz': self.criar_material_quiz,
                'exercicio': self.criar_material_exercicio,
                'apresentacao': self.criar_material_apresentacao,
            }
            
            for ordem, tipo in enumerate(tipos_material, 1):
                self.stdout.write(f"   ➕ Adicionando {tipo}...", ending=" ")
                if funcoes_criar[tipo](modulo, ordem):
                    self.stdout.write(self.style.SUCCESS("✅"))
                    materiais_adicionados += 1
                else:
                    self.stdout.write(self.style.ERROR("❌"))
            
            trilhas_processadas += 1
            self.stdout.write("")

        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("✅ PROCESSO CONCLUÍDO!"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("📊 RESUMO:"))
        self.stdout.write(self.style.SUCCESS(f"   • Trilhas processadas: {trilhas_processadas}/{total_trilhas}"))
        self.stdout.write(self.style.SUCCESS(f"   • Materiais adicionados: {materiais_adicionados}"))
        self.stdout.write(self.style.SUCCESS(f"   • Total de atividades esperadas: {total_trilhas * 6}"))
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("🎉 Todos os materiais de exemplo foram adicionados com sucesso!"))
        self.stdout.write("=" * 80)
