const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

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
  .catch(err => {
    console.error('DB connection error:', err);
    console.log(DB);
  });

const port = process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}`));