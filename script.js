
const buttons = document.querySelectorAll("button");

buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        const action = button.textContent.trim();

        if (action === "Send Money") {
            alert("Send Money feature coming soon!");
        }

        else if (action === "Scan QR") {
            alert("QR Scanner feature coming soon!");
        }

        else if (action === "Transactions" || action === "Transaction History") {
            alert("No transactions available yet!");
        }

        else if (action === "Expense Tracker") {
            alert("Expense Tracker coming soon!");
        }

    });

});
