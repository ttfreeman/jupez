const request = require("request");
const fs = require("fs");
const util = require("util");

// Convert fs.readFile into Promise version of same
const readFile = util.promisify(fs.readFile);

loadData = async () => {
  var data = await readFile("../data/reddit-gifs.json");
  data = JSON.parse(data);
  console.log(data[0]);

  if (data) {
    for (let item of data) {
      console.log("item=", item);

      try {
        request.post(
          "http://localhost:8080/posts/add",
          {
            form: {
              title: item.title,
              author: item.authorName,
              publishedDate: item.postTime,
              description: item.comments,
              imageUrl: item.imageUrl
            }
          },
          (error, res, body) => {
            if (error) {
              console.error(error);
              return;
            }
            console.log(`statusCode: ${res.statusCode}`);
            console.log(body);
          }
        );
      } catch (e) {
        console.log(e);
      }
    }
  }
  console.log("the data file does not exits");

  return;
};

loadData();
