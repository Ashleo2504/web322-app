const Sequelize = require('sequelize');

// Set up Sequelize with Neon.tech credentials (make sure these are kept secret in real apps)
const sequelize = new Sequelize('neondb', 'neondb_owner', 'npg_hFtk4deZq9IU', {
    host: 'ep-falling-dream-a5jg4e56-pooler.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false } // Allow SSL but don’t verify cert (handy for Neon)
    },
    query: { raw: true } // Returns plain JS objects instead of Sequelize models
});

// Define the Item model (this is basically a post or product or whatever you're listing)
const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

// Define the Category model (like "electronics", "furniture", etc.)
const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

// Set up relationship: every Item belongs to one Category
Item.belongsTo(Category, { foreignKey: 'category' });

// Export all the functions so other parts of the app can use them
module.exports = {
    // Connects and syncs models with the database
    initialize: function () {
        return new Promise((resolve, reject) => {
            sequelize.sync()
                .then(() => resolve())
                .catch(err => reject("unable to sync the database"));
        });
    },

    // Get all items, no filters
    getAllItems: function () {
        return new Promise((resolve, reject) => {
            Item.findAll()
                .then(data => resolve(data))
                .catch(err => reject("no results returned"));
        });
    },

    // Get only published items
    getPublishedItems: function () {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { published: true } })
                .then(data => resolve(data))
                .catch(err => reject("no results returned"));
        });
    },

    // Get published items that belong to a specific category
    getPublishedItemsByCategory: function (category) {
        return new Promise((resolve, reject) => {
            Item.findAll({
                where: {
                    published: true,
                    category: category
                }
            })
                .then(data => resolve(data))
                .catch(err => reject("no results returned"));
        });
    },

    // Grab all categories from the DB
    getCategories: function () {
        return new Promise((resolve, reject) => {
            Category.findAll()
                .then(data => resolve(data))
                .catch(err => reject("no results returned"));
        });
    },

    // Add a new item to the DB
    addItem: function (itemData) {
        return new Promise((resolve, reject) => {
            // If published checkbox was checked, it'll be truthy
            itemData.published = itemData.published ? true : false;

            // Clean up empty strings (set them to null)
            for (const key in itemData) {
                if (itemData[key] === "") itemData[key] = null;
            }

            // Convert category to an integer (should be category ID)
            if (itemData.category) {
                itemData.category = parseInt(itemData.category, 10);
            }

            // Set post date to now
            itemData.postDate = new Date();

            // Add the item to the DB
            Item.create(itemData)
                .then(() => resolve())
                .catch(err => {
                    console.error("Error adding item:", err);  // Debug info
                    reject("Unable to create post");
                });
        });
    },

    // Get one specific item by its ID
    getItemById: function (id) {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { id: id } })
                .then(data => {
                    if (data.length > 0) resolve(data[0]);
                    else reject("no results returned");
                })
                .catch(err => reject("no results returned"));
        });
    },

    // Get all items for a specific category
    getItemsByCategory: function (category) {
        return new Promise((resolve, reject) => {
            Item.findAll({ where: { category: category } })
                .then(data => resolve(data))
                .catch(err => reject("no results returned"));
        });
    },

    // Get items with a postDate >= a given date
    getItemsByMinDate: function (minDateStr) {
        const { gte } = Sequelize.Op;
        return new Promise((resolve, reject) => {
            Item.findAll({
                where: {
                    postDate: {
                        [gte]: new Date(minDateStr)
                    }
                }
            })
                .then(data => resolve(data))
                .catch(err => reject("no results returned"));
        });
    },

    // Add a new category to the DB
    addCategory: function (categoryData) {
        return new Promise((resolve, reject) => {
            // Clean out any empty strings
            for (const key in categoryData) {
                if (categoryData[key] === "") categoryData[key] = null;
            }

            Category.create(categoryData)
                .then(() => resolve())
                .catch(err => reject("unable to create category"));
        });
    },

    // Delete a category by its ID
    deleteCategoryById: function (id) {
        return new Promise((resolve, reject) => {
            Category.destroy({ where: { id: id } })
                .then(() => resolve())
                .catch(err => reject("Unable to delete category"));
        });
    },

    // Delete an item by its ID
    deletePostById: function (id) {
        return new Promise((resolve, reject) => {
            Item.destroy({ where: { id: id } })
                .then(() => resolve())
                .catch(err => reject("unable to delete post"));
        });
    }
};
