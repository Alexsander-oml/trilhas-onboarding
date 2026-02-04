from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserLoginView,
    UserRegisterView,
    ProtectedView,
    AdminUserRegisterView,
    ProfileDashboardView,
    UserDetailView,
    CurrentUserView,
    LogoutView,
    ChangePasswordView,
    ResetPasswordView,
    UserEnrollmentsView,
    AdminUsersListView,
)
from .views_learner import UserInfoView, PerfilUpdateView, PainelAprendizView
from .views_import import ImportarUsuariosView, status_importacao, validar_arquivo_importacao

urlpatterns = [
    # Autenticação
    path("auth/login/", UserLoginView.as_view(), name="token_obtain_pair"),
    path("auth/login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", UserRegisterView.as_view(), name="user_register"),
    path("auth/user/", CurrentUserView.as_view(), name="current_user"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    
    # Dashboard e Perfil
    path("enrollments/", UserEnrollmentsView.as_view(), name="user_enrollments"),
    path("dashboard/", ProfileDashboardView.as_view(), name="profile_dashboard"),
    path("protected/", ProtectedView.as_view(), name="protected_view"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("admin/register/", AdminUserRegisterView.as_view(), name="admin_user_register"),
    path("admin/users/", AdminUsersListView.as_view(), name="admin_users_list"),
    
    # Painel do Aprendiz
    path("me/", UserInfoView.as_view(), name="user_info"),
    path("perfil/", PerfilUpdateView.as_view(), name="perfil_update"),
    path("<int:pk>/profile/", PerfilUpdateView.as_view(), name="user_profile_update"),  # Frontend compatibility
    path("painel/", PainelAprendizView.as_view(), name="painel_aprendiz"),
    
    # Importação de Usuários
    path("import/", ImportarUsuariosView.as_view(), name="import_users"),
    path("import/status/", status_importacao, name="import_status"),
    path("import/validar/", validar_arquivo_importacao, name="import_validar"),
]