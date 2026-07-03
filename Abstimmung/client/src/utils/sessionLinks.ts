export function getInitialCode() {
  const url = new URL(window.location.href);
  const pathMatch = window.location.pathname.match(/^\/join\/([^/]+)/);
  return (pathMatch?.[1] ?? url.searchParams.get("code") ?? "").toUpperCase();
}

export function getJoinUrl(code: string) {
  return `${window.location.origin}/join/${code}`;
}
