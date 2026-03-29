import {
  initialFolders,
  initialStatus,
  recentActivity
} from "../config/mock-data.js";
import type { ActivityItem, FolderItem } from "../types/activity.js";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Renderer boot failed: missing required UI element ${selector}.`);
  }

  return element;
}

const statusLabel = requireElement<HTMLElement>("#status-label");
const statusDetail = requireElement<HTMLElement>("#status-detail");
const folderList = requireElement<HTMLElement>("#folder-list");
const addFolderButton = requireElement<HTMLButtonElement>("#add-folder-button");
const removeFolderButton = requireElement<HTMLButtonElement>("#remove-folder-button");
const timeoutInput = requireElement<HTMLInputElement>("#timeout-input");
const timeoutSummary = requireElement<HTMLElement>("#timeout-summary");
const activityList = requireElement<HTMLElement>("#activity-list");
const runtimeBadge = requireElement<HTMLElement>("#runtime-badge");
const desktopApi = window.vibePingDesktop;

let folders = [...initialFolders];
let selectedFolderId = folders[0]?.id ?? null;
let activityItems: ActivityItem[] = [...recentActivity];

statusLabel.textContent = initialStatus.label;
statusDetail.textContent = initialStatus.detail;
timeoutInput.value = String(initialStatus.timeoutMinutes);

function setStatus(label: string, detail: string): void {
  statusLabel.textContent = label;
  statusDetail.textContent = detail;
}

function renderFolders(): void {
  folderList.innerHTML = "";

  if (folders.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "activity-item";
    emptyState.textContent = "No folders selected yet. Click Add to choose a folder to watch.";
    folderList.append(emptyState);
    removeFolderButton.disabled = true;
    return;
  }

  folders.forEach((folder, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const pathLabel = document.createElement("span");
    const indexBadge = document.createElement("span");
    const badgeGroup = document.createElement("div");
    const statusBadge = document.createElement("span");
    const presenceBadge = document.createElement("span");
    const isActive = folder.status === "Watching";

    button.type = "button";
    button.className = "folder-item";

    if (folder.id === selectedFolderId) {
      button.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      selectedFolderId = folder.id;
      renderFolders();
    });

    indexBadge.className = "folder-item__index";
    indexBadge.textContent = String(index + 1).padStart(2, "0");

    title.textContent = folder.label.split("/").at(-1) ?? folder.label;

    pathLabel.className = "folder-item__path";
    pathLabel.textContent = folder.label;

    statusBadge.className = "folder-item__status";
    statusBadge.textContent = folder.status;

    presenceBadge.className = `folder-item__presence ${isActive ? "is-active" : "is-offline"}`;
    presenceBadge.textContent = isActive ? "Currently vibe coding" : "Offline";

    badgeGroup.className = "folder-item__badges";
    badgeGroup.append(statusBadge, presenceBadge);

    content.append(title, pathLabel);
    button.append(indexBadge, content, badgeGroup);
    item.append(button);
    folderList.append(item);
  });

  removeFolderButton.disabled = folders.length === 0 || selectedFolderId === null;
}

function renderTimeoutSummary(): void {
  const minutes = Number(timeoutInput.value) || initialStatus.timeoutMinutes;
  timeoutSummary.textContent = `Status checks will surface after ${minutes} minute${minutes === 1 ? "" : "s"} of inactivity in this mock preview.`;
}

function renderActivity(): void {
  activityList.innerHTML = "";

  if (activityItems.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "activity-item";
    emptyState.textContent = "No recent activity yet.";
    activityList.append(emptyState);
    return;
  }

  activityItems.forEach((activity) => {
    const item = document.createElement("li");
    const top = document.createElement("div");
    const title = document.createElement("strong");
    const time = document.createElement("span");
    const detail = document.createElement("p");

    item.className = "activity-item";
    top.className = "activity-item__top";
    time.className = "activity-item__time";
    detail.className = "activity-item__detail";

    title.textContent = activity.title;
    time.textContent = activity.time;
    detail.textContent = activity.detail;

    top.append(title, time);
    item.append(top, detail);
    activityList.append(item);
  });
}

async function refreshActivity(): Promise<void> {
  if (!desktopApi?.getActivity || !desktopApi?.setFolders) {
    return;
  }

  await desktopApi.setFolders(folders.map((folder) => folder.label));
  const snapshot = await desktopApi.getActivity(Number(timeoutInput.value) || initialStatus.timeoutMinutes);

  const statusByPath = new Map(snapshot.folders.map((folder) => [folder.path, folder.status]));
  folders = folders.map((folder) => ({
    ...folder,
    status: statusByPath.get(folder.label) ?? folder.status
  }));
  activityItems = snapshot.activity.map(({ timestamp: _timestamp, ...activity }) => activity);

  renderFolders();
  renderActivity();
}

async function addSelectedFolders(): Promise<void> {
  setStatus("Opening folder picker", "Choose one or more folders for VibePing to track.");

  if (!desktopApi?.selectFolders) {
    setStatus(
      "Folder picker unavailable",
      "Desktop bridge not found. Restart the app so the latest preload script is loaded."
    );
    return;
  }

  let selectedPaths: string[];

  try {
    selectedPaths = await desktopApi.selectFolders();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown picker error";
    setStatus("Folder picker unavailable", message);
    return;
  }

  if (selectedPaths.length === 0) {
    setStatus(initialStatus.label, initialStatus.detail);
    return;
  }

  const existingPaths = new Set(folders.map((folder) => folder.label));
  const nextFolders = selectedPaths
    .filter((selectedPath) => !existingPaths.has(selectedPath))
    .map<FolderItem>((selectedPath) => ({
      id: `folder-${selectedPath}-${Date.now()}`,
      label: selectedPath,
      status: "Watching"
    }));

  if (nextFolders.length === 0) {
    setStatus("No new folders added", "Those folders are already in the watch list.");
    return;
  }

  folders = [...folders, ...nextFolders];
  selectedFolderId = nextFolders.at(-1)?.id ?? selectedFolderId;
  setStatus("Folders selected", `${nextFolders.length} folder${nextFolders.length === 1 ? "" : "s"} added to the watch list.`);
  await refreshActivity();
}

function removeSelectedFolder(): void {
  if (selectedFolderId === null) {
    return;
  }

  folders = folders.filter((folder) => folder.id !== selectedFolderId);
  selectedFolderId = folders[0]?.id ?? null;
  void refreshActivity();
}

addFolderButton.addEventListener("click", () => {
  void addSelectedFolders();
});
removeFolderButton.addEventListener("click", removeSelectedFolder);
timeoutInput.addEventListener("input", renderTimeoutSummary);
timeoutInput.addEventListener("change", () => {
  void refreshActivity();
});

if (!desktopApi?.runtime) {
  setStatus(
    "Desktop bridge unavailable",
    "The preload script did not initialize. Restart the app to load the Electron bridge."
  );
} else {
  runtimeBadge.textContent = `Electron ${desktopApi.runtime.electron} • Node ${desktopApi.runtime.node} • ${desktopApi.platform}`;
}

renderFolders();
renderTimeoutSummary();
renderActivity();
void refreshActivity();
window.setInterval(() => {
  void refreshActivity();
}, 15000);
