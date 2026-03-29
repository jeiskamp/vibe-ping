const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vibePingDesktop", {
  platform: process.platform,
  runtime: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node
  },
  selectFolders: () => ipcRenderer.invoke("watcher:select-folders"),
  setFolders: (folders) => ipcRenderer.invoke("watcher:set-folders", folders),
  getActivity: (timeoutMinutes) => ipcRenderer.invoke("watcher:get-activity", timeoutMinutes)
});
