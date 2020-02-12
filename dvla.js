const puppeteer = require('puppeteer');
const { getChrome } = require('./chrome-script');
const pageUrl = 'https://www.driver.codes/timdl2.htm?cachebust=1';
const moment = require('moment');

module.exports.hello = async (event) => {
  try {
    const chrome = await getChrome();
    const browser = await launchBrowser(chrome);
    const page = await launchPage(browser);
    await page.setJavaScriptEnabled(false);
    
    await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded'
    });

    const responseData = {};  
    responseData.licenceData = {
      name: await page.$eval('dd.name', (el => el.innerHTML)),
      dob: await page.$eval('dd.dob-field', (el => el.innerHTML)),
      gender: await page.$eval('dd.gender-field', (el => el.innerHTML)),
      address: await await page.evaluate(() => document.querySelector('dd.address-field').childNodes[0].nodeValue.trim().replace(/(\r\n|\n|\r)/gm,'')),
      postcode: await page.$eval('dd.address-field > span', (el => el.innerText)),
      licenceStatus: await page.$eval('dd.licence-status-field', (el => el.innerHTML)),
      licenceValidFrom: await page.$eval('dd.licence-valid-from-field', (el => el.innerHTML)),
      licenceValidTo: await page.$eval('dd.licence-valid-to-field', (el => el.innerHTML)),
      licenceIssueNo: await page.$eval('dd.issue-number-field', (el => el.innerHTML)),
    };

    responseData.fullResponse = [];
    const selectors = await page.$$('#fullEntitlements > li');
    for (let i = 0; i < selectors.length; i++) {
      const fullResponse = {
        fullCategoryCode: await selectors[i].$eval('div.accordion-group > a', (el => el.getAttribute('href'))),
        fullCategory: await selectors[i].$eval('div.accordion-group > a > div > div > ul > li.category', (el => el.innerText)),
        fullValidFrom: await selectors[i].$eval('div.accordion-group > a > div > div > ul > li:nth-child(2)', (el => el.innerText)),
        fullValidTo: await selectors[i].$eval('div.accordion-group > a > div > div > ul > li:nth-child(3)', (el => el.innerText)),
        description: await selectors[i].$eval('ul > li.description > p', (el => el.innerText)),
      };
      responseData.fullResponse.push(fullResponse);
    };

    responseData.provisionalResponse = [];
    const provselectors = await page.$$('#provEntitlements > li ');
    for (let i = 0; i < provselectors.length; i++) {
      const provisionalResponse = {
        provCategoryCode: await provselectors[i].$eval('div.accordion-group > a', (el => el.getAttribute('href'))),
        provCategory: await provselectors[i].$eval('div.accordion-group > a > div > div > ul > li.category', (el => el.innerText)),
        provValidFrom: await provselectors[i].$eval('div.accordion-group > a > div > div > ul > li:nth-child(2)', (el => el.innerText)),
        provValidTo: await provselectors[i].$eval('div.accordion-group > a > div > div > ul > li:nth-child(3)', (el => el.innerText)),
        provDescription : await page.$eval('ul > li.description > p', (el => el.innerText)),
      };
      responseData.provisionalResponse.push(provisionalResponse);
    };

    responseData.pointsResponse = [];
    const pointselectors = await page.$$('#penaltyPoints > li ');
    for (let i = 0; i < pointselectors.length; i++) {
      const pointsResponse = {
        pointCategory: await pointselectors[i].$eval('div.accordion-group > a > div > ul > li.category', (el => el.innerText)),
        pointsGiven: await pointselectors[i].$eval('div.accordion-group > a > div > ul > li.points', (el => el.innerText)),
        pointsOffenceDate: await pointselectors[i].$eval('div.accordion-group > a > div > ul > li.offence-date', (el => el.innerText)),
        pointsExpiryDate: await page.$eval('#pen0 > ul > li.offence-dates > ul > li:nth-child(2)', (el => el.innerText)),
        pointsRemovalDate: await page.$eval('#pen0 > ul > li.offence-dates > ul > li:nth-child(3)', (el => el.innerText)),
        pointsOffice: await page.$eval('#pen0 > ul > li.offence-court > p', (el => el.innerText)),
        pointsReason: await page.$eval('#pen0 > ul > li.offence-details > ul > li:nth-child(1)', (el => el.innerText)),
      };

      responseData.pointsResponse.push(pointsResponse);
    };

    let response = {
      statusCode: 200,
      headers: {
          "x-custom-header" : "Data provided for DriverCodes app via DVSA"
      },
      body: JSON.stringify(responseData),
    };
    await page.close();
    await browser.close();

    return response;
  } catch (error) {
    console.log('Scraping Error: ', error);
    const errorPage = { 
      make: "not found"
    };
    
    let errorOutput = {
      statusCode: 200,
      headers: {
        "x-custom-header" : "Data provided for DriverCodes app via DVSA"
      },
      body: JSON.stringify(errorPage)
    };

    return errorOutput;
  }
}


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
        '--no-sandbox',
        '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3803.0 Safari/537.36',
        '--lang=en-US,en;q=0.9',
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