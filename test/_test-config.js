"use strict";

const path = require(`path`);

const TESTNAME = `cloud-storage-cloustore`;
const PORT = 8083;

module.exports = {
  test: TESTNAME,
  cwd: path.resolve(path.join(__dirname, `../`)),
  cmd: `app`,
  port: PORT,
  env: {
    PORT: PORT
  },
  url: `http://localhost:${PORT}`,
  version: process.env.GAE_VERSION || TESTNAME,
  msg: `jupez`,
  project: process.env.GCLOUD_PROJECT // needed for e2e URL
};
