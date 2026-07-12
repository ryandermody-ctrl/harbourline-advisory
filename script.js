const TYPEFORM_URL = "https://form.typeform.com/to/FgKntOf1";
const ACCESS_HASH = "412f259420d47ed87d805ec0f50a3ed381614b4efc8d82db407a83707e044a64";

const accessButton = document.getElementById("brief-access");
const dialog = document.getElementById("access-dialog");
const form = document.getElementById("access-form");
const codeInput = document.getElementById("access-code");
const errorMessage = document.getElementById("access-error");
const closeButton = document.getElementById("dialog-close");

async function hashValue(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function openTypeform() {
  window.location.assign(TYPEFORM_URL);
}

accessButton.addEventListener("click", () => {
  if (sessionStorage.getItem("hla-access") === "granted") {
    openTypeform();
    return;
  }

  errorMessage.textContent = "";
  codeInput.value = "";
  dialog.showModal();
  window.setTimeout(() => codeInput.focus(), 50);
});

closeButton.addEventListener("click", () => dialog.close());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submittedHash = await hashValue(codeInput.value.trim());

  if (submittedHash === ACCESS_HASH) {
    sessionStorage.setItem("hla-access", "granted");
    dialog.close();
    openTypeform();
    return;
  }

  errorMessage.textContent = "That access code is not recognised.";
  codeInput.select();
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
