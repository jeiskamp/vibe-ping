import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanWatchedFolders } from "./services/activity-scanner.js";
import { appendPresenceEvent, appendStatusSnapshot, initializeLocalNotifier } from "./services/local-notifier.js";
import type { PresenceState } from "./types/activity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let watchedFolders: string[] = [];
const presenceStateByPath = new Map<string, PresenceState>();
let presenceEvents: Array<{
  id: string;
  title: string;
  detail: string;
  time: string;
  timestamp: number;
}> = [];

ipcMain.handle("watcher:select-folders", async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  const options: OpenDialogOptions = {
    title: "Select folders to watch",
    properties: ["openDirectory", "multiSelections", "createDirectory"]
  };
  const result = senderWindow
    ? await dialog.showOpenDialog(senderWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled) {
    return [];
  }

  return result.filePaths;
});

ipcMain.handle("watcher:set-folders", async (_event, folderPaths: string[]) => {
  watchedFolders = folderPaths;
});

ipcMain.handle("watcher:get-activity", async (_event, timeoutMinutes: number, username: string) => {
  const snapshot = await scanWatchedFolders(watchedFolders, {
    timeoutMinutes,
    maxEntries: 120,
    maxDepth: 5
  });

  const now = Date.now();
  const cleanUsername = username.trim() || "anonomous0123";

  snapshot.folders.forEach((folder) => {
    const nextPresence = folder.status === "Watching" ? "Currently vibe coding" : "Offline";
    const previousPresence = presenceStateByPath.get(folder.path);

    if (previousPresence !== undefined && previousPresence !== nextPresence) {
      const folderName = path.basename(folder.path);
      const message =
        nextPresence === "Currently vibe coding"
          ? `${cleanUsername} is vibe coding ${folderName}`
          : `${cleanUsername} is offline ${folderName}`;

      const event = {
        id: `${folder.path}-${now}-${nextPresence}`,
        title: message,
        detail: folder.path,
        time: "just now",
        timestamp: now
      };

      presenceEvents = [event, ...presenceEvents].slice(0, 12);
      console.log(`[VibePing] ${message}`);
      void appendPresenceEvent(`[presence] ${message}`);
    }

    presenceStateByPath.set(folder.path, nextPresence);
  });

  void appendStatusSnapshot(cleanUsername, snapshot.folders);

  return {
    folders: snapshot.folders,
    activity: [...presenceEvents, ...snapshot.activity]
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 8)
  };
});

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 430,
    height: 620,
    minWidth: 390,
    minHeight: 540,
    backgroundColor: "#0b1116",
    title: "VibePing",
    webPreferences: {
      preload: path.join(__dirname, "../src/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, "../src/renderer/index.html"));

  return window;
}

app.whenReady().then(() => {
  void initializeLocalNotifier(app.getPath("userData"));
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
