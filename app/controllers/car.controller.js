const fs = require("fs");
const csvParser = require("csv-parser");
const json2csv = require("json2csv").parse;
const db = require("../config/config.js");
const path = require("path");
// Add new car
exports.addCar = async (req, res) => {
  try {
    const data = req.body;
    delete data.id;
    const docRef = await db.collection("cars").add(data);
    res.status(201).json({
      status: "ok",
      message: "Data saved successfully",
      data: { id: docRef.id },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Get all or filtered cars
exports.getCars = async (req, res) => {
  try {
    const {
      horsepowerMin,
      selectedCylinder,
      selectedModelYear,
      selectedOrigin,
      carName,
      page = 1,
    } = req.query;
    const pageSize = 10; // show 10 items per page
    const currentPage = parseInt(page) || 1;

    let query = db.collection("cars");

    if (selectedCylinder)
      query = query.where("cylinders", "==", selectedCylinder);
    if (selectedModelYear)
      query = query.where("modelYear", "==", selectedModelYear);
    if (selectedOrigin) query = query.where("origin", "==", selectedOrigin);

    const snapshot = await query.get();
    let cars = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // mimicking the search functionality because i do not want to pay firebase.
    if (carName) {
      const nameSearch = carName.toLowerCase();
      cars = cars.filter(
        (car) => car.name && car.name.toLowerCase().includes(nameSearch)
      );
    }
    const totalItems = cars.length;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCars = cars.slice(
      startIndex,
      startIndex + parseInt(pageSize)
    );
    res.status(200).json({
      status: "ok",
      message: "Filtered and paginated data retrieved successfully",
      data: paginatedCars,
      totalItems,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Update car
exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const carRef = db.collection("cars").doc(id);
    const doc = await carRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ status: "error", message: "Car not found" });
    }

    await carRef.update(updatedData);
    res.status(200).json({ status: "ok", message: "Car updated successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Delete car
exports.deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const carRef = db.collection("cars").doc(id);
    const doc = await carRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ status: "error", message: "Car not found" });
    }

    await carRef.delete();
    res.status(200).json({ status: "ok", message: "Car deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Upload CSV
exports.uploadCSV = (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ status: "error", message: "No file uploaded" });
  }

  // Validate the file extension
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  if (fileExt !== ".csv") {
    return res.status(400).json({
      status: "error",
      message: "Invalid file format. Only CSV files are allowed.",
    });
  }

  // Validate the MIME type
  const fileType = req.file.mimetype;
  if (fileType !== "text/csv" && fileType !== "application/vnd.ms-excel") {
    return res.status(400).json({
      status: "error",
      message: "Invalid file format. Only CSV files are allowed.",
    });
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const car of results) {
          const docRef = car.id
            ? db.collection("cars").doc(car.id)
            : db.collection("cars").doc();

          if (!car.id) car.id = docRef.id;

          await docRef.set(car);
        }

        res.status(200).json({
          status: "ok",
          message: "CSV uploaded and data saved to Firestore",
        });
      } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
      }
    });
};

// Download CSV
exports.downloadCSV = async (req, res) => {
  try {
    const snapshot = await db.collection("cars").get();
    const cars = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const csv = json2csv(cars);

    res.setHeader("Content-Disposition", "attachment; filename=cars.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
