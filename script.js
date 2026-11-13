
let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
let totalExpenses = Number(localStorage.getItem("totalExpenses")) || 0;
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
let qrScanner = null;

function updateDashboard() {
    document.getElementById("wallet").textContent = "₹" + walletBalance.toFixed(2);
    document.getElementById("expenses").textContent = "₹" + totalExpenses.toFixed(2);
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

    if (!confirm("Confirm demo transaction of ₹" + amount + "?")) return;

    walletBalance -= amount;

    transactions.push({
        name: name,
        amount: amount,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("walletBalance", walletBalance);

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

    transactions.forEach(function(item) {
        let entry = document.createElement("p");
        entry.textContent = item.name + " - ₹" + item.amount + " - " + item.date;
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
    expenses.push({ amount: amount, date: new Date().toLocaleString() });

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
                alert("QR Scanned: " + decodedText);
            }
        );

        result.textContent = "Camera ready. Scan a test QR code.";

    } catch (error) {
        result.textContent = "Camera could not start.";
        alert("Camera error: " + error);
        qrScanner = null;
    }
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
