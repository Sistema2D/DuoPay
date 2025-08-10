#!/bin/bash

# Script de inicialização do sistema DuoPay
# Este script configura automaticamente o banco de dados

echo "==================================="
echo "    INICIALIZADOR DUOPAY"
echo "==================================="
echo ""

# Verificar se o MySQL está rodando
echo "1. Verificando se o MySQL está ativo..."
if ! mysqladmin ping -h"localhost" --silent; then
    echo "❌ ERRO: MySQL não está rodando!"
    echo "   Por favor, inicie o XAMPP e certifique-se de que o MySQL está ativo."
    echo ""
    read -p "Pressione ENTER para tentar novamente..." dummy
    if ! mysqladmin ping -h"localhost" --silent; then
        echo "❌ MySQL ainda não está acessível. Abortando."
        exit 1
    fi
fi

echo "✅ MySQL está ativo!"
echo ""

# Configuração do banco
DB_NAME="fik_liso"
DB_USER="root"
DB_PASS=""

echo "2. Configurando banco de dados..."
echo "   - Nome do banco: $DB_NAME"
echo "   - Usuário: $DB_USER"
echo ""

# Criar banco e tabelas
echo "3. Executando script SQL..."
mysql -u"$DB_USER" -p"$DB_PASS" < database/create_database.sql

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados configurado com sucesso!"
else
    echo "❌ Erro ao configurar banco de dados."
    exit 1
fi

echo ""
echo "4. Verificando estrutura do banco..."

# Verificar se as tabelas foram criadas
TABLES=$(mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | grep -v "Tables_in")

if [ -z "$TABLES" ]; then
    echo "❌ Nenhuma tabela encontrada!"
    exit 1
fi

echo "✅ Tabelas criadas:"
echo "$TABLES" | while read table; do
    echo "   - $table"
done

echo ""
echo "5. Verificando usuário padrão..."

# Verificar se o usuário admin existe
USER_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -se "SELECT COUNT(*) FROM users WHERE username='admin';" 2>/dev/null)

if [ "$USER_COUNT" = "1" ]; then
    echo "✅ Usuário admin configurado!"
    echo "   - Usuário: admin"
    echo "   - Senha: admin"
else
    echo "❌ Usuário admin não encontrado!"
    exit 1
fi

echo ""
echo "==================================="
echo "     CONFIGURAÇÃO CONCLUÍDA!"
echo "==================================="
echo ""
echo "🎉 O sistema DuoPay está pronto para uso!"
echo ""
echo "📋 INFORMAÇÕES IMPORTANTES:"
echo "   • URL da aplicação: http://localhost/anaehugo/"
echo "   • Login padrão: admin / admin"
echo "   • Banco de dados: $DB_NAME"
echo ""
echo "🔒 SEGURANÇA:"
echo "   • Altere a senha padrão após o primeiro login"
echo "   • Sessões expiram em 5 minutos de inatividade"
echo "   • Verificação automática de sessão a cada 30 segundos"
echo ""
echo "📊 FUNCIONALIDADES:"
echo "   • Gestão completa de transações financeiras"
echo "   • Relatórios e gráficos interativos"
echo "   • Sistema de categorias personalizáveis"
echo "   • Interface responsiva e moderna"
echo ""
echo "Pressione ENTER para finalizar..."
read dummy
