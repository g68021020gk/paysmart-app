
// PAYSMART DATA

let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let qrHistory = JSON.parse(localStorage.getItem("qrHistory") || "[]");
let profile = JSON.parse(localStorage.getItem("profile") || '{"name":"User","email":""}');
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let categoryBudgets = JSON.parse(localStorage.getItem("categoryBudgets") || "{}");
let demoPin = localStorage.getItem("demoPin") || "1234";

let scanner = null;
let scannerRunning = false;


// SAFE DATA CHECK

if (!Array.isArray(transactions)) transactions = [];
if (!Array.isArray(expenses)) expenses = [];
if (!Array.isArray(qrHistory)) qrHistory = [];
if (!profile || typeof profile !== "object") profile = {name:"User", email:""};
if (!categoryBudgets || typeof categoryBudgets !== "object") categoryBudgets = {};


// SAVE DATA

function saveData() {
    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    localStorage.setItem("profile", JSON.stringify(profile));
    localStorage.setItem("monthlyBudget", monthlyBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
    localStorage.setItem("demoPin", demoPin);
}


// HELPERS

function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function validAmount(value) {
    return Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 10000000;
}

function currentMonthExpenses() {
    const now = new Date();

    return expenses.filter(item => {
        const date = new Date(item.date);
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
    });
}


// NAVIGATION

function showSection(id) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const section = document.getElementById(id);

    if (section) {
        section.classList.add("active");
    }

    updateApp();
}


// ADD MONEY

function addMoney() {
    const input = document.getElementById("addAmount");
    const amount = Number(input.value);

    if (!validAmount(amount)) {
        alert("Enter a valid amount.");
        return;
    }

    walletBalance += amount;

    transactions.unshift({
        type: "Money Added",
        name: "Wallet",
        amount: amount,
        date: new Date().toISOString()
    });

    input.value = "";

    saveData();
    updateApp();

    alert("Demo money added successfully!");
}


// SEND MONEY

function sendMoney() {
    const name = document.getElementById("receiverName").value.trim();
    const amount = Number(document.getElementById("sendAmount").value);

    if (!name || !validAmount(amount)) {
        alert("Enter a receiver name and valid amount.");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient demo wallet balance.");
        return;
    }

    if (!confirm("This is only a demo transaction. Continue?")) {
        return;
    }

    walletBalance -= amount;

    transactions.unshift({
        type: "Demo Sent",
        name: name,
        amount: amount,
        date: new Date().toISOString()
    });

    document.getElementById("receiverName").value = "";
    document.getElementById("sendAmount").value = "";

    saveData();
    updateApp();

    alert("Demo transaction completed. No real money was transferred.");
}


// ADD EXPENSE

function addExpense() {
    const title = document.getElementById("expenseTitle").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;

    if (!title || !validAmount(amount)) {
        alert("Enter an expense name and valid amount.");
        return;
    }

    expenses.unshift({
        id: Date.now(),
        title: title,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    });

    document.getElementById("expenseTitle").value = "";
    document.getElementById("expenseAmount").value = "";

    saveData();
    updateApp();

    alert("Expense added!");
}


// DELETE EXPENSE

function deleteExpense(id) {
    expenses = expenses.filter(item => item.id !== id);

    saveData();
    updateApp();
}


// DISPLAY EXPENSES

function displayExpenses() {
    const list = document.getElementById("expenseList");

    if (!expenses.length) {
        list.innerHTML = "<p>No expenses added yet.</p>";
        return;
    }

    list.innerHTML = expenses.map(item => `
        <div class="item">
            <strong>${escapeHTML(item.title)}</strong>
            <p>${escapeHTML(item.category)} - ${money(item.amount)}</p>
            <small>${new Date(item.date).toLocaleDateString()}</small>
            <button class="danger" onclick="deleteExpense(${Number(item.id)})">Delete</button>
        </div>
    `).join("");
}


// TRANSACTION HISTORY

function displayTransactions(search = "") {
    const list = document.getElementById("transactionList");

    const filtered = transactions.filter(item =>
        String(item.name).toLowerCase().includes(search.toLowerCase()) ||
        String(item.type).toLowerCase().includes(search.toLowerCase())
    );

    if (!filtered.length) {
        list.innerHTML = "<p>No transactions found.</p>";
        return;
    }

    list.innerHTML = filtered.map(item => `
        <div class="item">
            <strong>${escapeHTML(item.type)}</strong>
            <p>${escapeHTML(item.name)}</p>
            <p>${money(item.amount)}</p>
            <small>${new Date(item.date).toLocaleString()}</small>
        </div>
    `).join("");
}

function filterTransactions() {
    const search = document.getElementById("transactionSearch").value;
    displayTransactions(search);
}


// QR SCANNER

async function startScanner() {
    if (scannerRunning) {
        alert("Scanner is already running.");
        return;
    }

    if (typeof Html5Qrcode === "undefined") {
        alert("QR scanner library could not load. Check your internet connection.");
        return;
    }

    try {
        scanner = new Html5Qrcode("reader");

        await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            function(decodedText) {
                document.getElementById("scanResult").textContent =
                    "Scanned result: " + decodedText;

                qrHistory.unshift({
                    text: decodedText,
                    date: new Date().toISOString()
                });

                saveData();
                displayQRHistory();
                stopScanner();
            },
            function() {}
        );

        scannerRunning = true;

    } catch (error) {
        scanner = null;
        scannerRunning = false;
        alert("Unable to start camera. Allow camera permission and open the website using HTTPS.");
    }
}

async function stopScanner() {
    if (scanner && scannerRunning) {
        try {
            await scanner.stop();
            await scanner.clear();
        } catch (error) {
            console.log("Scanner stopped.");
        }
    }

    scanner = null;
    scannerRunning = false;
}

function displayQRHistory() {
    const list = document.getElementById("qrHistoryList");

    if (!qrHistory.length) {
        list.innerHTML = "<p>No QR scans yet.</p>";
        return;
    }

    list.innerHTML = qrHistory.map(item => `
        <div class="item">
            <p>${escapeHTML(item.text)}</p>
            <small>${new Date(item.date).toLocaleString()}</small>
        </div>
    `).join("");
}

function clearQRHistory() {
    if (!confirm("Clear all QR scan history?")) return;

    qrHistory = [];
    saveData();
    displayQRHistory();
}


// MONTHLY REPORT

function displayReport() {
    const monthly = currentMonthExpenses();

    const total = monthly.reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById("monthlyTotal").textContent = money(total);
    document.getElementById("monthlyCount").textContent = monthly.length;

    const categories = {};

    monthly.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + Number(item.amount);
    });

    const report = document.getElementById("categoryReport");

    if (!Object.keys(categories).length) {
        report.innerHTML = "<p>No expenses this month.</p>";
        return;
    }

    report.innerHTML = Object.entries(categories).map(([name, amount]) => `
        <div class="item">
            <strong>${escapeHTML(name)}</strong>
            <p>${money(amount)}</p>
        </div>
    `).join("");
}


// MONTHLY BUDGET

function saveBudget() {
    const amount = Number(document.getElementById("monthlyBudgetInput").value);

    if (!validAmount(amount)) {
        alert("Enter a valid budget.");
        return;
    }

    monthlyBudget = amount;

    saveData();
    updateApp();

    alert("Monthly budget saved!");
}


// CATEGORY BUDGET

function saveCategoryBudget() {
    const category = document.getElementById("budgetCategory").value;
    const amount = Number(document.getElementById("categoryBudgetInput").value);

    if (!validAmount(amount)) {
        alert("Enter a valid category budget.");
        return;
    }

    categoryBudgets[category] = amount;

    document.getElementById("categoryBudgetInput").value = "";

    saveData();
    updateApp();

    alert("Category budget saved!");
}

function displayCategoryBudgets() {
    const list = document.getElementById("categoryBudgetList");

    const categories = Object.keys(categoryBudgets);

    if (!categories.length) {
        list.innerHTML = "<p>No category budgets saved.</p>";
        return;
    }

    list.innerHTML = categories.map(category => {
        const spent = currentMonthExpenses()
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + Number(item.amount), 0);

        const budget = Number(categoryBudgets[category]);
        const remaining = budget - spent;

        return `
            <div class="item">
                <strong>${escapeHTML(category)}</strong>
                <p>Budget: ${money(budget)}</p>
                <p>Spent: ${money(spent)}</p>
                <p>Remaining: ${money(remaining)}</p>
            </div>
        `;
    }).join("");
}


// PROFILE

function saveProfile() {
    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();

    if (!name) {
        alert("Enter your name.");
        return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Enter a valid email address.");
        return;
    }

    profile = { name: name, email: email };

    saveData();
    updateApp();

    alert("Profile saved!");
}

function displayProfile() {
    document.getElementById("profileDetails").innerHTML = `
        <div class="item">
            <p><strong>Name:</strong> ${escapeHTML(profile.name)}</p>
            <p><strong>Email:</strong> ${escapeHTML(profile.email || "Not provided")}</p>
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
        alert("New demo PIN must contain exactly 4 digits.");
        return;
    }

    demoPin = newPin;

    document.getElementById("oldPin").value = "";
    document.getElementById("newPin").value = "";

    saveData();

    alert("Demo PIN changed!");
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
    if (!transactions.length) {
        alert("No transactions to export.");
        return;
    }

    const rows = [
        ["Type", "Name", "Amount", "Date"],
        ...transactions.map(item => [
            item.type,
            item.name,
            item.amount,
            item.date
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart-Transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
}


// BACKUP

function downloadBackup() {
    const data = {
        walletBalance,
        transactions,
        expenses,
        qrHistory,
        profile,
        monthlyBudget,
        categoryBudgets,
        demoPin
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart-Backup.json";
    link.click();

    URL.revokeObjectURL(url);
}


// RESTORE BACKUP

function restoreBackup() {
    const file = document.getElementById("restoreFile").files[0];

    if (!file) {
        alert("Choose a backup JSON file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);

            if (
                typeof data.walletBalance !== "number" ||
                !Array.isArray(data.transactions) ||
                !Array.isArray(data.expenses) ||
                !Array.isArray(data.qrHistory)
            ) {
                throw new Error("Invalid backup format.");
            }

            walletBalance = data.walletBalance;
            transactions = data.transactions;
            expenses = data.expenses;
            qrHistory = data.qrHistory;
            profile = data.profile || {name:"User", email:""};
            monthlyBudget = Number(data.monthlyBudget) || 0;
            categoryBudgets = data.categoryBudgets || {};
            demoPin = data.demoPin || "1234";

            saveData();
            updateApp();

            alert("Backup restored successfully!");

        } catch (error) {
            alert("Invalid backup file. Please select a PaySmart backup.");
        }
    };

    reader.readAsText(file);
}


// RESET DATA

function resetDemoData() {
    if (!confirm("Are you sure you want to reset all PaySmart demo data?")) {
        return;
    }

    walletBalance = 0;
    transactions = [];
    expenses = [];
    qrHistory = [];
    profile = {name:"User", email:""};
    monthlyBudget = 0;
    categoryBudgets = {};
    demoPin = "1234";

    saveData();
    updateApp();

    alert("Demo data reset successfully.");
}


// DASHBOARD

function updateDashboard() {
    const monthly = currentMonthExpenses();

    const total = monthly.reduce(
        (sum, item) => sum + Number(item.amount), 0
    );

    document.getElementById("dashboardBalance").textContent = money(walletBalance);
    document.getElementById("dashboardExpenses").textContent = money(total);
    document.getElementById("dashboardTransactions").textContent = transactions.length;
    document.getElementById("dashboardBudget").textContent = money(monthlyBudget);

    const chart = document.getElementById("dashboardChart");

    if (!monthly.length) {
        chart.innerHTML = "<p>No spending data this month.</p>";
    } else {
        const categories = {};

        monthly.forEach(item => {
            categories[item.category] =
                (categories[item.category] || 0) + Number(item.amount);
        });

        const max = Math.max(...Object.values(categories), 1);

        chart.innerHTML = Object.entries(categories).map(([name, amount]) => `
            <div class="bar-row">
                <div class="bar-label">
                    <span>${escapeHTML(name)}</span>
                    <span>${money(amount)}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${amount / max * 100}%"></div>
                </div>
            </div>
        `).join("");
    }

    const insight = document.getElementById("dashboardInsight");

    if (monthlyBudget > 0) {
        const remaining = monthlyBudget - total;

        insight.textContent = remaining >= 0
            ? "You have " + money(remaining) + " left in your monthly budget."
            : "You are over your monthly budget by " + money(Math.abs(remaining)) + ".";
    } else {
        insight.textContent = "Set a monthly budget to see your spending insights.";
    }

    const recent = document.getElementById("recentTransactions");

    recent.innerHTML = transactions.length
        ? transactions.slice(0, 5).map(item => `
            <div class="item">
                <strong>${escapeHTML(item.type)}</strong>
                <p>${escapeHTML(item.name)} - ${money(item.amount)}</p>
            </div>
        `).join("")
        : "<p>No transactions yet.</p>";
}


// UPDATE ALL SCREENS

function updateApp() {
    document.getElementById("walletBalance").textContent = money(walletBalance);

    displayExpenses();
    displayTransactions(
        document.getElementById("transactionSearch").value
    );
    displayQRHistory();
    displayReport();
    displayCategoryBudgets();
    displayProfile();
    updateDashboard();

    document.getElementById("budgetStatus").textContent =
        monthlyBudget > 0
            ? "Monthly budget: " + money(monthlyBudget)
            : "No monthly budget set.";
}


// START APP

document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem("darkMode") === "on") {
        document.body.classList.add("dark");
    }

    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileEmail").value = profile.email || "";

    updateApp();
});
    
