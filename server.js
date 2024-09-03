require("dotenv/config");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const CORS = require("./app/util/corsOptions");
const multer = require("multer");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");
const { status } = require("express/lib/response");
const fs = require("fs");
const json2csv = require("json2csv").parse;
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
app.use(bodyParser.json()); // parsing requesting content type to application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// making upload folder static for accessing
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
    // Extract filter parameters from the request query
    const {
      // horsepowerMax = 10000,
      horsepowerMin,
      selectedCylinder,
      selectedModelYear,
      selectedOrigin,
      carName,
    } = req.query;

    // Start with the cars collection reference
    let carsQuery = db.collection("cars");

    // Apply filters based on the provided criteria
    if (selectedCylinder) {
      carsQuery = carsQuery.where("cylinders", "==", selectedCylinder);
    }

    if (selectedModelYear) {
      carsQuery = carsQuery.where("modelYear", "==", selectedModelYear);
    }

    if (selectedOrigin) {
      carsQuery = carsQuery.where("origin", "==", selectedOrigin);
    }

    if (carName) {
      carsQuery = carsQuery.where("name", "==", carName);
    }

    // Fetch the filtered data
    const carsSnapshot = await carsQuery.get();

    // Map the results to an array of car objects
    const cars = carsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).send({
      status: "ok",
      message: "Filtered data retrieved successfully",
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

const upload = multer({ dest: "uploads/" });

app.post("/upload-csv", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .send({ status: "error", message: "No file uploaded" });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const car of results) {
          await db.collection("cars").add(car);
        }
        res.status(200).send({
          status: "ok",
          message: "CSV uploaded and data saved to Firestore",
        });
      } catch (error) {
        res.status(500).send({ status: "error", message: error.message });
      }
    });
});

app.get("/download-csv", async (req, res) => {
  try {
    const snapshot = await db.collection("cars").get();
    const cars = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const csv = json2csv(cars);
    res.setHeader("Content-disposition", "attachment; filename=cars.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 8080; //setting up the ports for application
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
