import Cookies from "js-cookie";

export function wsBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return apiUrl.replace(/^http/, "ws");
}

export function wsAuthedUrl(path: string): string {
  const token = Cookies.get("access_token");
  return `${wsBaseUrl()}${path}${path.includes("?") ? "&" : "?"}token=${token ?? ""}`;
}
