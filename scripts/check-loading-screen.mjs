import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.RIJNMUN_TEST_URL || "http://localhost:4173";
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  const video = page.locator("#initial-loading-screen video");
  await page.waitForFunction(() => document.querySelector("#initial-loading-screen video")?.currentTime > .1);
  const metadata = await video.evaluate(element => ({
    width: element.videoWidth, height: element.videoHeight, duration: element.duration,
    muted: element.muted, loop: element.loop, inline: element.playsInline,
    controls: element.controls, preload: element.preload,
  }));
  assert.equal(metadata.width, 1920);
  assert.equal(metadata.height, 1080);
  assert.ok(Math.abs(metadata.duration - 5.5) < .15);
  assert.deepEqual({ muted: metadata.muted, loop: metadata.loop, inline: metadata.inline, controls: metadata.controls, preload: metadata.preload }, { muted: true, loop: false, inline: true, controls: false, preload: "auto" });
  assert.equal(await page.locator("#root").evaluate(element => element.inert), true);
  assert.equal(await page.locator("#initial-loading-screen").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
  for (const [width, height, maximum] of [[1440,900,650], [768,1024,550], [390,844,400], [320,568,400], [844,390,550]]) {
    await page.setViewportSize({ width, height });
    const rect = await video.evaluate(element => element.getBoundingClientRect().toJSON());
    assert.ok(rect.width <= maximum && rect.width <= width && rect.height <= height);
    assert.ok(Math.abs(rect.width / rect.height - 16/9) < .01);
    assert.ok(Math.abs(rect.x + rect.width / 2 - width / 2) < 1);
    assert.ok(Math.abs(rect.y + rect.height / 2 - height / 2) < 1);
  }
  // Observe the real ended event: dismissing must not rely on a guessed duration.
  await page.evaluate(() => {
    const video = document.querySelector("#initial-loading-screen video");
    window.introEnded = false;
    video.addEventListener("ended", () => { window.introEnded = true; });
  });
  await page.locator("#initial-loading-screen.is-leaving").waitFor({ timeout: 12000 });
  assert.equal(await page.evaluate(() => window.introEnded), true);
  assert.equal(await page.locator("#initial-loading-screen").evaluate(element => getComputedStyle(element).transitionDuration), "0.6s");
  await page.locator("#initial-loading-screen").waitFor({ state: "detached" });
  assert.equal(await page.locator("#root").evaluate(element => element.inert), false);
  await page.locator(".nav-register").click();
  await page.waitForURL("**/registration");
  assert.equal(await page.locator("#initial-loading-screen").count(), 0);
  await page.reload();
  await page.locator("#initial-loading-screen").waitFor();
  await page.close();

  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  const videoRequests = [];
  reduced.on("request", request => { if (request.url().endsWith(".mp4")) videoRequests.push(request.url()); });
  await reduced.goto(base);
  await reduced.locator(".hero h1").waitFor();
  await reduced.locator("#initial-loading-screen").waitFor({ state: "detached" });
  assert.equal(await reduced.locator("#root").evaluate(element => element.inert), false);
  assert.deepEqual(videoRequests, []);
  await reduced.close();

  for (const scenario of ["blocked", "failed", "stalled", "motion-change", "admin", "preview"]) {
    const page = await browser.newPage();
    page.on("pageerror", error => errors.push(error.message));
    if (scenario === "blocked") await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Autoplay blocked", "NotAllowedError")); });
    if (scenario === "failed") await page.route("**/videos/*.mp4", route => route.abort());
    if (scenario === "stalled") {
      await page.clock.install();
      await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
    }
    const path = scenario === "admin" ? "/webdashadmin" : scenario === "preview" ? "/?preview=1" : "/";
    await page.goto(base + path);
    await page.locator("#root > *").first().waitFor({ state: "attached" });
    if (scenario === "stalled") {
      await page.waitForFunction(() => document.querySelector("#root").inert);
      await page.clock.runFor(10700);
    }
    if (scenario === "motion-change") {
      await page.waitForFunction(() => document.querySelector("#root").inert);
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    await page.locator("#initial-loading-screen").waitFor({ state: "detached", timeout: 6000 });
    assert.equal(await page.locator("#root").evaluate(element => element.inert), false, scenario);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log("Passed: original video playback, responsive centering, ended-driven 600ms fade, navigation/reload, reduced motion, autoplay/error/stall fallbacks, admin and preview bypasses.");
} finally {
  await browser.close();
}
