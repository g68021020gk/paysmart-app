// PAYSMART DATA

let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let qrHistory = JSON.parse(localStorage.getItem("qrHistory") || "[]");
let profile = JSON.parse(localStorage.getItem("profile") || '{"name":"User","email":""}');
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let categoryBudgets = JSON.parse(localStorage.getItem("categoryBudgets") || "{}");
let appPin = localStorage.getItem("appPin") || "1234";
let scanner = null;


// SAVE DATA

function saveData() {
    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    localStorage.setItem("profile", JSON.stringify(profile));
    localStorage.setItem("monthlyBudget", monthlyBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
}


// DATE HELPERS

function today() {
    return new Date().toLocaleString();
}

function dateISO() {
    let now = new Date();
    let year = now.getFullYear();
    let month = String(now.getMonth() + 1).padStart(2, "0");
    let day = String(now.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function isThisMonth(dateValue) {
    let date = new Date(dateValue);
    let now = new Date();

    return !isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
}


// NAVIGATION

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(function(section) {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");

    if (sectionId === "transactions") {
        filterTransactions();
    }

    if (sectionId === "report") {
        updateReport();
    }

    if (sectionId === "budget") {
        updateBudget();
    }
}


// WALLET

function addMoney() {
    let amount = Number(document.getElementById("addAmount").value);

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid amount");
        return;
    }

    walletBalance += amount;

    transactions.unshift({
        type: "Money Added",
        amount: amount,
        date: today(),
        dateISO: dateISO()
    });

    document.getElementById("addAmount").value = "";

    saveData();
    updateApp();

    alert("Demo money added successfully!");
}


// SEND MONEY

function sendMoney() {
    let name = document.getElementById("receiverName").value.trim();
    let amount = Number(document.getElementById("sendAmount").value);

    if (name === "") {
        alert("Enter receiver name");
        return;
    }

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid amount");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient demo wallet balance");
        return;
    }

    walletBalance -= amount;

    transactions.unshift({
        type: "Sent to " + name,
        amount: amount,
        date: today(),
        dateISO: dateISO()
    });

    document.getElementById("receiverName").value = "";
    document.getElementById("sendAmount").value = "";

    saveData();
    updateApp();

    alert("Demo transaction completed!");
}


// EXPENSE TRACKER

function addExpense() {
    let name = document.getElementById("expenseName").value.trim();
    let amount = Number(document.getElementById("expenseAmount").value);
    let category = document.getElementById("expenseCategory").value;

    if (name === "") {
        alert("Enter expense description");
        return;
    }

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid expense amount");
        return;
    }

    let expense = {
        name: name,
        amount: amount,
        category: category,
        date: today(),
        dateISO: dateISO()
    };

    expenses.unshift(expense);

    transactions.unshift({
        type: "Expense: " + name,
        amount: amount,
        date: expense.date,
        dateISO: expense.dateISO
    });

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";

    saveData();
    updateApp();

    alert("Expense added successfully!");
}


// MONTHLY BUDGET

function saveBudget() {
    let amount = Number(document.getElementById("monthlyBudget").value);

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid monthly budget");
        return;
    }

    monthlyBudget = amount;

    saveData();
    updateBudget();

    alert("Monthly budget saved!");
}

function getMonthlyExpenses() {
    return expenses.filter(function(expense) {
        return isThisMonth(expense.dateISO || expense.date);
    });
}

function saveCategoryBudget() {
    let category = document.getElementById("budgetCategory").value;
    let amount = Number(document.getElementById("categoryBudgetAmount").value);

    if (amount <= 0 || !Number.isFinite(amount)) {
        alert("Enter a valid category budget");
        return;
    }

    categoryBudgets[category] = amount;

    document.getElementById("categoryBudgetAmount").value = "";

    saveData();
    updateBudget();

    alert("Category budget saved!");
}

function updateBudget() {
    let monthlyExpenses = getMonthlyExpenses();

    let spent = monthlyExpenses.reduce(function(total, expense) {
        return total + Number(expense.amount);
    }, 0);

    let remaining = monthlyBudget - spent;

    document.getElementById("monthlyBudget").value = monthlyBudget || "";
    document.getElementById("budgetAmount").textContent = monthlyBudget.toFixed(2);
    document.getElementById("budgetSpent").textContent = spent.toFixed(2);
    document.getElementById("budgetRemaining").textContent = remaining.toFixed(2);

    let message = "";

    if (monthlyBudget === 0) {
        message = "Please set your monthly budget.";
    } else if (remaining < 0) {
        message = "You have exceeded your monthly budget.";
    } else if (spent >= monthlyBudget * 0.8) {
        message = "Warning: You have used 80% or more of your budget.";
    } else {
        message = "You are within your monthly budget.";
    }

    document.getElementById("budgetMessage").textContent = message;

    updateCategoryBudgets(monthlyExpenses);
}

function updateCategoryBudgets(monthlyExpenses) {
    let container = document.getElementById("categoryBudgetList");
    container.innerHTML = "";

    Object.keys(categoryBudgets).forEach(function(category) {
        let spent = monthlyExpenses
            .filter(function(expense) {
                return expense.category === category;
            })
            .reduce(function(total, expense) {
                return total + Number(expense.amount);
            }, 0);

        let limit = Number(categoryBudgets[category]);
        let remaining = limit - spent;

        let item = document.createElement("div");
        item.className = "budget-item";

        let heading = document.createElement("h4");
        heading.textContent = category;

        let details = document.createElement("p");
        details.textContent =
            "Budget: ₹" + limit.toFixed(2) +
            " | Spent: ₹" + spent.toFixed(2) +
            " | Remaining: ₹" + remaining.toFixed(2);

        let warning = document.createElement("p");

        if (remaining < 0) {
            warning.textContent = "Category budget exceeded!";
        } else if (spent >= limit * 0.8) {
            warning.textContent = "Warning: 80% of this budget used.";
        } else {
            warning.textContent = "Within category budget.";
        }

        item.appendChild(heading);
        item.appendChild(details);
        item.appendChild(warning);

        container.appendChild(item);
    });
}


// QR SCANNER

function startScanner() {
    if (typeof Html5Qrcode === "undefined") {
        alert("QR scanner library could not load. Check internet connection.");
        return;
    }

    if (scanner) {
        alert("Scanner is already running.");
        return;
    }

    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 220, height: 220 }
        },
        function(decodedText) {
            document.getElementById("scanResult").textContent = decodedText;

            qrHistory.unshift({
                result: decodedText,
                date: today()
            });

            saveData();
            updateQRHistory();
            stopScanner();
        },
        function(errorMessage) {}
    ).catch(function(error) {
        scanner = null;
        alert("Unable to start camera. Check camera permission and HTTPS.");
    });
}

function stopScanner() {
    if (!scanner) {
        return;
    }

    let currentScanner = scanner;

    currentScanner.stop().then(function() {
        currentScanner.clear();
        scanner = null;
    }).catch(function() {
        scanner = null;
    });
}


// QR HISTORY

function updateQRHistory() {
    let list = document.getElementById("qrHistoryList");
    list.innerHTML = "";

    if (qrHistory.length === 0) {
        list.textContent = "No QR scans yet.";
        return;
    }

    qrHistory.forEach(function(item) {
        let li = document.createElement("li");
        li.textContent = item.result + " — " + item.date;
        list.appendChild(li);
    });
}

function clearQRHistory() {
    if (!confirm("Clear all QR scan history?")) {
        return;
    }

    qrHistory = [];

    saveData();
    updateQRHistory();
}


// TRANSACTION HISTORY AND FILTERING

function getTransactionISO(item) {
    if (item.dateISO) {
        return item.dateISO;
    }

    let parsed = new Date(item.date);

    if (isNaN(parsed.getTime())) {
        return "";
    }

    let year = parsed.getFullYear();
    let month = String(parsed.getMonth() + 1).padStart(2, "0");
    let day = String(parsed.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function filterTransactions() {
    let search = document.getElementById("searchTransaction")
        .value.trim().toLowerCase();

    let type = document.getElementById("transactionType").value;
    let selectedDate = document.getElementById("transactionDate").value;

    let filtered = transactions.filter(function(item) {
        let matchesSearch =
            String(item.type).toLowerCase().includes(search);

        let matchesType = true;

        if (type === "Money Added") {
            matchesType = item.type === "Money Added";
        } else if (type === "Sent") {
            matchesType = item.type.startsWith("Sent to ");
        } else if (type === "Expense") {
            matchesType = item.type.startsWith("Expense:");
        }

        let matchesDate = true;

        if (selectedDate) {
            matchesDate = getTransactionISO(item) === selectedDate;
        }

        return matchesSearch && matchesType && matchesDate;
    });

    displayTransactions(filtered);

    document.getElementById("filterResult").textContent =
        "Showing " + filtered.length + " of " +
        transactions.length + " transactions.";
}

function displayTransactions(items) {
    let list = document.getElementById("transactionList");
    list.innerHTML = "";

    if (items.length === 0) {
        list.textContent = "No matching transactions found.";
        return;
    }

    items.forEach(function(item) {
        let li = document.createElement("li");

        li.textContent =
            item.type + " — ₹" +
            Number(item.amount).toFixed(2) +
            " — " + item.date;

        list.appendChild(li);
    });
}

function clearTransactionFilters() {
    document.getElementById("searchTransaction").value = "";
    document.getElementById("transactionType").value = "all";
    document.getElementById("transactionDate").value = "";

    filterTransactions();
}


// CSV DOWNLOAD

function downloadTransactions() {
    if (transactions.length === 0) {
        alert("No transactions available");
        return;
    }

    let rows = [["Transaction Type", "Amount", "Date"]];

    transactions.forEach(function(item) {
        rows.push([item.type, item.amount, item.date]);
    });

    let csv = rows.map(function(row) {
        return row.map(function(value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\n");

    let blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");

    link.href = url;
    link.download = "PaySmart_Transactions.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}


// MONTHLY EXPENSE REPORT

function updateReport() {
    let monthlyExpenses = getMonthlyExpenses();

    let total = monthlyExpenses.reduce(function(sum, expense) {
        return sum + Number(expense.amount);
    }, 0);

    document.getElementById("monthlyTotal").textContent = total.toFixed(2);

    let categories = {};

    monthlyExpenses.forEach(function(expense) {
        let category = expense.category || "Other";

        categories[category] =
            (categories[category] || 0) + Number(expense.amount);
    });

    let chart = document.getElementById("expenseChart");
    chart.innerHTML = "";

    let names = Object.keys(categories);

    if (names.length === 0) {
        chart.textContent = "No expenses recorded this month.";
        return;
    }

    names.forEach(function(category) {
        let amount = categories[category];
        let percentage = total > 0 ? (amount / total) * 100 : 0;

        let row = document.createElement("div");
        row.className = "chart-row";

        let label = document.createElement("div");
        label.className = "chart-label";

        let name = document.createElement("span");
        name.textContent = category;

        let value = document.createElement("span");
        value.textContent = "₹" + amount.toFixed(2);

        label.appendChild(name);
        label.appendChild(value);

        let bar = document.createElement("div");
        bar.className = "chart-bar";

        let fill = document.createElement("div");
        fill.className = "chart-fill";
        fill.style.width = percentage + "%";

        bar.appendChild(fill);
        row.appendChild(label);
        row.appendChild(bar);
        chart.appendChild(row);
    });
}


// PROFILE

function updateProfile() {
    document.getElementById("profileName").textContent =
        profile.name || "User";

    document.getElementById("profileEmail").textContent =
        profile.email || "Not added";

    document.getElementById("homeWelcome").textContent =
        "Welcome, " + (profile.name || "User") + "!";
}

function saveProfile() {
    let name = document.getElementById("editName").value.trim();
    let email = document.getElementById("editEmail").value.trim();

    if (name === "") {
        alert("Enter your name");
        return;
    }

    profile.name = name;
    profile.email = email;

    saveData();
    updateProfile();

    alert("Profile updated successfully!");
}


// CHANGE DEMO PIN

function changePin() {
    let oldPin = document.getElementById("oldPin").value;
    let newPin = document.getElementById("newPin").value;

    if (oldPin !== appPin) {
        alert("Current PIN is incorrect");
        return;
    }

    if (!/^\d{4,6}$/.test(newPin)) {
        alert("New PIN must contain 4 to 6 digits");
        return;
    }

    appPin = newPin;
    localStorage.setItem("appPin", appPin);

    document.getElementById("oldPin").value = "";
    document.getElementById("newPin").value = "";

    alert("Demo PIN changed successfully!");
}


// PIN LOCK

function unlockApp() {
    let enteredPin = document.getElementById("loginPin").value;

    if (enteredPin === appPin) {
        document.getElementById("lockScreen").classList.add("hidden");
        document.getElementById("pinMessage").textContent = "";
        document.getElementById("loginPin").value = "";
    } else {
        document.getElementById("pinMessage").textContent =
            "Incorrect PIN. Try again.";
    }
}

function lockApp() {
    document.getElementById("lockScreen").classList.remove("hidden");
    document.getElementById("loginPin").value = "";
}


// DARK MODE

function toggleDarkMode() {
    document.body.classList.toggle("dark");

    let darkMode = document.body.classList.contains("dark");

    localStorage.setItem("darkMode", darkMode);
}


// UPDATE EXPENSE LIST

function updateExpenseList() {
    let list = document.getElementById("expenseList");
    list.innerHTML = "";

    if (expenses.length === 0) {
        list.textContent = "No expenses added yet.";
        return;
    }

    expenses.forEach(function(expense) {
        let li = document.createElement("li");

        li.textContent =
            expense.name + " — ₹" +
            Number(expense.amount).toFixed(2) +
            " — " + expense.category +
            " — " + expense.date;

        list.appendChild(li);
    });
}


// UPDATE ALL APP DATA

function updateApp() {
    let total = expenses.reduce(function(sum, expense) {
        return sum + Number(expense.amount);
    }, 0);

    document.getElementById("homeBalance").textContent =
        walletBalance.toFixed(2);

    document.getElementById("walletBalance").textContent =
        walletBalance.toFixed(2);

    document.getElementById("homeExpenses").textContent =
        total.toFixed(2);

    document.getElementById("totalExpenses").textContent =
        total.toFixed(2);

    document.getElementById("homeTransactions").textContent =
        transactions.length;

    updateExpenseList();
    filterTransactions();
    updateQRHistory();
    updateProfile();
    updateBudget();
    updateReport();
}


// START APP

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
}

updateApp();
