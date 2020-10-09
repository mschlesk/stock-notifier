const chromium = require("chrome-aws-lambda");

const config = {
  targetUrl: "https://store.google.com/us/config/pixel_5",
  targetModelName: "Sorta Sage",
  selectors: {
    carrierCardSelector:
      'button[aria-label*="Google Fi (Unlocked)"].mqn-h-cards-carrier__card.ng-scope',
    modelCardSelector: "div.mqn-lobby-swatch__card__meta",
    modelNameSelector: "div.mqn-lobby-swatch__card__headline",
    modelStockSelector:
      "div.mqn-lobby-swatch__card__availability--out-of-stock",
  },
};

let browser, page, isLocal;

exports.handler = async (event) => {
  isLocal = !event;

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
    await page.close();
    await browser.close();
  }

  return {
    statusCode,
    body: JSON.stringify({
      inStock,
      err,
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
  console.log(`Navigating to page at ${config.targetUrl}`);
  await page.goto(config.targetUrl, { waitUntil: "networkidle2" });

  console.log("Querying page for carrier card element...");
  const targetElement = await page.$(config.selectors.carrierCardSelector);

  if (!targetElement)
    throw new Error(
      `Failed to find carrier card using selector ${config.selectors.carrierCardSelector}`
    );

  isLocal &&
    (await targetElement.screenshot({
      path: "screenshots/1-carrierCard.png",
    }));

  // Is the carrier button disabled?
  if (await targetElement.evaluate((node) => node.disabled)) {
    console.log("No stock for carrier");
    return false;
  }

  console.log("Stock exists for carrier, selecting carrier...");
  await targetElement.click();
  await page.waitForSelector(config.selectors.modelCardSelector);
  await targetElement.dispose();

  isLocal &&
    (await page.screenshot({
      path: "screenshots/2-modelsPage.png",
      fullPage: true,
    }));

  // Select model cards
  const models = await page.$$(config.selectors.modelCardSelector);
  console.log(`Models found: ${models.length}`);
  if (!models.length)
    throw new Error(
      `Failed to find model card using selector ${config.selectors.modelCardSelector}`
    );

  // Filter down to "Sorta Sage" model card
  for (const model of models) {
    const modelName = await model.$eval(
      config.selectors.modelNameSelector,
      (node) => node.innerText
    );
    console.log(`Found model "${modelName}"`);
    if (!!modelName && modelName.includes(config.targetModelName)) {
      targetModel = model;
      break;
    }
  }

  if (!targetModel)
    throw new Error(
      `Failed to find model matching model name ${config.targetModelName}`
    );

  isLocal &&
    (await targetModel.screenshot({
      path: "screenshots/3-modelCard.png",
    }));

  const inStock = await !targetModel.$(config.selectors.modelStockSelector);
  await targetModel.dispose();

  if (inStock) console.log("Target model is in stock!");

  return inStock;
};
