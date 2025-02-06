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

app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });


app.listen(HTTP_PORT, () => {
  console.log('Express http server listening on port ' + HTTP_PORT);
});
