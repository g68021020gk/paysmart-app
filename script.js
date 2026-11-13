
const buttons = document.querySelectorAll("button");

buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        const action = button.textContent.trim();

        if (action === "Send Money") {

            let name = prompt("Enter recipient name:");

            if (name === null || name.trim() === "") {
                alert("Please enter a recipient name.");
                return;
            }

            let amount = prompt("Enter amount:");

            if (amount === null) {
                return;
            }

            amount = Number(amount);

            if (!Number.isFinite(amount) || amount <= 0) {
                alert("Please enter a valid amount.");
                return;
            }

            let confirmPayment = confirm(
                "Demo payment to " + name +
                " for ₹" + amount.toFixed(2) +
                "?"
            );

            if (confirmPayment) {
                alert(
                    "Demo payment successful!\n" +
                    "Recipient: " + name +
                    "\nAmount: ₹" + amount.toFixed(2) +
                    "\n\nNo real money was transferred."
                );
            }

        }

        else if (action === "Scan QR") {
            alert("QR Scanner feature coming soon!");
        }

        else if (action === "Transactions" ||
                 action === "Transaction History") {
            alert("No transactions available yet!");
        }

        else if (action === "Expense Tracker") {
            alert("Expense Tracker coming soon!");
        }

    });

});

