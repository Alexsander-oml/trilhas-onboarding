from rest_framework import serializers

from .models import Trail


class TrailSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Trail
        fields = (
            'id', 'title', 'slug', 'description', 'level', 'duration', 'is_published',
            'created_by', 'updated_by', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'slug', 'created_by', 'updated_by', 'created_at', 'updated_at')
