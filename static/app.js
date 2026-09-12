const STATUS_LABELS = {
  not_called: "not called yet",
  in_progress: "calling…",
  paid: "paid",
  promised: "promised a date",
  disputed: "disputed",
  voicemail: "left voicemail",
  no_answer: "no answer",
  wrong_number: "wrong number",
  declined: "declined to discuss",
  failed: "call failed",
};

async function loadMode() {
  const res = await fetch("/api/mode");
  const data = await res.json();
  const pill = document.getElementById("modePill");
  pill.textContent =
    data.mode === "live"
      ? "live mode — real calls will be placed"
      : "fixture mode — no real calls placed, sample results only";
  pill.classList.add(data.mode);
}

async function loadInvoices() {
  const res = await fetch("/api/invoices");
  const invoices = await res.json();
  const list = document.getElementById("invoiceList");

  if (invoices.length === 0) {
    list.innerHTML = '<p class="empty">No invoices yet — add one above to try it out.</p>';
    return;
  }

  list.innerHTML = invoices.map(renderCard).join("");

  invoices.forEach((inv) => {
    const btn = document.getElementById(`call-${inv.id}`);
    if (btn) btn.addEventListener("click", () => placeCall(inv.id));
    const del = document.getElementById(`del-${inv.id}`);
    if (del) del.addEventListener("click", () => deleteInvoice(inv.id));
  });
}

function renderCard(inv) {
  const label = STATUS_LABELS[inv.status] || inv.status;
  const lastAttempt = (inv.attempts || []).slice(-1)[0];
  const promiseLine =
    inv.status === "promised" && inv.promised_date
      ? `<div class="card-sub">promised by ${inv.promised_date}</div>`
      : "";

  const history = (inv.attempts || [])
    .map(
      (a, i) =>
        `<div class="history-item">call ${i + 1} (${a.mode}) — ${STATUS_LABELS[a.status] || a.status}</div>`
    )
    .join("");

  const reviewBanner = inv.needs_human_review
    ? `<div class="review-banner">⚠ Needs human review — automatic follow-up limit reached, no more calls will be placed automatically.</div>`
    : "";

  return `
    <div class="invoice-card">
      <div class="card-top">
        <div>
          <div class="card-title">${escapeHtml(inv.client_name)} — #${escapeHtml(inv.invoice_number)}</div>
          <div class="card-sub">${escapeHtml(inv.amount)} ${escapeHtml(inv.currency)} · due ${inv.due_date}</div>
          ${promiseLine}
        </div>
        <span class="stamp ${inv.status}">${label}</span>
      </div>

      ${reviewBanner}

      ${lastAttempt ? `<div class="note"><strong>Last call:</strong> ${escapeHtml(lastAttempt.note || "")}</div>` : ""}
      ${history ? `<div class="history">${history}</div>` : ""}

      <div class="card-actions">
        <button id="call-${inv.id}" class="btn-primary">
          ${inv.status === "not_called" ? "Place first call" : "Call again"}
        </button>
        <button id="del-${inv.id}" class="btn-ghost">Remove</button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function placeCall(invoiceId) {
  const btn = document.getElementById(`call-${invoiceId}`);
  btn.disabled = true;
  btn.textContent = "Calling…";
  try {
    await fetch(`/api/invoices/${invoiceId}/call`, { method: "POST" });
  } finally {
    await loadInvoices();
  }
}

async function deleteInvoice(invoiceId) {
  await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
  await loadInvoices();
}

document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  form.reset();
  await loadInvoices();
});

document.getElementById("runFollowUps").addEventListener("click", async (e) => {
  const btn = e.target;
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = "Checking…";
  try {
    const res = await fetch("/api/follow-ups/run", { method: "POST" });
    const data = await res.json();
    btn.textContent = `${original} (${data.follow_ups_placed} placed)`;
    setTimeout(() => (btn.textContent = original), 2500);
  } finally {
    btn.disabled = false;
    await loadInvoices();
  }
});

loadMode();
loadInvoices();
