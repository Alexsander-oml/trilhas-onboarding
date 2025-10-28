from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Trail(models.Model):
    """A simple Trail model to back the frontend trail editor/viewer.

    Kept intentionally small to avoid extra dependencies. The frontend
    integration guide expects endpoints for CRUD and publish/duplicate.
    """

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=50, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True, help_text='Estimated duration in minutes')
    is_published = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_trails'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_trails'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:
        return f"Trail(id={self.pk} title={self.title})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:200]
            slug = base
            # ensure uniqueness in a simple way
            i = 1
            while Trail.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)
