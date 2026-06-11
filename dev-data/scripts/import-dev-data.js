const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' }); // import before the app to use it in app

dns.setServers(['1.1.1.1']); // that to fix the error of db connection (nodeJs issue of querySrv ECONNREFUSED MongoDB)

// const DB = process.env.DATABASE_LOCAL
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// Connect to Mongodb
mongoose.connect(DB).then(() => {
  console.log('DB connection successful!');
});

// Read JSON file
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/users.json`, 'utf-8'),
);
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/tours.json`, 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/reviews.json`, 'utf-8'),
);

// Import data into DB
const importData = async () => {
  try {
    await User.create(users, { validateBeforeSave: false });
    await Tour.create(tours);
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

// Delete all data from DB
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Tour.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

// to run the script in terminal: ADD --import or --delete at the end of the command AS AN ARGUMENT to specify the action that you want to do (import or delete)
if (process.argv[2] === '--import') {
  // node dev-data/scripts/import-dev-data.js --import
  importData();
} else if (process.argv[2] === '--delete') {
  // node dev-data/scripts/import-dev-data.js --delete
  deleteData();
} else {
  process.exit();
}
