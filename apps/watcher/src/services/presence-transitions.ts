import type { PresenceState } from "../types/activity.js";

type FolderSnapshot = {
  status: "Watching" | "Idle" | "Needs review";
};

export type PresenceTransitionDecision = {
  nextAggregatePresence: PresenceState;
  shouldSendActivePresence: boolean;
  shouldSendOfflinePresence: boolean;
  shouldLogProjectSwitch: boolean;
};

export function evaluatePresenceTransitionDecision(input: {
  folders: FolderSnapshot[];
  activeProjectName: string | null;
  activeFolderPath: string | null;
  previousAggregatePresence: PresenceState | undefined;
  previouslyAnnouncedActiveFolderPath: string | null;
}): PresenceTransitionDecision {
  const nextAggregatePresence: PresenceState = input.folders.some(
    (folder) => folder.status === "Watching"
  )
    ? "Currently vibe coding"
    : "Offline";

  const shouldSendActivePresence =
    Boolean(input.activeProjectName) &&
    nextAggregatePresence === "Currently vibe coding" &&
    (input.previousAggregatePresence !== "Currently vibe coding" ||
      input.previouslyAnnouncedActiveFolderPath !== input.activeFolderPath);

  const shouldLogProjectSwitch =
    Boolean(input.activeProjectName) &&
    nextAggregatePresence === "Currently vibe coding" &&
    input.previousAggregatePresence === "Currently vibe coding" &&
    input.previouslyAnnouncedActiveFolderPath !== null &&
    input.previouslyAnnouncedActiveFolderPath !== input.activeFolderPath;

  const shouldSendOfflinePresence =
    input.folders.length > 0 &&
    nextAggregatePresence === "Offline" &&
    input.previousAggregatePresence === "Currently vibe coding";

  return {
    nextAggregatePresence,
    shouldSendActivePresence,
    shouldSendOfflinePresence,
    shouldLogProjectSwitch
  };
}
