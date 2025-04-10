/*********************************************************************************
WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Dev Kumar Bachchan
Student ID: 123065237
Date: 9-04-2025
Cyclic Web App URL: https://vercel.com/ashleo2504s-projects/web322-app-qdfi
GitHub Repository URL: https://github.com/Ashleo2504/web322-app.git
********************************************************************************/

const storeService = require('./store-service');
const express = require('express');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Handlebars date format helper
const formatDate = function(dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

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
                <a class="nav-link ${url === app.locals.activeRoute ? "active" : ""}" href="${url}">${options.fn(this)}</a>
              </li>`;
    },
    equal: function(lvalue, rvalue, options) {
      if (arguments.length < 3) throw new Error("Handlebars Helper equal needs 2 parameters");
      return lvalue === rvalue ? options.fn(this) : options.inverse(this);
    },
    formatDate: formatDate  // Register the formatDate helper
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
    console.error('Error fetching items:', err);
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
    console.error('Error fetching categories:', err);
  }

  res.render("shop", { data: viewData });
});

// Route to handle specific item by ID
app.get("/shop/:id", async (req, res) => {
  let viewData = {};

  try {
    let item = await storeService.getItemById(req.params.id);
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results"; // Handle error if no item is found
    console.error('Error fetching item by ID:', err);
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
    console.error('Error fetching categories:', err);
  }

  res.render("shop", { data: viewData });
});

// Updated /items route to handle "no results" and error handling
app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then(data => {
      if (data.length > 0) {
        res.render('items', { items: data });
      } else {
        res.render('items', { message: 'No results found' });
      }
    })
    .catch(err => {
      console.error('Error fetching items:', err);
      res.render('items', { message: 'Error retrieving items' });
    });
});

// Updated /categories route to handle "no results" and error handling
app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then(data => {
      if (data.length > 0) {
        res.render('categories', { categories: data });
      } else {
        res.render('categories', { message: 'No results found' });
      }
    })
    .catch(err => {
      console.error('Error fetching categories:', err);
      res.render('categories', { message: 'Error retrieving categories' });
    });
});

// Route to render the add item page with categories
app.get('/items/add', (req, res) => {
  storeService.getCategories()
    .then(data => {
      res.render('addPost', { categories: data });
    })
    .catch(err => {
      res.render('addPost', { categories: [] });
      console.error('Error fetching categories:', err);
    });
});

// Route to handle adding an item
app.post('/items/add', upload.single("featureImage"), (req, res) => {
  let processItem = (imageUrl) => {
    req.body.featureImage = imageUrl || "";

    storeService.addItem(req.body)
      .then(() => res.redirect('/items'))
      .catch(err => {
        console.error('Error adding item:', err);
        res.status(500).send("Error adding item: " + err);
      });
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

// Route to render the add category page
app.get('/categories/add', (req, res) => {
  res.render('addCategory', { title: "Add Category" });
});

// Route to handle adding a new category
app.post('/categories/add', (req, res) => {
  storeService.addCategory(req.body)
    .then(() => res.redirect('/categories'))
    .catch(err => {
      console.error('Error adding category:', err);
      res.status(500).send("Error adding category: " + err);
    });
});

// Route to delete a category by ID
app.get('/categories/delete/:id', (req, res) => {
  const categoryId = req.params.id;
  storeService.deleteCategoryById(categoryId)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((err) => {
      console.error('Error deleting category:', err);
      res.status(500).send('Unable to Remove Category / Category not found: ' + err);
    });
});

// Route to delete an item by ID
app.get('/items/delete/:id', (req, res) => {
  const itemId = req.params.id;

  storeService.deletePostById(itemId)
    .then(() => {
      res.redirect('/items');
    })
    .catch((err) => {
      console.error('Error deleting item:', err);
      res.status(500).send('Unable to Remove Item / Item not found: ' + err);
    });
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
