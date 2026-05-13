const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Handle uncaught exceptions (like syntax errors) -- sync errors 
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); // import before the app to use it in app
const app = require('./app');

dns.setServers(['1.1.1.1']); // that to fix the error of db connection (nodeJs issue of querySrv ECONNREFUSED MongoDB)

// const DB = process.env.DATABASE_LOCAL
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to Mongodb
mongoose
  .connect(DB)
  .then(() => {
    console.log('DB connection successful!');
  })

const port = process.env.PORT;

const server = app.listen(port, () => console.log(`Listening on port ${port}`));

// Handle unhandled promise rejections (like DB connection error) -- async errors 
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // graceful shutdown - to allow the server to finish all the pending requests before shutting down
  server.close(() => {
    process.exit(1);
  });
});



