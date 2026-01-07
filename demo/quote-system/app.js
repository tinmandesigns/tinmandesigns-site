const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const elements = {
  serviceName: document.getElementById("serviceName"),
  quantity: document.getElementById("quantity"),
  rate: document.getElementById("rate"),
  setupFee: document.getElementById("setupFee"),
  customFee: document.getElementById("customFee"),
  baseLabel: document.getElementById("baseLabel"),
  baseSubtotal: document.getElementById("baseSubtotal"),
  setupFeeValue: document.getElementById("setupFeeValue"),
  customFeeValue: document.getElementById("customFeeValue"),
  extrasBreakdown: document.getElementById("extrasBreakdown"),
  totalValue: document.getElementById("totalValue"),
  summaryNote: document.getElementById("summaryNote"),
};

const extraInputs = Array.from(
  document.querySelectorAll(".extra-item input[type='checkbox']")
);

const sanitizeNumber = (value) => {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const buildExtras = () =>
  extraInputs
    .filter((input) => input.checked)
    .map((input) => ({
      label: input.dataset.label || "Extra",
      amount: sanitizeNumber(input.dataset.amount),
    }));

const updateBreakdown = () => {
  const quantity = Math.max(1, sanitizeNumber(elements.quantity.value));
  const rate = Math.max(0, sanitizeNumber(elements.rate.value));
  const setupFee = Math.max(0, sanitizeNumber(elements.setupFee.value));
  const customFee = Math.max(0, sanitizeNumber(elements.customFee.value));
  const serviceName = elements.serviceName.value.trim() || "Service";

  const baseSubtotal = quantity * rate;
  const extras = buildExtras();
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.amount, 0);
  const total = baseSubtotal + setupFee + extrasTotal + customFee;

  elements.baseLabel.textContent = `${quantity} × ${currencyFormatter.format(rate)}`;
  elements.baseSubtotal.textContent = currencyFormatter.format(baseSubtotal);
  elements.setupFeeValue.textContent = currencyFormatter.format(setupFee);
  elements.customFeeValue.textContent = currencyFormatter.format(customFee);
  elements.totalValue.textContent = currencyFormatter.format(total);
  elements.summaryNote.textContent = `${serviceName} · ${quantity} units at ${currencyFormatter.format(
    rate
  )} each.`;

  elements.extrasBreakdown.innerHTML = "";
  const groupTitle = document.createElement("p");
  groupTitle.className = "group-title";
  groupTitle.textContent = "Extras";
  elements.extrasBreakdown.appendChild(groupTitle);

  if (extras.length === 0) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "breakdown-row";
    emptyRow.innerHTML =
      "<span class='label'>No extras selected</span><span class='value'>$0</span>";
    elements.extrasBreakdown.appendChild(emptyRow);
  } else {
    extras.forEach((extra) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";
      row.innerHTML = `<span class='label'>${extra.label}</span><span class='value'>${currencyFormatter.format(
        extra.amount
      )}</span>`;
      elements.extrasBreakdown.appendChild(row);
    });
  }
};

const bindEvents = () => {
  const inputs = [
    elements.serviceName,
    elements.quantity,
    elements.rate,
    elements.setupFee,
    elements.customFee,
    ...extraInputs,
  ];

  inputs.forEach((input) => {
    input.addEventListener("input", updateBreakdown);
    input.addEventListener("change", updateBreakdown);
  });
};

// Initialize the interface with defaults.
bindEvents();
updateBreakdown();
