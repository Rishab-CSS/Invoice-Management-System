async function login() {

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    try {

        const res = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {

            localStorage.setItem("role", data.role);

            window.location.href = "index.html";

        } else {

            document.getElementById("error").style.display = "block";

        }

    } catch (err) {
        alert("Server error");
    }

}



document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        login();
    }
});


const passwordField = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const icon = togglePassword.querySelector("i");

togglePassword.addEventListener("click", () => {
    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
});

// INJECT GLOBAL FOOTER
(function injectFooter() {
    if (document.getElementById("global-footer")) return;

    const footer = document.createElement("footer");
    footer.id = "global-footer";
    footer.style.cssText = `
        text-align: center;
        padding: 1rem;
        margin-top: 1rem;
        border-top: 1px solid var(--border);
        color: var(--text-sec);
        font-size: 0.85rem;
        line-height: 1.6;
        background: transparent;
    `;

    footer.innerHTML = `
        <p style="margin: 0;">2026 Copy Rights Reserved</p>
        <p style="margin: 0;">Developed By</p>
        <p style="margin: 0.2rem 0 0 0; font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Rishab CSS & Imtiyaz Basha</p>
    `;

    document.body.appendChild(footer);
})();