from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	"""Admin registration for the custom User model."""
	model = User
	list_display = ("id", "email", "username", "role", "is_staff")
	list_filter = ("role", "is_staff", "is_superuser")
	search_fields = ("email", "username")
	ordering = ("id",)

	# add role field to the existing fieldsets from Django's UserAdmin
	fieldsets = DjangoUserAdmin.fieldsets + (("Extra", {"fields": ("role",)}),)
	add_fieldsets = DjangoUserAdmin.add_fieldsets + (("Extra", {"fields": ("role",)}),)
