const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };
    await transporter.sendMail(mailOptions);
};

const sendTemplateEmail = async (to, subject, templateName, data) => {
    try {
        const templatePath = path.join(__dirname, `../views/emails/${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, data);
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        };
        
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Error sending email template ${templateName}:`, error);
    }
};

module.exports = { sendEmail, sendTemplateEmail };