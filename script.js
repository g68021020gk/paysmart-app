
let walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
let totalExpenses = Number(localStorage.getItem("totalExpenses")) || 0;

let transactions = JSON.parse(
    localStorage.getItem("transactions") || "[]"
);

let expenses = JSON.parse(
    localStorage.getItem("expenses") || "[]"
);

let qrScanner = null;
let scannerBusy = false;

function updateDashboard() {
    document.getElementById("wallet").textContent =
        "₹" + walletBalance.toFixed(2);

    document.getElementById("expenses").textContent =
        "₹" + totalExpenses.toFixed(2);
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

    let transaction = {
        name: name,
        amount: amount,
        date: new Date().toLocaleString()
    };

    transactions.push(transaction);

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "walletBalance",
        walletBalance
    );

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

        entry.textContent =
            item.name + " - ₹" +
            item.amount + " - " + item.date;

        list.appendChild(entry);
    });
}

function showExpenses() {
    let amount = Number(
        prompt("Enter demo expense amount:")
    );

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    totalExpenses += amount;

    expenses.push({
        amount: amount,
        date: new Date().toLocaleString()
    });

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

    localStorage.setItem(
        "totalExpenses",
        totalExpenses
    );

    updateDashboard();

    alert("Expense added successfully!");
}

async function openScanner() {
    let section = document.getElementById("scannerSection");
    let result = document.getElementById("scanResult");

    section.style.display = "block";

    result.textContent = "Starting camera...";

    if (typeof Html5Qrcode === "undefined") {
        result.textContent = "QR scanner library not loaded.";
        alert("Check your internet connection.");
        return;
    }

    if (qrScanner || scannerBusy) {
        result.textContent = "Scanner is already running.";
        return;
    }

    scannerBusy = true;

    qrScanner = new Html5Qrcode("reader");

    try {
        await qrScanner.start(
            { facingMode: "environment" },
            {
                fps: 15,
                qrbox: function(width, height) {
                    let size = Math.floor(
                        Math.min(width, height) * 0.7
                    );

                    return {
                        width: size,
                        height: size
                    };
                },
                aspectRatio: 1.0
            },
            async function(decodedText) {
                result.textContent =
                    "QR Scanned Successfully: " + decodedText;

                if (qrScanner) {
                    let currentScanner = qrScanner;
                    qrScanner = null;

                    try {
                        await currentScanner.stop();
                        await currentScanner.clear();
                    } catch (error) {
                        console.log(error);
                    }
                }

                scannerBusy = false;
            }
        );

        result.textContent =
            "Camera ready. Point at a test QR code.";

    } catch (error) {
        result.textContent =
            "Camera could not start. Check camera permission.";

        alert("Camera error: " + error);

        qrScanner = null;
        scannerBusy = false;
    }
}

async function stopScanner() {
    if (qrScanner) {
        let currentScanner = qrScanner;
        qrScanner = null;

        try {
            await currentScanner.stop();
            await currentScanner.clear();
        } catch (error) {
            console.log(error);
        }
    }

    scannerBusy = false;

    document.getElementById("scannerSection").style.display =
        "none";
}

updateDashboard();
