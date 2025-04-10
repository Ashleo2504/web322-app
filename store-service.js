require('dotenv').config();  // Load environment variables from .env file
const Sequelize = require('sequelize');

// Create Sequelize instance and connect to Neon PostgreSQL
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { rejectUnauthorized: false }  // Required for Neon
  },
  query: { raw: true }  // Query results will be raw, no sequelize magic
});

// Define Category model
const Category = sequelize.define('Category', {
  category: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

// Define Item model (corresponds to the "Post" model mentioned earlier)
const Item = sequelize.define('Item', {
  body: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  postDate: {
    type: Sequelize.DATE,
    allowNull: false
  },
  featureImage: {
    type: Sequelize.STRING,
    allowNull: true
  },
  published: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  price: {
    type: Sequelize.DOUBLE,
    allowNull: false
  }
});

// Define the relationship between Item and Category
Item.belongsTo(Category, { foreignKey: 'category' });

// Test the connection to Neon PostgreSQL
sequelize.authenticate()
  .then(() => console.log('✅ Connected to Neon PostgreSQL successfully!'))
  .catch(err => console.error('❌ Unable to connect:', err));

// Initialize Sequelize models (Sync with database)
sequelize.sync()
  .then(() => console.log('Database synced successfully'))
  .catch(err => console.error('Error syncing database:', err));

// **Export the models and sequelize instance**
module.exports = {
  Item,
  Category,
  sequelize
};

// Functions to implement (as required)

// **1. initialize()**
module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        console.log('Database synced successfully');
        resolve();
      })
      .catch(err => {
        console.error('Unable to sync the database:', err);
        reject('Unable to sync the database');
      });
  });
};

// **2. getAllItems()**
module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **3. getItemsByCategory()**
module.exports.getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { category }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **4. getItemsByMinDate()**
module.exports.getItemsByMinDate = (minDateStr) => {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;
    const minDate = new Date(minDateStr);

    Item.findAll({
      where: {
        postDate: {
          [gte]: minDate
        }
      }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **5. getItemById()**
module.exports.getItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.findByPk(id)
      .then(item => {
        if (item) {
          resolve(item);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **6. addItem()**
module.exports.addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    // Ensure `published` property is a boolean
    itemData.published = (itemData.published) ? true : false;

    // Replace empty string values with null
    for (let key in itemData) {
      if (itemData[key] === "") {
        itemData[key] = null;
      }
    }

    // Set postDate to current date
    itemData.postDate = new Date();

    // Create new item
    Item.create(itemData)
      .then(newItem => {
        resolve(newItem);
      })
      .catch(err => {
        reject('Unable to create item');
      });
  });
};

// **7. getPublishedItems()**
module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true }
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **8. getPublishedItemsByCategory()**
module.exports.getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true },
      include: [{ model: Category, where: { category } }]
    })
      .then(items => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **9. getCategories()**
module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(categories => {
        if (categories.length > 0) {
          resolve(categories);
        } else {
          reject('No results returned');
        }
      })
      .catch(err => {
        reject('No results returned');
      });
  });
};

// **10. addCategory()**
module.exports.addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    // Replace blank values with null
    for (let prop in categoryData) {
      if (categoryData[prop] === "") {
        categoryData[prop] = null;
      }
    }

    // Create the category in the database
    Category.create(categoryData)
      .then(() => resolve()) // Successfully added
      .catch((err) => reject("Unable to create category: " + err)); // Error handling
  });
};

// **11. deleteCategoryById()**
module.exports.deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    // Try to delete the category by id
    Category.destroy({
      where: { id: id }
    })
      .then((rowsDeleted) => {
        if (rowsDeleted === 0) {
          reject("Category not found or already deleted");
        } else {
          resolve(); // Successfully deleted
        }
      })
      .catch((err) => reject("Unable to delete category: " + err)); // Error handling
  });
};

// **12. deletePostById()** (Updated)
module.exports.deletePostById = (id) => {
  return new Promise((resolve, reject) => {
    // Try to delete the post by id (corresponds to Item)
    Item.destroy({
      where: { id: id }
    })
      .then((rowsDeleted) => {
        if (rowsDeleted === 0) {
          reject("Post not found or already deleted");
        } else {
          resolve(); // Successfully deleted
        }
      })
      .catch((err) => reject("Unable to delete post: " + err)); // Error handling
  });
};
