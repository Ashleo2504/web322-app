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

// 🔹 Get items by category
function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => item.category == category);
    if (filteredItems.length === 0) {
      return reject("no results returned");
    }
    resolve(filteredItems);
  });
}

// 🔹 Get items by minimum post date
function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const minDate = new Date(minDateStr);
    if (isNaN(minDate.getTime())) {
      return reject("invalid date format");
    }

    const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
    if (filteredItems.length === 0) {
      return reject("no results returned");
    }
    resolve(filteredItems);
  });
}

// 🔹 Get an item by ID
function getItemById(id) {
  return new Promise((resolve, reject) => {
    const foundItem = items.find(item => item.id == id);
    if (!foundItem) {
      return reject("no result returned");
    }
    resolve(foundItem);
  });
}

// 🔹 Add a new item to the items array
function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;
    itemData.id = items.length + 1; // Set a unique ID
    itemData.postDate = new Date().toISOString().split('T')[0]; // Set today's date

    items.push(itemData);
    resolve(itemData);
  });
}

// Export all functions
module.exports = { 
  initialize, 
  getAllItems, 
  getPublishedItems, 
  getCategories, 
  addItem, 
  getItemsByCategory, 
  getItemsByMinDate, 
  getItemById 
};
