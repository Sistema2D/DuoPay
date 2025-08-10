// Global variables
let transactions = [];
let currentTab = 'dashboard';

// API endpoints
const API_URL = '/api/api.php';
const AUTH_URL = '/api/auth.php';
const USERS_URL = '/api/users_api.php';

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    let newTheme;
    
    switch(currentTheme) {
        case 'light':
            newTheme = 'dark';
            break;
        case 'dark':
            newTheme = 'light';
            break;
        case 'auto':
            newTheme = 'light';
            break;
        default:
            newTheme = 'dark';
            break;
    }
    
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle?.querySelector('i');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Alternar para Tema Claro';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Alternar para Tema Escuro';
        }
    }
}

// Suggestions for transaction descriptions
const suggestions = {
    income: ['Salário', 'Freelance', 'Venda', 'Investimento', 'Presente', 'Bonificação'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Conta de Luz', 'Conta de Água', 'Internet']
};

// Categories for transactions
const categories = {
    income: [
        'Salário',
        'Freelance',
        'Vendas',
        'Investimentos',
        'Renda Extra',
        'Presente/Doação',
        'Bonificação',
        'Aposentadoria',
        'Aluguel Recebido',
        'Dividendos',
        'Outros'
    ],
    expense: [
        'Alimentação',
        'Transporte',
        'Moradia',
        'Saúde',
        'Lazer',
        'Educação',
        'Conta de Luz',
        'Conta de Água',
        'Internet',
        'Telefone',
        'Cartão de Crédito',
        'Empréstimo',
        'Combustível',
        'Vestuário',
        'Supermercado',
        'Farmácia',
        'Academia',
        'Seguros',
        'Impostos',
        'Outros'
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeTheme();
    await loadTransactions();
    updateCurrentMonth();
    initializeCategories();
    initializeForm();
    updateSuggestions(); // Moved after initializeForm
    initializeChart();
    initializeHistoryFilters(); // New history functionality
    
    // Load last used category
    setTimeout(() => {
        loadLastCategory();
    }, 500);
    
    // Set default history date to current month (legacy support)
    const historyDateElement = document.getElementById('history-date');
    if (historyDateElement) {
        historyDateElement.value = new Date().toISOString().slice(0, 7);
    }
    
    // Add theme toggle event listener
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Add auto-refresh status click listener
    const autoRefreshStatus = document.getElementById('auto-refresh-status');
    if (autoRefreshStatus) {
        autoRefreshStatus.addEventListener('click', toggleAutoRefresh);
        autoRefreshStatus.style.cursor = 'pointer';
    }
    
    // Initialize auto-refresh system
    initializeAutoRefresh();
});

// API Functions
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Categories Management
function initializeCategories() {
    updateCategoriesAndSuggestions();
}

function updateCategoriesAndSuggestions() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateLabel = document.getElementById('date-label');
    const paidGroup = document.getElementById('paid-group');
    
    if (!typeSelect || !categorySelect) return;
    
    const selectedType = typeSelect.value;
    
    // Update categories
    categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    categories[selectedType].forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Update date label and payment checkbox visibility (only if elements exist)
    if (dateLabel && paidGroup) {
        if (selectedType === 'income') {
            dateLabel.textContent = 'Recebimento';
            paidGroup.style.display = 'none';
        } else {
            dateLabel.textContent = 'Vencimento';
            paidGroup.style.display = 'block';
        }
    }
    
    // Update suggestions
    updateSuggestions();
}

// Chart Management
function initializeChart() {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) return;
    
    evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Receitas',
                data: [],
                borderColor: 'rgb(25, 135, 84)',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Despesas',
                data: [],
                borderColor: 'rgb(220, 53, 69)',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução Mensal de Receitas e Despesas'
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            }
        }
    });
    
    updateChart();
}

function updateChart() {
    if (!evolutionChart) return;
    
    // Get last 12 months data
    const monthlyData = getMonthlyEvolutionData();
    
    evolutionChart.data.labels = monthlyData.labels;
    evolutionChart.data.datasets[0].data = monthlyData.income;
    evolutionChart.data.datasets[1].data = monthlyData.expenses;
    evolutionChart.update('smooth');
}

function getMonthlyEvolutionData() {
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
        });
        
        months.push(monthName);
        
        // Calculate totals for this month
        const monthTransactions = transactions.filter(t => 
            t.payment_date && t.payment_date.startsWith(monthKey)
        );
        
        const monthIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        incomeData.push(monthIncome);
        expenseData.push(monthExpenses);
    }
    
    return {
        labels: months,
        income: incomeData,
        expenses: expenseData
    };
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('d-none');
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.remove('d-none');
        targetTab.classList.add('active', 'fade-in');
    }
    
    // Add active class to clicked button
    const activeButton = document.getElementById(tabName + '-tab');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Update content based on tab
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'transactions') {
        updateTransactionsList();
    } else if (tabName === 'evolution') {
        loadEvolution();
    } else if (tabName === 'history') {
        // Initialize and load history data
        if (typeof initializeHistoryFilters === 'function') {
            loadHistoryData();
        } else {
            // Fallback to legacy history
            const historyDate = document.getElementById('history-date');
            if (historyDate && !historyDate.value) {
                const currentDate = new Date();
                const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
                historyDate.value = currentMonth;
            }
            filterHistory();
        }
    }
}

// Form Management
function initializeForm() {
    const form = document.getElementById('transaction-form');
    const typeSelect = document.getElementById('type');
    
    form.addEventListener('submit', handleFormSubmit);
    typeSelect.addEventListener('change', updateSuggestions);
}

function updateSuggestions() {
    const type = document.getElementById('type');
    const suggestionsContainer = document.getElementById('suggestions');
    const dateLabel = document.getElementById('date-label');
    const paidGroup = document.getElementById('paid-group');
    
    // Check if all required elements exist
    if (!type || !suggestionsContainer || !dateLabel || !paidGroup) {
        return; // Exit early if elements don't exist
    }
    
    const typeValue = type.value;
    
    // Update date label
    dateLabel.textContent = typeValue === 'income' ? 'Recebimento' : 'Pagamento';
    
    // Show/hide paid checkbox for expenses
    paidGroup.style.display = typeValue === 'expense' ? 'block' : 'none';
    
    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';
    
    // Check if suggestions object exists and has the type
    if (!suggestions || !suggestions[typeValue]) {
        return;
    }
    
    // Add new suggestions
    suggestions[typeValue].forEach(suggestion => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'suggestion-btn';
        btn.textContent = suggestion;
        btn.onclick = () => {
            const descriptionField = document.getElementById('description');
            if (descriptionField) {
                descriptionField.value = suggestion;
            }
        };
        suggestionsContainer.appendChild(btn);
    });
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const description = formData.get('description').trim();
    const category = formData.get('category');
    const amount = parseFloat(formData.get('amount'));
    const type = formData.get('type');
    const paymentDate = formData.get('payment_date') || new Date().toISOString().split('T')[0];
    const isPaid = type === 'income' ? true : (formData.get('is_paid') === 'on');
    
    if (!description || description.length > 255 || !category) {
        showNotification('Descrição e categoria são obrigatórias (máximo 255 caracteres).', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showNotification('Valor deve ser um número positivo.', 'error');
        return;
    }
    
    const transaction = {
        description,
        category,
        amount,
        type,
        payment_date: paymentDate,
        isPaid
    };
    
    // Check if we're editing an existing transaction
    if (window.editingTransactionId) {
        updateTransaction(window.editingTransactionId, transaction, event.target);
    } else {
        addTransaction(transaction, event.target);
    }
}

// Last Category Memory Functions - Removed to avoid localStorage usage
function saveLastCategory(type, category) {
    // No longer saving to localStorage - all data from database
}

function loadLastCategory() {
    // No longer loading from localStorage - all data from database
}

// Transaction Management
async function addTransaction(transactionData, form = null) {
    try {
        showLoading(true);
        const response = await apiRequest(API_URL, {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        
        // Add to local array
        if (response.success && response.data) {
            transactions.push(response.data);
        }
        
        // Save last used category
        saveLastCategory(transactionData.type, transactionData.category);
        
        // Data now comes exclusively from database
        
        // Update UI - only update dashboard if it's active
        if (isDashboardActive()) {
            updateDashboard();
        }
        updateTransactionsList();
        
        // Reset form if provided
        if (form) {
            form.reset();
            // Load last used category instead of resetting to first option
            loadLastCategory();
        }
        
        // Update chart
        updateChart();
        
        showNotification('Transação adicionada com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao adicionar transação: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Update Transaction
async function updateTransaction(id, transactionData, form) {
    try {
        showLoading(true);
        
        // Find the transaction in the local array
        const transactionIndex = transactions.findIndex(t => t.id === id);
        if (transactionIndex === -1) {
            throw new Error('Transação não encontrada');
        }
        
        // Prepare the updated transaction data
        const updatedTransaction = {
            id: id,
            description: transactionData.description,
            category: transactionData.category,
            amount: transactionData.amount,
            type: transactionData.type,
            payment_date: transactionData.payment_date,
            isPaid: transactionData.type === 'income' ? true : transactionData.isPaid
        };
        
        let apiSuccess = false;
        
        try {
            // Try to update in the API
            const response = await apiRequest(`${API_URL}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTransaction)
            });
            
            apiSuccess = response.success;
            if (!apiSuccess) {
                console.warn('API update failed:', response.message);
            }
        } catch (apiError) {
            console.warn('API request failed, updating locally only:', apiError.message);
        }
        
        // Update local array regardless of API success (for offline functionality)
        transactions[transactionIndex] = {
            ...transactions[transactionIndex],
            description: transactionData.description,
            category: transactionData.category,
            amount: transactionData.amount,
            type: transactionData.type,
            paymentDate: transactionData.payment_date,
            status: transactionData.type === 'income' ? 'paid' : (transactionData.isPaid ? 'paid' : 'pending')
        };
        
        // Save last used category
        saveLastCategory(transactionData.type, transactionData.category);
        
        // Data now comes exclusively from database
        
        // Update UI - only update dashboard if it's active
        if (isDashboardActive()) {
            updateDashboard();
        }
        updateTransactionsList();
        
        // Reset form and cancel edit mode
        if (form) {
            cancelEdit();
        }
        
        const message = apiSuccess ? 
            'Transação atualizada com sucesso!' : 
            'Transação atualizada localmente (sem conexão com servidor)';
        showNotification(message, 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        showNotification('Erro ao atualizar transação: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function removeTransaction(id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
        return;
    }
    
    try {
        showLoading(true);
        await apiRequest(`${API_URL}?id=${id}`, {
            method: 'DELETE'
        });
        
        // Remove from local array
        transactions = transactions.filter(t => t.id !== id);
        
        // Data now comes exclusively from database
        
        // Update UI - only update dashboard if it's active
        if (isDashboardActive()) {
            updateDashboard();
        }
        updateTransactionsList();
        filterHistory();
        
        // Update chart
        updateChart();
        
        showNotification('Transação removida com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao remover transação: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function togglePaymentStatus(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    try {
        showLoading(true);
        const newStatus = !transaction.isPaid;
        
        await apiRequest(API_URL, {
            method: 'PUT',
            body: JSON.stringify({
                id: id,
                isPaid: newStatus
            })
        });
        
        // Update local array
        transaction.isPaid = newStatus;
        transaction.status = newStatus ? 'paid' : 'pending';
        
        // Data now comes exclusively from database
        
        // Update UI - only update dashboard if it's active
        if (isDashboardActive()) {
            updateDashboard();
        }
        updateTransactionsList();
        filterHistory();
        
        showNotification(`Transação marcada como ${newStatus ? 'paga' : 'pendente'}!`, 'success');
    } catch (error) {
        showNotification('Erro ao atualizar status: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Edit Transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) {
        showNotification('Transação não encontrada!', 'error');
        return;
    }
    
    // Populate form with transaction data
    populateFormForEdit(transaction);
    
    // Switch to transactions tab if not already there
    if (currentTab !== 'transactions') {
        showTab('transactions');
    }
    
    // Scroll to form
    const form = document.getElementById('transaction-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add visual feedback
        form.style.border = '2px solid #fbbf24';
        form.style.borderRadius = '12px';
        form.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
        
        // Remove visual feedback after 3 seconds
        setTimeout(() => {
            form.style.border = '';
            form.style.borderRadius = '';
            form.style.backgroundColor = '';
        }, 3000);
    }
    
    showNotification('Transação carregada para edição!', 'info');
}

function populateFormForEdit(transaction) {
    // Store the transaction ID for update
    window.editingTransactionId = transaction.id;
    
    // Populate form fields
    document.getElementById('type').value = transaction.type;
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('payment-date').value = transaction.paymentDate;
    
    // Set the is_paid checkbox for expenses
    if (transaction.type === 'expense') {
        const isPaidCheckbox = document.getElementById('is-paid');
        if (isPaidCheckbox) {
            isPaidCheckbox.checked = transaction.status === 'paid';
        }
    }
    
    // Update categories for the selected type and then select the category
    updateCategoriesAndSuggestions();
    
    // Wait a moment for categories to load, then select the category
    setTimeout(() => {
        if (transaction.category) {
            document.getElementById('category').value = transaction.category;
        }
    }, 100);
    
    // Change form button text and behavior
    const submitBtn = document.querySelector('#transaction-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Atualizar Transação';
        submitBtn.className = 'btn btn-warning w-100';
    }
    
    // Add cancel edit button if it doesn't exist
    addCancelEditButton();
}

function addCancelEditButton() {
    const form = document.getElementById('transaction-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Check if cancel button already exists
    if (form.querySelector('.cancel-edit-btn')) {
        return;
    }
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary w-100 mt-2 cancel-edit-btn';
    cancelBtn.innerHTML = '<i class="fas fa-times me-2"></i>Cancelar Edição';
    cancelBtn.onclick = cancelEdit;
    
    // Insert after submit button
    submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
}

function cancelEdit() {
    // Clear editing flag
    delete window.editingTransactionId;
    
    // Reset form
    document.getElementById('transaction-form').reset();
    
    // Restore original button
    const submitBtn = document.querySelector('#transaction-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Adicionar Transação';
        submitBtn.className = 'btn btn-primary w-100';
    }
    
    // Remove cancel button
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.remove();
    }
    
    // Load last used category
    loadLastCategory();
    
    showNotification('Edição cancelada!', 'info');
}

// Data Persistence - Database Only
// Load transactions from database only
async function loadTransactions() {
    try {
        showLoading(true);
        
        // Load data exclusively from database via API
        const response = await apiRequest(API_URL);
        
        if (response.success && Array.isArray(response.data)) {
            transactions = response.data;
            showNotification('Dados carregados do servidor!', 'success');
        } else {
            transactions = [];
            showNotification('Nenhum dado encontrado.', 'info');
        }
        
    } catch (error) {
        console.error('Erro ao carregar do servidor:', error.message);
        transactions = [];
        showNotification('Erro ao carregar dados do servidor. Verifique sua conexão.', 'error');
    } finally {
        showLoading(false);
        // Only update dashboard if it's the active tab (which it is on initial load)
        if (isDashboardActive()) {
            updateDashboard();
        }
        updateTransactionsList();
        
        // Update history data if history tab is active
        if (currentTab === 'history' && typeof loadHistoryData === 'function') {
            loadHistoryData();
        }
    }
}

// Dashboard Updates
function isDashboardActive() {
    const dashboardTab = document.getElementById('dashboard');
    return dashboardTab && !dashboardTab.classList.contains('d-none');
}

function updateDashboard() {
    // Verificar se os elementos do dashboard existem e se a aba dashboard está ativa
    const dashboardTab = document.getElementById('dashboard');
    if (!dashboardTab || dashboardTab.classList.contains('d-none')) {
        return; // Não atualizar se a aba dashboard não está visível
    }
    
    // Verificar se todos os elementos necessários existem
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpenseEl = document.getElementById('monthly-expense');
    const monthlyPendingEl = document.getElementById('monthly-pending');
    const monthlyBalanceEl = document.getElementById('monthly-balance');
    
    if (!monthlyIncomeEl || !monthlyExpenseEl || !monthlyPendingEl || !monthlyBalanceEl) {
        console.warn('Elementos do dashboard não encontrados');
        return;
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter current month transactions
    const currentMonthTransactions = transactions.filter(t => {
        const transactionDate = createLocalDate(t.paymentDate);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // Calculate totals
    const totals = currentMonthTransactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else {
            acc.expense += t.amount;
            if (t.status === 'pending') {
                acc.pending += t.amount;
            }
        }
        return acc;
    }, { income: 0, expense: 0, pending: 0 });
    
    const balance = totals.income - totals.expense;
    
    // Update summary cards only if elements exist
    monthlyIncomeEl.textContent = formatCurrency(totals.income);
    monthlyExpenseEl.textContent = formatCurrency(totals.expense);
    monthlyPendingEl.textContent = formatCurrency(totals.pending);
    
    // Update balance with safe element access
    monthlyBalanceEl.textContent = formatCurrency(balance);
    if (monthlyBalanceEl.classList) {
        monthlyBalanceEl.className = 'mb-0 fw-bold text-primary ' + (balance >= 0 ? 'text-success' : 'text-danger');
    }
    
    // Update alerts only if dashboard is active
    updateAlerts(currentMonthTransactions);
    
    // Update monthly bills only if dashboard is active
    updateMonthlyBills(currentMonthTransactions);
}

function updateAlerts(currentMonthTransactions) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) {
        return; // Elemento não existe, não fazer nada
    }
    
    alertsContainer.innerHTML = '';
    
    const pendingBills = currentMonthTransactions.filter(t => 
        t.type === 'expense' && t.status === 'pending'
    );
    
    const today = new Date();
    // Set today to start of day for proper comparison
    today.setHours(0, 0, 0, 0);
    
    const overdue = pendingBills.filter(t => {
        const billDate = createLocalDate(t.paymentDate);
        return billDate < today;
    });
    
    const dueSoon = pendingBills.filter(t => {
        const dueDate = createLocalDate(t.paymentDate);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
    });
    
    // Overdue alerts
    if (overdue.length > 0) {
        const alert = createAlert('danger', `Contas em Atraso (${overdue.length})`, overdue);
        alertsContainer.appendChild(alert);
    }
    
    // Due soon alerts
    if (dueSoon.length > 0) {
        const alert = createAlert('warning', `Vencendo nos Próximos 7 Dias (${dueSoon.length})`, dueSoon);
        alertsContainer.appendChild(alert);
    }
}

function createAlert(type, title, bills) {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    
    const icon = type === 'danger' ? 'fas fa-exclamation-triangle' : 'fas fa-calendar';
    
    alert.innerHTML = `
        <i class="${icon}"></i>
        <div class="alert-content">
            <h3>${title}</h3>
            ${bills.map(bill => `
                <div class="alert-item">
                    <span>${bill.description}</span>
                    <span>${formatCurrency(bill.amount)} - ${formatDate(bill.paymentDate)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    return alert;
}

function updateMonthlyBills(currentMonthTransactions) {
    const billsContainer = document.getElementById('monthly-bills');
    if (!billsContainer) {
        return; // Elemento não existe, não fazer nada
    }
    
    const pendingBills = currentMonthTransactions.filter(t => 
        t.type === 'expense' && t.status === 'pending'
    );
    
    if (pendingBills.length === 0) {
        billsContainer.innerHTML = '<div class="text-center text-muted py-4 w-100"><i class="fas fa-check-circle fa-3x mb-3"></i><p class="mb-0">Nenhuma conta pendente para este mês! 🎉</p></div>';
        return;
    }
    
    billsContainer.innerHTML = pendingBills
        .sort((a, b) => createLocalDate(a.paymentDate) - createLocalDate(b.paymentDate))
        .map(bill => {
            const daysUntilDue = Math.ceil((createLocalDate(bill.paymentDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
            
            let statusClass = '';
            let statusIcon = 'fas fa-calendar';
            let statusText = `${Math.abs(daysUntilDue)} dias`;
            
            if (isOverdue) {
                statusClass = 'text-danger';
                statusIcon = 'fas fa-exclamation-triangle';
                statusText = `${Math.abs(daysUntilDue)} dias em atraso`;
            } else if (isDueSoon) {
                statusClass = 'text-warning';
                statusIcon = 'fas fa-clock';
                statusText = daysUntilDue === 0 ? 'Vence hoje' : `${daysUntilDue} dias restantes`;
            } else {
                statusClass = 'text-info';
                statusText = daysUntilDue === 1 ? '1 dia restante' : `${daysUntilDue} dias restantes`;
            }
            
            return `
                <div class="bill-card">
                    <div class="card h-100 ${isOverdue ? 'border-danger' : isDueSoon ? 'border-warning' : ''}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-1">${bill.description}</h6>
                                <span class="badge ${isOverdue ? 'bg-danger' : isDueSoon ? 'bg-warning text-dark' : 'bg-info'}">${bill.category || 'Geral'}</span>
                            </div>
                            <p class="text-muted small mb-2">
                                <i class="fas fa-calendar me-1"></i>
                                Vencimento: ${formatDate(bill.paymentDate)}
                            </p>
                            <p class="text-muted small mb-3 ${statusClass}">
                                <i class="${statusIcon} me-1"></i>
                                ${statusText}
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="bill-amount">
                                    <span class="fs-5 fw-bold text-danger">${formatCurrency(bill.amount)}</span>
                                </div>
                                <button class="btn btn-success btn-sm" onclick="togglePaymentStatus(${bill.id})" title="Marcar como pago">
                                    <i class="fas fa-check me-1"></i>
                                    Pagar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
}

// Transactions List
function updateTransactionsList() {
    const listContainer = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        listContainer.innerHTML = '<p class="no-data">Nenhuma transação registrada ainda.</p>';
        return;
    }
    
    listContainer.innerHTML = transactions
        .sort((a, b) => createLocalDate(b.paymentDate) - createLocalDate(a.paymentDate))
        .map(transaction => createTransactionItem(transaction, true))
        .join('');
}

function createTransactionItem(transaction, showActions = false) {
    const statusBadge = transaction.type === 'expense' ? 
        `<span class="status-badge ${transaction.status}">${transaction.status === 'paid' ? 'Pago' : 'Pendente'}</span>` : '';
    
    const actions = showActions ? `
        <div class="transaction-actions">
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <button class="action-btn edit" onclick="editTransaction(${transaction.id})" title="Editar transação">
                <i class="fas fa-edit"></i>
            </button>
            ${transaction.type === 'expense' ? `
                <button class="action-btn pay" onclick="togglePaymentStatus(${transaction.id})" 
                        title="${transaction.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}">
                    <i class="fas fa-check-circle"></i>
                </button>
            ` : ''}
            <button class="action-btn delete" onclick="removeTransaction(${transaction.id})" title="Excluir transação">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    ` : `
        <div class="transaction-amount ${transaction.type}">
            ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
        </div>
    `;
    
    return `
        <div class="transaction-item ${transaction.type} ${transaction.status}">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${transaction.description}</h6>
                    <small class="text-muted">
                        <i class="fas fa-tag me-1"></i>${transaction.category || 'Sem categoria'}
                    </small>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>${formatDate(transaction.paymentDate)}
                            <span class="ms-3"><i class="fas fa-clock me-1"></i>${transaction.createdAt}</span>
                        </small>
                    </div>
                </div>
                <div class="text-end">
                    <div class="transaction-amount ${transaction.type} fs-5 fw-bold">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </div>
                    <div class="mt-2">
                        ${statusBadge}
                        ${actions.replace('<div class="transaction-actions">', '').replace('</div>', '')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// History Filtering - New Implementation
let historyLineChart = null;

function initializeHistoryFilters() {
    // Populate year dropdown
    const yearSelect = document.getElementById('history-year');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Clear existing options
    yearSelect.innerHTML = '';
    
    // Add years from 2020 to current year + 2
    for (let year = 2020; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Set current month
    const monthSelect = document.getElementById('history-month');
    monthSelect.value = currentMonth;
    
    // Load initial data
    loadHistoryData();
}

function loadHistoryData() {
    const year = document.getElementById('history-year').value;
    const month = document.getElementById('history-month').value;
    
    if (!year || !month) return;
    
    // Filter transactions for the selected month/year
    const filteredTransactions = transactions.filter(t => {
        const transactionDate = createLocalDate(t.paymentDate);
        return transactionDate.getMonth() + 1 === parseInt(month) &&
               transactionDate.getFullYear() === parseInt(year);
    });
    
    // Update table
    updateHistoryTable(filteredTransactions);
    
    // Update chart
    updateHistoryChart(filteredTransactions, year, month);
    
    // Update summary
    updateHistorySummary(filteredTransactions);
}

function updateHistoryTable(filteredTransactions) {
    const tableBody = document.getElementById('history-table-body');
    const countElement = document.getElementById('history-count');
    
    countElement.textContent = `${filteredTransactions.length} transações`;
    
    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2 d-block"></i>
                    Nenhuma transação encontrada para este período
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedTransactions = filteredTransactions.sort((a, b) => 
        createLocalDate(b.paymentDate) - createLocalDate(a.paymentDate)
    );
    
    tableBody.innerHTML = sortedTransactions.map(transaction => {
        const typeIcon = transaction.type === 'income' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        const typeClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
        const typeText = transaction.type === 'income' ? 'Receita' : 'Despesa';
        const valueClass = transaction.type === 'income' ? 'text-success fw-bold' : 'text-danger fw-bold';
        
        return `
            <tr>
                <td>
                    <i class="${typeIcon} ${typeClass} me-2"></i>
                    <span class="${typeClass}">${typeText}</span>
                </td>
                <td>
                    <span class="badge bg-light text-dark">${transaction.category || 'Sem categoria'}</span>
                </td>
                <td>
                    <span class="text-truncate" style="max-width: 150px; display: inline-block;" title="${transaction.description}">
                        ${transaction.description}
                    </span>
                </td>
                <td class="${valueClass}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td>
                    <small class="text-muted">${formatDateBR(transaction.paymentDate)}</small>
                </td>
            </tr>
        `;
    }).join('');
}

function updateHistoryChart(filteredTransactions, year, month) {
    const ctx = document.getElementById('history-line-chart').getContext('2d');
    
    // Destroy existing chart
    if (historyLineChart) {
        historyLineChart.destroy();
    }
    
    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    // Initialize arrays
    for (let day = 1; day <= daysInMonth; day++) {
        labels.push(day);
        incomeData.push(0);
        expenseData.push(0);
    }
    
    // Aggregate data by day
    filteredTransactions.forEach(transaction => {
        const transactionDate = createLocalDate(transaction.paymentDate);
        const day = transactionDate.getDate() - 1; // Array index (0-based)
        
        if (transaction.type === 'income') {
            incomeData[day] += parseFloat(transaction.amount);
        } else {
            expenseData[day] += parseFloat(transaction.amount);
        }
    });

    historyLineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Evolução Financeira - ${getMonthName(month)}/${year}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Dias do Mês'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    min: 0,
                    max: 10000,
                    ticks: {
                        stepSize: 1000,
                        maxTicksLimit: 11,
                        includeBounds: true,
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

function updateHistorySummary(filteredTransactions) {
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const balance = totalIncome - totalExpense;
    const transactionCount = filteredTransactions.length;
    
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('transaction-count').textContent = transactionCount;
    
    // Update balance color
    const balanceElement = document.getElementById('balance');
    if (balance > 0) {
        balanceElement.className = 'text-success mb-1';
    } else if (balance < 0) {
        balanceElement.className = 'text-danger mb-1';
    } else {
        balanceElement.className = 'text-primary mb-1';
    }
}

function getMonthName(monthNumber) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNumber - 1];
}

function formatDateBR(dateString) {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

// Legacy function for compatibility
function filterHistory() {
    // Redirect to new implementation
    loadHistoryData();
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function formatDate(dateString) {
    // Create date locally to avoid timezone issues
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);
    
    const date = new Date(year, month, day);
    return date.toLocaleDateString('pt-BR');
}

// Helper function to create local date from date string
function createLocalDate(dateString) {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);
    
    return new Date(year, month, day);
}

function updateCurrentMonth() {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
    });
    document.getElementById('current-month').textContent = monthName;
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('d-none');
        } else {
            loadingOverlay.classList.add('d-none');
        }
    }
}

function showNotification(message, type = 'info') {
    // Create Bootstrap toast
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-primary';
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Auto-Refresh System
let autoRefreshInterval;
let lastRefreshTime = Date.now();
let isUserActive = true;
let isRefreshing = false;

function initializeAutoRefresh() {
    // Start auto-refresh every minute
    autoRefreshInterval = setInterval(performAutoRefresh, 60000); // 60 seconds
    
    // Track user activity to pause updates during interaction
    trackUserActivity();
    
    console.log('Auto-refresh system initialized - updates every minute');
}

function performAutoRefresh() {
    // Skip if user is currently interacting or already refreshing
    if (!isUserActive || isRefreshing) {
        console.log('Skipping auto-refresh - user interaction detected or refresh in progress');
        return;
    }
    
    // Skip if last refresh was less than 55 seconds ago (safety buffer)
    if (Date.now() - lastRefreshTime < 55000) {
        return;
    }
    
    console.log('Performing background data refresh...');
    refreshDataSilently();
}

async function refreshDataSilently() {
    if (isRefreshing) return;
    
    try {
        isRefreshing = true;
        updateAutoRefreshIndicator(true);
        
        // Store current state to compare later
        const previousTransactionsCount = transactions.length;
        const currentTab = getCurrentActiveTab();
        
        // Refresh transactions data
        const response = await apiRequest(API_URL);
        
        if (response.success && Array.isArray(response.data)) {
            const newTransactions = response.data;
            
            // Check if data actually changed
            if (hasDataChanged(transactions, newTransactions)) {
                transactions = newTransactions;
                
                // Update UI only for current visible content
                await updateUIAfterRefresh(currentTab, previousTransactionsCount);
                
                // Data now comes exclusively from database
                
                console.log('Data refreshed successfully - UI updated');
            } else {
                console.log('No data changes detected');
            }
        }
        
        lastRefreshTime = Date.now();
        
    } catch (error) {
        console.log('Silent refresh failed:', error.message);
    } finally {
        isRefreshing = false;
        updateAutoRefreshIndicator(false);
    }
}

function hasDataChanged(oldData, newData) {
    if (oldData.length !== newData.length) return true;
    
    // Compare basic properties of first and last items
    if (oldData.length > 0 && newData.length > 0) {
        const oldFirst = oldData[0];
        const newFirst = newData[0];
        const oldLast = oldData[oldData.length - 1];
        const newLast = newData[newData.length - 1];
        
        return (oldFirst.id !== newFirst.id || 
                oldLast.id !== newLast.id ||
                oldFirst.status !== newFirst.status ||
                oldLast.status !== newLast.status);
    }
    
    return false;
}

async function updateUIAfterRefresh(currentTab, previousCount) {
    // Update based on current active tab
    switch (currentTab) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'transactions':
            updateTransactionsList();
            break;
        case 'evolution':
            // Only refresh if user isn't actively viewing charts
            if (!isChartBeingViewed()) {
                loadEvolution();
            }
            break;
        case 'history':
            filterHistory();
            break;
    }
    
    // Show subtle notification only if significant changes detected
    if (transactions.length !== previousCount) {
        showSubtleNotification();
    }
}

function getCurrentActiveTab() {
    const tabs = ['dashboard', 'transactions', 'evolution', 'history'];
    for (const tab of tabs) {
        const element = document.getElementById(tab);
        if (element && !element.classList.contains('d-none')) {
            return tab;
        }
    }
    return 'dashboard'; // fallback
}

function isChartBeingViewed() {
    // Check if user is hovering over chart area
    const chartContainer = document.querySelector('.chart-container');
    return chartContainer && chartContainer.matches(':hover');
}

function trackUserActivity() {
    let activityTimeout;
    
    const resetActivity = () => {
        isUserActive = true;
        clearTimeout(activityTimeout);
        
        // Consider user inactive after 10 seconds of no interaction
        activityTimeout = setTimeout(() => {
            isUserActive = false;
        }, 10000);
    };
    
    // Track various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetActivity, { passive: true });
    });
    
    // Pause auto-refresh when user is typing in forms
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', () => {
            isUserActive = true;
            console.log('User editing form - auto-refresh paused');
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                // Only mark as inactive if no other form element is focused
                if (!document.activeElement.matches('input, textarea, select')) {
                    resetActivity();
                }
            }, 1000);
        });
    });
    
    // Initial state
    resetActivity();
}

function showSubtleNotification() {
    // Create a very subtle notification that doesn't interrupt the user
    const notification = document.createElement('div');
    notification.className = 'position-fixed bottom-0 end-0 m-3 alert alert-info alert-dismissible fade show';
    notification.style.cssText = 'z-index: 1055; max-width: 300px; opacity: 0.9; font-size: 0.875rem;';
    notification.innerHTML = `
        <i class="fas fa-sync-alt fa-spin me-2"></i>
        Dados atualizados
        <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function pauseAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('Auto-refresh paused');
    }
}

function resumeAutoRefresh() {
    if (!autoRefreshInterval) {
        autoRefreshInterval = setInterval(performAutoRefresh, 60000);
        console.log('Auto-refresh resumed');
    }
}

function toggleAutoRefresh() {
    const statusElement = document.getElementById('auto-refresh-status');
    
    if (autoRefreshInterval) {
        // Currently active, pause it
        pauseAutoRefresh();
        statusElement.className = 'badge bg-secondary me-2';
        statusElement.innerHTML = '<i class="fas fa-pause me-1"></i>Pausado';
        statusElement.title = 'Atualização automática pausada - Clique para reativar';
        
        showNotification('Atualização automática pausada', 'warning');
    } else {
        // Currently paused, resume it
        resumeAutoRefresh();
        statusElement.className = 'badge bg-success me-2';
        statusElement.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Auto';
        statusElement.title = 'Atualização automática ativada - Clique para pausar';
        
        showNotification('Atualização automática reativada', 'success');
    }
}

function updateAutoRefreshIndicator(isRefreshing) {
    const statusElement = document.getElementById('auto-refresh-status');
    
    // Only update if element exists
    if (statusElement) {
        if (isRefreshing && autoRefreshInterval) {
            statusElement.innerHTML = '<i class="fas fa-sync-alt fa-spin me-1"></i>Sync';
            statusElement.className = 'badge bg-info me-2';
        } else if (autoRefreshInterval) {
            statusElement.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Auto';
            statusElement.className = 'badge bg-success me-2';
        }
    }
}

// Evolution Tab Management
function loadEvolution() {
    loadEvolutionChart();
    loadEvolutionTrends();
    loadEvolutionStats();
}

let evolutionChart = null;

function loadEvolutionChart() {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) {
        console.error('Elemento evolutionChart não encontrado');
        return;
    }
    
    const context = ctx.getContext('2d');
    
    if (evolutionChart) {
        evolutionChart.destroy();
    }
    
    fetch('/api/api.php?action=get_monthly_evolution')
        .then(response => response.json())
        .then(response => {
            // Check if response is successful and extract data
            if (!response.success || !Array.isArray(response.data)) {
                throw new Error('Dados de evolução inválidos');
            }
            
            const data = response.data;
            
            // Separate historical and future data
            const historicalData = [];
            const projectionData = [];
            
            data.forEach(item => {
                if (item.is_projection) {
                    historicalData.push({
                        month_label: item.month_label,
                        income: null,
                        expenses: null,
                        balance: null
                    });
                    projectionData.push(item);
                } else {
                    historicalData.push(item);
                    projectionData.push({
                        month_label: item.month_label,
                        income: null,
                        expenses: null,
                        balance: null
                    });
                }
            });
            
            const months = data.map(item => item.month_label);
            const historicalIncome = historicalData.map(item => item.income);
            const historicalExpenses = historicalData.map(item => item.expenses);
            const historicalBalance = historicalData.map(item => item.balance);
            const projectionIncome = projectionData.map(item => item.income);
            const projectionExpenses = projectionData.map(item => item.expenses);
            const projectionBalance = projectionData.map(item => item.balance);
            
            evolutionChart = new Chart(context, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Receitas',
                            data: historicalIncome,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Receitas (Projeção)',
                            data: projectionIncome,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.05)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4,
                            pointStyle: 'triangle'
                        },
                        {
                            label: 'Despesas',
                            data: historicalExpenses,
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Despesas (Projeção)',
                            data: projectionExpenses,
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.05)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4,
                            pointStyle: 'triangle'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                filter: function(legendItem, chartData) {
                                    // Show legend only if dataset has data
                                    const dataset = chartData.datasets[legendItem.datasetIndex];
                                    return dataset.data.some(value => value !== null);
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.parsed.y === null) return null;
                                    const isProjection = context.dataset.label.includes('Projeção');
                                    const prefix = isProjection ? '📊 ' : '';
                                    return prefix + context.dataset.label.replace(' (Projeção)', '') + ': R$ ' + 
                                           context.parsed.y.toLocaleString('pt-BR', {
                                               minimumFractionDigits: 2,
                                               maximumFractionDigits: 2
                                           });
                                },
                                afterLabel: function(context) {
                                    const isProjection = context.dataset.label.includes('Projeção');
                                    return isProjection ? '⚠️ Projeção sujeita a alterações' : '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Erro ao carregar dados de evolução:', error);
        });
}

function loadEvolutionTrends() {
    fetch('/api/api.php?action=get_trends')
        .then(response => response.json())
        .then(response => {
            if (!response.success) {
                throw new Error('Erro ao carregar tendências');
            }
            
            const data = response.data;
            const trendsDiv = document.getElementById('evolution-trends');
            let trendsHtml = '';
            
            if (data.income_trend !== undefined) {
                const incomeIcon = data.income_trend > 0 ? 'fa-arrow-up text-success' : 
                                  data.income_trend < 0 ? 'fa-arrow-down text-danger' : 'fa-minus text-warning';
                trendsHtml += `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span>Receitas</span>
                        <span class="fw-bold">
                            <i class="fas ${incomeIcon} me-1"></i>
                            ${Math.abs(data.income_trend).toFixed(1)}%
                        </span>
                    </div>
                `;
            }
            
            if (data.expense_trend !== undefined) {
                const expenseIcon = data.expense_trend > 0 ? 'fa-arrow-up text-danger' : 
                                   data.expense_trend < 0 ? 'fa-arrow-down text-success' : 'fa-minus text-warning';
                trendsHtml += `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span>Despesas</span>
                        <span class="fw-bold">
                            <i class="fas ${expenseIcon} me-1"></i>
                            ${Math.abs(data.expense_trend).toFixed(1)}%
                        </span>
                    </div>
                `;
            }
            
            if (trendsHtml === '') {
                trendsHtml = '<p class="text-muted mb-0">Dados insuficientes para análise de tendências.</p>';
            }
            
            trendsDiv.innerHTML = trendsHtml;
        })
        .catch(error => {
            console.error('Erro ao carregar tendências:', error);
            document.getElementById('evolution-trends').innerHTML = 
                '<p class="text-muted mb-0">Erro ao carregar tendências.</p>';
        });
}

function loadEvolutionStats() {
    fetch('/api/api.php?action=get_stats')
        .then(response => response.json())
        .then(response => {
            if (!response.success) {
                throw new Error('Erro ao carregar estatísticas');
            }
            
            const data = response.data;
            const statsDiv = document.getElementById('evolution-stats');
            const avgIncome = parseFloat(data.avg_income || 0);
            const avgExpense = parseFloat(data.avg_expense || 0);
            const avgBalance = avgIncome - avgExpense;
            
            const statsHtml = `
                <div class="row g-3">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Receita Média</small>
                            <span class="fw-bold text-success">
                                R$ ${avgIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Despesa Média</small>
                            <span class="fw-bold text-danger">
                                R$ ${avgExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                    <div class="col-12">
                        <hr class="my-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted fw-bold">Saldo Médio</small>
                            <span class="fw-bold ${avgBalance >= 0 ? 'text-success' : 'text-danger'}">
                                R$ ${avgBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            
            statsDiv.innerHTML = statsHtml;
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas:', error);
            document.getElementById('evolution-stats').innerHTML = 
                '<p class="text-muted mb-0">Erro ao carregar estatísticas.</p>';
        });
}
document.head.appendChild(style);
