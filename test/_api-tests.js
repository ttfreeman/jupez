"use strict";

const getRequest = require(`@google-cloud/nodejs-repo-tools`).getRequest;
const test = require(`ava`);

module.exports = () => {
  let id, testConfig;

  test.before(() => {
    testConfig = require(`./_test-config`);
  });

  test.serial.cb(`should create a post`, t => {
    getRequest(testConfig)
      .post(`/api/posts`)
      .send({ title: `beep` })
      .expect(200)
      .expect(response => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.title, `beep`);
      })
      .end(t.end);
  });

  test.serial.cb(`should list posts`, t => {
    // Give Datastore time to become consistent
    setTimeout(() => {
      getRequest(testConfig)
        .get(`/api/posts`)
        .expect(200)
        .expect(response => {
          t.true(Array.isArray(response.body.items));
          t.true(response.body.items.length >= 1);
        })
        .end(t.end);
    }, 1000);
  });

  test.serial.cb(`should delete a post`, t => {
    getRequest(testConfig)
      .delete(`/api/posts/${id}/`)
      // .expect(200)
      .expect(response => {
        t.is(response.text, `OK`);
      })
      .end(t.end);
  });
};
