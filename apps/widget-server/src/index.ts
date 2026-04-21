import "dotenv/config";
import { pathToFileURL } from "node:url";
import { createApp, type CreateAppOptions } from "./app.js";

export async function startServer({
  port = Number(process.env.PORT ?? 3000),
  templatePath = process.env.WIDGET_TEMPLATE_PATH,
  staticDir = process.env.WIDGET_STATIC_DIR,
  ...options
}: CreateAppOptions & { port?: number } = {}) {
  const app = createApp({
    ...options,
    templatePath,
    staticDir,
  });

  return await new Promise<import("node:http").Server>((resolve, reject) => {
    const nextServer = app.listen(port, () => {
      setImmediate(() => resolve(nextServer));
    });
    nextServer.once("error", reject);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
