const currencySettings = {
  USD: { locale: "en-US", symbol: "$" },
  GBP: { locale: "en-GB", symbol: "£" },
  EUR: { locale: "de-DE", symbol: "€" },
};

const elements = {
  serviceName: document.getElementById("serviceName"),
  currency: document.getElementById("currency"),
  unitType: document.getElementById("unitType"),
  quantity: document.getElementById("quantity"),
  rate: document.getElementById("rate"),
  setupFee: document.getElementById("setupFee"),
  discountRate: document.getElementById("discountRate"),
  taxRate: document.getElementById("taxRate"),
  taxRateField: document.getElementById("taxRateField"),
  includeTax: document.getElementById("includeTax"),
  customFee: document.getElementById("customFee"),
  baseLabel: document.getElementById("baseLabel"),
  baseSubtotal: document.getElementById("baseSubtotal"),
  setupFeeValue: document.getElementById("setupFeeValue"),
  customFeeValue: document.getElementById("customFeeValue"),
  quantityLabel: document.getElementById("quantityLabel"),
  rateLabel: document.getElementById("rateLabel"),
  discountLabel: document.getElementById("discountLabel"),
  discountValue: document.getElementById("discountValue"),
  discountRow: document.getElementById("discountRow"),
  taxRow: document.getElementById("taxRow"),
  taxLabel: document.getElementById("taxLabel"),
  taxValue: document.getElementById("taxValue"),
  extrasBreakdown: document.getElementById("extrasBreakdown"),
  totalValue: document.getElementById("totalValue"),
  summaryNote: document.getElementById("summaryNote"),
};

const extraInputs = Array.from(
  document.querySelectorAll(".extra-item input[type='checkbox']")
);
const currencySymbolTargets = Array.from(
  document.querySelectorAll("[data-currency-symbol]")
);

const sanitizeNumber = (value) => {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getCurrencyFormatter = (currency) => {
  const settings = currencySettings[currency] || currencySettings.USD;
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
};

const updateCurrencyDisplays = (formatter, symbol) => {
  currencySymbolTargets.forEach((target) => {
    target.textContent = symbol;
  });

  extraInputs.forEach((input) => {
    const amountLabel = input.parentElement.querySelector(".extra-amount");
    if (amountLabel) {
      amountLabel.textContent = formatter.format(
        sanitizeNumber(input.dataset.amount)
      );
    }
  });
};

const updateUnitLabels = (unitType) => {
  const isHours = unitType === "hours";
  const unitLabel = isHours ? "Hours" : "Units";
  const rateLabel = isHours ? "Rate per hour" : "Rate per unit";

  elements.quantityLabel.textContent = unitLabel;
  elements.rateLabel.textContent = rateLabel;

  return isHours ? "hours" : "units";
};

const buildExtras = () =>
  extraInputs
    .filter((input) => input.checked)
    .map((input) => ({
      label: input.dataset.label || "Extra",
      amount: sanitizeNumber(input.dataset.amount),
    }));

const updateBreakdown = () => {
  const currency = elements.currency.value;
  const formatter = getCurrencyFormatter(currency);
  const symbol = currencySettings[currency]?.symbol || "$";
  const formatMoney = (value) => formatter.format(value);

  const quantity = Math.max(1, sanitizeNumber(elements.quantity.value));
  const rate = Math.max(0, sanitizeNumber(elements.rate.value));
  const setupFee = Math.max(0, sanitizeNumber(elements.setupFee.value));
  const discountRate = Math.max(0, sanitizeNumber(elements.discountRate.value));
  const taxRate = Math.max(0, sanitizeNumber(elements.taxRate.value));
  const includeTax = elements.includeTax.checked;
  const customFee = Math.max(0, sanitizeNumber(elements.customFee.value));
  const serviceName = elements.serviceName.value.trim() || "Service";
  const unitType = elements.unitType.value;
  const unitLabel = updateUnitLabels(unitType);

  const baseSubtotal = quantity * rate;
  const extras = buildExtras();
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.amount, 0);
  // Subtotal first, apply discount next, then apply tax to the discounted subtotal.
  const preDiscountSubtotal =
    baseSubtotal + setupFee + extrasTotal + customFee;
  const discountAmount = preDiscountSubtotal * (discountRate / 100);
  const discountedSubtotal = preDiscountSubtotal - discountAmount;
  const taxAmount = includeTax ? discountedSubtotal * (taxRate / 100) : 0;
  const total = discountedSubtotal + taxAmount;

  updateCurrencyDisplays(formatter, symbol);

  elements.baseLabel.textContent = `${quantity} × ${formatMoney(rate)}`;
  elements.baseSubtotal.textContent = formatMoney(baseSubtotal);
  elements.setupFeeValue.textContent = formatMoney(setupFee);
  elements.customFeeValue.textContent = formatMoney(customFee);
  elements.discountLabel.textContent = `Discount (${Math.round(discountRate)}%)`;
  elements.discountValue.textContent = formatter.format(-discountAmount);
  elements.discountRow.classList.toggle("is-hidden", discountRate <= 0);
  elements.taxLabel.textContent = `Tax (${Math.round(taxRate)}%)`;
  elements.taxValue.textContent = formatMoney(taxAmount);
  elements.taxRow.classList.toggle("is-hidden", !includeTax);
  elements.taxRate.disabled = !includeTax;
  elements.taxRateField.classList.toggle("is-hidden", !includeTax);
  elements.totalValue.textContent = formatMoney(total);
  elements.summaryNote.textContent = `${serviceName} · Based on ${quantity} ${unitLabel} at ${formatMoney(
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
      `<span class='label'>No extras selected</span><span class='value'>${formatMoney(
        0
      )}</span>`;
    elements.extrasBreakdown.appendChild(emptyRow);
  } else {
    extras.forEach((extra) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";
      row.innerHTML = `<span class='label'>${extra.label}</span><span class='value'>${formatMoney(
        extra.amount
      )}</span>`;
      elements.extrasBreakdown.appendChild(row);
    });
  }
};

const bindEvents = () => {
  const inputs = [
    elements.serviceName,
    elements.currency,
    elements.unitType,
    elements.quantity,
    elements.rate,
    elements.setupFee,
    elements.discountRate,
    elements.taxRate,
    elements.includeTax,
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
