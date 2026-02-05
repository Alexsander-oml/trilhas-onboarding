from django.contrib import admin
from .models import (
    Trilha, Modulo, Atividade, Matricula, Progresso,
    MaterialVideo, MaterialPDF, MaterialLeitura,
    Tag, Area, Cargo, Unidade, Competencia,
    Questao, Quiz, QuizQuestao, TentativaQuiz, RespostaQuestao, Certificado
)

# Importar admin de notificações (já usa @admin.register, não precisa registrar novamente)
from . import admin_notifications  # noqa: F401


@admin.register(Trilha)
class TrilhaAdmin(admin.ModelAdmin):
    list_display = ('id_trilha', 'titulo', 'versao', 'status', 'criado_por', 'is_template')
    list_filter = ('status', 'is_template')
    search_fields = ('titulo', 'descricao', 'objetivos')
    filter_horizontal = ('tags', 'areas', 'cargos', 'unidades', 'competencias')
    readonly_fields = ('criado_por',)


@admin.register(Modulo)
class ModuloAdmin(admin.ModelAdmin):
    list_display = ('id_modulo', 'titulo', 'id_trilha', 'ordem')
    list_filter = ('id_trilha',)
    search_fields = ('titulo', 'descricao')


@admin.register(Atividade)
class AtividadeAdmin(admin.ModelAdmin):
    list_display = ('id_atividade', 'titulo', 'id_modulo', 'ordem', 'nota_minima')
    list_filter = ('id_modulo__id_trilha',)
    search_fields = ('titulo', 'descricao')


@admin.register(Matricula)
class MatriculaAdmin(admin.ModelAdmin):
    list_display = ('id_matricula', 'id_usuario', 'id_trilha', 'status', 'data_inicio', 'obrigatoria')
    list_filter = ('status', 'obrigatoria')
    search_fields = ('id_usuario__email', 'id_trilha__titulo')


@admin.register(Progresso)
class ProgressoAdmin(admin.ModelAdmin):
    list_display = ('id_progresso', 'id_usuario', 'id_atividade', 'completed_at')
    list_filter = ('completed_at',)
    search_fields = ('id_usuario__email', 'id_atividade__titulo')


@admin.register(MaterialVideo)
class MaterialVideoAdmin(admin.ModelAdmin):
    list_display = ('id_material', 'titulo', 'id_atividade', 'fonte', 'duracao')
    list_filter = ('fonte',)
    search_fields = ('titulo', 'descricao')


@admin.register(MaterialPDF)
class MaterialPDFAdmin(admin.ModelAdmin):
    list_display = ('id_material', 'titulo', 'id_atividade')
    search_fields = ('titulo', 'descricao')


@admin.register(MaterialLeitura)
class MaterialLeituraAdmin(admin.ModelAdmin):
    list_display = ('id_material', 'titulo', 'id_atividade')
    search_fields = ('titulo', 'descricao')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('id_tag', 'nome')
    search_fields = ('nome',)


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ('id_area', 'nome')
    search_fields = ('nome', 'descricao')


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ('id_cargo', 'nome')
    search_fields = ('nome', 'descricao')


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ('id_unidade', 'nome')
    search_fields = ('nome', 'descricao')


@admin.register(Competencia)
class CompetenciaAdmin(admin.ModelAdmin):
    list_display = ('id_competencia', 'nome')
    search_fields = ('nome', 'descricao')


@admin.register(Questao)
class QuestaoAdmin(admin.ModelAdmin):
    list_display = ('id_questao', 'enunciado_preview', 'gabarito', 'criado_por', 'ativo', 'data_criacao')
    list_filter = ('ativo', 'gabarito', 'data_criacao')
    search_fields = ('enunciado', 'keywords')
    filter_horizontal = ('tags', 'areas', 'cargos', 'unidades', 'competencias')
    readonly_fields = ('criado_por', 'data_criacao', 'data_atualizacao')
    
    def enunciado_preview(self, obj):
        return obj.enunciado[:100] + '...' if len(obj.enunciado) > 100 else obj.enunciado
    enunciado_preview.short_description = 'Enunciado'


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('id_quiz', 'titulo', 'id_atividade', 'porcentagem_minima_aprovacao', 'get_total_questoes', 'data_criacao')
    list_filter = ('randomizar_questoes', 'randomizar_alternativas', 'mostrar_feedback')
    search_fields = ('titulo', 'descricao')
    readonly_fields = ('data_criacao', 'data_atualizacao')


@admin.register(QuizQuestao)
class QuizQuestaoAdmin(admin.ModelAdmin):
    list_display = ('id_quiz_questao', 'id_quiz', 'id_questao', 'ordem')
    list_filter = ('id_quiz',)
    ordering = ('id_quiz', 'ordem')


@admin.register(TentativaQuiz)
class TentativaQuizAdmin(admin.ModelAdmin):
    list_display = ('id_tentativa', 'id_usuario', 'id_quiz', 'nota', 'aprovado', 'status', 'data_inicio')
    list_filter = ('aprovado', 'status', 'data_inicio')
    search_fields = ('id_usuario__email', 'id_quiz__titulo')
    readonly_fields = ('data_inicio', 'data_fim', 'total_questoes', 'total_acertos', 'nota', 'aprovado')


@admin.register(RespostaQuestao)
class RespostaQuestaoAdmin(admin.ModelAdmin):
    list_display = ('id_resposta', 'id_tentativa', 'id_questao', 'resposta_usuario', 'correta', 'data_resposta')
    list_filter = ('correta', 'data_resposta')
    readonly_fields = ('correta', 'data_resposta')


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = ('id_certificado', 'id_usuario', 'id_trilha', 'codigo_verificacao', 'data_emissao')
    list_filter = ('data_emissao',)
    search_fields = ('id_usuario__username', 'id_usuario__email', 'id_trilha__titulo', 'codigo_verificacao')
    readonly_fields = ('codigo_verificacao', 'data_emissao')
    ordering = ('-data_emissao',)

# ====== ADMINs (comentados até os models existirem) ======
#
# @admin.register(Conteudo)
# class ConteudoAdmin(admin.ModelAdmin):
#     list_display = ['id_conteudo', 'titulo', 'tipo', 'id_atividade']
#     list_filter = ['tipo']
#     search_fields = ['titulo']
#
# @admin.register(Notification)
# class NotificationAdmin(admin.ModelAdmin):
#     """
#     Admin para gerenciar Notificações.
#     """
#     list_display = [
#         'id_notification',
#         'recipient',
#         'notification_type',
#         'title',
#         'is_read',
#         'created_at',
#     ]
#     list_filter = [
#         'notification_type',
#         'is_read',
#         'created_at',
#     ]
#     search_fields = [
#         'recipient__email',
#         'title',
#         'message',
#     ]
#     readonly_fields = [
#         'id_notification',
#         'created_at',
#         'read_at',
#     ]
#     fieldsets = (
#         ('Informações Básicas', {
#             'fields': (
#                 'id_notification',
#                 'recipient',
#                 'notification_type',
#                 'title',
#                 'message',
#             )
#         }),
#         ('Status de Leitura', {
#             'fields': (
#                 'is_read',
#                 'read_at',
#             )
#         }),
#         ('Relacionamentos', {
#             'fields': (
#                 'related_track',
#                 'related_module',
#                 'related_activity',
#                 'related_enrollment',
#             ),
#             'classes': ('collapse',)
#         }),
#         ('Timestamps', {
#             'fields': (
#                 'created_at',
#             ),
#             'classes': ('collapse',)
#         }),
#     )
#     ordering = ['-created_at']
#
# @admin.register(NotificationPreference)
# class NotificationPreferenceAdmin(admin.ModelAdmin):
#     """
#     Admin para gerenciar Preferências de Notificação.
#     """
#     list_display = [
#         'id_preference',
#         'user',
#         'enrollment_enabled',
#         'track_completed_enabled',
#         'deadline_reminders_enabled',
#         'quiz_results_enabled',
#         'activity_completed_enabled',
#         'system_notifications_enabled',
#         'email_enabled',
#         'push_enabled',
#     ]
#     list_filter = [
#         'enrollment_enabled',
#         'track_completed_enabled',
#         'deadline_reminders_enabled',
#         'quiz_results_enabled',
#         'activity_completed_enabled',
#         'system_notifications_enabled',
#         'email_enabled',
#         'push_enabled',
#         'updated_at',
#     ]
#     search_fields = [
#         'user__email',
#         'user__username',
#     ]
#     readonly_fields = [
#         'id_preference',
#         'updated_at',
#     ]
#     fieldsets = (
#         ('Usuário', {
#             'fields': (
#                 'id_preference',
#                 'user',
#             )
#         }),
#         ('Preferências de Notificação', {
#             'fields': (
#                 'enrollment_enabled',
#                 'track_completed_enabled',
#                 'deadline_reminders_enabled',
#                 'quiz_results_enabled',
#                 'activity_completed_enabled',
#                 'system_notifications_enabled',
#             )
#         }),
#         ('Canais de Notificação', {
#             'fields': (
#                 'email_enabled',
#                 'push_enabled',
#             )
#         }),
#         ('Timestamps', {
#             'fields': (
#                 'updated_at',
#             ),
#             'classes': ('collapse',)
#         }),
#     )
#     ordering = ['-updated_at']

# Notificações já registradas via @admin.register em admin_notifications.py
