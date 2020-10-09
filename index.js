const chromium = require("chrome-aws-lambda");

const DEBUG = true;

const targetUrl = "https://store.google.com/us/config/pixel_5",
  carrierCardSelector =
    'button[aria-label*="Google Fi (Unlocked)"].mqn-h-cards-carrier__card.ng-scope',
  modelCardSelector = "div.mqn-lobby-swatch__card__meta",
  modelNameSelector = "div.mqn-lobby-swatch__card__headline",
  targetModelName = "Sorta Sage",
  modelStockSelector = "div.mqn-lobby-swatch__card__availability--out-of-stock";

let browser, page;

exports.handler = async (event, context) => {
  let err,
    inStock,
    statusCode = 200;

  try {
    await initializePage();

    inStock = await checkStock();
  } catch (e) {
    console.error(e);
    err = e;
    statusCode = 500;
  } finally {
    await browser.close();
  }

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
  console.log(`Navigating to page at ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  console.log("Querying page for carrier card element...");
  const targetElement = await page.$(carrierCardSelector);

  if (!targetElement)
    throw new Error(
      `Failed to find carrier card using selector ${carrierCardSelector}`
    );

  DEBUG &&
    (await targetElement.screenshot({
      path: "screenshots/1-carrierCard.png",
    }));

  // Is the carrier button disabled?
  const carrierDisabled = await targetElement.evaluate((node) => node.disabled);
  if (carrierDisabled) {
    console.log("No stock for carrier");
    return false;
  }

  console.log("Stock exists for carrier, selecting carrier...");
  await targetElement.click();
  await page.waitForSelector(modelCardSelector);
  await targetElement.dispose();

  DEBUG &&
    (await page.screenshot({
      path: "screenshots/2-modelsPage.png",
      fullPage: true,
    }));

  // Select model cards
  const models = await page.$$(modelCardSelector);
  console.log(`Models found: ${models.length}`);
  if (!models.length)
    throw new Error(
      `Failed to find model card using selector ${modelCardSelector}`
    );

  // Filter down to "Sorta Sage" model card
  const targetModel = await models.reduce(async (acc, model) => {
    if (!!acc) return acc;
    const modelName = await model.$eval(
      modelNameSelector,
      (node) => node.innerText
    );
    console.log(modelName);
    return !!modelName && modelName.includes(targetModelName) ? model : null;
  }, null);

  if (!targetModel)
    throw new Error(
      `Failed to find model matching model name ${targetModelName}`
    );

  DEBUG &&
    (await targetModel.screenshot({
      path: "screenshots/3-modelCard.png",
    }));

  const inStock = await !targetModel.$(modelStockSelector);

  if (inStock) console.log("Target model is in stock!");

  return inStock;
};
