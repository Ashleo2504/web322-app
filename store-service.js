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

// 🔹 New function: Get published items by category
function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => item.published === true && item.category == category);
    if (filteredItems.length === 0) {
      return reject("no results returned");
    }
    resolve(filteredItems);
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

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => item.category == category);
    if (filteredItems.length === 0) {
      return reject("no results returned");
    }
    resolve(filteredItems);
  });
}

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

function getItemById(id) {
  return new Promise((resolve, reject) => {
    const foundItem = items.find(item => item.id == id);
    if (!foundItem) {
      return reject("no result returned");
    }
    resolve(foundItem);
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    // Set the "published" field to true/false based on the input
    itemData.published = itemData.published ? true : false;

    // Assign a new ID (assuming the IDs are sequential)
    itemData.id = items.length + 1;

    // Set the "postDate" to the current date in YYYY-MM-DD format
    itemData.postDate = new Date().toISOString().split('T')[0];

    // Push the new item to the items array
    items.push(itemData);

    // Resolve with the item data (or you could resolve with a success message)
    resolve(itemData);
  });
}

// Export all functions
module.exports = { 
  initialize, 
  getAllItems, 
  getPublishedItems, 
  getPublishedItemsByCategory, // Added the new function
  getCategories, 
  addItem, 
  getItemsByCategory, 
  getItemsByMinDate, 
  getItemById 
};
