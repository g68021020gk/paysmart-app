// PAYSMART DATA

function loadData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

let walletBalance = Number(loadData("walletBalance", 0));
let transactions = loadData("transactions", []);
let expenses = loadData("expenses", []);
let qrHistory = loadData("qrHistory", []);
let profile = loadData("profile", {
    name: "User",
    email: ""
});
let monthlyBudget = Number(loadData("monthlyBudget", 0));
let categoryBudgets = loadData("categoryBudgets", {});
let demoPin = localStorage.getItem("demoPin") || "1234";
let scanner = null;


// SAVE DATA

function saveData() {
    localStorage.setItem("walletBalance", JSON.stringify(walletBalance));
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    localStorage.setItem("profile", JSON.stringify(profile));
    localStorage.setItem("monthlyBudget", JSON.stringify(monthlyBudget));
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
    localStorage.setItem("demoPin", demoPin);
}


// HELPERS

function money(amount) {
    return "₹" + Number(amount || 0).toFixed(2);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function today() {
    return new Date().toLocaleString();
}

function isThisMonth(dateValue) {
    const date = new Date(dateValue);
    const now = new Date();

    return !isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
}

function showSection(sectionId) {
    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });

    const selected = document.getElementById(sectionId);

    if (selected) {
        selected.classList.add("active");
    }

    updateApp();
}


// ADD MONEY

function addMoney() {
    const input = document.getElementById("addAmount");
    const amount = Number(input.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    walletBalance += amount;

    transactions.unshift({
        type: "Added Money",
        name: "Wallet Deposit",
        amount: amount,
        date: today()
    });

    input.value = "";
    saveData();
    updateApp();

    alert(money(amount) + " added to your demo wallet.");
}


// SEND MONEY - DEMO ONLY

function sendMoney() {
    const nameInput = document.getElementById("receiverName");
    const amountInput = document.getElementById("sendAmount");

    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);

    if (!name) {
        alert("Please enter receiver name.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient demo wallet balance.");
        return;
    }

    walletBalance -= amount;

    transactions.unshift({
        type: "Demo Sent",
        name: name,
        amount: -amount,
        date: today()
    });

    nameInput.value = "";
    amountInput.value = "";

    saveData();
    updateApp();

    alert("Demo transaction completed. No real money was transferred.");
}


// ADD EXPENSE

function addExpense() {
    const titleInput = document.getElementById("expenseTitle");
    const amountInput = document.getElementById("expenseAmount");
    const categoryInput = document.getElementById("expenseCategory");

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;

    if (!title) {
        alert("Please enter expense description.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid expense amount.");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient demo wallet balance.");
        return;
    }

    walletBalance -= amount;

    expenses.unshift({
        title: title,
        amount: amount,
        category: category,
        date: today()
    });

    transactions.unshift({
        type: "Expense",
        name: title,
        amount: -amount,
        date: today()
    });

    titleInput.value = "";
    amountInput.value = "";

    saveData();
    updateApp();

    alert("Expense added successfully.");
}


// DISPLAY EXPENSES

function updateExpenses() {
    const list = document.getElementById("expenseList");

    if (expenses.length === 0) {
        list.innerHTML = "No expenses yet.";
        return;
    }

    list.innerHTML = expenses.map(function (expense, index) {
        return `
            <div class="item">
                <strong>${escapeHTML(expense.title)}</strong>
                <small>${escapeHTML(expense.category)} | ${escapeHTML(expense.date)}</small>
                <p class="amount-negative">${money(expense.amount)}</p>
                <button class="danger" onclick="deleteExpense(${index})">Delete</button>
            </div>
        `;
    }).join("");
}

function deleteExpense(index) {
    if (!confirm("Delete this expense? The wallet balance will be refunded in this demo.")) {
        return;
    }

    const expense = expenses[index];

    if (!expense) return;

    walletBalance += Number(expense.amount);

    transactions.unshift({
        type: "Expense Refund",
        name: expense.title,
        amount: Number(expense.amount),
        date: today()
    });

    expenses.splice(index, 1);

    saveData();
    updateApp();
}


// TRANSACTION HISTORY

function updateTransactions() {
    const list = document.getElementById("transactionList");

    if (transactions.length === 0) {
        list.innerHTML = "No transactions yet.";
        return;
    }

    list.innerHTML = transactions.map(function (transaction) {
        const amount = Number(transaction.amount);
        const className = amount >= 0 ? "amount-positive" : "amount-negative";

        return `
            <div class="item">
                <strong>${escapeHTML(transaction.type)}</strong>
                <small>${escapeHTML(transaction.name)} | ${escapeHTML(transaction.date)}</small>
                <p class="${className}">${amount >= 0 ? "+" : ""}${money(amount)}</p>
            </div>
        `;
    }).join("");
}

function filterTransactions() {
    const search = document.getElementById("transactionSearch").value.toLowerCase();
    const list = document.getElementById("transactionList");

    const filtered = transactions.filter(function (transaction) {
        return String(transaction.type).toLowerCase().includes(search) ||
            String(transaction.name).toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
        list.innerHTML = "No matching transactions.";
        return;
    }

    list.innerHTML = filtered.map(function (transaction) {
        const amount = Number(transaction.amount);
        const className = amount >= 0 ? "amount-positive" : "amount-negative";

        return `
            <div class="item">
                <strong>${escapeHTML(transaction.type)}</strong>
                <small>${escapeHTML(transaction.name)} | ${escapeHTML(transaction.date)}</small>
                <p class="${className}">${amount >= 0 ? "+" : ""}${money(amount)}</p>
            </div>
        `;
    }).join("");
}


// QR SCANNER

function startScanner() {
    const result = document.getElementById("scanResult");

    if (typeof Html5Qrcode === "undefined") {
        result.textContent = "QR scanner library could not load. Check your internet connection.";
        return;
    }

    if (scanner) {
        result.textContent = "Scanner is already running.";
        return;
    }

    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        function (decodedText) {
            result.textContent = "Scanned result: " + decodedText;

            qrHistory.unshift({
                result: decodedText,
                date: today()
            });

            saveData();
            updateQRHistory();
            stopScanner();
        },
        function () {
            // Waiting for a QR code.
        }
    ).catch(function (error) {
        scanner = null;
        result.textContent = "Could not start camera. Check camera permission and try again.";
    });
}

function stopScanner() {
    if (!scanner) {
        document.getElementById("scanResult").textContent = "Scanner is stopped.";
        return;
    }

    const currentScanner = scanner;
    scanner = null;

    currentScanner.stop().then(function () {
        return currentScanner.clear();
    }).catch(function () {
        // Scanner may already be stopped.
    });

    document.getElementById("scanResult").textContent = "Scanner stopped.";
}

function updateQRHistory() {
    const list = document.getElementById("qrHistoryList");

    if (qrHistory.length === 0) {
        list.innerHTML = "No QR scans yet.";
        return;
    }

    list.innerHTML = qrHistory.map(function (item) {
        return `
            <div class="item">
                <strong>${escapeHTML(item.result)}</strong>
                <small>${escapeHTML(item.date)}</small>
            </div>
        `;
    }).join("");
}

function clearQRHistory() {
    if (!confirm("Clear all QR scan history?")) return;

    qrHistory = [];
    saveData();
    updateQRHistory();
}


// MONTHLY REPORT

function getMonthlyExpenses() {
    return expenses.filter(function (expense) {
        return isThisMonth(expense.date);
    });
}

function updateReport() {
    const monthly = getMonthlyExpenses();

    const total = monthly.reduce(function (sum, expense) {
        return sum + Number(expense.amount);
    }, 0);

    document.getElementById("monthlyTotal").textContent = money(total);
    document.getElementById("monthlyCount").textContent = monthly.length;

    const categories = {};

    monthly.forEach(function (expense) {
        categories[expense.category] =
            (categories[expense.category] || 0) + Number(expense.amount);
    });

    const report = document.getElementById("categoryReport");

    if (Object.keys(categories).length === 0) {
        report.innerHTML = "No report available.";
        return;
    }

    report.innerHTML = Object.keys(categories).map(function (category) {
        return `
            <div class="item">
                <strong>${escapeHTML(category)}</strong>
                <span>${money(categories[category])}</span>
            </div>
        `;
    }).join("");
}


// MONTHLY BUDGET

function saveBudget() {
    const amount = Number(document.getElementById("monthlyBudgetInput").value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid monthly budget.");
        return;
    }

    monthlyBudget = amount;
    saveData();
    updateApp();

    alert("Monthly budget saved.");
}

function saveCategoryBudget() {
    const category = document.getElementById("budgetCategory").value;
    const amount = Number(document.getElementById("categoryBudgetInput").value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid category budget.");
        return;
    }

    categoryBudgets[category] = amount;

    document.getElementById("categoryBudgetInput").value = "";

    saveData();
    updateApp();

    alert("Category budget saved.");
}

function updateBudget() {
    document.getElementById("monthlyBudgetInput").value =
        monthlyBudget || "";

    document.getElementById("dashboardBudget").textContent =
        money(monthlyBudget);

    const monthly = getMonthlyExpenses();

    const total = monthly.reduce(function (sum, expense) {
        return sum + Number(expense.amount);
    }, 0);

    const status = document.getElementById("budgetStatus");

    if (monthlyBudget > 0) {
        const remaining = monthlyBudget - total;

        status.textContent = remaining >= 0
            ? "Remaining budget: " + money(remaining)
            : "You are over budget by " + money(Math.abs(remaining));
    } else {
        status.textContent = "Set a monthly budget to track spending.";
    }

    const categoryList = document.getElementById("categoryBudgetList");

    categoryList.innerHTML = Object.keys(categoryBudgets).map(function (category) {
        const spent = monthly
            .filter(function (expense) {
                return expense.category === category;
            })
            .reduce(function (sum, expense) {
                return sum + Number(expense.amount);
            }, 0);

        const budget = Number(categoryBudgets[category]);
        const percent = budget > 0
            ? Math.min((spent / budget) * 100, 100)
            : 0;

        return `
            <div class="item">
                <strong>${escapeHTML(category)}</strong>
                <small>Spent: ${money(spent)} / Budget: ${money(budget)}</small>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${percent}%"></div>
                </div>
            </div>
        `;
    }).join("") || "No category budgets saved.";
}


// PROFILE

function saveProfile() {
    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    profile = {
        name: name,
        email: email
    };

    saveData();
    updateProfile();

    alert("Profile saved successfully.");
}

function updateProfile() {
    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileEmail").value = profile.email || "";

    document.getElementById("profileDetails").innerHTML = `
        <div class="item">
            <strong>${escapeHTML(profile.name || "User")}</strong>
            <small>${escapeHTML(profile.email || "No email added")}</small>
        </div>
    `;
}


// DEMO PIN

function changePin() {
    const oldPin = document.getElementById("oldPin").value;
    const newPin = document.getElementById("newPin").value;

    if (oldPin !== demoPin) {
        alert("Current PIN is incorrect.");
        return;
    }

    if (!/^\d{4}$/.test(newPin)) {
        alert("New PIN must contain exactly 4 digits.");
        return;
    }

    demoPin = newPin;
    saveData();

    document.getElementById("oldPin").value = "";
    document.getElementById("newPin").value = "";

    alert("Demo PIN changed successfully.");
}


// DARK MODE

function toggleDarkMode() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark") ? "on" : "off"
    );
}


// CSV EXPORT

function exportCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    const rows = [
        ["Type", "Name", "Amount", "Date"],
        ...transactions.map(function (transaction) {
            return [
                transaction.type,
                transaction.name,
                transaction.amount,
                transaction.date
            ];
        })
    ];

    const csv = rows.map(function (row) {
        return row.map(function (value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart_Transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
}


// BACKUP

function downloadBackup() {
    const backup = {
        walletBalance: walletBalance,
        transactions: transactions,
        expenses: expenses,
        qrHistory: qrHistory,
        profile: profile,
        monthlyBudget: monthlyBudget,
        categoryBudgets: categoryBudgets,
        demoPin: demoPin
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart_Backup.json";
    link.click();

    URL.revokeObjectURL(url);
}


// RESTORE BACKUP

function restoreBackup() {
    const fileInput = document.getElementById("restoreFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a backup JSON file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const backup = JSON.parse(event.target.result);

            if (
                !backup ||
                typeof backup !== "object" ||
                !Number.isFinite(Number(backup.walletBalance)) ||
                !Array.isArray(backup.transactions) ||
                !Array.isArray(backup.expenses) ||
                !Array.isArray(backup.qrHistory) ||
                !backup.profile ||
                typeof backup.profile !== "object" ||
                typeof backup.categoryBudgets !== "object"
            ) {
                throw new Error("Invalid backup");
            }

            if (!confirm("Restore this backup? Current PaySmart data will be replaced.")) {
                return;
            }

            walletBalance = Number(backup.walletBalance);
            transactions = backup.transactions;
            expenses = backup.expenses;
            qrHistory = backup.qrHistory;
            profile = backup.profile;
            monthlyBudget = Number(backup.monthlyBudget) || 0;
            categoryBudgets = backup.categoryBudgets || {};
            demoPin = backup.demoPin || "1234";

            saveData();
            updateApp();

            alert("Backup restored successfully.");
        } catch (error) {
            alert("Invalid backup file. Please select a PaySmart backup.");
        }
    };

    reader.readAsText(file);
}


// RESET DEMO DATA

function resetDemoData() {
    if (!confirm("Are you sure? This will permanently clear PaySmart demo data from this browser.")) {
        return;
    }

    walletBalance = 0;
    transactions = [];
    expenses = [];
    qrHistory = [];
    profile = { name: "User", email: "" };
    monthlyBudget = 0;
    categoryBudgets = {};
    demoPin = "1234";

    saveData();
    updateApp();

    alert("PaySmart demo data has been reset.");
}


// DASHBOARD

function updateDashboard() {
    document.getElementById("dashboardBalance").textContent =
        money(walletBalance);

    document.getElementById("dashboardExpenses").textContent =
        money(getMonthlyExpenses().reduce(function (sum, expense) {
            return sum + Number(expense.amount);
        }, 0));

    document.getElementById("dashboardTransactions").textContent =
        transactions.length;

    updateDashboardChart();
    updateSpendingInsights();
    updateRecentTransactions();
}

function updateDashboardChart() {
    const monthly = getMonthlyExpenses();
    const totals = {};

    monthly.forEach(function (expense) {
        totals[expense.category] =
            (totals[expense.category] || 0) + Number(expense.amount);
    });

    const chart = document.getElementById("dashboardChart");
    const values = Object.values(totals);
    const maximum = Math.max(...values, 1);

    if (values.length === 0) {
      
