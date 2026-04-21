import { readFile } from "node:fs/promises";
import type { WidgetRuntime } from "@repo/shared";

function serializeRuntime(runtime: WidgetRuntime) {
  return JSON.stringify(runtime)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function injectWidgetRuntime(htmlTemplate: string, runtime: WidgetRuntime) {
  const runtimeScript =
    `<script>window.__WIDGET_RUNTIME__=${serializeRuntime(runtime)};</script>`;

  if (htmlTemplate.includes("<!--WIDGET_RUNTIME-->")) {
    return htmlTemplate.replace("<!--WIDGET_RUNTIME-->", runtimeScript);
  }

  if (htmlTemplate.includes("</head>")) {
    return htmlTemplate.replace("</head>", `${runtimeScript}</head>`);
  }

  return `${runtimeScript}${htmlTemplate}`;
}

export function createTemplateLoader({
  htmlTemplate,
  templatePath,
}: {
  htmlTemplate?: string;
  templatePath?: string;
}) {
  if (typeof htmlTemplate === "string") {
    return async () => htmlTemplate;
  }

  if (typeof templatePath !== "string" || templatePath.length === 0) {
    throw new Error("Widget HTML template path is required when no inline htmlTemplate is provided");
  }

  let pendingTemplate: Promise<string> | undefined;

  return async () => {
    if (!pendingTemplate) {
      pendingTemplate = readFile(templatePath, "utf8");
    }

    return pendingTemplate;
  };
}

export async function renderWidgetPage({
  loadTemplate,
  runtime,
}: {
  loadTemplate: () => Promise<string>;
  runtime: WidgetRuntime;
}) {
  const template = await loadTemplate();
  return injectWidgetRuntime(template, runtime);
}
