/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Dev Kumar Bachchan
Student ID: 123065237
Date: 18-04-2025
Cyclic Web App URL: https://vercel.com/ashleo2504s-projects/web322-app-qdfi
GitHub Repository URL: https://github.com/Ashleo2504/web322-app.git
********************************************************************************/

// Load env vars & dependencies
require('dotenv').config();
require('pg'); // Ensure pg driver is available
const authData = require('./auth-service.js');
const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer"); // For file uploads
const expHBS = require('express-handlebars');
const cloudinary = require('cloudinary').v2; // Cloud image storage
const streamifier = require('streamifier');
const Handlebars = require('handlebars');
const clientSessions = require("client-sessions");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Setup handlebars with helpers
const hbs = expHBS.create({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function (url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active"' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3) throw new Error("Handlebars Helper equal needs 2 parameters");
            return (lvalue != rvalue) ? options.inverse(this) : options.fn(this);
        },
        safeHTML: function (html) {
            return new Handlebars.SafeString(html);
        },
        formatDate: function (dateObj) {
            if (!dateObj) return '';
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            let day = dateObj.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        truncate: function (str, len) {
            if (str.length > len) {
                return str.substring(0, len) + '...';
            }
            return str;
        }
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Setup cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME || 'dfst9j74g',
    api_key: process.env.CLOUDINARY_KEY || '332178947425628',
    api_secret: process.env.CLOUDINARY_SECRET || 'y7M6d7_J5Feh4jbgowjFyOT4pw8',
    secure: true
});

const upload = multer(); // Setup multer for file uploads

// Setup middleware to handle incoming data & static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Set active route for highlighting nav
app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = '/' + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, '') : route.replace(/\/(.*)/, ''));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Configure session
app.use(clientSessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET || "your-strong-secret-here",
    duration: 24 * 60 * 60 * 1000, // 1 day
    activeDuration: 1000 * 60 * 5, // 5 minutes
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && !process.env.VERCEL,
        sameSite: 'none',
        proxy: true
    }
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// Routes
app.get('/', async (req, res) => {
    try {
        const featuredItems = await storeService.getPublishedItems();
        res.render('home', { featuredItems: featuredItems.slice(0, 3) });
    } catch (err) {
        res.render('home', { featuredItems: [], message: "Error loading featured items" });
    }
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get("/shop", async (req, res) => {
    let viewData = {};
    try {
        let items = req.query.category ? await storeService.getPublishedItemsByCategory(req.query.category) : await storeService.getPublishedItems();
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
        viewData.post = items[0];
    } catch (err) {
        viewData.message = "No results";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "No results";
    }

    res.render("shop", { data: viewData });
});

app.get('/shop/:id', async (req, res) => {
    let viewData = {};
    try {
        let items = req.query.category ? await storeService.getPublishedItemsByCategory(req.query.category) : await storeService.getPublishedItems();
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "No results";
    }

    try {
        viewData.post = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "No results";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "No results";
    }

    res.render("shop", { data: viewData });
});

app.get('/items', ensureLogin, async (req, res) => {
    try {
        const items = await storeService.getAllItems();
        res.render('items', { 
            items: items,
            categories: await storeService.getCategories()
        });
    } catch (err) {
        res.render('items', { items: [], message: "Error loading items" });
    }
});

app.get("/items/add", ensureLogin, async (req, res) => {
    try {
        const categories = await storeService.getCategories();
        res.render("addPost", { categories });
    } catch (err) {
        res.render("addPost", { categories: [] });
    }
});

// Handle item creation
app.post("/items/add", ensureLogin, upload.single("featureImage"), async (req, res) => {
    try {
        let imageUrl = "";

        if (req.file) {
            const uploaded = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'items' },
                    (error, result) => error ? reject(error) : resolve(result)
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
            imageUrl = uploaded.secure_url;
        }

        const itemData = {
            ...req.body,
            featureImage: imageUrl,
            postDate: new Date(),
            published: req.body.published === 'on',
            price: parseFloat(req.body.price)
        };

        const newItem = await storeService.addItem(itemData);
        res.redirect("/items");
    } catch (err) {
        try {
            const categories = await storeService.getCategories();
            res.render("addPost", {
                categories,
                errorMessage: "Failed to add item. Please try again.",
                formData: req.body
            });
        } catch (categoriesError) {
            res.status(500).render("addPost", {
                categories: [],
                errorMessage: "System error"
            });
        }
    }
});

app.get("/items/delete/:id", ensureLogin, async (req, res) => {
    try {
        await storeService.deletePostById(req.params.id);
        res.redirect("/items");
    } catch (err) {
        res.status(500).send("Unable to Remove Post / Post not found");
    }
});

app.get('/categories', ensureLogin, async (req, res) => {
    try {
        const categories = await storeService.getCategories();
        res.render('categories', { categories: categories });
    } catch (err) {
        res.render('categories', { message: "No results" });
    }
});

app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory');
});

app.post('/categories/add', ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect('/categories'))
        .catch(err => res.status(500).send("Unable to add category"));
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect('/categories'))
        .catch(err => res.status(500).send("Unable to remove category"));
});

// Auth Routes
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: null, userName: '', active: 'login' });
});

app.post('/login', async (req, res) => {
    try {
        req.body.userAgent = req.get('User-Agent');
        const user = await authData.checkUser(req.body);

        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory || []
        };

        res.redirect('/items');
    } catch (err) {
        res.render('login', { errorMessage: err.message || 'Login failed', userName: req.body.userName });
    }
});

app.get('/register', (req, res) => {
    res.render('register', { errorMessage: null, successMessage: null, userName: '', active: 'register' });
});

app.post('/register', async (req, res) => {
    try {
        if (!req.body.userName || !req.body.password || !req.body.email) {
            return res.render('register', {
                errorMessage: 'All fields are required',
                successMessage: null,
                userName: req.body.userName
            });
        }

        await authData.registerUser(req.body);

        res.render('register', {
            successMessage: 'User created successfully!',
            errorMessage: null,
            userName: ''
        });
    } catch (err) {
        res.render('register', {
            errorMessage: err.message || 'Registration failed',
            successMessage: null,
            userName: req.body.userName
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.clearCookie('session');
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory');
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render("404");
});

// Initialize services and start server
storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log("Server running on port: " + HTTP_PORT);
        });
    }).catch(err => {
        console.log("Unable to start server: " + err);
    });

module.exports = app;