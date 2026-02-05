from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, Perfil, Setor, SubSetor


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
	list_display = ("id_perfil", "nome")
	search_fields = ("nome",)


@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
	list_display = ("id_setor", "nome", "ativo", "data_criacao")
	list_filter = ("ativo",)
	search_fields = ("nome",)
	ordering = ("nome",)


@admin.register(SubSetor)
class SubSetorAdmin(admin.ModelAdmin):
	list_display = ("id_subsetor", "setor", "nome", "ativo", "data_criacao")
	list_filter = ("ativo", "setor")
	search_fields = ("nome", "setor__nome")
	ordering = ("setor__nome", "nome")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
	# Use email as the main identifier in list and ordering
	list_display = ("email", "username", "first_name", "last_name", "perfil", "setor", "ativo", "is_staff")
	list_filter = ("is_staff", "is_superuser", "is_active", "ativo", "perfil", "setor")
	search_fields = ("email", "username", "first_name", "last_name", "cargo")
	ordering = ("email",)

	fieldsets = (
		(None, {"fields": ("email", "password")}),
		(_("Personal info"), {"fields": ("username", "first_name", "last_name", "cargo", "setor", "subsetor", "unidade", "localidade", "tipo_contrato", "data_admissao", "perfil")}),
		(_("Permissions"), {"fields": ("ativo", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")} ),
		(_("Important dates"), {"fields": ("last_login", "date_joined")}),
	)

	add_fieldsets = (
		(None, {
			"classes": ("wide",),
			"fields": ("email", "username", "password1", "password2", "first_name", "last_name", "cargo", "setor", "subsetor", "perfil", "is_staff", "is_superuser"),
		}),
	)
