const chromium = require("chrome-aws-lambda");

const targetUrl = "https://store.google.com/us/config/pixel_5";

const elementSelector = `button[aria-label*="Google Fi (Unlocked)"] .mqn-h-cards-carrier__card__availability.ng-binding.ng-scope.mqn-h-cards-carrier__card__availability--out-of-stock`;

let browser, page;

exports.handler = async (event, context) => {
  await initializePage();

  const inStock = await checkStock();

  await browser.close();

  return {
    statusCode: 200,
    body: JSON.stringify({
      inStock,
    }),
  };
};

const initializePage = async () => {
  browser = await chromium.puppeteer.launch({
    executablePath: await chromium.executablePath,
    args: chromium.args,
    headless: true,
  });

  page = await browser.newPage();
};

const checkStock = async () => {
  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  // const screenshot = await page.screenshot({
  //   encoding: "binary",
  //   fullPage: true,
  // });

  const targetElement = await page.$(elementSelector);

  return !!targetElement;
};
