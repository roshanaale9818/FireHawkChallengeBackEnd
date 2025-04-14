require("dotenv/config");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const CORS = require("./app/util/corsOptions");
const multer = require("multer");
// const { initializeApp, cert } = require("firebase-admin/app");
// const { getFirestore } = require("firebase-admin/firestore");
// const serviceAccount = require("./serviceAccountKey.json");
const fs = require("fs");
const json2csv = require("json2csv").parse;
const csvParser = require("csv-parser");

const carRoutes = require("./app/routes/car.routes");

// initializeApp({
//   credential: cert(serviceAccount),
//   databaseURL: process.env.databaseURL,
// });
//create the app for rest api using express
const app = express();
var corsOptions = {
  origin: (origin, callback) => {
    // Check if the origin is in the list of allowed origins
    if (CORS.allowedCorsList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "*",
  allowedHeaders: "*",
  exposedHeaders: "*",
};
// use the cors body parser in express app
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// const db = getFirestore();
app.use(bodyParser.json()); // parsing requesting content type to application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/api/cars", carRoutes);

// Root route (optional)
app.get("/", (req, res) => {
  res.send("Welcome to the Car API 🚗");
});
const PORT = process.env.PORT || 8084; //setting up the ports for application
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
