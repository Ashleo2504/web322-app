/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Dev Kumar Bachchan
Student ID: 123065237
Date: 06-02-2025
Cyclic Web App URL: Github pages : https://ashleo2504.github.io/web322-app/
GitHub Repository URL: https://github.com/Ashleo2504/web322-app.git
********************************************************************************/

const storeService = require('./store-service');
const express = require('express');
const path = require('path');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

storeService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log('Express http server listening on port ' + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log('Error initializing store service: ' + err);
  });
