from users.models import User

# Atualizar senha do admin
admin = User.objects.get(username='admin')
admin.set_password('admin123')
admin.save()

print("✅ Senha do admin atualizada!")
print(f"   Username: admin")
print(f"   Email: {admin.email}")
print(f"   Password: admin123")
