const fs = require('fs');

let items = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/items.json', 'utf8', (err, data) => {
      if (err) {
        return reject('unable to read file');
      }

      try {
        items = JSON.parse(data);
      } catch (parseError) {
        return reject('unable to parse items.json');
      }

      fs.readFile('./data/categories.json', 'utf8', (err, data) => {
        if (err) {
          return reject('unable to read file');
        }

        try {
          categories = JSON.parse(data);
        } catch (parseError) {
          return reject('unable to parse categories.json');
        }

        resolve();
      });
    });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      return reject('no results returned');
    }

    resolve(items);
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published === true);

    if (publishedItems.length === 0) {
      return reject('no results returned');
    }

    resolve(publishedItems);
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      return reject('no results returned');
    }

    resolve(categories);
  });
}

module.exports = { initialize, getAllItems, getPublishedItems, getCategories };
