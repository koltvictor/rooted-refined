// frontend/src/pages/ContactPage.tsx

import React, { useState } from "react";
import "./ContactPage.css"; // We'll create this CSS next

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      setMessage("Please fill in all fields.");
      return;
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    // --- IMPORTANT: This is where you would send data to a backend endpoint ---
    // For now, we'll just simulate a successful submission.
    console.log("Contact form submitted:", formData);

    try {
      // In a real application, you'd send formData to your backend here:
      // const response = await api.post('/api/contact', formData);
      // if (response.status === 200) {
      //   setStatus('success');
      //   setMessage('Your message has been sent successfully!');
      //   setFormData({ name: '', email: '', message: '' }); // Clear form
      // } else {
      //   // Handle non-200 responses
      //   setStatus('error');
      //   setMessage(response.data.message || 'Failed to send message. Please try again.');
      // }

      // Simulate success after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setMessage("Your message has been sent successfully!");
      setFormData({ name: "", email: "", message: "" }); // Clear form
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          "Failed to send message. Please try again."
      );
    }
  };

  return (
    <div className="contact-container">
      <header className="contact-header">
        <h1 className="contact-title">Get In Touch</h1>
        <p className="contact-subtitle">I'd love to hear from you!</p>
      </header>

      <section className="contact-form-section">
        <p className="contact-intro-text">
          Whether you have a question about a recipe, a collaboration idea, or
          just want to share your culinary thoughts, feel free to reach out
          using the form below. I read every message and will get back to you as
          soon as I can.
        </p>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Your Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Your Message:</label>
            <textarea
              id="message"
              name="message"
              rows={6}
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Sending..." : "Send Message"}
          </button>

          {status === "success" && (
            <p className="form-status success">{message}</p>
          )}
          {status === "error" && <p className="form-status error">{message}</p>}
        </form>
      </section>
    </div>
  );
};

export default ContactPage;
