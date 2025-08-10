# DuoPay - Sistema de Gestão Financeira Familiar

## 🚀 Visão Geral

O **DuoPay** é um sistema moderno e intuitivo para gestão financeira familiar, desenvolvido com foco na usabilidade e segurança. Oferece controle completo das suas finanças com interface responsiva e recursos avançados de visualização.

## ✨ Principais Funcionalidades

### 💰 Gestão Financeira
- **Controle de Receitas e Despesas**: Adicione, edite e delete transações facilmente
- **Categorização Automática**: Organize suas transações por categorias personalizáveis
- **Saldo em Tempo Real**: Acompanhe seu saldo atual com atualizações automáticas
- **Histórico Completo**: Visualize todas as transações com filtros avançados

### 📊 Relatórios e Análises
- **Gráficos Interativos**: Visualize seus dados com Chart.js
- **Resumos por Período**: Analise receitas, despesas e saldo por mês/ano
- **Tendências Financeiras**: Acompanhe a evolução das suas finanças

### � Segurança e Autenticação
- **Sistema de Login Seguro**: Autenticação com criptografia de senhas
- **Sessões Controladas**: Timeout automático por inatividade (5 minutos)
- **Validação Contínua**: Verificação de sessão a cada 30 segundos
- **Logout Automático**: Proteção contra acesso não autorizado

### 🎨 Interface Moderna
- **Design Glassmorphism**: Interface elegante com efeitos visuais modernos
- **Tema Claro/Escuro**: Alternância entre temas para melhor experiência
- **Responsividade Completa**: Funciona perfeitamente em desktop, tablet e mobile
- **Animações Suaves**: Transições fluidas e feedback visual

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica moderna
- **CSS3** - Estilos avançados com Grid Layout e Flexbox
- **JavaScript ES6+** - Funcionalidades interativas e AJAX
- **Bootstrap 5.3.2** - Framework responsivo
- **Chart.js** - Gráficos interativos
- **Font Awesome** - Ícones modernos

### Backend
- **PHP 8+** - Lógica do servidor e APIs
- **MySQL** - Banco de dados relacional
- **Apache** - Servidor web (via XAMPP)

### Segurança
- **bcrypt** - Hash de senhas
- **Sessões PHP** - Controle de acesso
- **Validação de entrada** - Proteção contra injeções
- **CORS** - Controle de origem cruzada

## 📋 Pré-requisitos

1. **XAMPP** (recomendado) ou similar com:
   - Apache 2.4+
   - PHP 8.0+
   - MySQL 5.7+

2. **Navegador Moderno**:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

## 🚀 Instalação

### Método Automático (Recomendado)

1. **Baixe e extraia** os arquivos para `C:\xampp\htdocs\anaehugo\`

2. **Inicie o XAMPP** Control Panel e ative:
   - Apache
   - MySQL

3. **Execute o script de configuração**:
   
   **Windows (PowerShell como Administrador):**
   ```powershell
   cd C:\xampp\htdocs\anaehugo
   .\setup.ps1
   ```
   
   **Linux/Mac (Terminal):**
   ```bash
   cd /opt/lampp/htdocs/anaehugo
   chmod +x setup.sh
   ./setup.sh
   ```

4. **Acesse a aplicação**: http://localhost/anaehugo/

### Método Manual

1. **Configure o banco de dados**:
   ```sql
   -- Execute no phpMyAdmin ou MySQL CLI
   SOURCE database/create_database.sql;
   ```

2. **Verifique as configurações** em `config.php`:
   ```php
   $host = 'localhost';
   $username = 'root';
   $password = '';
   $database = 'fik_liso';
   ```

3. **Acesse a aplicação**: http://localhost/anaehugo/

## 🔐 Primeiro Acesso

### Credenciais Padrão
- **Usuário**: `admin`
- **Senha**: `admin`

> ⚠️ **IMPORTANTE**: Altere a senha padrão imediatamente após o primeiro login!

### Configurações de Segurança
- **Timeout de Sessão**: 5 minutos de inatividade
- **Verificação Automática**: A cada 30 segundos
- **Logout Automático**: Por inatividade ou expiração

## 📁 Estrutura do Projeto

```
anaehugo/
├── 📄 index.html          # Página principal da aplicação
├── 📄 login.html          # Tela de login
├── 📄 styles.css          # Estilos principais
├── 📄 script.js           # JavaScript principal
├── 📄 api.php             # API de transações
├── 📄 auth.php            # API de autenticação
├── 📄 config.php          # Configurações do banco
├── 📄 setup.ps1           # Script de instalação (Windows)
├── 📄 setup.sh            # Script de instalação (Linux/Mac)
├── 📄 README.md           # Este arquivo
└── 📁 database/
    └── 📄 create_database.sql  # Script de criação do banco
```

## 🎯 Como Usar

### 1. **Login**
- Acesse http://localhost/anaehugo/
- Use as credenciais padrão: `admin` / `admin`
- Altere a senha no primeiro acesso

### 2. **Adicionar Transações**
- Clique em "Adicionar Transação"
- Preencha: descrição, valor, categoria, tipo (receita/despesa)
- Confirme para salvar

### 3. **Editar Transações**
- Clique no ícone de edição (✏️) na transação desejada
- Modifique os campos necessários
- Salve as alterações

### 4. **Visualizar Relatórios**
- Use os filtros de data para selecionar períodos
- Visualize gráficos e resumos automáticos
- Acompanhe a evolução do saldo

### 5. **Configurações**
- Alterne entre tema claro/escuro
- Configure auto-refresh
- Gerencie categorias

## Funcionalidades
- ✅ **Painel principal** com resumo financeiro mensal
- ✅ **Cadastro de receitas e despesas** com categorização
- ✅ **Categorias pré-definidas** incluindo Cartão de Crédito e Empréstimo
- ✅ **Controle de status de pagamento** visual
- ✅ **Histórico de transações** por período
- ✅ **Gráfico de evolução** comparando receitas vs despesas
- ✅ **Alertas para contas em atraso** automáticos
- ✅ **Interface responsiva** com animações suaves
- ✅ **Persistência no banco de dados** MySQL
- ✅ **Fallback para localStorage** em caso de falha

## Configuração

### 1. Banco de Dados
O banco de dados será criado automaticamente quando você acessar a aplicação pela primeira vez. Se preferir criar manualmente:

```sql
CREATE DATABASE financial_manager;
USE financial_manager;

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    payment_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. XAMPP
- Certifique-se de que o Apache e MySQL estão rodando
- Coloque os arquivos na pasta `C:\xampp\htdocs\anaehugo\`
- Acesse: `http://localhost/anaehugo/`

## API Endpoints

### GET /api.php
Retorna todas as transações
```json
{
    "success": true,
    "data": [...]
}
```

### POST /api.php
Cria uma nova transação
```json
{
    "description": "Salário",
    "amount": 3000.00,
    "type": "income",
    "payment_date": "2024-01-15",
    "isPaid": true
}
```

### PUT /api.php
Atualiza uma transação existente
```json
{
    "id": 1,
    "isPaid": true
}
```

### DELETE /api.php?id=1
Remove uma transação

## Tecnologias Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript ES6, Bootstrap 5.3.2
- **Gráficos**: Chart.js para visualização de dados
- **Backend**: PHP 8+
- **Banco de Dados**: MySQL
- **Servidor**: Apache (XAMPP)
- **Ícones**: Font Awesome 6.4.0
- **Recursos**: Modo escuro, Toasts, Animações CSS, Categorização

## 🎨 Temas e Interface
- **Tema Automático**: Detecta preferência do sistema
- **Tema Claro**: Interface clara e moderna
- **Tema Escuro**: Ideal para uso noturno
- **Alternância**: Botão no canto superior direito
- **Gradientes**: Efeitos visuais modernos em cards e botões
- **Animações**: Transições suaves e responsivas

## Recursos Especiais
- **Interface responsiva** com Bootstrap Grid System
- **Sistema de notificações** com Bootstrap Toasts
- **Indicador de carregamento** com spinner animado
- **Sugestões automáticas** baseadas no histórico
- **Sistema de backup** com localStorage
- **Validação de dados** no frontend e backend
- **Tratamento de erros** robusto
- **Modo escuro/claro** com alternância suave
- **Gradientes e animações** modernas
- **Cards interativos** com hover effects

## Como Usar
1. Acesse a aplicação no navegador
2. Use a aba "Transações" para adicionar receitas e despesas
3. Acompanhe o resumo na aba "Dashboard"
4. Consulte o histórico na aba "Histórico"
5. Gerencie status de pagamento clicando nos ícones de cada transação

## Suporte
Esta aplicação foi refatorada de uma versão React original para uma arquitetura mais simples e compatível com XAMPP, mantendo todas as funcionalidades essenciais e adicionando:

### 🆕 Melhorias na Nova Versão:
- ✅ **Bootstrap 5.3.2** para interface moderna
- ✅ **Modo escuro nativo** com alternância suave  
- ✅ **Sistema de notificações** com Bootstrap Toasts
- ✅ **Animações CSS** e efeitos de hover
- ✅ **Gradientes modernos** em cards e botões
- ✅ **Responsividade aprimorada** para todos os dispositivos
- ✅ **Performance otimizada** com carregamento mais rápido
