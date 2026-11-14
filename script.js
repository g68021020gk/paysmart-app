
let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;

let transactions = JSON.parse(
    localStorage.getItem("transactions") || "[]"
);

let expenses = JSON.parse(
    localStorage.getItem("expenses") || "[]"
);

let qrHistory = JSON.parse(
    localStorage.getItem("qrHistory") || "[]"
);

let profile = JSON.parse(
    localStorage.getItem("profile") || "null"
) || {
    name: "Gowtham",
    email: "gowtham@77077.com"
};

let scanner = null;
let scannerRunning = false;

// DEMO PIN: Initial PIN is 1234
let appPin = localStorage.getItem("appPin") || "1234";

// SAVE DATA

function saveData() {
    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    localStorage.setItem("profile", JSON.stringify(profile));
}

function formatMoney(amount) {
    return "₹" + Number(amount).toFixed(2);
}

function getDateKey(date = new Date()) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");

    return year + "-" + month;
}

// NAVIGATION

function showSection(sectionId) {
    if (scannerRunning && sectionId !== "scanner") {
        stopScanner();
    }

    document.querySelectorAll(".page").forEach(function(section) {
        section.classList.add("hidden");
    });

    document.getElementById(sectionId).classList.remove("hidden");

    updateDashboard();
    displayTransactions();
    displayExpenses();
    displayQRHistory();
    displayProfile();
    displayReport();
}

// WALLET

function addMoney() {
    let amount = Number(
        document.getElementById("addAmount").value
    );

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount");
        return;
    }

    walletBalance += amount;

    transactions.unshift({
        type: "Money Added",
        amount: amount,
        date: new Date().toLocaleString()
    });

    document.getElementById("addAmount").value = "";

    saveData();
    updateDashboard();
    displayTransactions();

    alert("Demo money added successfully!");
}

// SEND MONEY - DEMO

function sendMoney() {
    let receiver = document.getElementById("receiverName").value.trim();

    let amount = Number(
        document.getElementById("sendAmount").value
    );

    if (!receiver) {
        alert("Enter receiver name");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient balance");
        return;
    }

    walletBalance -= amount;

    transactions.unshift({
        type: "Sent to " + receiver,
        amount: amount,
        date: new Date().toLocaleString()
    });

    document.getElementById("receiverName").value = "";
    document.getElementById("sendAmount").value = "";

    saveData();
    updateDashboard();
    displayTransactions();

    alert("Demo transaction completed!");
}

// EXPENSE TRACKER

function addExpense() {
    let name = document.getElementById("expenseName").value.trim();

    let amount = Number(
        document.getElementById("expenseAmount").value
    );

    let category = document.getElementById("expenseCategory").value;

    if (!name) {
        alert("Enter expense name");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount");
        return;
    }

    if (!category) {
        alert("Select a category");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient balance");
        return;
    }

    let now = new Date();

    walletBalance -= amount;

    expenses.unshift({
        name: name,
        amount: amount,
        category: category,
        date: now.toLocaleString(),
        dateISO: now.toISOString()
    });

    transactions.unshift({
        type: "Expense: " + name,
        amount: amount,
        date: now.toLocaleString()
    });

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";

    saveData();
    updateDashboard();
    displayExpenses();
    displayTransactions();
    displayReport();

    alert("Expense added successfully!");
}

// DISPLAY EXPENSES

function displayExpenses() {
    let list = document.getElementById("expenseList");

    list.innerHTML = "";

    expenses.forEach(function(expense) {
        let li = document.createElement("li");

        li.textContent =
            expense.name + " - " +
            formatMoney(expense.amount) + " - " +
            expense.category + " - " +
            expense.date;

        list.appendChild(li);
    });
}

// TRANSACTION HISTORY

function displayTransactions() {
    let list = document.getElementById("transactionList");

    list.innerHTML = "";

    transactions.forEach(function(transaction) {
        let li = document.createElement("li");

        li.textContent =
            transaction.type + " - " +
            formatMoney(transaction.amount) + " - " +
            transaction.date;

        list.appendChild(li);
    });
}

// DOWNLOAD TRANSACTIONS CSV

function downloadTransactions() {
    if (transactions.length === 0) {
        alert("No transactions available");
        return;
    }

    let rows = [
        ["Transaction Type", "Amount", "Date"]
    ];

    transactions.forEach(function(item) {
        rows.push([
            item.type,
            item.amount,
            item.date
        ]);
    });

    let csv = rows.map(function(row) {
        return row.map(function(value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\n");

    let blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart_Transactions.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// QR SCANNER

async function startScanner() {
    if (scannerRunning) {
        return;
    }

    if (typeof Html5Qrcode === "undefined") {
        alert("Scanner library not loaded. Check internet.");
        return;
    }

    try {
        scanner = new Html5Qrcode("reader");

        await scanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                }
            },
            function(decodedText) {
                document.getElementById("qrResult").textContent =
                    decodedText;

                qrHistory.unshift({
                    result: decodedText,
                    date: new Date().toLocaleString()
                });

                saveData();
                displayQRHistory();

                stopScanner();
            },
            function(errorMessage) {
                // Waiting for QR code detection.
            }
        );

        scannerRunning = true;

    } catch (error) {
        scanner = null;
        scannerRunning = false;

        alert("Camera could not start. Check permissions and HTTPS.");
    }
}

async function stopScanner() {
    if (scanner && scannerRunning) {
        try {
            await scanner.stop();
        } catch (error) {
            console.log("Scanner stop error:", error);
        }

        scannerRunning = false;
    }
}

// QR HISTORY

function displayQRHistory() {
    let list = document.getElementById("qrHistoryList");

    list.innerHTML = "";

    qrHistory.forEach(function(item) {
        let li = document.createElement("li");

        li.textContent = item.result + " - " + item.date;

        list.appendChild(li);
    });
}

function clearQRHistory() {
    if (!confirm("Clear all QR history?")) {
        return;
    }

    qrHistory = [];

    saveData();
    displayQRHistory();
}

// PROFILE

function displayProfile() {
    document.getElementById("profileName").textContent =
        profile.name;

    document.getElementById("profileEmail").textContent =
        profile.email || "Email not added";
}

function editProfile() {
    document.getElementById("nameInput").value =
        profile.name;

    document.getElementById("emailInput").value =
        profile.email;

    document.getElementById("editForm").classList.remove("hidden");
}

function saveProfile() {
    let name = document.getElementById("nameInput").value.trim();

    let email = document.getElementById("emailInput").value.trim();

    if (!name) {
        alert("Enter your name");
        return;
    }

    profile = {
        name: name,
        email: email
    };

    saveData();
    displayProfile();

    document.getElementById("editForm").classList.add("hidden");

    alert("Profile updated successfully!");
}

function cancelEdit() {
    document.getElementById("editForm").classList.add("hidden");
}

// MONTHLY EXPENSE REPORT

function displayReport() {
    let monthInput = document.getElementById("reportMonth");

    if (!monthInput) {
        return;
    }

    if (!monthInput.value) {
        monthInput.value = getDateKey();
    }

    let selectedMonth = monthInput.value;

    let monthlyExpenses = expenses.filter(function(expense) {
        let expenseDate;

        if (expense.dateISO) {
            expenseDate = new Date(expense.dateISO);
        } else {
            expenseDate = new Date(expense.date);
        }

        if (isNaN(expenseDate.getTime())) {
            return false;
        }

        return getDateKey(expenseDate) === selectedMonth;
    });

    let total = monthlyExpenses.reduce(function(sum, expense) {
        return sum + Number(expense.amount);
    }, 0);

    document.getElementById("monthlyTotal").textContent =
        formatMoney(total);

    displayExpenseChart(monthlyExpenses);
}

// CATEGORY CHART

function displayExpenseChart(monthlyExpenses) {
    let chart = document.getElementById("expenseChart");

    chart.innerHTML = "";

    let categories = {};

    monthlyExpenses.forEach(function(expense) {
        let category = expense.category || "Other";

        categories[category] =
            (categories[category] || 0) + Number(expense.amount);
    });

    let values = Object.values(categories);

    let maximum = Math.max(...values, 1);

    Object.keys(categories).forEach(function(category) {
        let amount = categories[category];

        let percentage = (amount / maximum) * 100;

        let row = document.createElement("div");
        row.className = "chart-row";

        let label = document.createElement("div");
        label.className = "chart-label";

        let name = document.createElement("span");
        name.textContent = category;

        let value = document.createElement("strong");
        value.textContent = formatMoney(amount);

        label.appendChild(name);
        label.appendChild(value);

        let track = document.createElement("div");
        track.className = "chart-track";

        let bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.width = percentage + "%";

        track.appendChild(bar);
        row.appendChild(label);
        row.appendChild(track);

        chart.appendChild(row);
    });

    if (Object.keys(categories).length === 0) {
        chart.textContent = "No expenses recorded for this month.";
    }
}

// DARK MODE

function toggleTheme() {
    document.body.classList.toggle("dark");

    let isDark = document.body.classList.contains("dark");

    localStorage.setItem("darkMode", isDark);

    document.querySelector("header button").textContent =
        isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// DEMO PIN SETTINGS

function changePin() {
    let newPin = document.getElementById("newPin").value;

    if (!/^\d{4}$/.test(newPin)) {
        alert("Enter a 4-digit PIN");
        return;
    }

    appPin = newPin;

    localStorage.setItem("appPin", appPin);

    document.getElementById("newPin").value = "";

    alert("Demo PIN changed successfully!");
}

function lockApp() {
    stopScanner();

    document.getElementById("lockScreen").classList.remove("hidden");

    document.getElementById("pinInput").value = "";
    document.getElementById("pinMessage").textContent = "";
}

function unlockApp() {
    let enteredPin = document.getElementById("pinInput").value;

    if (enteredPin === appPin) {
        document.getElementById("lockScreen").classList.add("hidden");

        document.getElementById("pinInput").value = "";
        document.getElementById("pinMessage").textContent = "";

        alert("Welcome to PaySmart!");
    } else {
        document.getElementById("pinMessage").textContent =
            "Incorrect PIN. Try again.";
    }
}

// DASHBOARD

function updateDashboard() {
    let total = expenses.reduce(function(sum, expense) {
        return sum + Number(expense.amount);
    }, 0);

    document.getElementById("walletBalance").textContent =
        formatMoney(walletBalance);

    document.getElementById("walletBalance2").textContent =
        formatMoney(walletBalance);

    document.getElementById("totalTransactions").textContent =
        transactions.length;

    document.getElementById("totalExpenses").textContent =
        formatMoney(total);
}

// INITIALIZE APP

function initializeApp() {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");

        document.querySelector("header button").textContent =
            "☀️ Light Mode";
    }

    document.getElementById("reportMonth").value = getDateKey();

    updateDashboard();
    displayTransactions();
    displayExpenses();
    displayQRHistory();
    displayProfile();
    displayReport();

    showSection("home");

    document.getElementById("lockScreen").classList.remove("hidden");
}

initializeApp();
