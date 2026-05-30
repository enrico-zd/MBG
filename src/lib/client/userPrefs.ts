const KEY_EMAIL = "mbg.userEmail";
const KEY_PROJECT = "mbg.selectedProjectId";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getUserEmail() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(KEY_EMAIL) || "";
}

export function setUserEmail(email: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(KEY_EMAIL, email);
}

export function getSelectedProjectId() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(KEY_PROJECT) || "";
}

export function setSelectedProjectId(projectId: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(KEY_PROJECT, projectId);
}
