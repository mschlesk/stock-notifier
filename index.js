const chromium = require("chrome-aws-lambda");

const targetUrl = "https://store.google.com/us/config/pixel_5";

let browser, page;

exports.handler = async (event, context) => {
console.log(`chromium.headless: ${chromium.headless}`);

  await initializePage();

  const screenshot = await checkStock();

  await browser.close();

  return {
    statusCode: 200,
    body: JSON.stringify({
      buffer: screenshot,
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
  await page.goto(targetUrl);

  const screenshot = await page.screenshot({ encoding: "binary" });

  return screenshot;
};
