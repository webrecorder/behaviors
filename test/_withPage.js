const puppeteer = require('puppeteer');

export default async (t, run) => {
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage({
    waitUntil: 'networkIdle'
  });
  try {
    await run(t, page);
  } finally {
    await page.close();
    await browser.close();
  }
}
