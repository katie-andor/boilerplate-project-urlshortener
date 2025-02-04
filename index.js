require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlparser = require('url');

const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("urlshortener")
const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function (req, res) {
  console.log(req.body);

  const url = req.body.url;
  if (!url) {
    return res.json({ error: "invalid url" });
  }

  let hostname;
  try {
    hostname = urlparser.parse(url).hostname;
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  if (!hostname) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(hostname, async (err, address) => {
    if (err || !address) {
      return res.json({ error: "invalid url" });
    }

    const urlCount = await urls.countDocuments({});
    const urlDoc = {
      url,
      short_url: urlCount,
    };

    const result = await urls.insertOne(urlDoc);
    console.log(result);

    res.json({
      original_url: url,
      short_url: urlCount,
    });
  });
});


app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = req.params.short_url
  const urlDoc = await urls.findOne({
    short_url: +shorturl
  })
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
