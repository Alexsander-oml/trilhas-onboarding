"""Add avatar ImageField to User model."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_create_enrollment'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/'),
        ),
    ]
