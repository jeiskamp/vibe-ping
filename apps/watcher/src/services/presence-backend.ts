import type { PresenceState } from "../types/activity.js";

type PresenceUpdate = {
  username: string;
  projectName: string;
  folderPath: string;
  status: PresenceState;
  timestamp: string;
  languageTag?: string;
  webhookUrl?: string;
  backendUrl?: string;
};

export type BackendDeliveryResult = {
  delivered: boolean;
  reason?: string;
};

export async function sendPresenceToBackend(
  payload: PresenceUpdate
): Promise<BackendDeliveryResult> {
  const backendUrl = payload.backendUrl?.trim() || process.env.VIBEPING_BACKEND_URL?.trim();

  if (!backendUrl) {
    return {
      delivered: false,
      reason: "VibePing backend is not configured"
    };
  }

  const response = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      username: payload.username,
      projectName: payload.projectName,
      folderPath: payload.folderPath,
      status: payload.status,
      timestamp: payload.timestamp,
      languageTag: payload.languageTag,
      webhookUrl: payload.webhookUrl
    })
  });

  if (!response.ok) {
    return {
      delivered: false,
      reason: `VibePing backend returned ${response.status}`
    };
  }

  return { delivered: true };
}
