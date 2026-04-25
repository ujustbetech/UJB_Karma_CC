export const ONBOARDING_EMAIL_TEMPLATES = Object.freeze({
  prospect_assessment_request: Object.freeze({
    enabled: true,
    provider: "emailjs",
    serviceId: "service_acyimrs",
    templateId: "template_cdm3n5x",
    publicKey: "w7YI9DEqR9sdiWX9h",
    recipients: Object.freeze({
      prospect: Object.freeze({
        subject: "",
        body: "",
        variableKeys: Object.freeze([]),
      }),
      orbiter: Object.freeze({
        subject: "",
        body:
          "Dear {{orbiter_name}},\n\nPlease fill the Prospect Assessment Form for {{prospect_name}}.\n\nAssessment Form:\n{{form_link}}\n\nRegards,\nUJustBe Team\n",
        variableKeys: Object.freeze(["orbiter_name", "prospect_name", "form_link"]),
      }),
    }),
  }),
});

function cloneRecipient(recipient) {
  return {
    ...recipient,
    variableKeys: Array.isArray(recipient?.variableKeys)
      ? [...recipient.variableKeys]
      : [],
  };
}

export function getFallbackOnboardingEmailTemplate(templateId) {
  const template = ONBOARDING_EMAIL_TEMPLATES[templateId];

  if (!template) {
    return null;
  }

  return {
    ...template,
    recipients: Object.fromEntries(
      Object.entries(template.recipients || {}).map(([key, recipient]) => [
        key,
        cloneRecipient(recipient),
      ])
    ),
  };
}
