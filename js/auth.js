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
        <p style="margin: 0.2rem 0 0 0; font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Rishab CSS & Imtiyaz Basha</p>
    `;

        document.body.appendChild(footer);
    })();