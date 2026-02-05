"""
Merge migration to resolve conflicting leaf nodes 0002 and 0003.

This file was generated manually to resolve the migration graph conflict
`Conflicting migrations detected; multiple leaf nodes in the migration graph`.

It depends on both migrations and performs no operations — Django will
consider the graph merged and you can run `migrate` normally.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_perfil_remove_user_role_user_cargo_and_more"),
        ("users", "0003_add_avatar_field"),
    ]

    operations = []
