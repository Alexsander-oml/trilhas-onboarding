from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserLoginView,
    UserRegisterView,
    ProtectedView,
    AdminUserRegisterView,
    CurrentUserView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserBulkDeleteView,
    TrailProgressView,
    InitializeTrailProgressView,
    UserEnrollmentsView,
)

# Notas rápidas sobre rotas relevantes para o frontend (Aprendiz):
# - GET  /api/user/enrollments/                     -> lista de enrollments do usuário (uso preferencial)
# - GET  /api/trails/<trail_id>/progress/           -> checar inscrição para trilha específica
# - POST /api/trails/<trail_id>/progress/initialize/-> criar/obter inscrição (acao de inscrever)


urlpatterns = [
    path("auth/login/", UserLoginView.as_view(), name="token_obtain_pair"),
    path("auth/login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", UserRegisterView.as_view(), name="user_register"),
    path("auth/user/", CurrentUserView.as_view(), name="current_user"),
    path("protected/", ProtectedView.as_view(), name="protected_view"),
    path("admin/register/", AdminUserRegisterView.as_view(), name="admin_user_register"),
    path("admin/users/", AdminUserListView.as_view(), name="admin_user_list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
    path("admin/users/bulk-delete/", AdminUserBulkDeleteView.as_view(), name="admin_user_bulk_delete"),
    # === Progress endpoints (trails enrollment) ===
    path("trails/<int:trail_id>/progress/", TrailProgressView.as_view(), name="trail_progress"),
    path("trails/<int:trail_id>/progress/initialize/", InitializeTrailProgressView.as_view(), name="trail_progress_initialize"),
    # endpoint que retorna todas as inscrições do usuário autenticado
    path("user/enrollments/", UserEnrollmentsView.as_view(), name="user_enrollments"),
]
