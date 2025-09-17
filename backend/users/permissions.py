from rest_framework.permissions import BasePermission

class IsRole(BasePermission):
    def has_permission(self, request, view):
        # Assumes the user is authenticated via SimpleJWT and the token contains a 'role' claim
        if not request.user or not request.user.is_authenticated:
            return False

        required_roles = getattr(view, 'required_roles', None)

        if required_roles is None:
            # If no roles are specified, allow access (or deny, depending on default policy)
            return True

        return request.user.role in required_roles


