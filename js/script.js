const CURRENCY_SYMBOL = "\u20B9";

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("inc-amt");
const expenseElement = document.getElementById("exp-amt");
const listElement = document.getElementById("list");
const form = document.getElementById("form");
const textInput = document.getElementById("text");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");
const darkModeBtn = document.getElementById("dark-mode-btn");
const searchInput = document.getElementById("search-input");
const filterCategoryInput = document.getElementById("filter-category");
const sortTransactionsInput = document.getElementById("sort-transactions");
const budgetLimitInput = document.getElementById("budget-limit");
const saveBudgetBtn = document.getElementById("save-budget-btn");
const totalTransactionsElement = document.getElementById("total-transactions");
const thisMonthCountElement = document.getElementById("this-month-count");
const avgTransactionElement = document.getElementById("avg-transaction");
const topCategoriesElement = document.getElementById("top-categories");
const recentTransactionsElement = document.getElementById("recent-transactions");
const insightsPanelElement = document.getElementById("insights-panel");
const monthlyIncomeElement = document.getElementById("monthly-income");
const monthlyExpenseElement = document.getElementById("monthly-expense");
const monthlyNetElement = document.getElementById("monthly-net");
const categoryBreakdownElement = document.getElementById("category-breakdown");
const budgetSpentElement = document.getElementById("budget-spent");
const budgetRemainingElement = document.getElementById("budget-remaining");
const budgetProgressBarElement = document.getElementById("budget-progress-bar");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentSearch = "";
let currentCategoryFilter = "";
let currentSort = "newest";
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

function formatCurrency(amount) {
  return `${CURRENCY_SYMBOL} ${Number(amount).toFixed(2)}`;
}

function updateLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveDarkModePreference(isDarkMode) {
  localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
}

function saveMonthlyBudget(value) {
  localStorage.setItem("monthlyBudget", String(value));
}

function updateValues() {
  const amounts = transactions.map((tx) => tx.amount);
  const total = amounts.reduce((sum, value) => sum + value, 0);
  const income = amounts
    .filter((value) => value > 0)
    .reduce((sum, value) => sum + value, 0);
  const expense = Math.abs(
    amounts.filter((value) => value < 0).reduce((sum, value) => sum + value, 0)
  );

  balanceElement.innerText = formatCurrency(total);
  incomeElement.innerText = formatCurrency(income);
  expenseElement.innerText = formatCurrency(expense);
  updateSidebarStats();
  updateMonthlySummary();
  updateBudgetStatus();
  renderInsights();
}

function isSameMonth(dateString, currentDate = new Date()) {
  const date = new Date(dateString);
  return (
    date.getMonth() === currentDate.getMonth() &&
    date.getFullYear() === currentDate.getFullYear()
  );
}

function updateSidebarStats() {
  if (totalTransactionsElement) {
    totalTransactionsElement.innerText = String(transactions.length);
  }

  if (thisMonthCountElement) {
    const thisMonthCount = transactions.filter((tx) => isSameMonth(tx.date)).length;
    thisMonthCountElement.innerText = String(thisMonthCount);
  }

  if (avgTransactionElement) {
    const average =
      transactions.length === 0
        ? 0
        : transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length;
    avgTransactionElement.innerText = formatCurrency(average);
  }

  if (topCategoriesElement) {
    renderTopCategories();
  }

  if (recentTransactionsElement) {
    renderRecentTransactions();
  }
}

function renderTopCategories() {
  if (!topCategoriesElement) {
    return;
  }

  if (transactions.length === 0) {
    topCategoriesElement.innerHTML = '<div class="stat-label">No categories yet.</div>';
    return;
  }

  const totalsByCategory = transactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const topCategories = Object.entries(totalsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  topCategoriesElement.innerHTML = topCategories
    .map(
      ([category, total]) => `
        <div class="stat-card">
          <div class="stat-label">${category}</div>
          <div class="stat-number">${formatCurrency(total)}</div>
        </div>
      `
    )
    .join("");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN");
}

function renderEmptyState() {
  listElement.innerHTML = '<li class="empty-state">No transactions yet.</li>';
}

function getFilteredTransactions() {
  return transactions
    .slice()
    .filter((tx) => {
      const matchesSearch =
        currentSearch === "" ||
        tx.text.toLowerCase().includes(currentSearch) ||
        tx.category.toLowerCase().includes(currentSearch);
      const matchesCategory =
        currentCategoryFilter === "" || tx.category === currentCategoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (currentSort === "oldest") {
        return new Date(a.date) - new Date(b.date);
      }
      if (currentSort === "highest") {
        return Math.abs(b.amount) - Math.abs(a.amount);
      }
      if (currentSort === "lowest") {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      return new Date(b.date) - new Date(a.date);
    });
}

function renderList() {
  listElement.innerHTML = "";

  if (transactions.length === 0) {
    renderEmptyState();
    return;
  }

  const filteredTransactions = getFilteredTransactions();

  if (filteredTransactions.length === 0) {
    listElement.innerHTML = '<li class="empty-state">No matching transactions found.</li>';
    return;
  }

  filteredTransactions.forEach((tx) => {
      const sign = tx.amount < 0 ? "-" : "+";
      const cssClass = tx.amount < 0 ? "minus" : "plus";
      const absAmt = Math.abs(tx.amount).toFixed(2);

      const li = document.createElement("li");
      li.classList.add(cssClass);
      li.innerHTML = `
        <div class="transaction-info">
          <strong>${tx.text}</strong>
          <small>${tx.category} &bull; ${formatDate(tx.date)}</small>
        </div>
        <div class="transaction-actions">
          <span>${sign}${CURRENCY_SYMBOL}${absAmt}</span>
          <button class="edit-btn" onclick="editTransaction(${tx.id})" type="button">Edit</button>
          <button class="delete-btn" onclick="removeTransaction(${tx.id})" type="button">x</button>
        </div>
      `;
      listElement.appendChild(li);
    });
}

function renderRecentTransactions() {
  if (!recentTransactionsElement) {
    return;
  }

  if (transactions.length === 0) {
    recentTransactionsElement.innerHTML = '<div class="stat-label">No recent activity yet.</div>';
    return;
  }

  recentTransactionsElement.innerHTML = transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4)
    .map(
      (tx) => `
        <div class="tip-card recent-item">
          <strong>${tx.text}</strong>
          <div class="stat-label">${tx.category} &bull; ${formatDate(tx.date)}</div>
          <div class="recent-amount ${tx.amount < 0 ? "minus-text" : "plus-text"}">
            ${tx.amount < 0 ? "-" : "+"}${formatCurrency(Math.abs(tx.amount))}
          </div>
        </div>
      `
    )
    .join("");
}

function updateMonthlySummary() {
  if (
    !monthlyIncomeElement ||
    !monthlyExpenseElement ||
    !monthlyNetElement ||
    !categoryBreakdownElement
  ) {
    return;
  }

  const monthlyTransactions = transactions.filter((tx) => isSameMonth(tx.date));
  const monthlyIncome = monthlyTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthlyExpense = Math.abs(
    monthlyTransactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
  );
  const monthlyNet = monthlyIncome - monthlyExpense;

  monthlyIncomeElement.innerText = formatCurrency(monthlyIncome);
  monthlyExpenseElement.innerText = formatCurrency(monthlyExpense);
  monthlyNetElement.innerText = formatCurrency(monthlyNet);

  if (monthlyTransactions.length === 0) {
    categoryBreakdownElement.innerHTML = '<div class="category-item">No transactions this month.</div>';
    return;
  }

  const categoryTotals = monthlyTransactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  categoryBreakdownElement.innerHTML = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, total]) => `
        <div class="category-item">
          <strong>${category}</strong>
          <div>${formatCurrency(total)}</div>
        </div>
      `
    )
    .join("");
}

function updateBudgetStatus() {
  if (!budgetSpentElement || !budgetRemainingElement || !budgetProgressBarElement) {
    return;
  }

  const monthlySpent = Math.abs(
    transactions
      .filter((tx) => isSameMonth(tx.date) && tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  budgetSpentElement.innerText = formatCurrency(monthlySpent);

  if (!monthlyBudget || monthlyBudget <= 0) {
    budgetRemainingElement.innerText = "No budget set";
    budgetProgressBarElement.style.width = "0%";
    budgetProgressBarElement.classList.remove("warning", "danger");
    return;
  }

  const remaining = monthlyBudget - monthlySpent;
  const progress = Math.min((monthlySpent / monthlyBudget) * 100, 100);

  budgetRemainingElement.innerText =
    remaining >= 0
      ? `${formatCurrency(remaining)} left`
      : `${formatCurrency(Math.abs(remaining))} over budget`;
  budgetProgressBarElement.style.width = `${progress}%`;
  budgetProgressBarElement.classList.toggle("warning", progress >= 75 && progress < 100);
  budgetProgressBarElement.classList.toggle("danger", progress >= 100);
}

function renderInsights() {
  if (!insightsPanelElement) {
    return;
  }

  if (transactions.length === 0) {
    insightsPanelElement.innerHTML = '<div class="stat-label">Add transactions to unlock insights.</div>';
    return;
  }

  const expenses = transactions.filter((tx) => tx.amount < 0);
  const incomes = transactions.filter((tx) => tx.amount > 0);
  const biggestExpense = expenses.reduce((max, tx) => (
    !max || Math.abs(tx.amount) > Math.abs(max.amount) ? tx : max
  ), null);
  const biggestIncome = incomes.reduce((max, tx) => (
    !max || tx.amount > max.amount ? tx : max
  ), null);

  insightsPanelElement.innerHTML = `
    <div class="tip-card">
      <strong>Biggest Expense</strong>
      <div class="stat-label">${biggestExpense ? biggestExpense.text : "None yet"}</div>
      <div class="recent-amount minus-text">${biggestExpense ? formatCurrency(Math.abs(biggestExpense.amount)) : formatCurrency(0)}</div>
    </div>
    <div class="tip-card">
      <strong>Biggest Income</strong>
      <div class="stat-label">${biggestIncome ? biggestIncome.text : "None yet"}</div>
      <div class="recent-amount plus-text">${biggestIncome ? formatCurrency(biggestIncome.amount) : formatCurrency(0)}</div>
    </div>
  `;
}

function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  saveDarkModePreference(isDarkMode);
}

function hydrateDarkMode() {
  const savedDarkMode = JSON.parse(localStorage.getItem("darkMode") || "false");
  document.body.classList.toggle("dark-mode", savedDarkMode);
}

function hydrateBudget() {
  if (budgetLimitInput && monthlyBudget > 0) {
    budgetLimitInput.value = monthlyBudget;
  }
}

function resetForm() {
  textInput.value = "";
  categoryInput.value = "";
  amountInput.value = "";
  dateInput.value = new Date().toISOString().split("T")[0];
}

function addTransaction(event) {
  event.preventDefault();

  const text = textInput.value.trim();
  const category = categoryInput.value;
  const date = dateInput.value;
  const amount = parseFloat(amountInput.value);

  if (!text || !category || !date || Number.isNaN(amount)) {
    alert("Please fill all fields with valid data.");
    return;
  }

  const transaction = {
    id: Date.now(),
    text,
    category,
    date,
    amount,
  };

  transactions.push(transaction);
  updateLocalStorage();
  updateValues();
  renderList();
  resetForm();
}

window.editTransaction = function editTransaction(id) {
  const transaction = transactions.find((tx) => tx.id === id);
  if (!transaction) {
    return;
  }

  textInput.value = transaction.text;
  categoryInput.value = transaction.category;
  dateInput.value = transaction.date;
  amountInput.value = transaction.amount;

  transactions = transactions.filter((tx) => tx.id !== id);
  updateLocalStorage();
  updateValues();
  renderList();
  textInput.focus();
};

window.removeTransaction = function removeTransaction(id) {
  transactions = transactions.filter((tx) => tx.id !== id);
  updateLocalStorage();
  updateValues();
  renderList();
};

function exportToCSV() {
  if (transactions.length === 0) {
    alert("No transactions to export.");
    return;
  }

  const csvContent = [
    ["ID", "Text", "Category", "Date", "Amount"],
    ...transactions.map((tx) => [tx.id, tx.text, tx.category, tx.date, tx.amount]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget_transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (!transactions.length) {
    return;
  }

  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    updateLocalStorage();
    updateValues();
    renderList();
    resetForm();
  }
}

form.addEventListener("submit", addTransaction);
exportBtn.addEventListener("click", exportToCSV);
clearBtn.addEventListener("click", clearAll);
darkModeBtn.addEventListener("click", toggleDarkMode);
searchInput.addEventListener("input", (event) => {
  currentSearch = event.target.value.trim().toLowerCase();
  renderList();
});
filterCategoryInput.addEventListener("change", (event) => {
  currentCategoryFilter = event.target.value;
  renderList();
});
sortTransactionsInput.addEventListener("change", (event) => {
  currentSort = event.target.value;
  renderList();
});
saveBudgetBtn.addEventListener("click", () => {
  const value = Number(budgetLimitInput.value);
  if (Number.isNaN(value) || value < 0) {
    alert("Please enter a valid budget amount.");
    return;
  }
  monthlyBudget = value;
  saveMonthlyBudget(value);
  updateBudgetStatus();
});

function init() {
  hydrateDarkMode();
  hydrateBudget();
  resetForm();
  updateValues();
  renderList();
}

init();
