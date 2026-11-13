
let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
let totalExpenses = Number(localStorage.getItem("totalExpenses")) || 0;

let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let qrHistory = JSON.parse(localStorage.getItem("qrHistory") || "[]");

let qrScanner = null;

function updateDashboard() {
    document.getElementById("wallet").textContent =
        "₹" + walletBalance.toFixed(2);

    document.getElementById("expenses").textContent =
        "₹" + totalExpenses.toFixed(2);
}

function addMoney() {
    let amount = Number(prompt("Enter demo amount to add:"));

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    walletBalance += amount;

    transactions.push({
        type: "Money Added",
        name: "Wallet",
        amount: amount,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    updateDashboard();

    alert("Demo money added successfully!");
}

function sendMoney() {
    let name = prompt("Enter receiver name for demo:");

    if (!name) return;

    let amount = Number(prompt("Enter demo amount:"));

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient demo wallet balance.");
        return;
    }

    if (!confirm("Confirm demo transaction of ₹" + amount + "?")) {
        return;
    }

    walletBalance -= amount;

    transactions.push({
        type: "Money Sent",
        name: name,
        amount: amount,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("walletBalance", walletBalance);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    updateDashboard();

    alert("Demo transaction completed!");
}

function showTransactions() {
    let list = document.getElementById("transactionList");

    list.innerHTML = "";

    if (transactions.length === 0) {
        list.textContent = "No transactions yet.";
        return;
    }

    transactions.slice().reverse().forEach(function(item) {
        let entry = document.createElement("p");

        entry.textContent =
            item.type + " | " +
            item.name + " | ₹" +
            item.amount + " | " +
            item.date;

        list.appendChild(entry);
    });
}

function showExpenses() {
    let amount = Number(prompt("Enter demo expense amount:"));

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    totalExpenses += amount;

    expenses.push({
        amount: amount,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("totalExpenses", totalExpenses);

    updateDashboard();

    alert("Expense added successfully!");
}

async function openScanner() {
    document.getElementById("scannerSection").style.display = "block";

    let result = document.getElementById("scanResult");

    result.textContent = "Starting camera...";

    if (typeof Html5Qrcode === "undefined") {
        result.textContent = "Scanner library not loaded.";
        return;
    }

    if (qrScanner) return;

    qrScanner = new Html5Qrcode("reader");

    try {
        await qrScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            function(decodedText) {
                result.textContent = "QR RESULT: " + decodedText;

                qrHistory.push({
                    text: decodedText,
                    date: new Date().toLocaleString()
                });

                localStorage.setItem(
                    "qrHistory",
                    JSON.stringify(qrHistory)
                );

                displayQRHistory();

                alert("QR scanned successfully!");
            }
        );

        result.textContent = "Camera ready. Scan a test QR code.";

    } catch (error) {
        result.textContent = "Camera could not start.";
        alert("Camera error: " + error);
        qrScanner = null;
    }
}

function displayQRHistory() {
    let history = document.getElementById("qrHistory");

    history.innerHTML = "";

    if (qrHistory.length === 0) {
        history.textContent = "No QR scans yet.";
        return;
    }

    qrHistory.slice().reverse().forEach(function(item) {
        let entry = document.createElement("p");

        entry.textContent = item.text + " - " + item.date;

        history.appendChild(entry);
    });
}

async function stopScanner() {
    if (qrScanner) {
        try {
            await qrScanner.stop();
            await qrScanner.clear();
        } catch (error) {
            console.log(error);
        }

        qrScanner = null;
    }

    document.getElementById("scannerSection").style.display = "none";
}

updateDashboard();
displayQRHistory();
    
