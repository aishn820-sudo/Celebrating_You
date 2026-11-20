import { chromium } from "playwright";

async function test() {
  console.log("Launching browser via Playwright...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  console.log("Browser launched successfully!");
  const page = await browser.newPage();
  await page.setContent("<h1>Celebrating YOU Test</h1>");
  const title = await page.textContent("h1");
  console.log("Page rendered:", title);
  await browser.close();
  console.log("Browser closed cleanly.");
}

test().catch(console.error);
