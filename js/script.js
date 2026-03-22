// Select DOM elements
const balanceElement   = document.getElementById('balance');
const incomeElement    = document.getElementById('inc-amt');
const expenseElement   = document.getElementById('exp-amt');
const listElement      = document.getElementById('list');
const form             = document.getElementById('form');
const textInput        = document.getElementById('text');
const amountInput      = document.getElementById('amount');

// Load transactions from localStorage (or start empty)
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Save to localStorage
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update balance / income / expense display
function updateValues() {
  const amounts = transactions.map(tx => tx.amount);

  const total    = amounts.reduce((sum, val) => sum + val, 0).toFixed(2);
  const income   = amounts.filter(val => val > 0).reduce((sum, val) => sum + val, 0).toFixed(2);
  const expense  = (amounts.filter(val => val < 0).reduce((sum, val) => sum + val, 0) * -1).toFixed(2);

  balanceElement.innerText = `₹ ${total}`;
  incomeElement.innerText  = `₹ ${income}`;
  expenseElement.innerText = `₹ ${expense}`;
}

// Render history list
function renderList() {
  listElement.innerHTML = '';

  transactions.forEach(tx => {
    const sign     = tx.amount < 0 ? '-' : '+';
    const cssClass = tx.amount < 0 ? 'minus' : 'plus';
    const absAmt   = Math.abs(tx.amount).toFixed(2);

    const li = document.createElement('li');
    li.classList.add(cssClass);
    li.innerHTML = `
      ${tx.text} <span>${sign}${absAmt}</span>
      <button class="delete-btn" onclick="removeTransaction(${tx.id})">x</button>
    `;
    listElement.appendChild(li);
  });
}

// Add new transaction
function addTransaction(e) {
  e.preventDefault();  // ← prevents page refresh!

  const text   = textInput.value.trim();
  const amount = parseFloat(amountInput.value.trim());

  if (!text || isNaN(amount)) {
    alert('Please enter description and valid amount!');
    return;
  }

  const transaction = {
    id: Math.floor(Math.random() * 100000000),  // simple ID
    text,
    amount
  };

  transactions.push(transaction);

  updateValues();
  renderList();
  updateLocalStorage();

  // Clear inputs
  textInput.value = '';
  amountInput.value = '';
}

// Remove transaction
window.removeTransaction = function(id) {   // global so onclick can call it
  if (confirm('Delete this transaction?')) {
    transactions = transactions.filter(tx => tx.id !== id);
    updateValues();
    renderList();
    updateLocalStorage();
  }
};

// Attach form submit listener
form.addEventListener('submit', addTransaction);

// Initialize on page load
function init() {
  updateValues();
  renderList();
}

init();
