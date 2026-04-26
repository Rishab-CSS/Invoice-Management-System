window.logout = function () {
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

    // INJECT GLOBAL FOOTER
    ;(function injectFooter() {
        if (document.getElementById("global-footer")) return;

        const footer = document.createElement("footer");
        footer.id = "global-footer";
        footer.style.cssText = `
        text-align: center;
        padding: 1rem;
        margin-top: auto;
        border-top: 1px solid var(--border);
        color: var(--text-sec);
        font-size: 0.85rem;
        line-height: 1.6;
        background: transparent;
        width: 100%;
    `;

        footer.innerHTML = `
        <p style="margin: 0;">2026 Copy Rights Reserved</p>
        <p style="margin: 0;">Developed By</p>
        <p style="margin: 0.2rem 0 0 0; font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Rishab CSS & Imtiyaz Basha M</p>
    `;

        document.body.appendChild(footer);
    })();



    // =======================
// PWA INSTALL CONTROL
// =======================

let deferredPrompt = null;

// Capture install event
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // stop auto popup
    deferredPrompt = e;

    const role = localStorage.getItem("role");

    // Show button only if logged in
    if (role) {
        showInstallButton();
    }
});

// Function to create button dynamically
function showInstallButton() {

    // Prevent duplicate button
    if (document.getElementById("installBtn")) return;

    const btn = document.createElement("button");
    btn.id = "installBtn";
    btn.innerText = "📲 Install App";

    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 8px;
        border: none;
        background: #30C5D2;
        color: #000;
        font-weight: 600;
        cursor: pointer;
        z-index: 9999;
    `;

    document.body.appendChild(btn);

    btn.addEventListener("click", async () => {

        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const choice = await deferredPrompt.userChoice;

        if (choice.outcome === "accepted") {
            console.log("App installed");
        }

        deferredPrompt = null;
        btn.remove(); // remove after use
    });
}