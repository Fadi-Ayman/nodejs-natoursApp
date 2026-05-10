const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const fs = require('fs');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' }); // import before the app to use it in app

dns.setServers(['1.1.1.1']); // that to fix the error of db connection (nodeJs issue of querySrv ECONNREFUSED MongoDB)

// const DB = process.env.DATABASE_LOCAL
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to Mongodb
mongoose.connect(DB).then(() => {
  console.log('DB connection successful!');
});

// Read JSON file
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/tours-simple.json`, 'utf-8')
);

// Import data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
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
    await Tour.deleteMany();
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
}
