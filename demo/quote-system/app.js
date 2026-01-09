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
  quantityLabel: document.getElementById("quantityLabel"),
  rateLabel: document.getElementById("rateLabel"),
  adjustmentsBreakdown: document.getElementById("adjustmentsBreakdown"),
  extrasBreakdown: document.getElementById("extrasBreakdown"),
  totalValue: document.getElementById("totalValue"),
  summaryNote: document.getElementById("summaryNote"),
  clientName: document.getElementById("clientName"),
  messageNote: document.getElementById("messageNote"),
  quoteMessage: document.getElementById("quoteMessage"),
  copyMessage: document.getElementById("copyMessage"),
  shareMessage: document.getElementById("shareMessage"),
  copyStatus: document.getElementById("copyStatus"),
  downloadQuote: document.getElementById("downloadQuote"),
  resetQuote: document.getElementById("resetQuote"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleText: document.getElementById("themeToggleText"),
};

const extraInputs = Array.from(
  document.querySelectorAll(".extra-item input[type='checkbox']")
);
const currencySymbolTargets = Array.from(
  document.querySelectorAll("[data-currency-symbol]")
);
const THEME_STORAGE_KEY = "quote-theme";

const getPreferredTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

const applyTheme = (theme, { persist = false } = {}) => {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalizedTheme);

  if (elements.themeToggle) {
    elements.themeToggle.setAttribute(
      "aria-pressed",
      String(normalizedTheme === "dark")
    );
    elements.themeToggle.dataset.theme = normalizedTheme;
  }

  if (elements.themeToggleText) {
    elements.themeToggleText.textContent =
      normalizedTheme === "dark" ? "Dark" : "Light";
  }

  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  }
};

const initializeTheme = () => {
  applyTheme(getPreferredTheme());
};

const handleThemeToggle = () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, { persist: true });
};

const defaultState = {
  serviceName: elements.serviceName.value,
  currency: elements.currency.value,
  unitType: elements.unitType.value,
  quantity: elements.quantity.value,
  rate: elements.rate.value,
  setupFee: elements.setupFee.value,
  discountRate: elements.discountRate.value,
  taxRate: elements.taxRate.value,
  includeTax: elements.includeTax.checked,
  customFee: elements.customFee.value,
  extras: extraInputs.map((input) => input.checked),
};

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

const getUnitLabelForQuantity = (unitType, quantity) => {
  const isHours = unitType === "hours";
  const singular = isHours ? "hour" : "unit";
  const plural = isHours ? "hours" : "units";

  return quantity === 1 ? singular : plural;
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

const getAdjustmentLineItems = (pricingItems) => {
  const adjustments = [];

  if (pricingItems.custom.visible) {
    adjustments.push(pricingItems.custom);
  }

  if (pricingItems.discount.visible) {
    adjustments.push(pricingItems.discount);
  }

  if (pricingItems.tax.visible) {
    adjustments.push(pricingItems.tax);
  }

  return adjustments;
};

// Message template for client-ready quotes. Adjust wording here if needed.
const buildQuoteMessage = ({
  total,
  unitLabel,
  quantity,
  rate,
  formatter,
  pricingItems,
}) => {
  const clientName = elements.clientName.value.trim();
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const formattedTotal = formatter.format(total);
  const formattedRate = formatter.format(rate);
  const summaryLines = [
    `• ${quantity} ${unitLabel} at ${formattedRate} each`,
  ];

  pricingItems.extras.forEach((extra) => {
    summaryLines.push(`• ${extra.label}: ${extra.value}`);
  });

  if (pricingItems.setup.amount > 0) {
    summaryLines.push(`• Setup fee: ${pricingItems.setup.value}`);
  }

  if (pricingItems.custom.amount > 0) {
    summaryLines.push(`• Additional fee: ${pricingItems.custom.value}`);
  }

  if (pricingItems.discount.amount > 0 && pricingItems.discount.visible) {
    summaryLines.push(`• ${pricingItems.discount.label}: ${pricingItems.discount.value}`);
  }

  if (pricingItems.tax.amount > 0) {
    summaryLines.push(`• ${pricingItems.tax.label}: ${pricingItems.tax.value}`);
  }

  const lines = [
    greeting,
    "",
    "Here’s your estimate based on the details we discussed.",
    "",
    "Estimate summary:",
    ...summaryLines,
    "",
    `Total estimate: ${formattedTotal}`,
    "",
    "If this looks good, just reply to confirm and I’ll take care of the next steps.",
  ];

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const updateMessageActions = (message) => {
  elements.quoteMessage.value = message;
};

const showCopyStatus = (text) => {
  elements.copyStatus.textContent = text;
  elements.copyStatus.classList.add("is-visible");
  window.clearTimeout(showCopyStatus.timeout);
  showCopyStatus.timeout = window.setTimeout(() => {
    elements.copyStatus.classList.remove("is-visible");
  }, 2000);
};

const copyMessageToClipboard = async (message) => {
  try {
    await navigator.clipboard.writeText(message);
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
  }
};

const handleCopyMessage = async () => {
  const message = elements.quoteMessage.value;
  if (!message) {
    return;
  }

  await copyMessageToClipboard(message);
  showCopyStatus("Copied to clipboard");
};

const handleShareMessage = async () => {
  const message = elements.quoteMessage.value;
  if (!message) {
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Quote estimate",
        text: message,
      });
      showCopyStatus("Share sheet opened");
    } catch (error) {
      showCopyStatus("Sharing was interrupted.");
    }
    return;
  }

  await copyMessageToClipboard(message);
  showCopyStatus("Sharing isn’t supported here — message copied to clipboard.");
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

const resetQuoteFields = () => {
  const confirmed = window.confirm(
    "Start a new quote? This will reset all fields and clear the message."
  );
  if (!confirmed) {
    return;
  }

  elements.serviceName.value = defaultState.serviceName;
  elements.currency.value = defaultState.currency;
  elements.unitType.value = defaultState.unitType;
  elements.quantity.value = defaultState.quantity;
  elements.rate.value = defaultState.rate;
  elements.setupFee.value = defaultState.setupFee;
  elements.discountRate.value = defaultState.discountRate;
  elements.taxRate.value = defaultState.taxRate;
  elements.includeTax.checked = defaultState.includeTax;
  elements.customFee.value = defaultState.customFee;
  extraInputs.forEach((input, index) => {
    input.checked = defaultState.extras[index];
  });
  elements.clientName.value = "";
  elements.messageNote.value = "";

  updateBreakdown();
  showCopyStatus("Quote reset.");
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
  const messageUnitLabel = getUnitLabelForQuantity(unitType, quantity);

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
  elements.taxRate.disabled = !includeTax;
  elements.taxRateField.classList.toggle("is-hidden", !includeTax);
  elements.totalValue.textContent = formatMoney(total);
  elements.summaryNote.textContent = `${serviceName} · Based on ${quantity} ${messageUnitLabel} at ${formatMoney(
    rate
  )} each.`;

  const message = buildQuoteMessage({
    total,
    unitLabel: messageUnitLabel,
    quantity,
    rate,
    formatter,
    pricingItems,
  });
  updateMessageActions(message);

  elements.extrasBreakdown.innerHTML = "";
  elements.adjustmentsBreakdown.innerHTML = "";
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

  getAdjustmentLineItems(pricingItems).forEach((item) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `<span class='label'>${item.label}</span><span class='value'>${item.value}</span>`;
    elements.adjustmentsBreakdown.appendChild(row);
  });
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
  elements.shareMessage.addEventListener("click", handleShareMessage);
  elements.downloadQuote.addEventListener("click", handleDownloadQuote);
  elements.resetQuote.addEventListener("click", resetQuoteFields);

  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", handleThemeToggle);
  }
};

const setAppReady = () => {
  const root = document.documentElement;
  root.classList.remove("is-loading");
  root.classList.add("is-ready");
};

const triggerEntranceAnimation = () => {
  const root = document.documentElement;
  root.classList.remove("is-ready");
  root.classList.add("is-loading");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setAppReady();
    });
  });
};

// Initialize the interface with defaults.
initializeTheme();
bindEvents();
updateBreakdown();
triggerEntranceAnimation();

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    triggerEntranceAnimation();
  }
});
