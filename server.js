require("dotenv/config");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const CORS = require("./app/util/corsOptions");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");
const { status } = require("express/lib/response");
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.databaseURL,
});
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
  allowedHeaders: "*", // Allow all headers
  exposedHeaders: "*", // Expose all header
};
// use the cors body parser in express app
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
const db = getFirestore();
console.log(db);
app.use(bodyParser.json()); // parsing requesting content type to application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// making upload folder static for accessing
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Welcome to Node js app for firehawk" });
});
app.post("/car", async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection("cars").add(data);
    return res
      .status(201)
      .send({
        status: "ok",
        message: "Data saved successfull",
        data: { id: docRef.id },
      });
  } catch (error) {
    return res.status(500).send({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 8080; //setting up the ports for application
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
