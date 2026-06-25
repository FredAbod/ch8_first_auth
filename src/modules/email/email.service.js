import nodemailer from "nodemailer";
import ejs from "ejs";
import env from "../../config/env.js";
import { resolveFrom } from "../../shared/helpers/path.helper.js";
import logger from "../../shared/logger/logger.js";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

export const sendTemplateEmail = async (to, subject, templateName, data) => {
  try {
    const templatePath = resolveFrom(
      import.meta.url,
      "../../views/emails",
      `${templateName}.ejs`,
    );
    const html = await ejs.renderFile(templatePath, data);

    await transporter.sendMail({
      from: env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error(`Error sending email template ${templateName}`, {
      error: error.message,
    });
  }
};
