"use strict";

const path = require("path");
const express = require("express");
const hbs = require('hbs')
const bodyParser = require("body-parser");
const scrape = require('./lib/scrape')

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
// Setup handlebars engine and views 
app.disable("etag");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views/partials"))
app.set("view engine", "hbs");
app.set("trust proxy", true);

// Redirect root to /posts
app.get("/", (req, res) => {
  res.redirect("/posts");
});

// Scrape manager
app.get("/scrape", (req, res) => {
  res.render("scrape");
});

// Scraper
app.post("/scrape", (req, res) => {
  const data= req.body
  
  const url = data.url || "https://cloud.google.com/docs/tutorials"
  scrape(url);
  res.redirect(`/scrape`);
});

// posts
app.use("/posts", require("./posts/crud"));
app.use("/api/posts", require("./posts/api"));

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || "Something broke!");
});

if (module === require.main) {
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("jupez app listening on " + PORT));
}

module.exports = app;
