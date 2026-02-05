from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Trilha
    TrilhaCreateView, TrilhaUpdateView, TrilhaSearchView, TrilhaDetalhadaView, InitializeTrailProgressView,
    # Módulo
    ModuloCreateView, ModuloDetailView,
    # Atividade
    AtividadeCreateView, AtividadeDetailView, AtividadeToggleView,
    # Matrícula
    MatriculaCreateView,
    # Conteúdo (a implementar)
    # ConteudoCreateView, ConteudoDetailView,
    # Material Vídeo
    MaterialVideoCreateView, MaterialVideoDetailView,
    # Material PDF
    MaterialPDFCreateView, MaterialPDFDetailView,
    # Material Leitura
    MaterialLeituraCreateView, MaterialLeituraDetailView,
    # Material Genérico
    AtividadeMaterialView,
    # Filtros
    TagListCreateView, TagDetailView,
    AreaListCreateView, AreaDetailView,
    CargoListCreateView, CargoDetailView,
    UnidadeListCreateView, UnidadeDetailView,
    CompetenciaListCreateView, CompetenciaDetailView,
    # Banco de Questões
    QuestaoCreateView, QuestaoDetailView, QuestaoSearchView,
    # Quiz
    QuizCreateView, QuizDetailView, QuizCreateWithAtividadeView,
    QuizAdicionarQuestaoView, QuizRemoverQuestaoView,
    # Tentativas
    IniciarTentativaView, ObterQuestaoTentativaView,
    ResponderQuestaoView, FinalizarTentativaView,
    HistoricoTentativasView, TentativaDetalheView,
    # Progressão
    VerificarProgressaoView,
    # Certificado
    GerarCertificadoView, ListarCertificadosView,
)
from .views_progresso import SalvarProgressoView, ModuloAtividadesView
from .views_matricula_status import StatusMatriculaView, RefazerTrilhaView, ResetarProgressoView
from .views_notifications import (
    NotificationViewSet,
    NotificationPreferenceViewSet,
    NotificationUnreadCountView,
)

# Router para endpoints de notificação
router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"notification-preferences", NotificationPreferenceViewSet, basename="notification-preference")
router.register(r"notifications/unread-count", NotificationUnreadCountView, basename="notification-unread-count")

urlpatterns = [
    # ==================== ROTAS DE NOTIFICAÇÃO ====================
    path("", include(router.urls)),

    # ==================== ROTAS DE TRILHA ====================
    path("trilhas/create/", TrilhaCreateView.as_view(), name="trilha-create"),
    path("trilhas/search/", TrilhaSearchView.as_view(), name="trilha-search"),
    path("trilhas/<int:id_trilha>/", TrilhaUpdateView.as_view(), name="trilha-detail-update-delete"),
    path("trilhas/<int:id_trilha>/detalhada/", TrilhaDetalhadaView.as_view(), name="trilha-detalhada"),
    path("trilhas/<int:id_trilha>/progressao/", VerificarProgressaoView.as_view(), name="trilha-progressao"),
    path("trilhas/<int:id_trilha>/progress/initialize/", InitializeTrailProgressView.as_view(), name="trilha-progress-initialize"),
    
    # ==================== ALIASES EM INGLÊS (para compatibilidade frontend) ====================
    path("trails/<int:id_trilha>/progress/initialize/", InitializeTrailProgressView.as_view(), name="trails-progress-initialize"),
    path("trails/search/", TrilhaSearchView.as_view(), name="trails-search"),
    path("trails/<int:id_trilha>/", TrilhaUpdateView.as_view(), name="trails-detail-update-delete"),
    path("trails/<int:id_trilha>/detalhada/", TrilhaDetalhadaView.as_view(), name="trails-detalhada"),
    
    # ==================== ROTAS DE MÓDULO ====================
    path("modulos/create/", ModuloCreateView.as_view(), name="modulo-create"),
    path("modulos/<int:id_modulo>/", ModuloDetailView.as_view(), name="modulo-detail-update-delete"),
    path("modulos/<int:id_modulo>/atividades/", ModuloAtividadesView.as_view(), name="modulo-atividades"),
    
    # ==================== ROTAS DE ATIVIDADE ====================
    path("atividades/create/", AtividadeCreateView.as_view(), name="atividade-create"),
    path("atividades/<int:id_atividade>/", AtividadeDetailView.as_view(), name="atividade-detail-update-delete"),
    path("atividades/<int:id_atividade>/toggle/", AtividadeToggleView.as_view(), name="atividade-toggle"),
    path("atividades/<int:id_atividade>/material/", AtividadeMaterialView.as_view(), name="atividade-material"),
    
    # ==================== ROTAS DE MATRÍCULA ====================
    path("matriculas/create/", MatriculaCreateView.as_view(), name="matricula-create"),

    # ==================== ROTAS DE CONTEÚDO (a implementar) ====================
    # path("conteudos/create/", ConteudoCreateView.as_view(), name="conteudo-create"),
    # path("conteudos/<int:id_conteudo>/", ConteudoDetailView.as_view(), name="conteudo-detail-update-delete"),
    
    # ==================== ROTAS DE MATERIAL VÍDEO ====================
    path("materiais/video/create/", MaterialVideoCreateView.as_view(), name="material-video-create"),
    path("materiais/video/<int:id_material>/", MaterialVideoDetailView.as_view(), name="material-video-detail"),
    
    # ==================== ROTAS DE MATERIAL PDF ====================
    path("materiais/pdf/create/", MaterialPDFCreateView.as_view(), name="material-pdf-create"),
    path("materiais/pdf/<int:id_material>/", MaterialPDFDetailView.as_view(), name="material-pdf-detail"),
    
    # ==================== ROTAS DE MATERIAL LEITURA ====================
    path("materiais/leitura/create/", MaterialLeituraCreateView.as_view(), name="material-leitura-create"),
    path("materiais/leitura/<int:id_material>/", MaterialLeituraDetailView.as_view(), name="material-leitura-detail"),
    
    # ==================== ROTAS DE FILTROS ====================
    path("tags/", TagListCreateView.as_view(), name="tag-list-create"),
    path("tags/<int:id_tag>/", TagDetailView.as_view(), name="tag-detail"),
    path("areas/", AreaListCreateView.as_view(), name="area-list-create"),
    path("areas/<int:id_area>/", AreaDetailView.as_view(), name="area-detail"),
    path("cargos/", CargoListCreateView.as_view(), name="cargo-list-create"),
    path("cargos/<int:id_cargo>/", CargoDetailView.as_view(), name="cargo-detail"),
    path("unidades/", UnidadeListCreateView.as_view(), name="unidade-list-create"),
    path("unidades/<int:id_unidade>/", UnidadeDetailView.as_view(), name="unidade-detail"),
    path("competencias/", CompetenciaListCreateView.as_view(), name="competencia-list-create"),
    path("competencias/<int:id_competencia>/", CompetenciaDetailView.as_view(), name="competencia-detail"),
    
    # ==================== ALIASES PARA FRONTEND (compatibilidade) ====================
    # Frontend chama /api/filtros/{tags,areas,cargos,unidades,competencias}/
    path("filtros/tags/", TagListCreateView.as_view(), name="filtros-tags"),
    path("filtros/areas/", AreaListCreateView.as_view(), name="filtros-areas"),
    path("filtros/cargos/", CargoListCreateView.as_view(), name="filtros-cargos"),
    path("filtros/unidades/", UnidadeListCreateView.as_view(), name="filtros-unidades"),
    path("filtros/competencias/", CompetenciaListCreateView.as_view(), name="filtros-competencias"),
    
    # ==================== ROTAS DE BANCO DE QUESTÕES ====================
    path("questoes/create/", QuestaoCreateView.as_view(), name="questao-create"),
    path("questoes/search/", QuestaoSearchView.as_view(), name="questao-search"),
    path("questoes/<int:id_questao>/", QuestaoDetailView.as_view(), name="questao-detail"),
    
    # ==================== ROTAS DE QUIZ ====================
    path("quiz/create/", QuizCreateView.as_view(), name="quiz-create"),
    path("quiz/create-with-atividade/", QuizCreateWithAtividadeView.as_view(), name="quiz-create-with-atividade"),
    path("quiz/<int:id_quiz>/", QuizDetailView.as_view(), name="quiz-detail"),
    path("quiz/<int:id_quiz>/adicionar-questao/", QuizAdicionarQuestaoView.as_view(), name="quiz-adicionar-questao"),
    path("quiz/<int:id_quiz>/remover-questao/<int:id_questao>/", QuizRemoverQuestaoView.as_view(), name="quiz-remover-questao"),
    path("quiz/<int:id_quiz>/historico/", HistoricoTentativasView.as_view(), name="quiz-historico"),
    
    # ==================== ROTAS DE TENTATIVA ====================
    path("quiz/<int:id_quiz>/iniciar/", IniciarTentativaView.as_view(), name="tentativa-iniciar"),
    path("tentativas/<int:id_tentativa>/questao/<int:numero_questao>/", ObterQuestaoTentativaView.as_view(), name="tentativa-questao"),
    path("tentativas/<int:id_tentativa>/responder/", ResponderQuestaoView.as_view(), name="tentativa-responder"),
    path("tentativas/<int:id_tentativa>/finalizar/", FinalizarTentativaView.as_view(), name="tentativa-finalizar"),
    path("tentativas/<int:id_tentativa>/", TentativaDetalheView.as_view(), name="tentativa-detalhe"),
    
    # ==================== ROTAS DE CERTIFICADO ====================
    path("certificados/", ListarCertificadosView.as_view(), name="certificados-listar"),
    path("certificado/gerar/", GerarCertificadoView.as_view(), name="certificado-gerar"),    
    
    # ==================== PROGRESSO ====================
    path("progresso/salvar/", SalvarProgressoView.as_view(), name="progresso-salvar"),
    
    # ==================== MATRÍCULA E STATUS ====================
    path("matriculas/<int:id_trilha>/status/", StatusMatriculaView.as_view(), name="matricula-status"),
    path("matriculas/<int:id_trilha>/refazer/", RefazerTrilhaView.as_view(), name="matricula-refazer"),
    path("matriculas/<int:id_trilha>/resetar/", ResetarProgressoView.as_view(), name="matricula-resetar"),
]