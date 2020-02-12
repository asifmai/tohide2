const puppeteer = require('puppeteer');
const { getChrome } = require('./chrome-script');
const url = 'https://www.check-mot.service.gov.uk/';
const moment = require('moment');


 module.exports.hello = async (event) => {
  try {
    const { regNumber } = event.queryStringParameters;
    const chrome = await getChrome();
    const browser = await launchBrowser(chrome);
    const page = await launchPage(browser);
    await page.goto(url, {timeout: 0, waitUntil: 'load'});
   // let bodyHTML = await page.evaluate(() => document.body.outerHTML);
    const regNum = regNumber;

   // await page.waitForSelector('input[type="text"]:not([aria-hidden])');
    await page.$x('//input[contains(@type, "text") and not(@aria-hidden="true")]');
    const inputField = await page.$('input[type="text"]:not([aria-hidden])');
    await inputField.type(regNum);
    await page.keyboard.press('Enter');

    await page.waitForNavigation({timeout: 0, waitUntil: 'load'});
   
    const pageData = {
      make: await page.evaluate(() => document.querySelector('h1.heading-xlarge').childNodes[2].nodeValue.trim().replace(/(\r\n|\n|\r)/gm,'')),
      colour: await page.evaluate(() => document.querySelector('.column-full .grid-row:first-of-type > .column-one-third:first-child > h2').childNodes[2].nodeValue.trim().replace(/(\r\n|\n|\r)/gm,'')),
      fuelType: await page.evaluate(() => document.querySelector('.column-full .grid-row:first-of-type > .column-one-third:nth-child(2) > h2').childNodes[2].nodeValue.trim().replace(/(\r\n|\n|\r)/gm,'')),
      dateRegistered: await page.evaluate(() => document.querySelector('.column-full .grid-row:first-of-type > .column-one-third:last-child > h2').childNodes[2].nodeValue.trim().replace(/(\r\n|\n|\r)/gm,'')),
      motUntil: await page.evaluate(() => document.querySelector('h2.heading--large').childNodes[2].nodeValue.trim().replace(/(\r\n|\n|\r)/gm,'')),
    };
    console.log(pageData);
    
    let response = {
        statusCode: 200,
        headers: {
            "x-custom-header" : "Data provided for DriverCodes app via DVSA"
        },
        body: JSON.stringify(pageData)
    };
    return response;
    
    await page.close();
    await browser.close();

 

  } catch (error) {
    console.log(dt(), 'Scraping Error: ', error);
    const errorPage = { 
       make: "not found" };
    
    let erroroutput = {
      statusCode: 200,
      headers: {
            "x-custom-header" : "Data provided for DriverCodes app via DVSA"
        },
      body: JSON.stringify(errorPage)
    };

    return erroroutput;
  }
};

const launchPage = (browser) => new Promise(async (resolve, reject) => {
  try {
    const page = await browser.newPage();
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36';
    await page.setUserAgent(userAgent);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });
    console.log(dt(), 'Launched Page');
    resolve(page);
  } catch (error) {
    console.log(dt(), 'Launch Page Error: ', error)
    reject(error);
  }
});

const launchBrowser = (chrome) => new Promise(async (resolve, reject) => {
  try {
     const browser = await puppeteer.connect({
      browserWSEndpoint: chrome.endpoint,
      headless: false,
      args: [
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
      ],
      ignoreHTTPSErrors: true,

      defaultViewport: null,
    });
    console.log(dt(), 'Launched Browser');
    resolve(browser);
  } catch (error) {
    console.log(dt(), 'Browser Launch Error: ', error);
    reject(error);
  }
});

const dt = () => {
  return moment().format('YYYY-MM-DD HH:mm:ss') + ' -';
}

