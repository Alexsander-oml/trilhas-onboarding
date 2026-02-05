from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrAdmin(BasePermission):
    """Allow safe methods for any, creation for authenticated users,
    and modifications only for owners (created_by) or staff.
    """

    def has_permission(self, request, view):
        # Allow list/retrieve for any (handled by view), require auth for create
        if view.action == 'create':
            return request.user and request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # allow if user is staff
        if request.user and request.user.is_staff:
            return True
        # allow if user created the object
        return getattr(obj, 'created_by_id', None) == getattr(request.user, 'id', None)
