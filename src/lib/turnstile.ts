type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

export const verifyTurnstileToken = async (
  token: string | undefined | null,
  secretKey: string | undefined | null,
  clientIp?: string | null,
): Promise<{ success: boolean; error?: string }> => {
  if (!secretKey) {
    // If running in development without a Turnstile secret key, allow testing bypass
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return { success: false, error: "Turnstile secret key is not configured" };
  }

  if (!token) {
    return { success: false, error: "Turnstile verification token is missing" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      return { success: false, error: `Verification service returned ${response.status}` };
    }

    const data = (await response.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      const errorCodes = data["error-codes"]?.join(", ") || "verification-failed";
      return { success: false, error: `Turnstile check failed: ${errorCodes}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown verification error";
    return { success: false, error: message };
  }
};
