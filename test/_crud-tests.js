"use strict";

const getRequest = require(`@google-cloud/nodejs-repo-tools`).getRequest;
const test = require(`ava`);

module.exports = () => {
  let id, testConfig;

  test.before(() => {
    testConfig = require(`./_test-config`);
  });

  test.serial.cb(`should show a list of posts`, t => {
    // Give Datastore time to become consistent
    setTimeout(() => {
      const expected = /<div class="card-body">/;
      getRequest(testConfig)
        .get(`/posts`)
        .expect(200)
        .expect(response => {
          t.regex(response.text, expected);
        })
        .end(t.end);
    }, 2000);
  });

  test.serial.cb(`should handle error`, t => {
    getRequest(testConfig)
      .get(`/posts`)
      .query({ pageToken: `badrequest` })
      .expect(500)
      .end(t.end);
  });

  test.serial.cb(`should post to add post form`, t => {
    const expected = /Redirecting to \/posts\//;
    getRequest(testConfig)
      .post(`/posts/add`)
      .send(`title=my%20post`)
      .expect(302)
      .expect(response => {
        const location = response.headers.location;
        const idPart = location.replace(`/posts/`, ``);
        id = idPart;
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show add post form`, t => {
    const expected = /Add post/;
    getRequest(testConfig)
      .get(`/posts/add`)
      .expect(200)
      .expect(response => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should update a post`, t => {
    const expected = new RegExp(`Redirecting to /posts/${id}`);
    getRequest(testConfig)
      .post(`/posts/${id}/edit`)
      .send(`title=my%20other%20post`)
      .expect(302)
      .expect(response => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show edit post form`, t => {
    const expected = /<input class="form-control" type="text" name="title" id="title" value="my other post">/;
    getRequest(testConfig)
      .get(`/posts/${id}/edit`)
      .expect(200)
      .expect(response => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show a post`, t => {
    const expected = /<h4 class="mt-0">my other post&nbsp;<small><\/small><\/h4>/;
    getRequest(testConfig)
      .get(`/posts/${id}`)
      .expect(200)
      .expect(response => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should REGEXdelete a post`, t => {
    const expected = /Redirecting to \/posts/;
    getRequest(testConfig)
      .get(`/posts/${id}/delete`)
      .expect(302)
      .expect(response => {
        id = undefined;
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  // clean up
  test.after.always.cb(t => {
    if (id) {
      getRequest(testConfig)
        .delete(`/posts/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });
};
