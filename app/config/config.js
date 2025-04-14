require("dotenv/config");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.databaseURL,
});

const db = getFirestore();

module.exports = db;
