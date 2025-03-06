/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Dev Kumar Bachchan
Student ID: 123065237
Date: 05-03-2025
Cyclic Web App URL: 
GitHub Repository URL: https://github.com/Ashleo2504/web322-app.git
********************************************************************************/

const storeService = require('./store-service');
const express = require('express');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path'); 

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware to parse URL-encoded data (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dfvcozpgh', 
  api_key: '755688973366479',       
  api_secret: 'ZjDenjLsuZcA9EJ9P-RXt1fJ-Lk', 
  secure: true
});

// Multer configuration for handling file uploads (in-memory storage)
const upload = multer();

app.use(express.static('public'));

// Home page
app.get('/', (req, res) => {
  res.redirect('/about');
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

// Get published items
app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then((data) => res.json(data))
    .catch((err) => res.json({ message: err }));
});

// Get all items with filtering options
app.get('/items', (req, res) => {
  if (req.query.category) {
    storeService.getItemsByCategory(req.query.category)
      .then((data) => res.json(data))
      .catch((err) => res.status(404).json({ message: err }));
  } 
  else if (req.query.minDate) {
    storeService.getItemsByMinDate(req.query.minDate)
      .then((data) => res.json(data))
      .catch((err) => res.status(404).json({ message: err }));
  } 
  else {
    storeService.getAllItems()
      .then((data) => res.json(data))
      .catch((err) => res.status(404).json({ message: err }));
  }
});

// Get categories
app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((data) => res.json(data))
    .catch((err) => res.json({ message: err }));
});

// Route to render the add item page
app.get('/items/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
});

// Route to handle adding an item
app.post('/items/add', upload.single("featureImage"), (req, res) => {
  let processItem = (imageUrl) => {
    req.body.featureImage = imageUrl || "";
    
    storeService.addItem(req.body)
      .then(() => res.redirect('/items'))
      .catch(err => res.status(500).send("Error adding item: " + err));
  };

  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    streamUpload(req)
      .then(uploaded => processItem(uploaded.url))
      .catch(err => {
        console.error("Error uploading to Cloudinary:", err);
        res.status(500).send("Error uploading image.");
      });
  } else {
    processItem("");
  }
});

// Route to get an item by ID
app.get('/item/:id', (req, res) => {
  storeService.getItemById(req.params.id)
    .then(item => res.json(item))
    .catch(err => res.status(404).json({ message: err }));
});

// 404 error handler
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Initialize store service and start server
storeService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on port ${HTTP_PORT}`);
    });
  })
  .catch(err => {
    console.log('Error initializing store service: ' + err);
  });
