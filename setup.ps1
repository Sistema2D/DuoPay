# Script de inicialização do sistema DuoPay para Windows
# Execute este script no PowerShell como Administrador

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "    INICIALIZADOR DUOPAY" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Configuração do banco
$dbName = "fik_liso"
$dbUser = "root"
$dbPass = ""
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"

# Verificar se o XAMPP está instalado
Write-Host "1. Verificando instalação do XAMPP..." -ForegroundColor Yellow
if (-not (Test-Path $mysqlPath)) {
    Write-Host "❌ ERRO: MySQL não encontrado no caminho padrão do XAMPP!" -ForegroundColor Red
    Write-Host "   Caminho esperado: $mysqlPath" -ForegroundColor Gray
    Write-Host "   Por favor, verifique se o XAMPP está instalado corretamente." -ForegroundColor Gray
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "✅ XAMPP encontrado!" -ForegroundColor Green
Write-Host ""

# Verificar se o MySQL está rodando
Write-Host "2. Verificando se o MySQL está ativo..." -ForegroundColor Yellow
try {
    $testConnection = & $mysqlPath -u$dbUser -p$dbPass -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL não está respondendo"
    }
    Write-Host "✅ MySQL está ativo!" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: MySQL não está rodando!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o XAMPP Control Panel e inicie o serviço MySQL." -ForegroundColor Gray
    Write-Host ""
    Read-Host "Pressione ENTER para tentar novamente"
    
    try {
        $testConnection = & $mysqlPath -u$dbUser -p$dbPass -e "SELECT 1;" 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "MySQL ainda não está respondendo"
        }
        Write-Host "✅ MySQL está ativo agora!" -ForegroundColor Green
    } catch {
        Write-Host "❌ MySQL ainda não está acessível. Abortando." -ForegroundColor Red
        Read-Host "Pressione ENTER para sair"
        exit 1
    }
}

Write-Host ""

# Configuração do banco
Write-Host "3. Configurando banco de dados..." -ForegroundColor Yellow
Write-Host "   - Nome do banco: $dbName" -ForegroundColor Gray
Write-Host "   - Usuário: $dbUser" -ForegroundColor Gray
Write-Host ""

# Executar script SQL
Write-Host "4. Executando script SQL..." -ForegroundColor Yellow
try {
    $sqlScript = Get-Content "database\create_database.sql" -Raw
    $sqlScript | & $mysqlPath -u$dbUser -p$dbPass
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco de dados configurado com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro ao executar script SQL"
    }
} catch {
    Write-Host "❌ Erro ao configurar banco de dados." -ForegroundColor Red
    Write-Host "   Verifique se o arquivo database\create_database.sql existe." -ForegroundColor Gray
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""

# Verificar estrutura do banco
Write-Host "5. Verificando estrutura do banco..." -ForegroundColor Yellow
try {
    $tables = & $mysqlPath -u$dbUser -p$dbPass -D$dbName -e "SHOW TABLES;" 2>$null | Where-Object {$_ -notmatch "Tables_in"}
    
    if ($tables.Count -gt 0) {
        Write-Host "✅ Tabelas criadas:" -ForegroundColor Green
        foreach ($table in $tables) {
            Write-Host "   - $table" -ForegroundColor Gray
        }
    } else {
        throw "Nenhuma tabela encontrada"
    }
} catch {
    Write-Host "❌ Erro ao verificar tabelas!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""

# Verificar usuário padrão
Write-Host "6. Verificando usuário padrão..." -ForegroundColor Yellow
try {
    $userCount = & $mysqlPath -u$dbUser -p$dbPass -D$dbName -se "SELECT COUNT(*) FROM users WHERE username='admin';" 2>$null
    
    if ($userCount -eq "1") {
        Write-Host "✅ Usuário admin configurado!" -ForegroundColor Green
        Write-Host "   - Usuário: admin" -ForegroundColor Gray
        Write-Host "   - Senha: admin" -ForegroundColor Gray
    } else {
        throw "Usuário admin não encontrado"
    }
} catch {
    Write-Host "❌ Usuário admin não encontrado!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "     CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 O sistema DuoPay está pronto para uso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INFORMAÇÕES IMPORTANTES:" -ForegroundColor Yellow
Write-Host "   • URL da aplicação: http://localhost/anaehugo/" -ForegroundColor Gray
Write-Host "   • Login padrão: admin / admin" -ForegroundColor Gray
Write-Host "   • Banco de dados: $dbName" -ForegroundColor Gray
Write-Host ""
Write-Host "🔒 SEGURANÇA:" -ForegroundColor Yellow
Write-Host "   • Altere a senha padrão após o primeiro login" -ForegroundColor Gray
Write-Host "   • Sessões expiram em 5 minutos de inatividade" -ForegroundColor Gray
Write-Host "   • Verificação automática de sessão a cada 30 segundos" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 FUNCIONALIDADES:" -ForegroundColor Yellow
Write-Host "   • Gestão completa de transações financeiras" -ForegroundColor Gray
Write-Host "   • Relatórios e gráficos interativos" -ForegroundColor Gray
Write-Host "   • Sistema de categorias personalizáveis" -ForegroundColor Gray
Write-Host "   • Interface responsiva e moderna" -ForegroundColor Gray
Write-Host ""
Read-Host "Pressione ENTER para finalizar"
