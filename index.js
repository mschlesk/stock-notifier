const chromium = require("chrome-aws-lambda");

const targetUrl = "https://store.google.com/us/config/pixel_5";

let browser, page;

exports.handler = async (event, context) => {
  const puppeteer = chromium.puppeteer;

  initializePage();

  const screenshot = await checkStock();

  browser.close();

  return {
    statusCode: 200,
    body: JSON.stringify({
      buffer: screenshot,
    }),
  };
};

const initializePage = async () => {
  browser = await puppeteer.launch({
    executablePath: await chromium.executablePath,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
  });

  page = browser.newPage();
};

const checkStock = async () => {
  await page.goto(targetUrl);

  const screenshot = await page.screenshot({ encoding: "binary" });

  return screenshot;
};
