const storeService = require('./store-service');
const express = require('express');
const path = require('path');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Redirect root to /about
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Serve the about page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

// Shop route (public-facing)
app.get('/shop', (req, res) => {
  res.send('TODO: get all items who have published==true');
});

// Items route (for future management use)
app.get('/items', (req, res) => {
  res.send('TODO: get all items');
});

// Categories route (for future management use)
app.get('/categories', (req, res) => {
  res.send('TODO: get all categories');
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Start the server
app.listen(HTTP_PORT, () => {
  console.log('Express http server listening on port ' + HTTP_PORT);
});
