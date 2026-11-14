
let profile = JSON.parse(
    localStorage.getItem("profile")
) || {
    name: "Gowtham",
    email: "gowtham@example.com"
};

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

    document.getElementById("editForm").style.display =
        "block";
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

    localStorage.setItem(
        "profile",
        JSON.stringify(profile)
    );

    displayProfile();

    document.getElementById("editForm").style.display =
        "none";

    alert("Profile updated successfully!");
}

function cancelEdit() {
    document.getElementById("editForm").style.display =
        "none";
}

function goBack() {
    window.history.back();
}

displayProfile();

                
