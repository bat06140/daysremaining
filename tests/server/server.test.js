import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../server.js";

const htmlTemplate =
  "<!DOCTYPE html><html><head></head><body><div id=\"root\"></div></body></html>";

async function withServer(app, callback) {
  const server = await new Promise((resolve, reject) => {
    const nextServer = app.listen(0, () => resolve(nextServer));
    nextServer.once("error", reject);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test server port");
    }

    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    if (!server.listening) {
      return;
    }

    await new Promise((resolve, reject) => {
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

test("calendar route validates ?license= and injects premium runtime state", async () => {
  let receivedLicense;
  const app = createApp({
    checkAccess: async (license) => {
      receivedLicense = license;
      return { access: true };
    },
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/calendar?license=VALID-KEY&layout=full`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(receivedLicense, "VALID-KEY");
    assert.match(html, /"widget":"calendar"/);
    assert.match(html, /"accessGranted":true/);
    assert.doesNotMatch(html, /VALID-KEY/);
  });
});

test("clock and days-remaining routes inject locked runtime state", async () => {
  const app = createApp({
    checkAccess: async (license) => ({
      access: false,
      reason: license ? "Licence introuvable" : "Licence manquante",
    }),
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const [clockResponse, daysRemainingResponse] = await Promise.all([
      fetch(`${baseUrl}/clock?license=UNKNOWN`),
      fetch(`${baseUrl}/days-remaining`),
    ]);
    const clockHtml = await clockResponse.text();
    const daysRemainingHtml = await daysRemainingResponse.text();

    assert.equal(clockResponse.status, 200);
    assert.equal(daysRemainingResponse.status, 200);
    assert.match(clockHtml, /"widget":"clock"/);
    assert.match(clockHtml, /"accessGranted":false/);
    assert.match(clockHtml, /"reason":"Licence introuvable"/);
    assert.match(daysRemainingHtml, /"widget":"daysRemaining"/);
    assert.match(daysRemainingHtml, /"reason":"Licence manquante"/);
  });
});
