import type { WidgetKey } from "@repo/shared";

export function getWidgetFromPathname(pathname: string): WidgetKey | undefined {
  if (pathname === "/calendar") {
    return "calendar";
  }

  if (pathname === "/clock") {
    return "clock";
  }

  if (pathname === "/days-remaining") {
    return "daysRemaining";
  }

  return undefined;
}

export function getWidgetPath(widget: WidgetKey) {
  if (widget === "calendar") {
    return "/calendar";
  }

  if (widget === "clock") {
    return "/clock";
  }

  return "/days-remaining";
}

export function isWidgetPathname(pathname: string) {
  return getWidgetFromPathname(pathname) !== undefined;
}
