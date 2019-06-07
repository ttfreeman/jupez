
const puppeteer = require('puppeteer');
const {Storage} = require('@google-cloud/storage');
const keys = require('../config/keys')
const width = 1920;
const height = 1080;
const htmlBucket = keys.storageBucketScrapedHtml;
const screenshotBucket = keys.storageBucketScrapedScreenshot;

let gcs;

const scrape = async (url) => {
  // const url = req.query.url || req.body.url;
  if (!url) {
    console.error('URL to scrape not specified')
    return res.status(400).send('Please specify URL to scrape');
  }
  console.log('Processing this url: ', url);
  
  let page;
  try {
    page = await loadPage(url);

    const imageBuffer = await page.screenshot({fullPage: true});
    options = createUploadOptions('image/png', page.url());
    const filename = new Date().toISOString();
    console.log(filename);
    
    await writeToGcs(screenshotBucket, filename, imageBuffer, options);

    const html = await page.content();
    options = createUploadOptions('text/html', page.url());
    await writeToGcs(htmlBucket, filename, html, options);

    return {
      url: page.url,
      filename: filename
    };
  } catch (e) {
    console.error('Caught Error: '+e);
  //   res.status(500).send(e);
  } finally {
    if (page) {
      await page.browser().close();
    }
  }
}


async function writeToGcs(bucketName, filename, content, options) {
  
  gcs = gcs || new Storage();
  const bucket = gcs.bucket(bucketName);
  const file = bucket.file(filename);
  const gcs_filename = `gs://${bucket.name}/${file.name}`

  const stream = file.createWriteStream(options);
  return new Promise((resolve, reject) => {
    stream.end(content);
    stream.on('error', (err) => {
      console.error('Error writing GCS file: ' + err);
      reject(err);
    });
    stream.on('finish', () => {
      console.log('Created object: '+gcs_filename);
      resolve(200);
    });
  });
}


async function loadPage(url) {
  // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', `--window-size=${width},${height}`]
  });
  const page = await browser.newPage();
  console.log('Fetching url: '+url)
  await page.goto(url, {
    'waitUntil' : 'networkidle0'
  });
  return page;
}


function createUploadOptions(contentType, url) {
  return {
    resumable: false,
    metadata: {
      contentType: contentType,
      metadata: {
        scrapedUrl: url,
      }
    }
  };
}

module.exports= scrape
