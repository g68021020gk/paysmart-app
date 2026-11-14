
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
    email: "gowtham@example.com"
};

let scanner = null;
let scannerRunning = false;

function formatMoney(amount) {
    return "₹" + Number(amount).toFixed(2);
}

function saveData() {
    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    localStorage.setItem("profile", JSON.stringify(profile));
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
}

// WALLET

function addMoney() {
    let amount = Number(document.getElementById("addAmount").value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount");
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

// SEND MONEY - DEMO ONLY

function sendMoney() {
    let receiver = document.getElementById("receiverName").value.trim();

    let amount = Number(document.getElementById("sendAmount").value);

    if (receiver === "") {
        alert("Please enter receiver name");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient wallet balance");
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

    let amount = Number(document.getElementById("expenseAmount").value);

    let category = document.getElementById("expenseCategory").value;

    if (name === "") {
        alert("Please enter expense name");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    if (category === "") {
        alert("Please select a category");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient wallet balance");
        return;
    }

    walletBalance -= amount;

    expenses.unshift({
        name: name,
        amount: amount,
        category: category,
        date: new Date().toLocaleString()
    });

    transactions.unshift({
        type: "Expense: " + name,
        amount: amount,
        date: new Date().toLocaleString()
    });

    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";

    saveData();
    updateDashboard();
    displayExpenses();
    displayTransactions();

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

// QR SCANNER

async function startScanner() {
    if (scannerRunning) {
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
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
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
                // QR code not detected in this frame.
            }
        );

        scannerRunning = true;

    } catch (error) {
        scanner = null;
        scannerRunning = false;

        alert("Camera could not start. Check camera permission and HTTPS.");
    }
}

async function stopScanner() {
    if (scanner && scannerRunning) {
        try {
            await scanner.stop();
        } catch (error) {
            console.log("Scanner stop:", error);
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
    if (!confirm("Clear all QR scan history?")) {
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

    if (name === "") {
        alert("Please enter your name");
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

// DASHBOARD

function updateDashboard() {
    let totalExpenses = expenses.reduce(function(total, expense) {
        return total + Number(expense.amount);
    }, 0);

    document.getElementById("walletBalance").textContent =
        formatMoney(walletBalance);

    document.getElementById("walletBalance2").textContent =
        formatMoney(walletBalance);

    document.getElementById("totalTransactions").textContent =
        transactions.length;

    document.getElementById("totalExpenses").textContent =
        formatMoney(totalExpenses);
}

// INITIALIZE APP

function initializeApp() {
    updateDashboard();
    displayTransactions();
    displayExpenses();
    displayQRHistory();
    displayProfile();

    showSection("home");
}

initializeApp();
