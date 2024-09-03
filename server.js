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
  allowedHeaders: "*",
  exposedHeaders: "*",
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
    return res.status(201).send({
      status: "ok",
      message: "Data saved successfull",
      data: { id: docRef.id },
    });
  } catch (error) {
    return res.status(500).send({ status: "error", message: error.message });
  }
});

// get all
app.get("/car", async (req, res) => {
  try {
    // Fetching all documents from the 'cars' collection
    const carsSnapshot = await db.collection("cars").get();

    // Mapping through the documents to extract data
    const cars = carsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).send({
      status: "ok",
      message: "Data retrieved successfully",
      data: cars,
    });
  } catch (error) {
    return res.status(500).send({ status: "error", message: error.message });
  }
});

// delete
app.delete("/car/:id", async (req, res) => {
  try {
    const { id } = req.params; // Extract the document ID from the request parameters

    // Reference to the specific document in the 'cars' collection
    const carRef = db.collection("cars").doc(id);

    // Check if the document exists
    const doc = await carRef.get();
    if (!doc.exists) {
      return res.status(404).send({
        status: "error",
        message: "Car not found",
      });
    }

    // Delete the document
    await carRef.delete();

    return res.status(200).send({
      status: "ok",
      message: "Car deleted successfully",
    });
  } catch (error) {
    return res.status(500).send({ status: "error", message: error.message });
  }
});

// update
app.put("/car/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Reference to the specific document in the 'cars' collection
    const carRef = db.collection("cars").doc(id);

    // Check if the document exists
    const doc = await carRef.get();
    if (!doc.exists) {
      return res.status(404).send({
        status: "error",
        message: "Car not found",
      });
    }

    // Update the document with the new data
    await carRef.update(updatedData);

    return res.status(200).send({
      status: "ok",
      message: "Car updated successfully",
    });
  } catch (error) {
    return res.status(500).send({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 8080; //setting up the ports for application
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
