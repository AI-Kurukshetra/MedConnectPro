type SendSmsInput = {
  to: string;
  body: string;
  metadata?: Record<string, unknown>;
};

type SendSmsResult = {
  providerName: string;
  providerMessageId: string;
  status: "queued" | "sent";
};

export async function sendSmsWithProvider(input: SendSmsInput): Promise<SendSmsResult> {
  const apiUrl = process.env.SMS_PROVIDER_API_URL;
  const apiKey = process.env.SMS_PROVIDER_API_KEY;
  const fromNumber = process.env.SMS_PROVIDER_FROM_NUMBER;

  if (!apiUrl || !apiKey || !fromNumber) {
    throw new Error("Missing SMS provider configuration.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: fromNumber,
      to: input.to,
      body: input.body,
      metadata: input.metadata ?? {}
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS provider error (${response.status}): ${errorText || "unknown error"}`);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    status?: "queued" | "sent";
    provider?: string;
  };

  return {
    providerName: payload.provider ?? "generic_sms_provider",
    providerMessageId: payload.id ?? crypto.randomUUID(),
    status: payload.status ?? "queued"
  };
}
