import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanWatchedFolders } from "./services/activity-scanner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let watchedFolders: string[] = [];

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

ipcMain.handle("watcher:get-activity", async (_event, timeoutMinutes: number) => {
  return scanWatchedFolders(watchedFolders, {
    timeoutMinutes,
    maxEntries: 120,
    maxDepth: 5
  });
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
