# DuoPay - Deploy Vercel

## 🚀 Configuração para Deploy no Vercel

Esta aplicação foi configurada para deploy no Vercel usando PHP Functions.

### 📁 Estrutura do Projeto

```
/
├── public/              # Frontend (HTML, CSS, JS)
│   ├── index.html       # Página principal
│   ├── login.html       # Página de login
│   ├── styles.css       # Estilos
│   └── script.js        # JavaScript
├── api/                 # Backend PHP Functions
│   ├── api.php          # API principal
│   ├── auth.php         # Autenticação
│   ├── users_api.php    # Gestão de usuários
│   └── config.php       # Configuração do banco
├── vercel.json          # Configuração do Vercel
└── package.json         # Metadados do projeto
```

### ⚙️ Variáveis de Ambiente Necessárias

Configure no Vercel Dashboard:

```bash
DB_HOST=seu-host-mysql
DB_NAME=seu-banco
DB_USER=seu-usuario
DB_PASS=sua-senha
DB_PORT=3306
DB_SSL=true  # Para conexões seguras
```

### 🗄️ Banco de Dados Recomendado

- **PlanetScale** (MySQL serverless)
- **Vercel Postgres** (PostgreSQL)
- **Railway** (MySQL/PostgreSQL)

### 📝 Comandos para Deploy

```bash
# 1. Conectar repositório ao Vercel
vercel --prod

# 2. Configurar variáveis de ambiente
vercel env add DB_HOST
vercel env add DB_NAME
vercel env add DB_USER
vercel env add DB_PASS

# 3. Deploy
vercel --prod
```

### 🔧 Configurações do Vercel

O arquivo `vercel.json` já está configurado para:
- ✅ PHP Functions para backend
- ✅ Servir arquivos estáticos
- ✅ Roteamento correto
- ✅ PHP 8.1

### 🌐 URLs da Aplicação

- **Frontend**: `https://seu-projeto.vercel.app/`
- **Login**: `https://seu-projeto.vercel.app/login`
- **API**: `https://seu-projeto.vercel.app/api/`

### ⚠️ Limitações do Vercel (PHP)

- Tempo máximo de execução: 10s
- Sem estado persistente
- Cold starts podem ocorrer
- Ideal para APIs stateless

### 🚀 Deploy Status

✅ Estrutura reorganizada  
✅ Caminhos de API ajustados  
✅ Configuração do banco compatível  
✅ vercel.json configurado  
✅ Pronto para deploy!
