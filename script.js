
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
let profile = loadData("profile", { name: "User", email: "" });
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


// COMMON FUNCTIONS

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


// NAVIGATION

function showSection(sectionId) {
    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.remove("active");
    });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add("active");
    }

    updateApp();
}


// ADD MONEY

function addMoney() {
    const input = document.getElementById("addAmount");
    const amount = Number(input.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
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

    alert(money(amount) + " added successfully.");
}


// SEND MONEY - DEMO

function sendMoney() {
    const nameInput = document.getElementById("receiverName");
    const amountInput = document.getElementById("sendAmount");

    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);

    if (!name) {
        alert("Enter receiver name.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
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

    alert("Demo transaction successful. No real money was transferred.");
}


// EXPENSE TRACKER

function addExpense() {
    const titleInput = document.getElementById("expenseTitle");
    const amountInput = document.getElementById("expenseAmount");
    const categoryInput = document.getElementById("expenseCategory");

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;

    if (!title) {
        alert("Enter expense description.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid expense amount.");
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
    if (!confirm("Delete this expense and refund the demo wallet?")) {
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

    list.innerHTML = transactions.map(function (item) {
        const amount = Number(item.amount);
        const color = amount >= 0 ? "amount-positive" : "amount-negative";

        return `
            <div class="item">
                <strong>${escapeHTML(item.type)}</strong>
                <small>${escapeHTML(item.name)} | ${escapeHTML(item.date)}</small>
                <p class="${color}">${amount >= 0 ? "+" : ""}${money(amount)}</p>
            </div>
        `;
    }).join("");
}

function filterTransactions() {
    const search = document.getElementById("transactionSearch").value.toLowerCase();
    const list = document.getElementById("transactionList");

    const filtered = transactions.filter(function (item) {
        return String(item.type).toLowerCase().includes(search) ||
            String(item.name).toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
        list.innerHTML = "No matching transactions.";
        return;
    }

    list.innerHTML = filtered.map(function (item) {
        const amount = Number(item.amount);
        const color = amount >= 0 ? "amount-positive" : "amount-negative";

        return `
            <div class="item">
                <strong>${escapeHTML(item.type)}</strong>
                <small>${escapeHTML(item.name)} | ${escapeHTML(item.date)}</small>
                <p class="${color}">${amount >= 0 ? "+" : ""}${money(amount)}</p>
            </div>
        `;
    }).join("");
}


// QR SCANNER

function startScanner() {
    const result = document.getElementById("scanResult");

    if (typeof Html5Qrcode === "undefined") {
        result.textContent = "Scanner library not loaded. Check internet connection.";
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
        function () {}
    ).catch(function () {
        scanner = null;
        result.textContent = "Camera could not start. Check camera permission and HTTPS.";
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
    }).catch(function () {});

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
    if (!confirm("Clear QR history?")) return;

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

    const total = monthly.reduce(function (sum, item) {
        return sum + Number(item.amount);
    }, 0);

    document.getElementById("monthlyTotal").textContent = money(total);
    document.getElementById("monthlyCount").textContent = monthly.length;

    const categories = {};

    monthly.forEach(function (item) {
        categories[item.category] =
            (categories[item.category] || 0) + Number(item.amount);
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


// BUDGET MANAGEMENT

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

    const total = monthly.reduce(function (sum, item) {
        return sum + Number(item.amount);
    }, 0);

    const remaining = monthlyBudget - total;

    document.getElementById("budgetStatus").textContent =
        monthlyBudget > 0
            ? (remaining >= 0
                ? "Remaining budget: " + money(remaining)
                : "Over budget by " + money(Math.abs(remaining)))
            : "Set a monthly budget to track spending.";

    const list = document.getElementById("categoryBudgetList");

    list.innerHTML = Object.keys(categoryBudgets).map(function (category) {
        const spent = monthly
            .filter(function (item) {
                return item.category === category;
            })
            .reduce(function (sum, item) {
                return sum + Number(item.amount);
            }, 0);

        const budget = Number(categoryBudgets[category]);
        const percent = budget > 0
            ? Math.min(spent / budget * 100, 100)
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
        alert("Enter your name.");
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


// CHANGE DEMO PIN

function changePin() {
    const oldPin = document.getElementById("oldPin").value;
    const newPin = document.getElementById("newPin").value;

    if (oldPin !== demoPin) {
        alert("Incorrect current PIN.");
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
        ...transactions.map(function (item) {
            return [item.type, item.name, item.amount, item.date];
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
    const file = document.getElementById("restoreFile").files[0];

    if (!file) {
        alert("Select a backup JSON file.");
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
                !backup.categoryBudgets ||
                typeof backup.categoryBudgets !== "object"
            ) {
                throw new Error("Invalid backup");
            }

            if (!confirm("Replace current demo data with this backup?")) {
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
            alert("Invalid PaySmart backup file.");
        }
    };

    reader.readAsText(file);
}


// RESET DEMO DATA

function resetDemoData() {
    if (!confirm("Clear all PaySmart demo data?")) return;

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

    alert("Demo data reset successfully.");
}


// DASHBOARD

function updateDashboard() {
    document.getElementById("dashboardBalance").textContent =
        money(walletBalance);

    const monthly = getMonthlyExpenses();

    const total = monthly.reduce(function (sum, item) {
        return sum + Number(item.amount);
    }, 0);

    document.getElementById("dashboardExpenses").textContent = money(total);

    document.getElementById("dashboardTransactions").textContent =
        transactions.length;

    updateDashboardChart();
    updateSpendingInsights();
    updateRecentTransactions();
}

function updateDashboardChart() {
    const totals = {};

    getMonthlyExpenses().forEach(function (item) {
        totals[item.category] =
            (totals[item.category] || 0) + Number(item.amount);
    });

    const chart = document.getElementById("dashboardChart");
    const values = Object.values(totals);
    const maximum = Math.max(...values, 1);

    if (values.length === 0) {
        chart.innerHTML = "No spending data available this month.";
        return;
    }

    chart.innerHTML = Object.keys(totals).map(function (category) {
        const amount = totals[category];
        const percent = amount / maximum * 100;

        return `
            <div class="chart-row">
                <div class="chart-label">
                    <span>${escapeHTML(category)}</span>
                    <strong>${money(amount)}</strong>
                </div>
                <div class="chart-track">
                    <div class="chart-fill" style="width:${percent}%"></div>
                </div>
            </div>
        
