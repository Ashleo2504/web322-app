// Import required modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing passwords

// Define a Mongoose Schema
const Schema = mongoose.Schema;

// Define the structure of a User document
let userSchema = new Schema({
    userName: { type: String, unique: true }, // unique username
    password: String, // hashed password
    email: String, // user's email
    loginHistory: [{
        dateTime: Date,      // timestamp of login
        userAgent: String    // browser/device used for login
    }]
});

// Declare a variable for the User model
let User;

// This function connects to MongoDB and initializes the User model
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        // Connect to your MongoDB Atlas database
        let db = mongoose.createConnection(
            "mongodb+srv://captainhero147:balebale%405002@cluster0.e5rvns3.mongodb.net/web322?retryWrites=true&w=majority",
            {
                useNewUrlParser: true,      // use new URL parser (recommended)
                useUnifiedTopology: true    // use new server discovery engine (recommended)
            }
        );

        // Handle connection errors
        db.on('error', (err) => {
            reject("MongoDB connection error: " + err);
        });

        // Once connected, define the "users" collection based on the schema
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve(); // Notify caller that initialization was successful
        });
    });
};

// Function to register a new user
module.exports.registerUser = function (userData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Hash the user's password before saving it to DB
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create a new User instance with hashed password
            const newUser = new User({
                userName: userData.userName,
                password: hashedPassword,
                email: userData.email,
                loginHistory: [] // Start with empty login history
            });

            // Save the new user to MongoDB
            await newUser.save();
            resolve(); // Success
        } catch (err) {
            // Handle duplicate username error (code 11000 from MongoDB)
            if (err.code === 11000) {
                reject("Username already taken");
            } else {
                // Handle other errors during user creation
                reject("There was an error creating the user: " + err);
            }
        }
    });
};

// Function to check a user's login credentials
module.exports.checkUser = function (userData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Try to find the user by their username
            const user = await User.findOne({ userName: userData.userName });

            // If no user is found, reject with an error
            if (!user) return reject("Unable to find user: " + userData.userName);

            // Compare provided password with stored hashed password
            const match = await bcrypt.compare(userData.password, user.password);

            // If passwords don't match, reject
            if (!match) return reject("Incorrect password");

            // If matched, log the current login to the user's login history
            user.loginHistory.push({
                dateTime: new Date(),               // current time
                userAgent: userData.userAgent       // store user's browser info
            });

            // Save the updated user object back to the DB
            await user.save();

            // Success! Return the user object
            resolve(user);
        } catch (err) {
            // Catch any other errors during the login process
            reject("There was an error verifying the user: " + err);
        }
    });
};
