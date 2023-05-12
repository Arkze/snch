const express = require("express")
const path = require("path")
const multer = require("multer")
const cp = require('child_process')
const bodyParser = require('body-parser');
const cryptoJs = require("crypto-js");
const fs = require('fs')


const app = express()

let hashedFileNameJson = '';

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true }));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads")
  },
  filename: function (req, file, cb) {
    createFileTimestamp = Date.now();
    const hashedFileName = cryptoJs.MD5(file.fieldname + "-" + createFileTimestamp);
    hashedFileNameJson = `${hashedFileName}.json`
    cb(null, hashedFileNameJson)
  }
})

const maxSize = 1024 * 10000

var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {

    var filetypes = /json/;
    var mimetype = filetypes.test(file.mimetype);

    var extname = filetypes.test(path.extname(
      file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb("Error: File upload only supports the "
      + "following filetypes - " + filetypes);
  }

}).single("snyk");

app.get("/", function (req, res) {
  res.render("index");
})

app.post("/uploadJson", function (req, res, next) {

  upload(req, res, function (err) {

    if (err) {
      res.send(err)
    }
    else {
      res.send(`Success, JSON Uploaded at ${hashedFileNameJson} !`)
    }
  })
})


app.post("/renderHtml", (req, res) => {
  
  if (req.body.nameFile.match(/^[a-f0-9]{1,64}$/i)) {
    outputPath = `snyk-render-${req.body.nameFile}.html`

    const hashedOutputPath = cryptoJs.MD5(`snyk-render-${req.body.nameFile}.html`);

    const renderResults = cp.spawnSync(
      'snyk-to-html',
      ['--input', `./uploads/${req.body.nameFile}.json`,
        '--output', `./scansHtml/${hashedOutputPath}.html`],
      {
        encoding: 'utf-8',
      },
    );

    console.log(renderResults)
    if (renderResults.stdout.includes('no such file or directory')) {
      res.send(`Cannot find file`)
    }
    if (renderResults.stdout.includes('not a valid json')) {
      res.send(`Error rendering to HTML, invalid JSON `)
    }
    else {
      res.send(`Success, JSON rendered at ${hashedOutputPath}.html !`)
    }
    fs.rmSync(`./uploads/${req.body.nameFile}.json`)
    fs.chmodSync(`./scansHtml/${hashedOutputPath}.html`, 0o777)
  }
})

app.get('/my-render', function (req, res) {
  if (req.query.nameRender.match(/^[a-f0-9]{1,64}$/i)) { 
    res.sendFile(path.join(__dirname, `./scansHtml/${req.query.nameRender}.html`));
  }
});

app.listen(80, function (error) {
  if (error) throw error
  console.log("Server created Successfully on PORT 80")
})

// docker compose besoin volume partagé pour que le puppeteer 
// ait accès partagé au webserver/fichier