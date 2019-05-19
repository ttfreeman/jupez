"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const model = require("./model-datastore");

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/posts
 *
 * Retrieve a page of posts (up to ten at a time).
 */
router.get("/", (req, res, next) => {
  model.list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.json({
      items: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * POST /api/posts
 *
 * Create a new post.
 */
router.post("/", (req, res, next) => {
  model.create(req.body, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.json(entity);
  });
});

/**
 * GET /api/posts/:id
 *
 * Retrieve a post.
 */
router.get("/:post", (req, res, next) => {
  model.read(req.params.post, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.json(entity);
  });
});

/**
 * PUT /api/posts/:id
 *
 * Update a post.
 */
router.put("/:post", (req, res, next) => {
  model.update(req.params.post, req.body, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.json(entity);
  });
});

/**
 * DELETE /api/posts/:id
 *
 * Delete a post.
 */
router.delete("/:post", (req, res, next) => {
  model.delete(req.params.post, err => {
    if (err) {
      next(err);
      return;
    }
    res.status(200).send("OK");
  });
});

/**
 * Errors on "/api/posts/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
