const puppeteer = require('puppeteer');

module.exports = async (t, run) => {
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    args: [ '--proxy-server=http://127.0.0.1:8080' ]
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
