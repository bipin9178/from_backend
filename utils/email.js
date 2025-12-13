import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email Error:", error);
    throw new Error("Email could not be sent");
  }
};
