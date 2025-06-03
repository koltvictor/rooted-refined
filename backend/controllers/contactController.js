// backend/controllers/contactController.js
const nodemailer = require("nodemailer");

/**
 * @desc Submit a contact form message
 * @route POST /api/contact
 * @access Public
 * @param {object} req - The request object (body: { name, email, message }).
 * @param {object} res - The response object.
 */
exports.submitMessage = async (req, res) => {
  // Optional: Basic server-side validation using express-validator
  // (You'd need to add validation middleware to the route in contactRoutes.js)
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { name, email, message } = req.body;

  // Basic validation (already handled by frontend, but good to have backend fallback)
  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    // 1. Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <p>You have a new message from your website contact form.</p>
        <h3>Contact Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <h3>Message:</h3>
        <p>${message}</p>
      `,
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);

    console.log(`Contact message from ${email} sent successfully.`);
    res
      .status(200)
      .json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending contact message:", error);
    res
      .status(500)
      .json({ message: "Failed to send message. Please try again later." });
  }
};
