import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

const htmlTemplate =
  "<!DOCTYPE html><html><head></head><body><div id=\"root\"></div></body></html>";

async function withServer(
  app: ReturnType<typeof createApp>,
  callback: (baseUrl: string) => Promise<void>
) {
  const server = await new Promise<import("node:http").Server>((resolve, reject) => {
    const nextServer = app.listen(0, () => resolve(nextServer));
    nextServer.once("error", reject);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test server port");
    }

    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    if (!server.listening) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test("widget access api returns denied access without leaking the license", async () => {
  let receivedLicense: string | undefined;
  const app = createApp({
    checkAccess: async (license: string | undefined) => {
      receivedLicense = license;
      return {
        access: false,
        reason: "Licence introuvable",
      };
    },
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/widget-access?widget=calendar&license=BAD-KEY`
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(receivedLicense, "BAD-KEY");
    assert.deepEqual(payload, {
      accessGranted: false,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
      reason: "Licence introuvable",
    });
  });
});

test("static shell serves the frontend app for widget routes", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: true }),
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/calendar?license=BAD-KEY`);
    const responseHtml = await response.text();

    assert.equal(response.status, 200);
    assert.match(responseHtml, /<div id="root"><\/div>/);
    assert.doesNotMatch(responseHtml, /"widget":"calendar"/);
  });
});
