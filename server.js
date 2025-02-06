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
