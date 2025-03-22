/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Dev Kumar Bachchan
Student ID: 123065237
Date: 21-03-2025
Cyclic Web App URL: https://vercel.com/ashleo2504s-projects/web322-app-qdfi
GitHub Repository URL: https://github.com/Ashleo2504/web322-app.git
********************************************************************************/

const storeService = require('./store-service');
const express = require('express');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const exphbs = require('express-handlebars'); // Import express-handlebars

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware to parse URL-encoded data (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Middleware to track active routes
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Configure Handlebars with custom helpers
const handlebars = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
    navLink: function(url, options) {
      return `<li class="nav-item">
                <a class="nav-link ${url === app.locals.activeRoute ? "active" : ""}" href="${url}">
                  ${options.fn(this)}
                </a>
              </li>`;
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3) throw new Error("Handlebars Helper equal needs 2 parameters");
      return lvalue === rvalue ? options.fn(this) : options.inverse(this);
    }
  }
});

// Register Handlebars engine
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

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

// Home page - Now redirecting to /shop
app.get('/', (req, res) => {
  res.redirect('/shop');
});

// About page (Now Using Handlebars)
app.get('/about', (req, res) => {
  res.render('about', { title: "About" });
});

// Updated /shop route
app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }

    // Sort items by postDate (latest first)
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    let item = items[0];

    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

// **New Route to Render Specific Item by ID**
app.get("/shop/:id", async (req, res) => {
  let viewData = {};

  try {
    let item = await storeService.getItemById(req.params.id); // Fetch item by ID
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results"; // Handle error if no item is found with the given ID
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

// Get all items with filtering options
app.get('/items', (req, res) => {
  if (req.query.category) {
    storeService.getItemsByCategory(req.query.category)
      .then(data => res.render('items', { items: data }))
      .catch(err => res.render('items', { message: 'no results' }));
  } else if (req.query.minDate) {
    storeService.getItemsByMinDate(req.query.minDate)
      .then(data => res.render('items', { items: data }))
      .catch(err => res.render('items', { message: 'no results' }));
  } else {
    storeService.getAllItems()
      .then(data => res.render('items', { items: data }))
      .catch(err => res.render('items', { message: 'no results' }));
  }
});

// Get categories
app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then(data => res.render("categories", { categories: data }))
    .catch(err => res.render("categories", { message: "no results" }));
});

// Route to render the add item page using Handlebars
app.get('/items/add', (req, res) => {
  res.render('addPost', { title: "Add Item" });
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
  res.status(404).render('404', { title: "Page Not Found" });
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
