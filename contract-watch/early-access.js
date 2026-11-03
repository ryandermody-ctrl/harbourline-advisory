/* Coastal Contract Watch early-access form (pre-launch). Only anonymous visitor OAuth is used. */
(() => {
  "use strict";
  const form = document.getElementById("early-access");
  if (!form) return;
  const clientId = "d884dc58-3579-43ff-9baa-2ac44e2679ce"; // Public Wix OAuth app ID, not a client secret.
  const formId = "cfcf615f-0de1-4122-9a46-0a19177f1beb";
  const base = "https://www.wixapis.com";
  const status = document.getElementById("ea-message");
  const button = document.getElementById("ea-submit");
  async function accessToken() {
    const key = "ccw-wix-visitor-oauth";
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (_) {}
    if (saved && saved.accessToken && saved.expiresAt > Date.now() + 60000) return saved.accessToken;
    let body = { clientId, grantType: "anonymous" };
    if (saved && saved.refreshToken) body = { clientId, grantType: "refresh_token", refreshToken: saved.refreshToken };
    let response = await fetch(`${base}/oauth2/token`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    if (!response.ok && body.grantType === "refresh_token") {
      response = await fetch(`${base}/oauth2/token`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, grantType: "anonymous" })
      });
    }
    if (!response.ok) throw new Error("Wix visitor authentication is currently unavailable.");
    const token = await response.json();
    const access = token.access_token || token.accessToken;
    const refresh = token.refresh_token || token.refreshToken;
    const expiresAt = Date.now() + 1000 * (token.expires_in || token.expiresIn || 3600);
    if (!access) throw new Error("Wix did not provide a visitor token.");
    try { sessionStorage.setItem(key, JSON.stringify({ accessToken: access, refreshToken: refresh, expiresAt })); } catch (_) {}
    return access;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const email = document.getElementById("ea-email").value.trim();
    const company = document.getElementById("ea-company").value.trim();
    const optedIn = Boolean(document.getElementById("ea-optin").checked);
    button.disabled = true;
    status.textContent = "Submitting your early-access request…";
    try {
      const token = await accessToken();
      const response = await fetch(`${base}/form-submission-service/v4/submissions`, {
        method: "POST", headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ submission: { formId, submissions: {
          email_early_access: email,
          company_and_marine_services: company,
          subscribe_early_access: optedIn
        } } })
      });
      if (!response.ok) throw new Error(`The form service returned ${response.status}.`);
      const data = await response.json();
      if (!data.submission || !data.submission.id) throw new Error("Submission did not receive a confirmation ID.");
      form.reset();
      status.textContent = "Request received. Harbour Line Advisory will contact you when the pilot opens.";
    } catch (error) {
      console.error("Coastal Contract Watch form submission failed:", error.message);
      status.textContent = "We couldn't confirm your request. Please email info@harbourlineadvisory.com instead; no submission was recorded as successful.";
    } finally { button.disabled = false; }
  });
})();