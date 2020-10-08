const chromium = require('chrome-aws-lambda')

exports.handler = async (event, context) => {
  const puppeteer = chromium.puppeteer

  const exePath = await chromium.executablePath

  console.log(exePath)

  const browser = await puppeteer.launch({
    executablePath: exePath,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
  })
}
