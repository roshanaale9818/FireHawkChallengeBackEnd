const express = require("express");
const router = express.Router();
const carController = require("../controllers/car.controller");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

// Routes
router.post("/", carController.addCar);
router.get("/", carController.getCars);
router.put("/:id", carController.updateCar);
router.delete("/:id", carController.deleteCar);

// CSV upload and download
router.post("/upload", upload.single("file"), carController.uploadCSV);
router.get("/download-csv", carController.downloadCSV);

module.exports = router;
