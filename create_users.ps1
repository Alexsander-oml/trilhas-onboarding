# Script PowerShell para criar usuários iniciais no Django

Write-Host "Criando usuários de teste..." -ForegroundColor Cyan

# Criar perfis
Write-Host "`nCriando perfis..." -ForegroundColor Yellow
docker exec trilhas_onboarding_db psql -U postgres -d onboarding -c "INSERT INTO users_perfil (nome, descricao) VALUES ('Administrador', 'Perfil de administrador do sistema'), ('Aprendiz', 'Perfil de aprendiz do sistema'), ('Mentor', 'Perfil de mentor do sistema'), ('Gestor', 'Perfil de gestor do sistema'), ('Autor de Conteúdo', 'Perfil de autor de conteúdo') ON CONFLICT DO NOTHING;"

# Criar usuário admin
Write-Host "`nCriando usuário admin..." -ForegroundColor Yellow
docker exec trilhas_onboarding_backend python manage.py shell -c "from users.models import User, Perfil; perfil = Perfil.objects.get(nome='Administrador'); User.objects.get_or_create(username='admin', defaults={'email':'admin@trilhas.com', 'perfil':perfil, 'is_active':True, 'ativo':True, 'is_staff':True, 'is_superuser':True}); u = User.objects.get(username='admin'); u.set_password('admin123'); u.save(); print('✅ Admin criado/atualizado')"

# Criar usuário aprendiz
Write-Host "Criando usuário aprendiz..." -ForegroundColor Yellow
docker exec trilhas_onboarding_backend python manage.py shell -c "from users.models import User, Perfil; perfil = Perfil.objects.get(nome='Aprendiz'); User.objects.get_or_create(username='aprendiz', defaults={'email':'aprendiz@trilhas.com', 'perfil':perfil, 'is_active':True, 'ativo':True}); u = User.objects.get(username='aprendiz'); u.set_password('aprendiz123'); u.save(); print('✅ Aprendiz criado/atualizado')"

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green
Write-Host "`nCredenciais de acesso:" -ForegroundColor Cyan
Write-Host "Admin: admin@trilhas.com / admin123" -ForegroundColor White
Write-Host "Aprendiz: aprendiz@trilhas.com / aprendiz123" -ForegroundColor White
