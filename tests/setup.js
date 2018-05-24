jest.setTimeout(30000); // how much should it wait before failing the test

require('../models/User'); // execute the mongoose context when Jest starts

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });

// also need to set up in package.json and tell Jest to call this file
