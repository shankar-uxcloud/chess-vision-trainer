"use strict";
const { test, expect } = require("@playwright/test");

async function activateTrainingAndWait(page) {
  await page.evaluate(() => {
    document.body.dataset.boardSizeVerified = "pending";
    window.setView("training");
  });
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
}

async function enterTraining(page) {
  await page.goto("/");
  await page.locator("#continueGuest").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("#continueGuest").click();
  await activateTrainingAndWait(page);
  await expect(page.locator("#chessboard")).toBeVisible();
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
    await activateTrainingAndWait(page);
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
  await page.locator("#boardSize").evaluate(el => { el.value = "60"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await activateTrainingAndWait(page);
  const small = await measureBoard(page);

  await page.evaluate(() => window.setView("settings"));
  await page.locator("#boardSize").evaluate(el => { el.value = "130"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await activateTrainingAndWait(page);
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
    await activateTrainingAndWait(page);
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
  await activateTrainingAndWait(page);
  const size = await measureBoard(page);
  expect(size.width).toBe(size.height);
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
    await page.evaluate(() => { document.body.dataset.boardSizeVerified = "pending"; });
    await page.locator(`.mode-btn[data-mode="${mode}"]`).click();
    await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
    await expect(page.locator("#trainingTitle")).toHaveText(title);
    const size = await measureBoard(page);
    expect(size.width).toBe(size.height);
  }
});

test("responsive viewports keep the board square and inside the viewport", async ({ page }) => {
  await enterTraining(page);
  for (const viewport of [
    { width: 320, height: 640 }, { width: 375, height: 812 },
    { width: 768, height: 1024 }, { width: 1024, height: 768 },
    { width: 1366, height: 768 }, { width: 1920, height: 1080 }
  ]) {
    await page.evaluate(() => { document.body.dataset.boardSizeVerified = "pending"; });
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
  await page.evaluate(() => { document.body.dataset.boardSizeVerified = "pending"; });
  await page.setViewportSize({ width: 812, height: 375 });
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const landscape = await measureBoard(page);
  expect(landscape.width).toBe(landscape.height);
  await page.evaluate(() => { document.body.dataset.boardSizeVerified = "pending"; });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForFunction(() => document.body.dataset.boardSizeVerified === "true");
  const portrait = await measureBoard(page);
  expect(portrait.width).toBe(portrait.height);
});

test("backup export and import preserve board, theme and recommended settings", async ({ page }) => {
  await enterTraining(page);
  await page.evaluate(() => window.setView("settings"));
  await page.locator("#appearanceTheme").selectOption("neon");
  await page.locator("#boardTheme").selectOption("ice");
  await page.locator("#boardSize").evaluate(el => { el.value = "115"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.locator("#animationsToggle").uncheck();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#exportBtn").click()
  ]);
  const filePath = await download.path();
  const fs = require("node:fs");
  const backup = JSON.parse(fs.readFileSync(filePath, "utf8"));
  expect(backup.settings.theme).toBe("neon");
  expect(backup.settings.board).toBe("ice");
  expect(backup.settings.boardSize).toBe(115);
  expect(backup.settings.boardFit).toBe(false);
  expect(backup.settings.settingsProfile).toBe("custom");
  expect(backup.settings.animations).toBe(false);

  await page.locator("#importFile").setInputFiles(filePath);
  await expect(page.locator("#toastMessage")).toContainText("Backup imported successfully.");
  const saved = await page.evaluate(() => ({
    theme: localStorage.getItem("cvt-theme-v3"),
    board: localStorage.getItem("cvt-board-v3"),
    size: localStorage.getItem("cvt-boardsize-v3"),
    fit: localStorage.getItem("cvt-board-fit-v1"),
    profile: localStorage.getItem("cvt-settings-profile-v1"),
    animations: localStorage.getItem("cvt-settings-animations-v1")
  }));
  expect(saved).toEqual({
    theme: "neon", board: "ice", size: "115", fit: "false",
    profile: "custom", animations: "false"
  });
});

test("primary application sections remain routable in guest mode", async ({ page }) => {
  await enterTraining(page);
  for (const view of ["dashboard", "journey", "training", "mindpalace", "achievements", "daily", "analytics", "profile", "tactics", "blindfold", "weekly", "coach", "settings"]) {
    await page.evaluate(name => window.setView(name), view);
    await expect(page.locator("body")).toHaveAttribute("data-view", view);
    await expect(page.locator(`.view[data-view="${view}"]`)).toHaveClass(/active/);
  }
});

test("board size and Fit to Screen preference survive a browser reload", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await enterTraining(page);
  await page.evaluate(() => window.setView("settings"));
  await page.locator('[data-board-preset="maximum"]').click();
  await activateTrainingAndWait(page);
  const presetBefore = await measureBoard(page);
  await page.evaluate(() => window.setView("settings"));
  await page.locator("#fitBoardBtn").click();
  await activateTrainingAndWait(page);
  const fitBefore = await measureBoard(page);
  expect(fitBefore.width).toBeGreaterThanOrEqual(presetBefore.width);

  await page.reload();
  await page.waitForSelector("#chessboard");
  await activateTrainingAndWait(page);
  const fitAfter = await measureBoard(page);
  expect(fitAfter.width).toBe(fitBefore.width);
  expect(fitAfter.height).toBe(fitBefore.height);
  expect(await page.evaluate(() => localStorage.getItem("cvt-board-fit-v1"))).toBe("true");
});
