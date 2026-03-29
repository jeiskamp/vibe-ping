import { appendFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const logPath = path.join(tmpdir(), "vibeping", "presence.log");

export async function appendDevLog(message: string): Promise<void> {
  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, `${message}\n`, "utf8");
}
