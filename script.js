
let transactions = JSON.parse(
    localStorage.getItem("transactions") || "[]"
);

function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

const buttons = document.querySelectorAll("button");

buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        const action = button.textContent.trim();

        if (action === "Send Money") {

            let name = prompt("Enter recipient name:");

            if (!name || name.trim() === "") {
                alert("Enter a valid name.");
                return;
            }

            let amount = Number(prompt("Enter amount:"));

            if (!Number.isFinite(amount) || amount <= 0) {
                alert("Enter a valid amount.");
                return;
            }

            if (confirm("Confirm demo payment of ₹" + amount + "?")) {

                let transaction = {
                    name: name.trim(),
                    amount: amount,
                    date: new Date().toLocaleString()
                };

                transactions.push(transaction);
                saveTransactions();

                alert("Demo payment successful!");
            }
        }

        else if (
            action === "Transactions" ||
            action === "Transaction History"
        ) {

            if (transactions.length === 0) {
                alert("No transactions available.");
                return;
            }

            let history = "TRANSACTION HISTORY\n\n";

            transactions.forEach(function(item, index) {
                history +=
                    (index + 1) + ". " +
                    item.name +
                    " - ₹" + item.amount +
                    "\n" + item.date + "\n\n";
            });

            alert(history);
        }

        else if (action === "Scan QR") {
            alert("QR Scanner coming soon!");
        }

        else if (action === "Expense Tracker") {
            alert("Expense Tracker coming soon!");
        }

    });

});
