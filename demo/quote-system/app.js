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
  setupFeeLabel: document.getElementById("setupFeeLabel"),
  customFeeValue: document.getElementById("customFeeValue"),
  customFeeRow: document.getElementById("customFeeRow"),
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
  clientName: document.getElementById("clientName"),
  messageNote: document.getElementById("messageNote"),
  quoteMessage: document.getElementById("quoteMessage"),
  copyMessage: document.getElementById("copyMessage"),
  copyStatus: document.getElementById("copyStatus"),
  whatsAppShare: document.getElementById("whatsAppShare"),
  downloadQuote: document.getElementById("downloadQuote"),
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
    }))
    .filter((extra) => extra.amount > 0);

const buildRelevantLineItems = ({
  setupFee,
  extras,
  customFee,
  discountRate,
  discountAmount,
  includeTax,
  taxAmount,
  taxRate,
  formatter,
}) => {
  const formatMoney = (value) => formatter.format(value);
  const setupLabel = setupFee > 0 ? "Setup fee" : "Setup fee (included)";

  return {
    setup: {
      label: setupLabel,
      value: formatMoney(setupFee),
      amount: setupFee,
    },
    extras: extras.map((extra) => ({
      label: extra.label,
      value: formatMoney(extra.amount),
      amount: extra.amount,
    })),
    custom: {
      label: "Custom fee",
      value: formatMoney(customFee),
      amount: customFee,
      visible: customFee > 0,
    },
    discount: {
      label: `Discount (${Math.round(discountRate)}%)`,
      value: formatter.format(-discountAmount),
      amount: discountAmount,
      visible: discountAmount > 0 && discountRate > 0,
    },
    tax: {
      label: `Tax (${Math.round(taxRate)}%)`,
      value: formatMoney(taxAmount),
      amount: taxAmount,
      visible: includeTax && taxAmount > 0,
    },
  };
};

// Message template for client-ready quotes. Adjust wording here if needed.
const buildQuoteMessage = ({
  serviceName,
  total,
  unitLabel,
  quantity,
  rate,
  formatter,
  pricingItems,
}) => {
  const clientName = elements.clientName.value.trim();
  const messageNote = elements.messageNote.value.trim();
  const greeting = clientName ? `Hi ${clientName},` : "Hello,";
  const formattedTotal = formatter.format(total);
  const formattedRate = formatter.format(rate);
  const description = serviceName
    ? `Here’s your quote for ${serviceName.toLowerCase()}.`
    : "Here’s your quote for the requested service.";
  const lineItems = [];

  if (pricingItems.setup.amount > 0) {
    lineItems.push(`• ${pricingItems.setup.label}: ${pricingItems.setup.value}`);
  } else {
    lineItems.push(`• ${pricingItems.setup.label}`);
  }

  pricingItems.extras.forEach((extra) => {
    lineItems.push(`• ${extra.label}: ${extra.value}`);
  });

  if (pricingItems.custom.visible) {
    lineItems.push(`• ${pricingItems.custom.label}: ${pricingItems.custom.value}`);
  }

  if (pricingItems.discount.visible) {
    lineItems.push(`• ${pricingItems.discount.label}: ${pricingItems.discount.value}`);
  }

  if (pricingItems.tax.visible) {
    lineItems.push(`• ${pricingItems.tax.label}: ${pricingItems.tax.value}`);
  }

  const lines = [
    greeting,
    "",
    description,
    `Estimate details: ${quantity} ${unitLabel} at ${formattedRate} each.`,
  ];

  if (lineItems.length) {
    lines.push("", ...lineItems);
  }

  lines.push("", `Total estimate: ${formattedTotal}`);

  if (messageNote) {
    lines.push("", `Note: ${messageNote}`);
  }

  lines.push("", "If this looks good, reply and I’ll lock in the next steps.");

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const updateMessageActions = (message) => {
  elements.quoteMessage.value = message;
  const encodedMessage = encodeURIComponent(message);
  elements.whatsAppShare.href = `https://wa.me/?text=${encodedMessage}`;
};

const showCopyStatus = (text) => {
  elements.copyStatus.textContent = text;
  elements.copyStatus.classList.add("is-visible");
  window.clearTimeout(showCopyStatus.timeout);
  showCopyStatus.timeout = window.setTimeout(() => {
    elements.copyStatus.classList.remove("is-visible");
  }, 2000);
};

const handleCopyMessage = async () => {
  const message = elements.quoteMessage.value;
  if (!message) {
    return;
  }

  try {
    await navigator.clipboard.writeText(message);
    showCopyStatus("Copied to clipboard");
  } catch (error) {
    const fallback = document.createElement("textarea");
    fallback.value = message;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "absolute";
    fallback.style.left = "-9999px";
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    document.body.removeChild(fallback);
    showCopyStatus("Copied to clipboard");
  }
};

const handleDownloadQuote = () => {
  const message = elements.quoteMessage.value.trim();
  if (!message) {
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  printWindow.document.write(`
    <html>
      <head>
        <title>Quote</title>
        <style>
          body { font-family: "Inter", Arial, sans-serif; padding: 32px; color: #1d2433; }
          h1 { font-size: 1.4rem; margin-bottom: 16px; }
          pre { white-space: pre-wrap; font-size: 1rem; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Quote message</h1>
        <pre>${safeMessage}</pre>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

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
  const pricingItems = buildRelevantLineItems({
    setupFee,
    extras,
    customFee,
    discountRate,
    discountAmount,
    includeTax,
    taxAmount,
    taxRate,
    formatter,
  });

  updateCurrencyDisplays(formatter, symbol);

  elements.baseLabel.textContent = `${quantity} × ${formatMoney(rate)}`;
  elements.baseSubtotal.textContent = formatMoney(baseSubtotal);
  elements.setupFeeLabel.textContent = pricingItems.setup.label;
  elements.setupFeeValue.textContent = pricingItems.setup.value;
  elements.customFeeValue.textContent = pricingItems.custom.value;
  elements.customFeeRow.classList.toggle("is-hidden", !pricingItems.custom.visible);
  elements.discountLabel.textContent = pricingItems.discount.label;
  elements.discountValue.textContent = pricingItems.discount.value;
  elements.discountRow.classList.toggle("is-hidden", !pricingItems.discount.visible);
  elements.taxLabel.textContent = pricingItems.tax.label;
  elements.taxValue.textContent = pricingItems.tax.value;
  elements.taxRow.classList.toggle("is-hidden", !pricingItems.tax.visible);
  elements.taxRate.disabled = !includeTax;
  elements.taxRateField.classList.toggle("is-hidden", !includeTax);
  elements.totalValue.textContent = formatMoney(total);
  elements.summaryNote.textContent = `${serviceName} · Based on ${quantity} ${unitLabel} at ${formatMoney(
    rate
  )} each.`;

  const message = buildQuoteMessage({
    serviceName,
    total,
    unitLabel,
    quantity,
    rate,
    formatter,
    pricingItems,
  });
  updateMessageActions(message);

  elements.extrasBreakdown.innerHTML = "";
  elements.extrasBreakdown.classList.toggle(
    "is-hidden",
    pricingItems.extras.length === 0
  );

  if (pricingItems.extras.length > 0) {
    const groupTitle = document.createElement("p");
    groupTitle.className = "group-title";
    groupTitle.textContent = "Extras";
    elements.extrasBreakdown.appendChild(groupTitle);

    pricingItems.extras.forEach((extra) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";
      row.innerHTML = `<span class='label'>${extra.label}</span><span class='value'>${extra.value}</span>`;
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
    elements.clientName,
    elements.messageNote,
    ...extraInputs,
  ];

  inputs.forEach((input) => {
    input.addEventListener("input", updateBreakdown);
    input.addEventListener("change", updateBreakdown);
  });

  elements.copyMessage.addEventListener("click", handleCopyMessage);
  elements.downloadQuote.addEventListener("click", handleDownloadQuote);
};

// Initialize the interface with defaults.
bindEvents();
updateBreakdown();
