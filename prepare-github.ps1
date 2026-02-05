# Script para preparar o repositório para GitHub
# Uso: .\prepare-github.ps1

Write-Host "🧹 Limpando arquivos desnecessários..." -ForegroundColor Green

# Remover __pycache__
Write-Host "`n📁 Removendo __pycache__..." -ForegroundColor Cyan
Get-ChildItem -Path . -Filter __pycache__ -Recurse -Directory | Remove-Item -Recurse -Force

# Remover .pyc files
Write-Host "`n📦 Removendo arquivos .pyc..." -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "*.pyc" -Recurse | Remove-Item -Force

# Limpar dist do frontend
Write-Host "`n📁 Limpando dist do frontend..." -ForegroundColor Cyan
if (Test-Path "frontend/dist") {
    Remove-Item "frontend/dist" -Recurse -Force
}

# Limpar node_modules (opcional - comentado)
# Write-Host "`n📁 Removendo node_modules..." -ForegroundColor Cyan
# if (Test-Path "frontend/node_modules") {
#     Remove-Item "frontend/node_modules" -Recurse -Force
# }

# Remover logs
Write-Host "`n📝 Removendo arquivos de log..." -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "*.log" -Recurse | Remove-Item -Force

# Verificar .env files
Write-Host "`n🔒 Verificando arquivos .env..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Path . -Filter ".env" -Recurse
if ($envFiles) {
    Write-Host "⚠️  Encontrados .env files:" -ForegroundColor Yellow
    foreach ($file in $envFiles) {
        Write-Host "   - $($file.FullName)" -ForegroundColor Yellow
    }
    Write-Host "`n❌ CUIDADO: Não commit .env files! Apenas .env.example" -ForegroundColor Red
} else {
    Write-Host "✅ Nenhum .env file na raiz (OK)" -ForegroundColor Green
}

Write-Host "`n✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. git status             # Verificar mudanças"
Write-Host "   2. git add .              # Adicionar arquivos"
Write-Host "   3. git commit -m '...'    # Commit"
Write-Host "   4. git push origin main   # Push" -ForegroundColor Green
