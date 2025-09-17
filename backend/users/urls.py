from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserLoginView, UserRegisterView, ProtectedView, AdminUserRegisterView

urlpatterns = [
    path("auth/login/", UserLoginView.as_view(), name="token_obtain_pair"),
    path("auth/login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", UserRegisterView.as_view(), name="user_register"),
    path("protected/", ProtectedView.as_view(), name="protected_view"),
    path("admin/register/", AdminUserRegisterView.as_view(), name="admin_user_register"),
]