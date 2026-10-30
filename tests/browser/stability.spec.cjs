"use strict";
const { test, expect } = require("@playwright/test");

async function enterTraining(page) {
  await page.goto("/");
  await page.locator("#continueGuest").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("#continueGuest").click();
  await page.evaluate(() => window.setView("training"));
  await expect(page.locator("#chessboard")).toBeVisible();
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
}

async function measureBoard(page) {
  return page.locator("#chessboard").evaluate(board => {
    const rect = board.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height), left: rect.left, right: rect.right };
  });
}

test("all five board presets produce increasing, square rendered dimensions", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await enterTraining(page);
  const values = [];
  for (const preset of ["small", "medium", "large", "extra-large", "maximum"]) {
    await page.evaluate(() => window.setView("settings"));
    await page.locator(`[data-board-preset="${preset}"]`).click();
    await page.evaluate(() => window.setView("training"));
    await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
    const size = await measureBoard(page);
    expect(size.width).toBe(size.height);
    values.push(size.width);
  }
  for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
});

test("custom slider and Fit to Screen change the actual rendered grid", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await enterTraining(page);
  await page.evaluate(() => window.setView("settings"));
  await page.locator("#boardSize").fill("60");
  await page.evaluate(() => window.setView("training"));
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const small = await measureBoard(page);

  await page.evaluate(() => window.setView("settings"));
  await page.locator("#boardSize").fill("130");
  await page.evaluate(() => window.setView("training"));
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const large = await measureBoard(page);
  expect(large.width).toBeGreaterThan(small.width);
  expect(large.width).toBe(large.height);

  await page.evaluate(() => window.setView("settings"));
  await page.locator("#fitBoardBtn").click();
  await page.evaluate(() => window.setView("training"));
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const fit = await measureBoard(page);
  expect(fit.width).toBe(fit.height);
  expect(fit.width).toBeGreaterThanOrEqual(large.width);
});

test("recommended profiles apply their declared preferences and retain a square board", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await enterTraining(page);
  for (const profile of ["balanced", "focus", "performance"]) {
    await page.evaluate(name => window.applyRecommendedProfile(name, { silent: true }), profile);
    await page.evaluate(() => window.setView("training"));
    await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
    const size = await measureBoard(page);
    expect(size.width).toBe(size.height);
    expect(await page.locator("body").getAttribute("data-settings-profile")).toBe(profile);
  }
});

test("all four interface themes remain selectable", async ({ page }) => {
  await enterTraining(page);
  await page.evaluate(() => window.setView("settings"));
  for (const theme of ["dark", "light", "neon", "heavy"]) {
    await page.locator("#appearanceTheme").selectOption(theme);
    await expect(page.locator("body")).toHaveAttribute("data-theme", theme);
  }
});

test("all eight core training modes remain selectable", async ({ page }) => {
  await enterTraining(page);
  const modes = [
    ["square", "Square Vision"], ["coordinate", "Coordinate Trainer"],
    ["reverse", "Reverse Coordinates"], ["knight", "Knight Vision"],
    ["blindfold", "Blindfold Training"], ["color", "Color Recognition"],
    ["custom", "Custom Practice"], ["mindpalace", "Mind Palace"]
  ];
  for (const [mode, title] of modes) {
    await page.locator(`.mode-btn[data-mode="${mode}"]`).click();
    await expect(page.locator("#trainingTitle")).toHaveText(title);
  }
});

test("responsive viewports keep the board square and inside the viewport", async ({ page }) => {
  await enterTraining(page);
  for (const viewport of [
    { width: 320, height: 640 }, { width: 375, height: 812 },
    { width: 768, height: 1024 }, { width: 1024, height: 768 },
    { width: 1366, height: 768 }, { width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
    const size = await measureBoard(page);
    expect(size.width).toBe(size.height);
    expect(size.left).toBeGreaterThanOrEqual(-1);
    expect(size.right).toBeLessThanOrEqual(viewport.width + 1);
  }
});

test("orientation changes recalculate Fit to Screen without distorting the board", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await enterTraining(page);
  await page.evaluate(() => window.fitBoardToScreen());
  await page.setViewportSize({ width: 812, height: 375 });
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const landscape = await measureBoard(page);
  expect(landscape.width).toBe(landscape.height);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const portrait = await measureBoard(page);
  expect(portrait.width).toBe(portrait.height);
});
