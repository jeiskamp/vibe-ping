import { describe, expect, it } from "vitest";
import { evaluatePresenceTransitionDecision } from "../src/services/presence-transitions";

describe("evaluatePresenceTransitionDecision", () => {
  it("sends active presence when entering active state", () => {
    const result = evaluatePresenceTransitionDecision({
      folders: [{ status: "Watching" }],
      activeProjectName: "vibe-ping",
      activeFolderPath: "/tmp/vibe-ping",
      previousAggregatePresence: undefined,
      previouslyAnnouncedActiveFolderPath: null
    });

    expect(result.nextAggregatePresence).toBe("Currently vibe coding");
    expect(result.shouldSendActivePresence).toBe(true);
    expect(result.shouldSendOfflinePresence).toBe(false);
    expect(result.shouldLogProjectSwitch).toBe(false);
  });

  it("does not resend active presence for the same already-announced folder", () => {
    const result = evaluatePresenceTransitionDecision({
      folders: [{ status: "Watching" }],
      activeProjectName: "vibe-ping",
      activeFolderPath: "/tmp/vibe-ping",
      previousAggregatePresence: "Currently vibe coding",
      previouslyAnnouncedActiveFolderPath: "/tmp/vibe-ping"
    });

    expect(result.shouldSendActivePresence).toBe(false);
    expect(result.shouldLogProjectSwitch).toBe(false);
  });

  it("sends active presence and logs switch when active folder changes", () => {
    const result = evaluatePresenceTransitionDecision({
      folders: [{ status: "Watching" }],
      activeProjectName: "repo-b",
      activeFolderPath: "/tmp/repo-b",
      previousAggregatePresence: "Currently vibe coding",
      previouslyAnnouncedActiveFolderPath: "/tmp/repo-a"
    });

    expect(result.shouldSendActivePresence).toBe(true);
    expect(result.shouldLogProjectSwitch).toBe(true);
    expect(result.shouldSendOfflinePresence).toBe(false);
  });

  it("sends offline presence once when transitioning from active to offline", () => {
    const result = evaluatePresenceTransitionDecision({
      folders: [{ status: "Idle" }],
      activeProjectName: null,
      activeFolderPath: null,
      previousAggregatePresence: "Currently vibe coding",
      previouslyAnnouncedActiveFolderPath: "/tmp/vibe-ping"
    });

    expect(result.nextAggregatePresence).toBe("Offline");
    expect(result.shouldSendOfflinePresence).toBe(true);
    expect(result.shouldSendActivePresence).toBe(false);
  });

  it("does not send offline presence when there are no watched folders", () => {
    const result = evaluatePresenceTransitionDecision({
      folders: [],
      activeProjectName: null,
      activeFolderPath: null,
      previousAggregatePresence: "Currently vibe coding",
      previouslyAnnouncedActiveFolderPath: "/tmp/vibe-ping"
    });

    expect(result.shouldSendOfflinePresence).toBe(false);
  });
});
