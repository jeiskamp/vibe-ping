export type FolderItem = {
  id: string;
  label: string;
  status: "Watching" | "Idle" | "Needs review";
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};
