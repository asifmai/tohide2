const puppeteer = require('puppeteer');



(async () => {

  // Create an instance of the chrome browser

  const browserOpts = {

    headless: false,

    args: [

      '--no-sandbox',

      '--disable-setuid-sandbox',

      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3803.0 Safari/537.36',

      // THIS IS THE KEY BIT!

      '--lang=en-US,en;q=0.9',

    ],

  };



  const browser = await puppeteer.launch(browserOpts);


  function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time)
    });
  }
  // Create a new page


  const page = await browser.newPage();

  // Disable Javascript to overcome f/e anti-bot

  await page.setJavaScriptEnabled(false);

  // Navigate to DVSA website

  //  await page.goto('https://www.viewdrivingrecord.service.gov.uk/driving-record/licence-number',{waitUntil: 'domcontentloaded'});

  // Static for now ,  timdl.html has single array of points,  timdl2.html has 2 sets of points.

  await page.goto('https://www.driver.codes/timdl2.htm?cachebust=1', {
    waitUntil: 'domcontentloaded'
  });

  //   await page.waitFor('input[name=dln]');
  //   await page.$eval('input[name=dln]', el => el.value = 'BLAH'); 
  //   await page.$eval('input[name=nino]', el => el.value = 'FOO');
  //   await page.$eval('input[name=postcode]', el => el.value = 'BAR');
  //   const terms = await page.$('#dwpPermission');
  //   await terms.evaluate( terms => terms.click() ); 
  //   anti-bot delay of 10 seconds required
  //   await delay(10000);
  //   const form = await page.$('#submitDln');
  //   await form.evaluate( form => form.click() );


  // page returned
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

  console.log(responseData)
  // build the response around a try catch
  // to do -  I need to output this in a way that lambda can return it.  Refer to my other script for syntax.




  // Close Browser

  browser.close();


})();