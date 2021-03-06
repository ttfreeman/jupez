"use strict";

const { Firestore } = require("@google-cloud/firestore");
const keys = require('../config/keys')

// [START config]
const firestore = new Firestore();
const collectionApi = "posts";
const db = firestore.collection(collectionApi)
// [END config]

// [START list]
async function list(limit, token) {
  if (token==undefined) {
    token=0
  }
  
  const q = db
    .limit(limit)
    .orderBy("symbol")
    .startAt(token);

  
  const postSnapshot = await q.get()
  var posts=[]  
  postSnapshot.forEach(doc=>{
    posts.push({
      id: doc.id,
      data: doc.data()
    })
  })
    
  return posts
      // var last = snapshot.docs[snapshot.docs.length - 1];
      // var next = db
      //   .startAfter(last.data().population)
      //   .limit(3);
}
// [END list]

// [START update]
async function update(id, data) {
  data = JSON.parse(JSON.stringify(data));
    
  await db.doc(id).update(data);
  const ref = await read(id)
  console.log('ref=', ref);
    
  return ref
}
// [END update]

async function create(data) {
  data = JSON.parse(JSON.stringify(data));
  
  const ref = await db.add(data)
    return ref
}

async function read(id) {
  const postRef = await db.doc(id).get()
  return {id: postRef.id, data:postRef.data()}
}

function _delete(id) {
  db.doc(id).delete();
}

function findRead(symbol){
  var optionsRef = firestore.collection('jupez-scrape-analysis')
  var query = optionsRef.where('symbol', '==', symbol).get()
    .then(snapshot => {
      if (snapshot.empty) {
        console.log('No matching documents.');
        return;
      }

      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });  
}

module.exports = {
  create,
  read,
  update,
  delete: _delete,
  list,
  findRead
};