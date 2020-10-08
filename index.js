const chromium = require('chrome-aws-lambda')

exports.handler = async (event, context) => {
  const puppeteer = chromium.puppeteer

  const browser = await puppeteer.launch()
}
