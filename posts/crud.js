"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const model = require("./model-firestore");
const images = require("../lib/images");

const router = express.Router();

// Automatically parse request body as form data
router.use(bodyParser.urlencoded({ extended: false }));

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
  res.set("Content-Type", "text/html");
  next();
});

/**
 * GET /posts
 *
 * Display a page of posts (up to ten at a time).
 */
router.get("/", async (req, res) => {
  const posts = await model.list(10, req.query.pageToken) 
    
    res.render("index", {
      list: 'list',
      posts: posts,
      // nextPageToken: cursor
    });
});

/**
 * GET /posts/add
 *
 * Display a form for creating a post.
 */
// [START add_get]
router.get("/add", (req, res) => {
  res.render("index", {
    form: 'form',
    post: {},
    action: "Add"
  });
});
// [END add_get]

/**
 * POST /posts/add
 *
 * Create a post.
 */
// [START add_post]
router.post(
  "/add",
  images.multer.single("image"),
  images.sendUploadToGCS,
  async (req, res) => {
    const data = req.body;
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }

    // Save the data to the database.
    const ref = await model.create(data)

    res.redirect(`${req.baseUrl}/${ref.id}`);
  }
);
// [END add_post]

/**
 * GET /posts/:id/edit
 *
 * Display a post for editing.
 */
router.get("/:post/edit", async (req, res) => {
  const post = await model.read(req.params.post)
  res.render("index", {
      form: 'form',
      post: post,
      action: "Edit"
  });
});

/**
 * POST /posts/:id/edit
 *
 * Update a post.
 */
router.post(
  "/:post/edit",
  images.multer.single("image"),
  images.sendUploadToGCS,
  async (req, res) => {
    const data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    const ref = await model.update(req.params.post, data)
    res.redirect(`${req.baseUrl}/${ref.id}`);
  }
);

/**
 * GET /posts/:id
 *
 * Display a post.
 */
router.get("/:post", async (req, res) => {
  const post = await model.read(req.params.post) 
  
  await model.findRead(post.data.symbol)
  res.render("index", {
      view: 'view',
      post: post
  });
});

/**
 * GET /posts/:id/delete
 *
 * Delete a post.
 */
router.get("/:post/delete", async (req, res, next) => {
  await model.delete(req.params.post)
  res.redirect(req.baseUrl);
});

module.exports = router;
