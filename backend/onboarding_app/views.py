from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Q

from .models import (
    Trilha, Matricula, Modulo, Atividade, Progresso,
    MaterialVideo, MaterialPDF, MaterialLeitura,
    Tag, Area, Cargo, Unidade, Competencia,
    Questao, Quiz, QuizQuestao, TentativaQuiz, RespostaQuestao, Certificado
)
from .serializers import (
    TrilhaSerializer, MatriculaSerializer, ModuloSerializer, 
    AtividadeSerializer, ProgressoSerializer,
    MaterialVideoSerializer, MaterialPDFSerializer, MaterialLeituraSerializer,
    TrilhaSearchSerializer, TagSerializer, AreaSerializer, 
    CargoSerializer, UnidadeSerializer, CompetenciaSerializer,
    QuestaoSerializer, QuestaoSearchSerializer, QuestaoParaTentativaSerializer,
    QuizSerializer, QuizParaTentativaSerializer,
    TentativaQuizSerializer, TentativaQuizDetalhadaSerializer,
    RespostaQuestaoSerializer, IniciarTentativaSerializer, ResponderQuestaoSerializer
)
from users.permissions import IsAdminOrGestor, IsAdminOrGestorOrAutor
from users.models import User


# ==================== VIEWS DE TRILHA ====================

class TrilhaCreateView(generics.CreateAPIView):
    def perform_create(self, serializer):
        trilha = serializer.save(criado_por=self.request.user)
        
        # Inscrever automaticamente o criador da trilha (admin/gestor/autor)
        self._auto_enroll_creator(trilha)
        
        # Criar atividades automaticamente para materiais do tipo quiz
        self._create_activities_for_materials(trilha)
    
    def _auto_enroll_creator(self, trilha):
        """Inscreve automaticamente o admin/gestor/autor que criou a trilha"""
        try:
            user = self.request.user
            perfil = getattr(user, 'perfil', None)
            
            if perfil:
                perfil_tipo = getattr(perfil, 'tipo_usuario', None) or getattr(perfil, 'nome', '')
                
                # Inscrever apenas se for admin, gestor ou autor
                if perfil_tipo in ['Administrador', 'Gestor', 'Autor de Conteúdo']:
                    # Verificar se já existe matrícula
                    matricula_existente = Matricula.objects.filter(
                        id_usuario=user,
                        id_trilha=trilha
                    ).first()
                    
                    if not matricula_existente:
                        Matricula.objects.create(
                            id_usuario=user,
                            id_trilha=trilha,
                            status='EmAndamento',
                            data_inicio=timezone.now()
                        )
                        print(f"✅ {perfil_tipo} {user.email} inscrito automaticamente na trilha '{trilha.titulo}'")
                    else:
                        print(f"ℹ️ {perfil_tipo} {user.email} já estava inscrito na trilha '{trilha.titulo}'")
        except Exception as e:
            print(f"⚠️ Erro ao inscrever criador automaticamente: {e}")
            # Não falhar a criação da trilha se houver erro na inscrição
    
    def _create_activities_for_materials(self, trilha):
        """Cria automaticamente atividades para materiais de quiz que nÃ£o possuem id_atividade"""
        import json
        from .models import Atividade, Modulo
        
        if not trilha.changelog:
            return
        
        try:
            changelog = json.loads(trilha.changelog) if isinstance(trilha.changelog, str) else trilha.changelog
            modules = changelog.get('modules', [])
            
            for mod_idx, module_data in enumerate(modules):
                # Buscar mÃ³dulo real no banco
                modulos = Modulo.objects.filter(id_trilha=trilha).order_by('id_modulo')
                if mod_idx < len(modulos):
                    modulo = modulos[mod_idx]
                    materials = module_data.get('materials', [])
                    
                    for mat_idx, material in enumerate(materials):
                        # Criar atividade apenas para quizzes sem id_atividade
                        if material.get('type') == 'quiz' and not material.get('id_atividade'):
                            atividade = Atividade.objects.create(
                                id_modulo=modulo,
                                tipo_atividade='quiz',
                                titulo=material.get('name', f'Quiz {mat_idx + 1}'),
                                descricao=material.get('description', ''),
                                obrigatorio=material.get('required', True),
                                ordem=mat_idx + 1
                            )
                            # Atualizar material com id_atividade
                            material['id_atividade'] = atividade.id_atividade
                            
                            # Criar questÃµes do quiz
                            questions = material.get('questions', [])
                            for q_idx, question in enumerate(questions):
                                from .models import Questao
                                Questao.objects.create(
                                    id_atividade=atividade,
                                    texto_questao=question.get('question', ''),
                                    tipo_questao='multipla_escolha',
                                    opcoes=json.dumps(question.get('options', [])),
                                    resposta_correta=question.get('correct', 0),
                                    ordem=q_idx + 1
                                )
            
            # Salvar changelog atualizado
            trilha.changelog = json.dumps(changelog)
            trilha.save(update_fields=['changelog'])
            
        except Exception as e:
            print(f"Erro ao criar atividades automaticamente: {e}")
    
    queryset = Trilha.objects.all()
    serializer_class = TrilhaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]


class TrilhaUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Trilha.objects.prefetch_related(
        'modulos', 
        'tags', 
        'areas', 
        'cargos', 
        'unidades', 
        'competencias'
    ).all()
    serializer_class = TrilhaSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id_trilha"
    
    def get_permissions(self):
        """
        Permite GET para todos os usuÃ¡rios autenticados.
        Requer IsAdminOrGestorOrAutor para PUT, PATCH, DELETE.
        """
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrGestorOrAutor()]
    
    def perform_update(self, serializer):
        trilha = serializer.save()
        # Criar atividades automaticamente para materiais do tipo quiz
        self._create_activities_for_materials(trilha)
    
    def _create_activities_for_materials(self, trilha):
        """Cria automaticamente atividades para materiais de quiz que nÃ£o possuem id_atividade"""
        import json
        from .models import Atividade, Modulo, Questao
        
        if not trilha.changelog:
            return
        
        try:
            changelog = json.loads(trilha.changelog) if isinstance(trilha.changelog, str) else trilha.changelog
            modules = changelog.get('modules', [])
            
            for mod_idx, module_data in enumerate(modules):
                # Buscar mÃ³dulo real no banco
                modulos = Modulo.objects.filter(id_trilha=trilha).order_by('id_modulo')
                if mod_idx < len(modulos):
                    modulo = modulos[mod_idx]
                    materials = module_data.get('materials', [])
                    
                    for mat_idx, material in enumerate(materials):
                        # Criar atividade apenas para quizzes sem id_atividade
                        if material.get('type') == 'quiz' and not material.get('id_atividade'):
                            atividade = Atividade.objects.create(
                                id_modulo=modulo,
                                tipo_atividade='quiz',
                                titulo=material.get('name', f'Quiz {mat_idx + 1}'),
                                descricao=material.get('description', ''),
                                obrigatorio=material.get('required', True),
                                ordem=mat_idx + 1
                            )
                            # Atualizar material com id_atividade
                            material['id_atividade'] = atividade.id_atividade
                            
                            # Criar questÃµes do quiz
                            questions = material.get('questions', [])
                            for q_idx, question in enumerate(questions):
                                Questao.objects.create(
                                    id_atividade=atividade,
                                    texto_questao=question.get('question', ''),
                                    tipo_questao='multipla_escolha',
                                    opcoes=json.dumps(question.get('options', [])),
                                    resposta_correta=question.get('correct', 0),
                                    ordem=q_idx + 1
                                )
            
            # Salvar changelog atualizado
            trilha.changelog = json.dumps(changelog)
            trilha.save(update_fields=['changelog'])
            
        except Exception as e:
            print(f"Erro ao criar atividades automaticamente: {e}")


class TrilhaSearchView(APIView):
    """
    View para pesquisa de trilhas com filtros avanÃ§ados.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Verificar se usuÃ¡rio tem perfil
        try:
            perfil_nome = user.perfil.nome if hasattr(user, 'perfil') and user.perfil else None
        except:
            perfil_nome = None
        
        # Se nÃ£o tem perfil OU Ã© Administrador/Gestor/Autor, mostra todas as trilhas
        if not perfil_nome or perfil_nome in ["Administrador", "Gestor", "Autor de ConteÃºdo"]:
            queryset = Trilha.objects.all()
        elif perfil_nome == "Aprendiz":
            # Aprendiz vÃª trilhas publicadas (status "Publicada")
            # Removido filtro restritivo que mostrava apenas matriculadas
            queryset = Trilha.objects.filter(
                status="Publicada"
            )
        else:
            # Fallback: mostrar todas
            queryset = Trilha.objects.all()
        
        keyword = request.query_params.get('q', None)
        if keyword:
            queryset = queryset.filter(
                Q(titulo__icontains=keyword) |
                Q(descricao__icontains=keyword) |
                Q(objetivos__icontains=keyword)
            )
        
        tags_param = request.query_params.get('tags', None)
        if tags_param:
            tag_ids = [int(id.strip()) for id in tags_param.split(',') if id.strip().isdigit()]
            if tag_ids:
                queryset = queryset.filter(tags__id_tag__in=tag_ids).distinct()
        
        area_id = request.query_params.get('area', None)
        if area_id:
            queryset = queryset.filter(areas__id_area=area_id)
        
        cargo_id = request.query_params.get('cargo', None)
        if cargo_id:
            queryset = queryset.filter(cargos__id_cargo=cargo_id)
        
        unidade_id = request.query_params.get('unidade', None)
        if unidade_id:
            queryset = queryset.filter(unidades__id_unidade=unidade_id)
        
        competencia_id = request.query_params.get('competencia', None)
        if competencia_id:
            queryset = queryset.filter(competencias__id_competencia=competencia_id)
        
        status_param = request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Otimizar query com prefetch para incluir mÃ³dulos
        queryset = queryset.prefetch_related(
            'modulos'
        ).distinct().order_by('-id_trilha')
        serializer = TrilhaSearchSerializer(queryset, many=True)
        
        return Response({
            "perfil": perfil_nome or "Sem perfil",
            "total": queryset.count(),
            "trilhas": serializer.data
        })


# ==================== TRILHA DETALHADA (COM MATERIAIS) ====================

class TrilhaDetalhadaView(APIView):
    """Retorna a trilha com mÃ³dulos e materiais agregados das atividades.

    MantÃ©m os campos do `TrilhaSerializer`, porÃ©m monta `modules` com uma
    lista de materiais por mÃ³dulo a partir das atividades relacionadas.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id_trilha):
        try:
            # Prefetch focado apenas para esta view detalhada
            trilha = (
                Trilha.objects
                .filter(id_trilha=id_trilha)
                .prefetch_related(
                    'modulos',
                    'tags', 'areas', 'cargos', 'unidades', 'competencias',
                    'modulos__atividades',
                    'modulos__atividades__material_video',
                    'modulos__atividades__material_pdf',
                    'modulos__atividades__material_leitura',
                    'modulos__atividades__quiz',
                )
                .first()
            )

            if not trilha:
                return Response({"detail": "Trilha nÃ£o encontrada."}, status=status.HTTP_404_NOT_FOUND)

            # Base com serializer padrÃ£o
            base_data = TrilhaSerializer(trilha, context={'request': request}).data

            # Montar modules com materiais a partir das atividades
            modules_data = []
            for modulo in trilha.modulos.all().order_by('ordem'):
                materiais = []
                for atividade in modulo.atividades.all().order_by('ordem'):
                    # Passar o contexto com request para construir URLs absolutas
                    atividade_serializer = AtividadeSerializer(context={'request': request})
                    mat = atividade_serializer.get_material(atividade)
                    if mat:
                        materiais.append(mat)

                modules_data.append({
                    'id': getattr(modulo, 'id_modulo', None),
                    'id_modulo': getattr(modulo, 'id_modulo', None),
                    'name': getattr(modulo, 'titulo', '') or '',
                    'titulo': getattr(modulo, 'titulo', '') or '',
                    'description': getattr(modulo, 'descricao', '') or '',
                    'descricao': getattr(modulo, 'descricao', '') or '',
                    'order': getattr(modulo, 'ordem', 0),
                    'ordem': getattr(modulo, 'ordem', 0),
                    'materials': materiais,
                })

            base_data['modules'] = modules_data
            base_data['total_modulos'] = len(modules_data)

            return Response(base_data)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== INICIALIZAR PROGRESSO DA TRILHA ====================

class InitializeTrailProgressView(APIView):
    """
    POST /api/trails/{id_trilha}/progress/initialize/
    
    Cria uma matrÃ­cula (inscriÃ§Ã£o) do usuÃ¡rio autenticado em uma trilha.
    Retorna os dados da matrÃ­cula criada ou jÃ¡ existente.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id_trilha):
        try:
            # Obter a trilha
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            
            # Verificar se usuÃ¡rio jÃ¡ estÃ¡ matriculado
            matricula_existente = Matricula.objects.filter(
                id_usuario=request.user,
                id_trilha=trilha
            ).first()
            
            if matricula_existente:
                # JÃ¡ existe matrÃ­cula, retornar com status 200 (OK)
                serializer = MatriculaSerializer(matricula_existente)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # Criar nova matrÃ­cula
            matricula = Matricula.objects.create(
                id_usuario=request.user,
                id_trilha=trilha,
                status="EmAndamento",
                data_inicio=timezone.now()
            )
            
            serializer = MatriculaSerializer(matricula)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Trilha.DoesNotExist:
            return Response(
                {"detail": "Trilha nÃ£o encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== VIEWS DE FILTROS ====================

class TagListCreateView(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrGestorOrAutor()]
        return [IsAuthenticated()]


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    lookup_field = "id_tag"


class AreaListCreateView(generics.ListCreateAPIView):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrGestorOrAutor()]
        return [IsAuthenticated()]


class AreaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    lookup_field = "id_area"


class CargoListCreateView(generics.ListCreateAPIView):
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrGestorOrAutor()]
        return [IsAuthenticated()]


class CargoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    lookup_field = "id_cargo"


class UnidadeListCreateView(generics.ListCreateAPIView):
    queryset = Unidade.objects.all()
    serializer_class = UnidadeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrGestorOrAutor()]
        return [IsAuthenticated()]


class UnidadeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Unidade.objects.all()
    serializer_class = UnidadeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    lookup_field = "id_unidade"


class CompetenciaListCreateView(generics.ListCreateAPIView):
    queryset = Competencia.objects.all()
    serializer_class = CompetenciaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrGestorOrAutor()]
        return [IsAuthenticated()]


class CompetenciaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Competencia.objects.all()
    serializer_class = CompetenciaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    lookup_field = "id_competencia"


# ==================== VIEWS DE MÃ“DULO ====================

class ModuloCreateView(generics.CreateAPIView):
    queryset = Modulo.objects.all()
    serializer_class = ModuloSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]


class ModuloDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Modulo.objects.all()
    serializer_class = ModuloSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    lookup_field = "id_modulo"


# ==================== VIEWS DE ATIVIDADE ====================

class AtividadeCreateView(generics.CreateAPIView):
    queryset = Atividade.objects.all()
    serializer_class = AtividadeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]


class AtividadeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Atividade.objects.all()
    serializer_class = AtividadeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    lookup_field = "id_atividade"


class AtividadeToggleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id_atividade):
        try:
            atividade = Atividade.objects.get(id_atividade=id_atividade)
            
            # Verificar se o usuÃ¡rio estÃ¡ matriculado na trilha
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            try:
                matricula = Matricula.objects.get(
                    id_usuario=request.user,
                    id_trilha=trilha
                )
                if matricula.status == "Cancelada":
                    return Response({
                        "error": "Sua matrÃ­cula nesta trilha foi cancelada."
                    }, status=status.HTTP_403_FORBIDDEN)
            except Matricula.DoesNotExist:
                return Response({
                    "error": "VocÃª nÃ£o estÃ¡ matriculado nesta trilha."
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verificar se a atividade tem quiz
            try:
                quiz = atividade.quiz
                return Response({
                    "error": "Esta atividade possui um quiz. A conclusÃ£o Ã© determinada pela aprovaÃ§Ã£o no quiz."
                }, status=status.HTTP_400_BAD_REQUEST)
            except Quiz.DoesNotExist:
                pass
            
            progresso, created = Progresso.objects.get_or_create(
                id_usuario=request.user,
                id_atividade_id=id_atividade
            )
            
            if progresso.completed_at is None:
                progresso.completed_at = timezone.now()
                message = "Atividade marcada como concluÃ­da."
            else:
                progresso.completed_at = None
                message = "Atividade desmarcada."
            
            progresso.save()
            
            # Verificar e atualizar status da matrÃ­cula
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            try:
                matricula = Matricula.objects.get(
                    id_usuario=request.user,
                    id_trilha=trilha
                )
                matricula.atualizar_status()
            except Matricula.DoesNotExist:
                pass
            
            serializer = ProgressoSerializer(progresso)
            return Response({
                "message": message,
                "progresso": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Atividade.DoesNotExist:
            return Response({
                "error": "Atividade nÃ£o encontrada."
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== VIEWS DE MATRÃCULA ====================

class MatriculaCreateView(generics.CreateAPIView):
    queryset = Matricula.objects.all()
    serializer_class = MatriculaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor"]


# ==================== VIEWS DE MATERIAL ====================

class MaterialVideoCreateView(generics.CreateAPIView):
    queryset = MaterialVideo.objects.all()
    serializer_class = MaterialVideoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class MaterialVideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialVideo.objects.all()
    serializer_class = MaterialVideoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "id_material"


class MaterialPDFCreateView(generics.CreateAPIView):
    queryset = MaterialPDF.objects.all()
    serializer_class = MaterialPDFSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    parser_classes = [MultiPartParser, FormParser]


class MaterialPDFDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialPDF.objects.all()
    serializer_class = MaterialPDFSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = "id_material"


class MaterialLeituraCreateView(generics.CreateAPIView):
    queryset = MaterialLeitura.objects.all()
    serializer_class = MaterialLeituraSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]


class MaterialLeituraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaterialLeitura.objects.all()
    serializer_class = MaterialLeituraSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    lookup_field = "id_material"


class AtividadeMaterialView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id_atividade):
        try:
            atividade = Atividade.objects.get(id_atividade=id_atividade)
            
            try:
                material = atividade.material_video
                return Response({
                    "tipo": "video",
                    "material": MaterialVideoSerializer(material).data
                })
            except MaterialVideo.DoesNotExist:
                pass

            try:
                material = atividade.material_pdf
                return Response({
                    "tipo": "pdf",
                    "material": MaterialPDFSerializer(material).data
                })
            except MaterialPDF.DoesNotExist:
                pass

            try:
                material = atividade.material_leitura
                return Response({
                    "tipo": "leitura",
                    "material": MaterialLeituraSerializer(material).data
                })
            except MaterialLeitura.DoesNotExist:
                pass

            try:
                quiz = atividade.quiz
                return Response({
                    "tipo": "quiz",
                    "material": QuizSerializer(quiz).data
                })
            except Quiz.DoesNotExist:
                pass

            return Response({
                "message": "Nenhum material associado a esta atividade."
            }, status=status.HTTP_404_NOT_FOUND)

        except Atividade.DoesNotExist:
            return Response({
                "error": "Atividade nÃ£o encontrada."
            }, status=status.HTTP_404_NOT_FOUND)


# ==================== VIEWS DE BANCO DE QUESTÃ•ES ====================

class QuestaoCreateView(generics.CreateAPIView):
    """
    View para criar uma nova questÃ£o no Banco de QuestÃµes.
    A questÃ£o Ã© salva globalmente e pode ser reutilizada em mÃºltiplos quizzes.
    """
    queryset = Questao.objects.all()
    serializer_class = QuestaoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)


class QuestaoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View para visualizar, atualizar ou excluir uma questÃ£o."""
    queryset = Questao.objects.all()
    serializer_class = QuestaoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    lookup_field = "id_questao"


class QuestaoSearchView(APIView):
    """
    View para buscar questÃµes no Banco de QuestÃµes.
    
    Filtros disponÃ­veis:
    - q: Busca por palavras-chave no enunciado ou keywords
    - tags: IDs de tags separados por vÃ­rgula
    - area: ID da Ã¡rea
    - cargo: ID do cargo
    - unidade: ID da unidade
    - competencia: ID da competÃªncia
    """
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]

    def get(self, request):
        queryset = Questao.objects.filter(ativo=True)
        
        # Filtro por palavras-chave
        keyword = request.query_params.get('q', None)
        if keyword:
            queryset = queryset.filter(
                Q(enunciado__icontains=keyword) |
                Q(keywords__icontains=keyword)
            )
        
        # Filtro por tags
        tags_param = request.query_params.get('tags', None)
        if tags_param:
            tag_ids = [int(id.strip()) for id in tags_param.split(',') if id.strip().isdigit()]
            if tag_ids:
                queryset = queryset.filter(tags__id_tag__in=tag_ids).distinct()
        
        # Filtro por Ã¡rea
        area_id = request.query_params.get('area', None)
        if area_id:
            queryset = queryset.filter(areas__id_area=area_id)
        
        # Filtro por cargo
        cargo_id = request.query_params.get('cargo', None)
        if cargo_id:
            queryset = queryset.filter(cargos__id_cargo=cargo_id)
        
        # Filtro por unidade
        unidade_id = request.query_params.get('unidade', None)
        if unidade_id:
            queryset = queryset.filter(unidades__id_unidade=unidade_id)
        
        # Filtro por competÃªncia
        competencia_id = request.query_params.get('competencia', None)
        if competencia_id:
            queryset = queryset.filter(competencias__id_competencia=competencia_id)
        
        queryset = queryset.distinct().order_by('-data_criacao')
        serializer = QuestaoSearchSerializer(queryset, many=True)
        
        return Response({
            "total": queryset.count(),
            "questoes": serializer.data
        })


# ==================== VIEWS DE QUIZ ====================

class QuizCreateWithAtividadeView(APIView):
    """
    View para criar um novo Quiz E sua Atividade associada no mÃ³dulo.
    Isso garante que o quiz tenha uma atividade relacionada.
    """
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    
    def post(self, request):
        try:
            # Obter dados
            id_modulo = request.data.get('id_modulo')
            titulo_atividade = request.data.get('titulo_atividade', 'Quiz')
            titulo_quiz = request.data.get('titulo_quiz', 'Quiz')
            descricao_quiz = request.data.get('descricao_quiz', '')
            
            # Validar mÃ³dulo
            modulo = Modulo.objects.get(id_modulo=id_modulo)
            
            # Obter prÃ³xima ordem de atividade
            ultima_atividade = modulo.atividades.all().order_by('ordem').last()
            proxima_ordem = (ultima_atividade.ordem + 1) if ultima_atividade else 1
            
            # Criar atividade
            atividade = Atividade.objects.create(
                id_modulo=modulo,
                titulo=titulo_atividade,
                descricao=descricao_quiz,
                ordem=proxima_ordem
            )
            
            # Criar quiz associado
            quiz = Quiz.objects.create(
                id_atividade=atividade,
                titulo=titulo_quiz,
                descricao=descricao_quiz,
                porcentagem_minima_aprovacao=70.0,
                randomizar_questoes=True,
                randomizar_alternativas=True,
                mostrar_feedback=True,
                mostrar_gabarito=True
            )
            
            return Response({
                'success': True,
                'message': 'Atividade e Quiz criados com sucesso',
                'atividade': {
                    'id_atividade': atividade.id_atividade,
                    'titulo': atividade.titulo,
                    'ordem': atividade.ordem
                },
                'quiz': {
                    'id_quiz': quiz.id_quiz,
                    'titulo': quiz.titulo,
                    'id_atividade': quiz.id_atividade.id_atividade
                }
            }, status=status.HTTP_201_CREATED)
            
        except Modulo.DoesNotExist:
            return Response({
                'error': 'MÃ³dulo nÃ£o encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class QuizCreateView(generics.CreateAPIView):
    """
    View para criar um novo Quiz associado a uma atividade existente.
    Use QuizCreateWithAtividadeView para criar atividade + quiz juntos.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View para visualizar, atualizar ou excluir um quiz."""
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]
    required_roles = ["Administrador", "Gestor", "Autor de ConteÃºdo"]
    lookup_field = "id_quiz"


class QuizAdicionarQuestaoView(APIView):
    """
    View para adicionar questÃµes a um quiz.
    Permite adicionar questÃµes existentes ou criar novas.
    """
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]

    def post(self, request, id_quiz):
        try:
            quiz = Quiz.objects.get(id_quiz=id_quiz)
            
            # Adicionar questÃ£o existente
            questao_id = request.data.get('questao_id')
            if questao_id:
                questao = Questao.objects.get(id_questao=questao_id)
                
                # Verificar se jÃ¡ existe
                if QuizQuestao.objects.filter(id_quiz=quiz, id_questao=questao).exists():
                    return Response({
                        "error": "Esta questÃ£o jÃ¡ estÃ¡ no quiz."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Obter prÃ³xima ordem
                ultima_ordem = quiz.quiz_questoes.order_by('-ordem').first()
                nova_ordem = (ultima_ordem.ordem + 1) if ultima_ordem else 1
                
                QuizQuestao.objects.create(
                    id_quiz=quiz,
                    id_questao=questao,
                    ordem=nova_ordem
                )
                
                return Response({
                    "message": "QuestÃ£o adicionada ao quiz com sucesso.",
                    "quiz": QuizSerializer(quiz).data
                })
            
            # Criar nova questÃ£o e adicionar ao quiz
            nova_questao_data = request.data.get('nova_questao')
            if nova_questao_data:
                serializer = QuestaoSerializer(data=nova_questao_data)
                if serializer.is_valid():
                    questao = serializer.save(criado_por=request.user)
                    
                    ultima_ordem = quiz.quiz_questoes.order_by('-ordem').first()
                    nova_ordem = (ultima_ordem.ordem + 1) if ultima_ordem else 1
                    
                    QuizQuestao.objects.create(
                        id_quiz=quiz,
                        id_questao=questao,
                        ordem=nova_ordem
                    )
                    
                    return Response({
                        "message": "Nova questÃ£o criada e adicionada ao quiz.",
                        "questao": QuestaoSerializer(questao).data,
                        "quiz": QuizSerializer(quiz).data
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                "error": "ForneÃ§a 'questao_id' para importar ou 'nova_questao' para criar."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz nÃ£o encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Questao.DoesNotExist:
            return Response({"error": "QuestÃ£o nÃ£o encontrada."}, status=status.HTTP_404_NOT_FOUND)


class QuizRemoverQuestaoView(APIView):
    """View para remover uma questÃ£o de um quiz."""
    permission_classes = [IsAuthenticated, IsAdminOrGestorOrAutor]

    def delete(self, request, id_quiz, id_questao):
        try:
            quiz_questao = QuizQuestao.objects.get(
                id_quiz_id=id_quiz,
                id_questao_id=id_questao
            )
            quiz_questao.delete()
            
            return Response({
                "message": "QuestÃ£o removida do quiz com sucesso."
            })
        except QuizQuestao.DoesNotExist:
            return Response({
                "error": "QuestÃ£o nÃ£o encontrada neste quiz."
            }, status=status.HTTP_404_NOT_FOUND)


# ==================== VIEWS DE TENTATIVA DE QUIZ ====================

class IniciarTentativaView(APIView):
    """
    View para iniciar uma nova tentativa de quiz.
    Gera a ordem randomizada das questÃµes e alternativas.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id_quiz):
        try:
            quiz = Quiz.objects.get(id_quiz=id_quiz)
            user = request.user
            
            # Verificar se o usuÃ¡rio estÃ¡ matriculado na trilha
            atividade = quiz.id_atividade
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            try:
                matricula = Matricula.objects.get(
                    id_usuario=user,
                    id_trilha=trilha
                )
                if matricula.status == "Cancelada":
                    return Response({
                        "error": "Sua matrÃ­cula nesta trilha foi cancelada."
                    }, status=status.HTTP_403_FORBIDDEN)
            except Matricula.DoesNotExist:
                return Response({
                    "error": "VocÃª nÃ£o estÃ¡ matriculado nesta trilha."
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Verificar se o usuÃ¡rio pode fazer mais tentativas
            if not quiz.usuario_pode_tentar(user):
                return Response({
                    "error": f"VocÃª atingiu o limite de {quiz.tentativas_permitidas} tentativas."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar se jÃ¡ existe tentativa em andamento
            tentativa_em_andamento = TentativaQuiz.objects.filter(
                id_quiz=quiz,
                id_usuario=user,
                status="EmAndamento"
            ).first()
            
            if tentativa_em_andamento:
                return Response({
                    "error": "VocÃª jÃ¡ possui uma tentativa em andamento.",
                    "tentativa_id": tentativa_em_andamento.id_tentativa
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Criar nova tentativa
            tentativa = TentativaQuiz.objects.create(
                id_quiz=quiz,
                id_usuario=user,
                total_questoes=quiz.get_total_questoes()
            )
            
            # Gerar ordem das questÃµes
            questoes_ids = tentativa.gerar_ordem_questoes()
            
            # Criar registros de resposta para cada questÃ£o
            for questao_id in questoes_ids:
                resposta = RespostaQuestao.objects.create(
                    id_tentativa=tentativa,
                    id_questao_id=questao_id
                )
                # Gerar ordem das alternativas
                resposta.gerar_ordem_alternativas()
            
            return Response({
                "message": "Tentativa iniciada com sucesso.",
                "tentativa_id": tentativa.id_tentativa,
                "total_questoes": tentativa.total_questoes,
                "tempo_limite_minutos": quiz.tempo_limite_minutos,
                "tentativas_restantes": (
                    quiz.tentativas_permitidas - quiz.get_tentativas_usuario(user)
                    if quiz.tentativas_permitidas else "Ilimitadas"
                )
            }, status=status.HTTP_201_CREATED)
            
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz nÃ£o encontrado."}, status=status.HTTP_404_NOT_FOUND)


class ObterQuestaoTentativaView(APIView):
    """
    View para obter uma questÃ£o especÃ­fica durante uma tentativa.
    Retorna a questÃ£o com alternativas na ordem randomizada.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id_tentativa, numero_questao):
        try:
            tentativa = TentativaQuiz.objects.get(
                id_tentativa=id_tentativa,
                id_usuario=request.user
            )
            
            # Verificar se a tentativa pertence ao usuÃ¡rio (jÃ¡ verificado no get acima)
            # Verificar matrÃ­cula na trilha
            atividade = tentativa.id_quiz.id_atividade
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            try:
                matricula = Matricula.objects.get(
                    id_usuario=request.user,
                    id_trilha=trilha
                )
                if matricula.status == "Cancelada":
                    return Response({
                        "error": "Sua matrÃ­cula nesta trilha foi cancelada."
                    }, status=status.HTTP_403_FORBIDDEN)
            except Matricula.DoesNotExist:
                return Response({
                    "error": "VocÃª nÃ£o estÃ¡ matriculado nesta trilha."
                }, status=status.HTTP_403_FORBIDDEN)
            
            if tentativa.status != "EmAndamento":
                return Response({
                    "error": "Esta tentativa jÃ¡ foi finalizada."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar tempo limite
            if tentativa.id_quiz.tempo_limite_minutos:
                tempo_decorrido = (timezone.now() - tentativa.data_inicio).total_seconds() / 60
                if tempo_decorrido > tentativa.id_quiz.tempo_limite_minutos:
                    tentativa.status = "Expirada"
                    tentativa.data_fim = timezone.now()
                    tentativa.calcular_resultado()
                    return Response({
                        "error": "Tempo esgotado. A tentativa foi finalizada.",
                        "resultado": TentativaQuizSerializer(tentativa).data
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obter questÃ£o pelo nÃºmero (1-indexed)
            questoes_ids = tentativa.get_ordem_questoes()
            if numero_questao < 1 or numero_questao > len(questoes_ids):
                return Response({
                    "error": f"NÃºmero de questÃ£o invÃ¡lido. Use 1 a {len(questoes_ids)}."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            questao_id = questoes_ids[numero_questao - 1]
            resposta = RespostaQuestao.objects.get(
                id_tentativa=tentativa,
                id_questao_id=questao_id
            )
            
            questao = resposta.id_questao
            alternativas = resposta.get_alternativas_ordenadas()
            
            return Response({
                "numero_questao": numero_questao,
                "total_questoes": len(questoes_ids),
                "questao": {
                    "id_questao": questao.id_questao,
                    "enunciado": questao.enunciado,
                    "alternativas": [
                        {"posicao": chr(65 + i), "texto": alt["texto"]}
                        for i, alt in enumerate(alternativas)
                    ]
                },
                "resposta_atual": resposta.resposta_usuario,
                "tempo_restante_minutos": (
                    tentativa.id_quiz.tempo_limite_minutos - 
                    (timezone.now() - tentativa.data_inicio).total_seconds() / 60
                    if tentativa.id_quiz.tempo_limite_minutos else None
                )
            })
            
        except TentativaQuiz.DoesNotExist:
            return Response({"error": "Tentativa nÃ£o encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except RespostaQuestao.DoesNotExist:
            return Response({"error": "QuestÃ£o nÃ£o encontrada na tentativa."}, status=status.HTTP_404_NOT_FOUND)


class ResponderQuestaoView(APIView):
    """
    View para responder uma questÃ£o durante uma tentativa.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id_tentativa):
        try:
            tentativa = TentativaQuiz.objects.get(
                id_tentativa=id_tentativa,
                id_usuario=request.user
            )
            
            # Verificar matrÃ­cula na trilha
            atividade = tentativa.id_quiz.id_atividade
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            try:
                matricula = Matricula.objects.get(
                    id_usuario=request.user,
                    id_trilha=trilha
                )
                if matricula.status == "Cancelada":
                    return Response({
                        "error": "Sua matrÃ­cula nesta trilha foi cancelada."
                    }, status=status.HTTP_403_FORBIDDEN)
            except Matricula.DoesNotExist:
                return Response({
                    "error": "VocÃª nÃ£o estÃ¡ matriculado nesta trilha."
                }, status=status.HTTP_403_FORBIDDEN)
            
            if tentativa.status != "EmAndamento":
                return Response({
                    "error": "Esta tentativa jÃ¡ foi finalizada."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar tempo limite
            if tentativa.id_quiz.tempo_limite_minutos:
                tempo_decorrido = (timezone.now() - tentativa.data_inicio).total_seconds() / 60
                if tempo_decorrido > tentativa.id_quiz.tempo_limite_minutos:
                    tentativa.status = "Expirada"
                    tentativa.data_fim = timezone.now()
                    tentativa.calcular_resultado()
                    return Response({
                        "error": "Tempo esgotado. A tentativa foi finalizada.",
                        "resultado": TentativaQuizSerializer(tentativa).data
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = ResponderQuestaoSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            questao_id = serializer.validated_data['id_questao']
            resposta_letra = serializer.validated_data['resposta']
            
            # Verificar se a questÃ£o faz parte desta tentativa
            try:
                resposta = RespostaQuestao.objects.get(
                    id_tentativa=tentativa,
                    id_questao_id=questao_id
                )
            except RespostaQuestao.DoesNotExist:
                return Response({
                    "error": "Esta questÃ£o nÃ£o faz parte desta tentativa."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Salvar resposta
            resposta.verificar_e_salvar_resposta(resposta_letra)
            
            return Response({
                "message": "Resposta registrada com sucesso.",
                "questao_id": questao_id,
                "resposta": resposta_letra
            })
            
        except TentativaQuiz.DoesNotExist:
            return Response({"error": "Tentativa nÃ£o encontrada."}, status=status.HTTP_404_NOT_FOUND)


class FinalizarTentativaView(APIView):
    """
    View para finalizar uma tentativa de quiz.
    Calcula a nota e verifica aprovaÃ§Ã£o.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id_tentativa):
        try:
            tentativa = TentativaQuiz.objects.get(
                id_tentativa=id_tentativa,
                id_usuario=request.user
            )
            
            # Verificar matrÃ­cula na trilha
            atividade = tentativa.id_quiz.id_atividade
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            try:
                matricula = Matricula.objects.get(
                    id_usuario=request.user,
                    id_trilha=trilha
                )
                if matricula.status == "Cancelada":
                    return Response({
                        "error": "Sua matrÃ­cula nesta trilha foi cancelada."
                    }, status=status.HTTP_403_FORBIDDEN)
            except Matricula.DoesNotExist:
                return Response({
                    "error": "VocÃª nÃ£o estÃ¡ matriculado nesta trilha."
                }, status=status.HTTP_403_FORBIDDEN)
            
            if tentativa.status != "EmAndamento":
                return Response({
                    "error": "Esta tentativa jÃ¡ foi finalizada."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Finalizar tentativa
            tentativa.data_fim = timezone.now()
            tentativa.status = "Finalizada"
            tentativa.calcular_resultado()
            
            # Se aprovado, atualizar progresso e matrÃ­cula
            if tentativa.aprovado:
                atividade = tentativa.id_quiz.id_atividade
                progresso, _ = Progresso.objects.get_or_create(
                    id_usuario=request.user,
                    id_atividade=atividade
                )
                progresso.completed_at = timezone.now()
                progresso.save()
                
                # Verificar conclusÃ£o da trilha
                modulo = atividade.id_modulo
                trilha = modulo.id_trilha
                try:
                    matricula = Matricula.objects.get(
                        id_usuario=request.user,
                        id_trilha=trilha
                    )
                    matricula.atualizar_status()
                except Matricula.DoesNotExist:
                    pass
            
            # Preparar resposta
            response_data = {
                "message": "Tentativa finalizada.",
                "resultado": {
                    "total_questoes": tentativa.total_questoes,
                    "total_acertos": tentativa.total_acertos,
                    "nota": round(tentativa.nota, 2),
                    "porcentagem_minima": tentativa.id_quiz.porcentagem_minima_aprovacao,
                    "aprovado": tentativa.aprovado
                }
            }
            
            # Incluir feedback se configurado
            if tentativa.id_quiz.mostrar_feedback or tentativa.id_quiz.mostrar_gabarito:
                response_data["detalhes"] = TentativaQuizDetalhadaSerializer(tentativa).data
            
            return Response(response_data)
            
        except TentativaQuiz.DoesNotExist:
            return Response({"error": "Tentativa nÃ£o encontrada."}, status=status.HTTP_404_NOT_FOUND)


class HistoricoTentativasView(APIView):
    """
    View para visualizar o histÃ³rico de tentativas de um quiz.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id_quiz):
        try:
            quiz = Quiz.objects.get(id_quiz=id_quiz)
            
            tentativas = TentativaQuiz.objects.filter(
                id_quiz=quiz,
                id_usuario=request.user
            ).order_by('-data_inicio')
            
            serializer = TentativaQuizSerializer(tentativas, many=True)
            
            return Response({
                "quiz": QuizParaTentativaSerializer(quiz).data,
                "total_tentativas": tentativas.count(),
                "aprovado": quiz.usuario_aprovado(request.user),
                "tentativas": serializer.data
            })
            
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz nÃ£o encontrado."}, status=status.HTTP_404_NOT_FOUND)


class TentativaDetalheView(generics.RetrieveAPIView):
    """View para visualizar detalhes de uma tentativa finalizada."""
    serializer_class = TentativaQuizDetalhadaSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id_tentativa"

    def get_queryset(self):
        return TentativaQuiz.objects.filter(
            id_usuario=self.request.user,
            status__in=["Finalizada", "Expirada"]
        )


# ==================== VIEW DE PROGRESSÃƒO ====================

class VerificarProgressaoView(APIView):
    """
    View para verificar o progresso do usuÃ¡rio em uma trilha.
    Retorna status de conclusÃ£o de mÃ³dulos e atividades.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id_trilha):
        try:
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            user = request.user
            
            # Verificar matrÃ­cula
            try:
                matricula = Matricula.objects.get(id_usuario=user, id_trilha=trilha)
            except Matricula.DoesNotExist:
                if not (request.user.perfil.tipo_usuario in ['Administrador', 'Gestor']):
                    return Response({
                        "error": "VocÃª nÃ£o estÃ¡ matriculado nesta trilha."
                    }, status=status.HTTP_400_BAD_REQUEST)
                # Admin/Gestor pode gerar certificado sem matrícula para testes
                print(f"⚠️ Admin gerando certificado sem matrícula: {request.user.username}")
            
            # Calcular progresso
            modulos_info = []
            for modulo in trilha.modulos.all().order_by('ordem'):
                atividades_info = []
                for atividade in modulo.atividades.all().order_by('ordem'):
                    concluida = atividade.verificar_conclusao_usuario(user)
                    
                    # Verificar se tem quiz
                    quiz_info = None
                    try:
                        quiz = atividade.quiz
                        quiz_info = {
                            "id_quiz": quiz.id_quiz,
                            "aprovado": quiz.usuario_aprovado(user),
                            "tentativas": quiz.get_tentativas_usuario(user),
                            "tentativas_permitidas": quiz.tentativas_permitidas
                        }
                    except Quiz.DoesNotExist:
                        pass
                    
                    atividades_info.append({
                        "id_atividade": atividade.id_atividade,
                        "titulo": atividade.titulo,
                        "concluida": concluida,
                        "quiz": quiz_info
                    })
                
                modulos_info.append({
                    "id_modulo": modulo.id_modulo,
                    "titulo": modulo.titulo,
                    "concluido": modulo.verificar_conclusao_usuario(user),
                    "atividades": atividades_info
                })
            
            trilha_concluida = trilha.verificar_conclusao_usuario(user)
            
            # Atualizar status da matrÃ­cula se necessÃ¡rio
            if trilha_concluida and matricula.status != "Concluida":
                matricula.atualizar_status()
            
            return Response({
                "trilha": {
                    "id_trilha": trilha.id_trilha,
                    "titulo": trilha.titulo,
                    "concluida": trilha_concluida
                },
                "matricula": {
                    "status": matricula.status,
                    "data_inicio": matricula.data_inicio,
                    "data_fim": matricula.data_fim
                },
                "modulos": modulos_info
            })
            
        except Trilha.DoesNotExist:
            return Response({"error": "Trilha nÃ£o encontrada."}, status=status.HTTP_404_NOT_FOUND)


# ==================== VIEWS DE CERTIFICADO ====================

class ListarCertificadosView(APIView):
    """
    Lista todos os certificados de um usuÃ¡rio.
    
    GET /api/certificados/
    
    Retorna lista de certificados com informaÃ§Ãµes da trilha associada.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Pegar certificados do usuÃ¡rio autenticado
            certificados = Certificado.objects.filter(
                id_usuario=request.user
            ).select_related('id_trilha').order_by('-data_emissao')
            
            # Serializar dados
            certificados_data = []
            for cert in certificados:
                # Buscar imagem da trilha (usar primeira do changelog se disponÃ­vel)
                imagem_trilha = None
                try:
                    if cert.id_trilha.changelog:
                        changelog = json.loads(cert.id_trilha.changelog)
                        if isinstance(changelog, dict) and 'modules' in changelog:
                            for module in changelog['modules']:
                                for material in module.get('materials', []):
                                    if material.get('type') == 'video' and material.get('url'):
                                        # Usar thumbnail do vÃ­deo como imagem
                                        imagem_trilha = material.get('thumbnail')
                                        break
                                if imagem_trilha:
                                    break
                except:
                    pass
                
                # Se nÃ£o encontrou imagem no changelog, usar imagem padrÃ£o baseada no nome
                if not imagem_trilha:
                    nome_trilha_lower = cert.id_trilha.titulo.lower() if cert.id_trilha.titulo else ""
                    if "compliance" in nome_trilha_lower or "Ã©tica" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=800&fit=crop&auto=format"
                    elif "lideranÃ§a" in nome_trilha_lower or "gestÃ£o" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop&auto=format"
                    elif "onboarding" in nome_trilha_lower or "integraÃ§Ã£o" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&h=800&fit=crop&auto=format"
                    elif "seguranÃ§a" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&h=800&fit=crop&auto=format"
                    elif "vendas" in nome_trilha_lower or "comercial" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop&auto=format"
                    elif "tecnologia" in nome_trilha_lower or "cloud" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop&auto=format"
                    elif "marketing" in nome_trilha_lower:
                        imagem_trilha = "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1200&h=800&fit=crop&auto=format"
                    else:
                        # Imagem padrÃ£o genÃ©rica
                        imagem_trilha = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=800&fit=crop&auto=format"
                
                certificados_data.append({
                    'id': cert.id_certificado,
                    'codigo_verificacao': cert.codigo_verificacao,
                    'data_emissao': cert.data_emissao.strftime('%Y-%m-%d'),
                    'link_pdf': cert.link_pdf,
                    'trilha': {
                        'id': cert.id_trilha.id_trilha,
                        'titulo': cert.id_trilha.titulo,
                        'descricao': cert.id_trilha.descricao,
                        'imagem': imagem_trilha
                    }
                })
            
            return Response({
                'certificados': certificados_data,
                'total': len(certificados_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Erro ao listar certificados: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GerarCertificadoView(APIView):
    """
    Gera um certificado de conclusÃ£o para um usuÃ¡rio que completou 100% de uma trilha.
    
    POST /api/certificado/gerar/
    Body: {
        "id_trilha": 45,
        "id_usuario": 1
    }
    
    ValidaÃ§Ãµes:
    - UsuÃ¡rio deve ter matrÃ­cula na trilha
    - Trilha deve estar 100% completa
    - Se jÃ¡ existir certificado, retorna o existente
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        id_trilha = request.data.get('id_trilha')
        id_usuario = request.data.get('id_usuario')
        
        if not id_trilha or not id_usuario:
            return Response(
                {"error": "id_trilha e id_usuario sÃ£o obrigatÃ³rios"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            trilha = Trilha.objects.get(id_trilha=id_trilha)
            usuario = User.objects.get(id=id_usuario)
            
            # Verificar se usuÃ¡rio tem permissÃ£o (deve ser o prÃ³prio ou admin)
            perfil_usuario = getattr(request.user, 'perfil', None)
            if perfil_usuario:
                perfil_tipo = getattr(perfil_usuario, 'tipo_usuario', None) or getattr(perfil_usuario, 'nome', 'Aprendiz')
            else:
                perfil_tipo = 'Aprendiz'
            
            is_admin = perfil_tipo in ['Administrador', 'Gestor']
            
            if request.user.id != int(id_usuario) and not is_admin:
                return Response(
                    {"error": "VocÃª nÃ£o tem permissÃ£o para gerar este certificado"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verificar se usuÃ¡rio tem matrÃ­cula na trilha
            try:
                matricula = Matricula.objects.get(id_usuario=usuario, id_trilha=trilha)
            except Matricula.DoesNotExist:
                if not is_admin:
                    return Response(
                        {"error": "Usuário não está matriculado nesta trilha"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Admin/Gestor pode gerar certificado sem matrícula para testes
                print(f"⚠️ Admin gerando certificado sem matrícula: {request.user.username}")
            # Verificar se trilha estÃ¡ 100% completa
            modulos = trilha.modulos.all()
            total_atividades = 0
            atividades_concluidas = 0
            
            print(f"ðŸ” [GerarCertificadoView] Calculando conclusÃ£o da trilha {trilha.titulo}")
            print(f"ðŸ“š MÃ³dulos encontrados: {modulos.count()}")
            
            for modulo in modulos:
                atividades = modulo.atividades.all()
                total_atividades += atividades.count()
                print(f"   ðŸ“– MÃ³dulo {modulo.titulo}: {atividades.count()} atividades")
                
                for atividade in atividades:
                    # Verificar se hÃ¡ progresso registrado para esta atividade
                    # Aceita qualquer Progresso registrado (com ou sem completed_at)
                    progresso_existe = Progresso.objects.filter(
                        id_usuario=usuario,
                        id_atividade=atividade
                    ).exists()
                    
                    if progresso_existe:
                        atividades_concluidas += 1
                        print(f"      âœ… {atividade.titulo} - CONCLUÃDA")
                    else:
                        print(f"      â³ {atividade.titulo} - PENDENTE")
            
            print(f"ðŸ“Š Total: {atividades_concluidas}/{total_atividades} atividades concluÃ­das")
            
            if total_atividades == 0:
                return Response(
                    {"error": "Trilha nÃ£o possui atividades"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            percentual_conclusao = (atividades_concluidas / total_atividades) * 100
            print(f"ðŸ“ˆ Percentual de conclusÃ£o: {percentual_conclusao:.1f}%")
            
            if percentual_conclusao < 100:
                # Detalhar quais atividades faltam
                atividades_pendentes = []
                for modulo in modulos:
                    for atividade in modulo.atividades.all():
                        if not Progresso.objects.filter(
                            id_usuario=usuario,
                            id_atividade=atividade
                        ).exists():
                            atividades_pendentes.append(f"{modulo.titulo} â†’ {atividade.titulo}")
                
                return Response({
                    "error": f"Trilha nÃ£o estÃ¡ 100% completa. Progresso atual: {percentual_conclusao:.1f}%",
                    "atividades_concluidas": atividades_concluidas,
                    "total_atividades": total_atividades,
                    "atividades_pendentes": atividades_pendentes[:10]  # Mostrar apenas as 10 primeiras
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar se jÃ¡ existe certificado
            certificado, created = Certificado.objects.get_or_create(
                id_usuario=usuario,
                id_trilha=trilha
            )
            
            # Calcular carga horÃ¡ria total da trilha somando duraÃ§Ã£o dos materiais
            carga_horaria = 0
            for modulo in modulos:
                for atividade in modulo.atividades.all():
                    # Tentar buscar duraÃ§Ã£o dos diferentes tipos de material
                    try:
                        if hasattr(atividade, 'material_video') and atividade.material_video:
                            carga_horaria += atividade.material_video.duracao or 0
                    except:
                        pass
                    try:
                        if hasattr(atividade, 'material_pdf') and atividade.material_pdf:
                            carga_horaria += atividade.material_pdf.duracao_estimada or 0
                    except:
                        pass
                    try:
                        if hasattr(atividade, 'material_leitura') and atividade.material_leitura:
                            carga_horaria += atividade.material_leitura.duracao_estimada or 0
                    except:
                        pass
                    try:
                        if hasattr(atividade, 'quiz') and atividade.quiz:
                            # Estimar tempo do quiz baseado no nÃºmero de questÃµes (2 min por questÃ£o)
                            num_questoes = atividade.quiz.questoes.count()
                            carga_horaria += num_questoes * 2
                    except:
                        pass
            
            # Se nÃ£o conseguiu calcular, usar valor padrÃ£o
            if carga_horaria == 0:
                carga_horaria = 40  # Default: 40 horas
            
            # Construir nome do aluno a partir de first_name e last_name, ou usar username
            nome_aluno = usuario.username
            if usuario.first_name or usuario.last_name:
                nome_aluno = f"{usuario.first_name} {usuario.last_name}".strip()
            
            return Response({
                "codigo_verificacao": certificado.codigo_verificacao,
                "data_emissao": certificado.data_emissao.isoformat(),
                "nome_aluno": nome_aluno,
                "nome_trilha": trilha.titulo,
                "carga_horaria": int(carga_horaria),
                "link_pdf": certificado.link_pdf,
                "criado_agora": created
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Trilha.DoesNotExist:
            return Response({"error": "Trilha nÃ£o encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({"error": "UsuÃ¡rio nÃ£o encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"error": f"Erro ao gerar certificado: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
