import assert from "node:assert/strict";
import { chromium } from "playwright";

// Run against npm start (or set RIJNMUN_TEST_URL to a local production preview).
const base = process.env.RIJNMUN_TEST_URL || "http://localhost:4173";
const routes = ["/", "/rijnmun-2026", "/committees", "/programme", "/board", "/speakers", "/venue", "/registration", "/resources", "/contact", "/news", "/archive", "/webdashadmin"];
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    for (const route of routes) {
      await page.goto(base + route);
      await page.locator("h1").first().waitFor({ state: "attached" });
      await page.waitForTimeout(100);
      const layout = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        images: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src),
      }));
      assert.ok(layout.width <= width + 1, `${route} overflows at ${width}px: ${layout.width}`);
      assert.deepEqual(layout.images, [], `Missing images on ${route}`);
    }
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/committees#sc");
  const selected = page.getByRole("tab", { selected: true });
  await selected.waitFor();
  assert.match(await selected.innerText(), /SC/);
  await selected.focus();
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("tab", { name: /HRC/ }).waitFor();
  assert.match(await page.getByRole("tab", { selected: true }).innerText(), /HRC/);
  await page.keyboard.press("Home");
  assert.match(await page.getByRole("tab", { selected: true }).innerText(), /GA1/);
  await page.getByRole("button", { name: "Open menu" }).click();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close menu");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("href")), "/registration");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close menu");
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Open menu");
  await page.goto(base + "/programme");
  await page.evaluate(() => window.postMessage({ type: "rijnmun-preview", content: {
    programme: { notice: "Updated Secretariat notice", days: [{ id: "qa-day", label: "DAY 01", date: "Updated conference day", events: [{ id: "qa-event", time: "09:00–10:30", title: "Updated opening session", note: "Room A" }] }] },
  } }, window.location.origin));
  await page.getByRole("heading", { name: "Updated opening session" }).waitFor();
  assert.equal(await page.locator(".events time").innerText(), "09:00–10:30");
  assert.match(await page.locator(".programme-note").innerText(), /Updated Secretariat notice/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Updated timetable overflows");

  // Exercise the same-origin preview bridge and image overrides without saving data.
  await page.goto(base + "/");
  assert.equal(await page.locator(".hero-image").evaluate(element => getComputedStyle(element).transform), "none");
  await page.goto(base + "/committees");
  assert.ok(await page.locator(".page-hero > img").getAttribute("srcset"), "Responsive sources missing");
  const key = await page.locator(".page-hero > img").evaluate(element => {
    const parts = [];
    for (let node = element; node && node.tagName !== "BODY"; node = node.parentElement) {
      const siblings = [...node.parentElement.children].filter(sibling => sibling.tagName === node.tagName);
      parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(node) + 1})`);
    }
    return `/committees::${parts.join(">")}`;
  });
  await page.evaluate(key => window.postMessage({ type: "rijnmun-preview", content: {
    visual: { [key]: { type: "image", value: "/images/rijnmun-photo2.webp", alt: "Edited photograph" } },
  } }, window.location.origin), key);
  await page.locator('.page-hero > img[alt="Edited photograph"]').waitFor();
  assert.equal(await page.locator(".page-hero > img").getAttribute("srcset"), null);
  await page.goto(base + "/resources");
  for (const href of await page.locator('a[href$=".pdf"]').evaluateAll(links => links.map(link => link.getAttribute("href")))) {
    assert.equal((await page.request.get(base + href)).status(), 200, `Missing document ${href}`);
  }
  await page.goto(base + "/contact");
  assert.match(await page.title(), /Contact/);
  assert.match(await page.locator('meta[property="og:title"]').getAttribute("content"), /Contact/);
  await page.evaluate(() => {
    window.previewSelection = null;
    window.addEventListener("message", event => {
      if (event.origin === window.location.origin && event.data?.type === "rijnmun-preview-select") window.previewSelection = event.data;
    });
    const iframe = document.createElement("iframe");
    iframe.id = "qa-preview";
    iframe.src = "/programme";
    iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:300;background:white";
    document.body.append(iframe);
  });
  const preview = page.frameLocator("#qa-preview");
  await preview.locator("h1[data-visual-key]").waitFor();
  await page.evaluate(() => document.querySelector("#qa-preview").contentWindow.postMessage({ type: "rijnmun-editor-mode", mode: "edit" }, window.location.origin));
  await preview.locator("body.visual-edit-mode").waitFor();
  await preview.locator("h1").click();
  await page.waitForFunction(() => window.previewSelection?.tag === "h1");
  assert.equal(await page.evaluate(() => window.previewSelection.path), "/programme");
  await page.evaluate(() => document.querySelector("#qa-preview").contentWindow.postMessage({ type: "rijnmun-preview", content: { programme: { notice: "Iframe preview updated", days: [] } } }, window.location.origin));
  await preview.getByText("Iframe preview updated").waitFor();
  await page.evaluate(() => document.querySelector("#qa-preview").remove());
  await page.route("**/api/public/albums", route => route.fulfill({ json: [{ id: "qa-album", title: "Conference photographs", year: "2026", description: "Conference moments", photos: [{ id: "qa-photo", src: "/images/rijnmun-photo1.webp", alt: "Delegates preparing", caption: "Committee preparation" }] }] }));
  await page.goto(base + "/archive");
  await page.getByRole("button", { name: /Conference photographs/ }).click();
  await page.locator(".album-title h1").waitFor();
  assert.ok(await page.locator(".album-page > header").evaluate(element => element.getBoundingClientRect().top >= 70), "Album controls obscured by navigation");
  await page.getByRole("button", { name: "All albums" }).click();
  await page.getByRole("button", { name: /Conference photographs/ }).waitFor();
  await page.goto(base + "/webdashadmin");
  assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "noindex, nofollow");
  assert.deepEqual(errors, [], "Browser errors");
  console.log(`Passed: ${routes.length} routes at 7 widths, committee links and keyboard navigation, mobile focus trap, live timetable and image previews, iframe editing, albums, reduced motion, documents and metadata.`);
} finally {
  await browser.close();
}
