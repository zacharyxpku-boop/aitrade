const { config } = require("./config");

function providerStatus() {
  return {
    provider: config.email.provider,
    mode: config.email.provider === "local" ? "local-simulated" : "external",
    from: config.email.from,
    exposesLocalTokens: config.email.provider === "local" && config.email.exposeLocalTokens,
    productionNote: config.email.provider === "local"
      ? "Local mode returns verification/reset tokens for demo only. Production must send email and hide tokens from API responses."
      : "External mode should send email through a verified provider with delivery logs.",
  };
}

function verificationPayload(token) {
  const status = providerStatus();
  return {
    mode: status.mode,
    provider: status.provider,
    token: status.exposesLocalTokens ? token : null,
    note: status.productionNote,
  };
}

function passwordResetPayload(reset) {
  const status = providerStatus();
  return {
    ok: true,
    mode: status.mode,
    provider: status.provider,
    resetToken: status.exposesLocalTokens ? reset?.token || null : null,
    note: status.productionNote,
  };
}

module.exports = {
  providerStatus,
  verificationPayload,
  passwordResetPayload,
};
