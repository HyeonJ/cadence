const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  await page.goto('file:///C:/Dev/Workspace/coach-harness-design-demo/today-hybrid.html');
  await page.waitForTimeout(2500);
  console.log('CONSOLE_ERRORS:' + errors.length);
  if (errors.length) errors.forEach(e => console.log('  ' + e));
  await browser.close();
})();
