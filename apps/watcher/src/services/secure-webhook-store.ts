import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { app, safeStorage } from "electron";

type SecureWebhookPayload = {
  schemaVersion: 1;
  encryptedWebhookUrl: string | null;
};

export type SecureWebhookResult = {
  webhookUrl: string;
  persisted: boolean;
  reason?: string;
};

function getSecureWebhookPath(): string {
  return path.join(app.getPath("userData"), "watcher-secrets.json");
}

export async function loadWebhookUrlFromSecureStore(): Promise<SecureWebhookResult> {
  try {
    const raw = await readFile(getSecureWebhookPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<SecureWebhookPayload>;
    const encryptedWebhookUrl =
      typeof parsed.encryptedWebhookUrl === "string" ? parsed.encryptedWebhookUrl : null;

    if (!encryptedWebhookUrl) {
      return {
        webhookUrl: "",
        persisted: true
      };
    }

    if (!safeStorage.isEncryptionAvailable()) {
      return {
        webhookUrl: "",
        persisted: false,
        reason: "OS secure storage is not available on this machine."
      };
    }

    try {
      const decrypted = safeStorage.decryptString(Buffer.from(encryptedWebhookUrl, "base64"));
      return {
        webhookUrl: decrypted.trim(),
        persisted: true
      };
    } catch {
      return {
        webhookUrl: "",
        persisted: false,
        reason: "Stored webhook secret could not be decrypted."
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      return {
        webhookUrl: "",
        persisted: true
      };
    }

    return {
      webhookUrl: "",
      persisted: false,
      reason: "Webhook secret store is unreadable."
    };
  }
}

export async function saveWebhookUrlToSecureStore(webhookUrl: string): Promise<SecureWebhookResult> {
  const normalizedWebhookUrl = webhookUrl.trim();

  if (!normalizedWebhookUrl) {
    await persistPayload({
      schemaVersion: 1,
      encryptedWebhookUrl: null
    });
    return {
      webhookUrl: "",
      persisted: true
    };
  }

  if (!safeStorage.isEncryptionAvailable()) {
    return {
      webhookUrl: normalizedWebhookUrl,
      persisted: false,
      reason: "OS secure storage is not available on this machine."
    };
  }

  const encryptedWebhookUrl = safeStorage
    .encryptString(normalizedWebhookUrl)
    .toString("base64");

  await persistPayload({
    schemaVersion: 1,
    encryptedWebhookUrl
  });

  return {
    webhookUrl: normalizedWebhookUrl,
    persisted: true
  };
}

async function persistPayload(payload: SecureWebhookPayload): Promise<void> {
  const secureWebhookPath = getSecureWebhookPath();
  await mkdir(path.dirname(secureWebhookPath), { recursive: true });
  await writeFile(secureWebhookPath, JSON.stringify(payload, null, 2), "utf8");
}
