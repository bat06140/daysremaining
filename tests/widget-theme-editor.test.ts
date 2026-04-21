import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WidgetThemeProvider } from "../src/context/WidgetThemeContext.js";
import Calendar from "../src/components/Calendar.js";
import { WidgetThemeEditor } from "../src/components/WidgetThemeEditor.js";
import { renderWidget } from "../src/components/widget-registry.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../src/lib/widget-access.js";

const renderWithTheme = (element: React.ReactElement) =>
  renderToStaticMarkup(
    React.createElement(WidgetThemeProvider, null, element)
  );

test("WidgetThemeEditor hides itself in hidden mode", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "hidden",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    })
  );

  assert.equal(markup, "");
});

test("WidgetThemeEditor renders the locked purchase affordance", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "locked",
      purchaseUrl: "https://example.com/purchase",
    })
  );

  assert.match(markup, /Unlock premium theme customization/);
  assert.match(markup, /aria-label="Unlock premium theme customization"/);
  assert.match(markup, /href="https:\/\/example\.com\/purchase"/);
});

test("renderWidget threads purchaseUrl into the locked editor path", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      WidgetThemeProvider,
      null,
      renderWidget({
        widget: "calendar",
        layout: "square",
        accessGranted: false,
        purchaseUrl: "https://example.com/purchase",
      })
    )
  );

  assert.match(markup, /href="https:\/\/example\.com\/purchase"/);
});

test("Calendar hides the editor when the theme editor is disabled", () => {
  const markup = renderWithTheme(
    React.createElement(Calendar, {
      layout: "square",
      accessGranted: false,
      allowThemeEditor: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    })
  );

  assert.doesNotMatch(markup, /href="https:\/\/atomicskills\.academy\/widgets-notion\/"/);
  assert.doesNotMatch(markup, /Unlock premium theme customization/);
});

test("Calendar threads access granted into the premium editor path", () => {
  const markup = renderWithTheme(
    React.createElement(Calendar, {
      layout: "square",
      accessGranted: true,
      allowThemeEditor: true,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    })
  );

  assert.doesNotMatch(markup, /href="https:\/\/atomicskills\.academy\/widgets-notion\/"/);
  assert.match(markup, /Customize widget colors/);
});
