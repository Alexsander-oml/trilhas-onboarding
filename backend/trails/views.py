from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import Trail
from .serializers import TrailSerializer
from .permissions import IsOwnerOrAdmin


class TrailViewSet(viewsets.ModelViewSet):
    """Basic CRUD for trails. The frontend expects standard REST endpoints:
    - GET /api/trails/
    - POST /api/trails/
    - GET /api/trails/{id}/
    - PATCH /api/trails/{id}/
    - DELETE /api/trails/{id}/
    - POST /api/trails/{id}/publish/  (custom action)
    """

    queryset = Trail.objects.all()
    serializer_class = TrailSerializer
    permission_classes = (IsAuthenticatedOrReadOnly, IsOwnerOrAdmin)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        trail = self.get_object()
        # Only owner or admin can publish (IsOwnerOrAdmin enforces)
        trail.is_published = True
        trail.updated_by = request.user
        trail.save()
        return Response({'status': 'published'}, status=status.HTTP_200_OK)
