from django.contrib import admin
from .models import Trail


@admin.register(Trail)
class TrailAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'is_published', 'created_by', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')
