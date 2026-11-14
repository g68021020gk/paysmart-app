
let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let qrHistory = JSON.parse(localStorage.getItem("qrHistory") || "[]");
let profile = JSON.parse(localStorage.getItem("profile") || '{"name":"User","email":""}');
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let categoryBudgets = JSON.parse(localStorage.getItem("categoryBudgets") || "{}");

let scanner = null;
let pin = localStorage.getItem("demoPin") || "1234";

function saveData() {
    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    localStorage.setItem("profile", JSON.stringify(profile));
    localStorage.setItem("monthlyBudget", monthlyBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
}

function showSection(id) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
    updateApp();
}

function addMoney() {
    let amount = Number(document.getElementById("addAmount").value);

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid amount.");
        return;
    }

    walletBalance += amount;

    transactions.unshift({
        type: "Added Money",
        name: "Wallet",
        amount: amount,
        date: new Date().toLocaleString()
    });

    document.getElementById("addAmount").value = "";

    saveData();
    updateApp();
    alert("Demo money added successfully!");
}

function sendMoney() {
    let name = document.getElementById("receiverName").value.trim();
    let amount = Number(document.getElementById("sendAmount").value);

    if (!name || amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter valid receiver details and amount.");
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
        amount: amount,
        date: new Date().toLocaleString()
    });

    document.getElementById("receiverName").value = "";
    document.getElementById("sendAmount").value = "";

    saveData();
    updateApp();
    alert("Demo transaction completed. No real money was sent.");
}

function addExpense() {
    let name = document.getElementById("expenseName").value.trim();
    let amount = Number(document.getElementById("expenseAmount").value);
    let category = document.getElementById("expenseCategory").value;

    if (!name || amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter valid expense details.");
        return;
    }

    expenses.unshift({
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    });

    walletBalance -= amount;

    transactions.unshift({
        type: "Expense",
        name: name,
        amount: amount,
        date: new Date().toLocaleString()
    });

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";

    saveData();
    updateApp();
    alert("Expense added successfully!");
}

function filterTransactions() {
    let search = document.getElementById("transactionSearch").value.toLowerCase();
    let list = document.getElementById("transactionList");

    list.innerHTML = "";

    transactions.filter(item =>
        String(item.type).toLowerCase().includes(search) ||
        String(item.name).toLowerCase().includes(search)
    ).forEach(item => {
        let li = document.createElement("li");
        li.textContent = item.type + " - " + item.name +
            " - ₹" + Number(item.amount).toFixed(2) + " - " + item.date;
        list.appendChild(li);
    });
}

function updateQRHistory() {
    let list = document.getElementById("qrHistoryList");
    list.innerHTML = "";

    qrHistory.forEach(item => {
        let li = document.createElement("li");
        li.textContent = item.result + " - " + item.date;
        list.appendChild(li);
    });
}

function clearQRHistory() {
    if (confirm("Clear all QR scan history?")) {
        qrHistory = [];
        saveData();
        updateQRHistory();
    }
}

function startScanner() {
    if (!window.Html5Qrcode) {
        alert("QR scanner library could not load. Check your internet connection.");
        return;
    }

    if (scanner) {
        alert("Scanner is already running.");
        return;
    }

    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        result => {
            document.getElementById("qrResult").textContent =
                "Result: " + result;

            qrHistory.unshift({
                result: result,
                date: new Date().toLocaleString()
            });

            saveData();
            updateQRHistory();
            stopScanner();
        },
        () => {}
    ).catch(() => {
        scanner = null;
        alert("Unable to start scanner. Allow camera permission and use HTTPS.");
    });
}

function stopScanner() {
    if (scanner) {
        let currentScanner = scanner;
        scanner = null;

        currentScanner.stop().then(() => {
            currentScanner.clear();
        }).catch(() => {});
    }
}

function exportCSV() {
    let csv = "Type,Name,Amount,Date\n";

    transactions.forEach(item => {
        let values = [item.type, item.name, item.amount, item.date];

        csv += values.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(",") + "\n";
    });

    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart_Transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
}

function getMonthlyExpenses() {
    let now = new Date();

    return expenses.filter(item => {
        let date = new Date(item.date);

        return !Number.isNaN(date.getTime()) &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();
    });
}

function updateReport() {
    let monthlyExpenses = getMonthlyExpenses();

    let total = monthlyExpenses.reduce(
        (sum, item) => sum + Number(item.amount), 0
    );

    document.getElementById("monthlyTotal").textContent =
        "Monthly Expenses: ₹" + total.toFixed(2);

    let categories = {};

    monthlyExpenses.forEach(item => {
        categories[item.category] =
            (categories[item.category] || 0) + Number(item.amount);
    });

    let chart = document.getElementById("reportChart");
    chart.innerHTML = "";

    Object.entries(categories).forEach(([category, amount]) => {
        let row = document.createElement("p");
        row.textContent = category + ": ₹" + amount.toFixed(2);
        chart.appendChild(row);
    });

    if (monthlyExpenses.length === 0) {
        chart.textContent = "No expenses recorded this month.";
    }
}

function saveBudget() {
    let amount = Number(document.getElementById("monthlyBudget").value);

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid budget.");
        return;
    }

    monthlyBudget = amount;
    saveData();
    updateApp();

    alert("Monthly budget saved!");
}

function saveCategoryBudget() {
    let category = document.getElementById("budgetCategory").value;
    let amount = Number(document.getElementById("categoryBudgetAmount").value);

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid category budget.");
        return;
    }

    categoryBudgets[category] = amount;
    document.getElementById("categoryBudgetAmount").value = "";

    saveData();
    updateApp();

    alert("Category budget saved!");
}

function updateBudget() {
    document.getElementById("monthlyBudget").value = monthlyBudget || "";

    let total = getMonthlyExpenses().reduce(
        (sum, item) => sum + Number(item.amount), 0
    );

    let status = document.getElementById("budgetStatus");

    if (monthlyBudget > 0) {
        let remaining = monthlyBudget - total;

        status.textContent = remaining >= 0
            ? "Remaining budget: ₹" + remaining.toFixed(2)
            : "Budget exceeded by: ₹" + Math.abs(remaining).toFixed(2);
    } else {
        status.textContent = "Set a monthly budget to track your spending.";
    }

    let list = document.getElementById("categoryBudgetList");
    list.innerHTML = "";

    Object.entries(categoryBudgets).forEach(([category, budget]) => {
        let spent = getMonthlyExpenses()
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + Number(item.amount), 0);

        let p = document.createElement("p");

        p.textContent = category + ": ₹" + spent.toFixed(2) +
            " / ₹" + Number(budget).toFixed(2);

        list.appendChild(p);
    });
}

function saveProfile() {
    let name = document.getElementById("profileName").value.trim();
    let email = document.getElementById("profileEmail").value.trim();

    if (!name) {
        alert("Enter your name.");
        return;
    }

    profile = { name: name, email: email };

    saveData();
    updateProfile();

    document.getElementById("profileMessage").textContent =
        "Profile saved successfully!";
}

function updateProfile() {
    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileEmail").value = profile.email || "";
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark-mode") ? "on" : "off"
    );

    updateDashboard();
}

function changePin() {
    let current = document.getElementById("currentPin").value;
    let newValue = document.getElementById("newPin").value;
    let message = document.getElementById("pinMessage");

    if (current !== pin) {
        message.textContent = "Incorrect current PIN.";
        return;
    }

    if (!/^\d{4,6}$/.test(newValue)) {
        message.textContent = "New PIN must contain 4 to 6 digits.";
        return;
    }

    pin = newValue;
    localStorage.setItem("demoPin", pin);

    document.getElementById("currentPin").value = "";
    document.getElementById("newPin").value = "";

    message.textContent = "Demo PIN changed successfully.";
}

/* Dashboard */

function updateDashboard() {
    let monthlyExpenses = getMonthlyExpenses();

    let total = monthlyExpenses.reduce(
        (sum, item) => sum + Number(item.amount), 0
    );

    document.getElementById("dashboardBalance").textContent =
        "₹" + walletBalance.toFixed(2);

    document.getElementById("dashboardExpenses").textContent =
        "₹" + total.toFixed(2);

    document.getElementById("dashboardTransactions").textContent =
        transactions.length;

    document.getElementById("dashboardBudget").textContent =
        monthlyBudget > 0 ? "₹" + monthlyBudget.toFixed(2) : "Not Set";

    updateDashboardChart(monthlyExpenses);
    updateSpendingInsights(monthlyExpenses, total);
    updateRecentTransactions();
}

function updateDashboardChart(monthlyExpenses) {
    let categories = {};

    monthlyExpenses.forEach(item => {
        categories[item.category] =
            (categories[item.category] || 0) + Number(item.amount);
    });

    let chart = document.getElementById("dashboardChart");
    chart.innerHTML = "";

    let entries = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        chart.textContent = "No spending data available this month.";
        return;
    }

    let maximum = Math.max(...entries.map(item => item[1]));

    entries.forEach(([category, amount]) => {
        let row = document.createElement("div");
        row.className = "chart-row";

        let label = document.createElement("div");
        label.className = "chart-label";

        let name = document.createElement("span");
        name.textContent = category;

        let value = document.createElement("strong");
        value.textContent = "₹" + amount.toFixed(2);

        label.appendChild(name);
        label.appendChild(value);

        let track = document.createElement("div");
        track.className = "chart-track";

        let fill = document.createElement("div");
        fill.className = "chart-fill";
        fill.style.width = (amount / maximum * 100) + "%";

        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);

        chart.appendChild(row);
    });
}

function updateSpendingInsights(monthlyExpenses, total) {
    let insights = document.getElementById("spendingInsights");
    insights.innerHTML = "";

    let messages = [];

    if (monthlyExpenses.length === 0) {
        messages.push("No expenses recorded this month. Add an expense to see your insights.");
    } else {
        let categories = {};

        monthlyExpenses.forEach(item => {
            categories[item.category] =
                (categories[item.category] || 0) + Number(item.amount);
        });

        let highest = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0];

        messages.push(
            "Highest spending category: " + highest[0] +
            " (₹" + highest[1].toFixed(2) + ")."
        );

        messages.push(
            "You recorded " + monthlyExpenses.length +
            " expenses this month."
        );

        if (monthlyBudget > 0) {
            let remaining = monthlyBudget - total;

            if (remaining >= 0) {
                messages.push(
                    "You have ₹" + remaining.toFixed(2) +
                    " left in your monthly budget."
                );
            } else {
                messages.push(
                    "You exceeded your monthly budget by ₹" +
                    Math.abs(remaining).toFixed(2) + "."
                );
            }
        } else {
            messages.push(
                "Set a monthly budget to monitor your spending."
            );
        }
    }

    messages.forEach(message => {
        let item = document.createElement("div");
        item.className = "insight-item";
        item.textContent = message;
        insights.appendChild(item);
    });
}

function updateRecentTransactions() {
    let list = document.getElementById("dashboardRecentTransactions");
    list.innerHTML = "";

    let recent = transactions.slice(0, 5);

    if (recent.length === 0) {
        list.innerHTML = "<li>No transactions available.</li>";
        return;
    }

    recent.forEach(item => {
        let li = document.createElement("li");

        li.textContent = item.type + " - " + item.name +
            " - ₹" + Number(item.amount).toFixed(2);

        list.appendChild(li);
    });
}

/* Backup and Restore */

function downloadBackup() {
    let backup = {
        appName: "PaySmart",
        backupVersion: 1,
        backupDate: new Date().toISOString(),
        walletBalance: walletBalance,
        transactions: transactions,
        expenses: expenses,
        qrHistory: qrHistory,
        profile: profile,
        monthlyBudget: monthlyBudget,
        categoryBudgets: categoryBudgets
    };

    let blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart_Backup.json";
    link.click();

    URL.revokeObjectURL(url);

    document.getElementById("backupMessage").textContent =
        "Backup downloaded successfully!";
}

function validateBackup(data) {
    if (!data || typeof data !== "object" ||
        Array.isArray(data) ||
        data.appName !== "PaySmart" ||
        data.backupVersion !== 1) {
        return false;
    }

    if (!Number.isFinite(data.walletBalance) ||
        data.walletBalance < 0 ||
        !Array.isArray(data.transactions) ||
        !Array.isArray(data.expenses) ||
        !Array.isArray(data.qrHistory) ||
        !data.profile ||
        typeof data.profile.name !== "string" ||
        typeof data.profile.email !== "string" ||
        !Number.isFinite(data.monthlyBudget) ||
        data.monthlyBudget < 0 ||
        !data.categoryBudgets ||
        typeof data.categoryBudgets !== "object" ||
        Array.isArray(data.categoryBudgets)) {
        return false;
    }

    let validTransactions = data.transactions.every(item =>
        item &&
        typeof item.type === "string" &&
        typeof item.name === "string" &&
        Number.isFinite(item.amount) &&
        item.amount >= 0 &&
        typeof item.date === "string"
    );

    let validExpenses = data.expenses.every(item =>
        item &&
        typeof item.name === "string" &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.category === "string" &&
        typeof item.date === "string" &&
        !Number.isNaN(Date.parse(item.date))
    );

    let validQR = data.qrHistory.every(item =>
        item &&
        typeof item.result === "string" &&
        typeof item.date === "string"
    );

    let validBudgets = Object.values(data.categoryBudgets).every(value =>
        Number.isFinite(value) && value > 0
    );

    return validTransactions && validExpenses && validQR && validBudgets;
}

function restoreBackup() {
    let fileInput = document.getElementById("restoreFile");
    let message = document.getElementById("backupMessage");
    let file = fileInput.files[0];

    if (!file) {
        message.textContent = "Please select a backup JSON file.";
        return;
    }

    if (!confirm("Restoring will replace your current PaySmart data. Continue?")) {
        return;
    }

    let reader = new FileReader();

    reader.onload = function(event) {
        try {
            let data = JSON.parse(event.target.result);

            if (!validateBackup(data)) {
                message.textContent = "Invalid PaySmart backup file.";
                return;
            }

            walletBalance = data.walletBalance;
            transactions = data.transactions;
            expenses = data.expenses;
            qrHistory = data.qrHistory;
            profile = data.profile;
            monthlyBudget = data.monthlyBudget;
            categoryBudgets = data.categoryBudgets;

            saveData();
            updateApp();

            fileInput.value = "";
            message.textContent = "Backup restored successfully!";
        } catch (error) {
            message.textContent = "Unable to read this backup file.";
        }
    };

    reader.onerror = function() {
        message.textContent = "Error reading the selected file.";
    };

    reader.readAsText(file);
}

/* Update all sections */

function updateApp() {
    document.getElementById("walletBalance").textContent =
        "₹" + walletBalance.toFixed(2);

    let total = expenses.reduce(
        (sum, item) => sum + Number(item.amount), 0
    );

    document.getElementById("totalExpenses").textContent =
        "₹" + total.toFixed(2);

    let expenseList = document.getElementById("expenseList");
    expenseList.innerHTML = "";

    expenses.forEach(item => {
        let li = document.createElement("li");

        li.textContent = item.name + " - ₹" +
            Number(item.amount).toFixed(2) +
            " (" + item.category + ")";

        expenseList.appendChild(li);
    });

    filterTransactions();
    up
