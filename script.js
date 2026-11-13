let walletBalance = 0;
let totalExpenses = 0;

let transactions = JSON.parse(
    localStorage.getItem("transactions") || "[]"
);

let expenses = JSON.parse(
    localStorage.getItem("expenses") || "[]"
);

let qrScanner = null;

function updateDashboard() {
    document.getElementById("wallet").textContent =
        "₹" + walletBalance.toFixed(2);

    document.getElementById("expenses").textContent =
        "₹" + totalExpenses.toFixed(2);
}

function sendMoney() {
    let name = prompt("Enter receiver name:");

    if (!name) return;

    let amount = Number(prompt("Enter demo amount:"));

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (amount > walletBalance) {
        alert("Insufficient demo wallet balance.");
        return;
    }

    if (!confirm("Confirm demo payment of ₹" + amount + "?")) {
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

    localStorage.setItem("walletBalance", walletBalance);

    updateDashboard();

    alert("Demo transaction completed!");
}

function showTransactions() {
    let list = document.getElementById("transactionList");

    if (transactions.length === 0) {
        list.textContent = "No transactions yet.";
        return;
    }

    list.innerHTML = "";

    transactions.forEach(function(item) {
        let entry = document.createElement("p");

        entry.textContent =
            item.name + " - ₹" + item.amount + " - " + item.date;

        list.appendChild(entry);
    });
}

function showExpenses() {
    let amount = Number(prompt("Enter demo expense amount:"));

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
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

function openScanner() {
    document.getElementById("scannerSection").style.display = "block";
    document.getElementById("scanResult").textContent =
        "Starting camera...";

    if (typeof Html5Qrcode === "undefined") {
        alert("QR scanner library did not load. Check your internet connection.");
        return;
    }

    if (qrScanner) {
        return;
    }

    qrScanner = new Html5Qrcode("reader");

    qrScanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        function(decodedText) {
            document.getElementById("scanResult").textContent =
                "Scanned QR content: " + decodedText;

            stopScanner();
        }
    ).catch(function(error) {
        document.getElementById("scanResult").textContent =
            "Camera could not start. Check camera permission and HTTPS.";

        qrScanner = null;

        alert("Camera error: " + error);
    });
}

function stopScanner() {
    if (qrScanner) {
        qrScanner.stop().then(function() {
            qrScanner.clear();
            qrScanner = null;
        }).catch(function(error) {
            console.log(error);
            qrScanner = null;
        });
    }

    document.getElementById("scannerSection").style.display = "none";
}

walletBalance = Number(localStorage.getItem("walletBalance")) || 0;
totalExpenses = Number(localStorage.getItem("totalExpenses")) || 0;

updateDashboard();
