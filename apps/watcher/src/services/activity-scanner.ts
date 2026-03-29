import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export type FolderStatus = "Watching" | "Idle" | "Needs review";

export type WatchedFolderSnapshot = {
  path: string;
  status: FolderStatus;
  lastActivityAt: number | null;
};

export type RecentActivityEntry = {
  id: string;
  title: string;
  detail: string;
  time: string;
  timestamp: number;
};

type ScanOptions = {
  timeoutMinutes: number;
  maxEntries?: number;
  maxDepth?: number;
};

type FileActivity = {
  filePath: string;
  modifiedAt: number;
};

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".cache"
]);

export async function scanWatchedFolders(
  watchedFolders: string[],
  options: ScanOptions
): Promise<{
  folders: WatchedFolderSnapshot[];
  activity: RecentActivityEntry[];
}> {
  const allActivity = await Promise.all(
    watchedFolders.map(async (folderPath) => {
      const activity = await collectRecentFiles(folderPath, {
        maxEntries: options.maxEntries ?? 40,
        maxDepth: options.maxDepth ?? 4
      });

      const latest = activity[0]?.modifiedAt ?? null;

      return {
        folderPath,
        activity,
        latest
      };
    })
  );

  const now = Date.now();
  const timeoutMs = options.timeoutMinutes * 60 * 1000;

  const folders = allActivity.map<WatchedFolderSnapshot>((folder) => ({
    path: folder.folderPath,
    lastActivityAt: folder.latest,
    status: getFolderStatus(folder.latest, now, timeoutMs)
  }));

  const activity = allActivity
    .flatMap((folder) =>
      folder.activity.map<RecentActivityEntry>((entry) => ({
        id: `${entry.filePath}-${entry.modifiedAt}`,
        title: path.basename(entry.filePath),
        detail: `${path.basename(folder.folderPath)} • ${entry.filePath}`,
        time: formatRelativeTime(entry.modifiedAt, now),
        timestamp: entry.modifiedAt
      }))
    )
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 8);

  return { folders, activity };
}

async function collectRecentFiles(
  rootPath: string,
  options: {
    maxEntries: number;
    maxDepth: number;
  }
): Promise<FileActivity[]> {
  const results: FileActivity[] = [];
  let scannedEntries = 0;

  async function walk(currentPath: string, depth: number): Promise<void> {
    if (depth > options.maxDepth || scannedEntries >= options.maxEntries) {
      return;
    }

    let entries;

    try {
      entries = await readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (scannedEntries >= options.maxEntries) {
        return;
      }

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (SKIPPED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        await walk(fullPath, depth + 1);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      scannedEntries += 1;

      try {
        const fileStat = await stat(fullPath);
        results.push({
          filePath: fullPath,
          modifiedAt: fileStat.mtimeMs
        });
      } catch {
        continue;
      }
    }
  }

  await walk(rootPath, 0);

  return results.sort((left, right) => right.modifiedAt - left.modifiedAt).slice(0, 6);
}

function getFolderStatus(
  latestActivityAt: number | null,
  now: number,
  timeoutMs: number
): FolderStatus {
  if (latestActivityAt === null) {
    return "Needs review";
  }

  if (now - latestActivityAt <= timeoutMs) {
    return "Watching";
  }

  return "Idle";
}

function formatRelativeTime(timestamp: number, now: number): string {
  const diffMs = Math.max(0, now - timestamp);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
