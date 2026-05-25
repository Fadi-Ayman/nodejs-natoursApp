const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    // service: "Gmail", // bet ter to use sendgrid or mailgun for production as not marked as spammer
    // Activate in gmail "less secure app"
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Fady Ayman <Natours@example.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: '<p>HTML version of the message</p>'
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions); // PROMISE
};

module.exports = sendEmail;