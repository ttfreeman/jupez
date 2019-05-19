"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const model = require("./model-datastore");
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
router.get("/", (req, res, next) => {
  model.list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.render("posts/list.pug", {
      posts: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * GET /posts/add
 *
 * Display a form for creating a post.
 */
// [START add_get]
router.get("/add", (req, res) => {
  res.render("posts/form.pug", {
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
  (req, res, next) => {
    const data = req.body;
    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }

    // Save the data to the database.
    model.create(data, (err, savedData) => {
      if (err) {
        next(err);
        return;
      }

      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
  }
);
// [END add_post]

/**
 * GET /posts/:id/edit
 *
 * Display a post for editing.
 */
router.get("/:post/edit", (req, res, next) => {
  model.read(req.params.post, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render("posts/form.pug", {
      post: entity,
      action: "Edit"
    });
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
  (req, res, next) => {
    const data = req.body;

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    model.update(req.params.post, data, (err, savedData) => {
      if (err) {
        next(err);
        return;
      }
      res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
  }
);

/**
 * GET /posts/:id
 *
 * Display a post.
 */
router.get("/:post", (req, res, next) => {
  model.read(req.params.post, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.render("posts/view.pug", {
      post: entity
    });
  });
});

/**
 * GET /posts/:id/delete
 *
 * Delete a post.
 */
router.get("/:post/delete", (req, res, next) => {
  model.delete(req.params.post, err => {
    if (err) {
      next(err);
      return;
    }
    res.redirect(req.baseUrl);
  });
});

/**
 * Errors on "/posts/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
