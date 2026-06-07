const { config } = require("./config");

function providerStatus() {
  return {
    provider: config.payment.provider,
    mode: config.payment.provider === "local" ? "local-simulated" : "external",
    webhookSignatureRequired: config.payment.provider !== "local",
    webhookSecretConfigured: config.payment.webhookSecretConfigured,
    productionNote: config.payment.provider === "local"
      ? "Local mode does not process real money. Payment events are simulated through the local webhook endpoint."
      : "External payment mode must verify webhook signatures and handle invoices, refunds, tax, and disputes.",
  };
}

function createCheckoutSession(order) {
  const status = providerStatus();
  return {
    id: order.id,
    url: status.mode === "local-simulated" ? `/billing/local-checkout/${encodeURIComponent(order.plan)}` : null,
    provider: status.provider,
    mode: status.mode,
    status: order.status,
    note: status.productionNote,
  };
}

function providerName() {
  return providerStatus().provider;
}

module.exports = {
  createCheckoutSession,
  providerName,
  providerStatus,
};
