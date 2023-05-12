
const puppeteer = require('puppeteer')
const fs = require("fs");


async function getFilesInDirectory(directoryPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

async function main() {
  const files = await getFilesInDirectory("/data");

  console.log(files);
  await new Promise(r => setTimeout(r, 1000));


  for (const file of files) {
    console.log(file)
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: "new" });
    const page = await browser.newPage();
    const fileNoHtmlExt = file.split('.')[0]
    const url = `http://172.20.0.2/my-render?nameRender=${fileNoHtmlExt}`;

    console.log(fileNoHtmlExt)
    try {
      console.log(url);

      await page.setUserAgent('FLAG');
      await page.goto(url);
      await page.waitForNavigation({waitUntil: 'networkidle2' ,timeout: 5000});

    }
    catch (err) {
      console.log("ERROR")
      console.log(err)
    }
    finally {
      console.log("FINALLY")
      fs.rmSync(`/data/${file}`);
      await browser.close()
    }
  }
}


main();
