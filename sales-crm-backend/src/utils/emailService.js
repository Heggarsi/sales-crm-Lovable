const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter (will be configured later)
let transporter = null;

// Initialize email service
const initializeEmailService = () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    logger.info('Email service initialized');
  } catch (error) {
    logger.error('Email service initialization failed:', error);
  }
};

const emailService = {
  // Send introduction email to lead
  sendIntroductionEmail: async (to, leadName, salesPersonName) => {
    if (!transporter) {
      logger.warn('Email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Welcome - Introduction from Our Team',
        html: `
          <h2>Hello ${leadName},</h2>
          <p>Thank you for your interest in our services.</p>
          <p>My name is ${salesPersonName}, and I will be your dedicated point of contact.</p>
          <p>I look forward to understanding your requirements and helping you achieve your goals.</p>
          <br>
          <p>Best regards,</p>
          <p>${salesPersonName}</p>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('Introduction email sent', { to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send introduction email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send appointment confirmation email
  sendAppointmentEmail: async (to, appointmentDetails) => {
    if (!transporter) {
      logger.warn('Email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Appointment Scheduled',
        html: `
          <h2>Appointment Confirmation</h2>
          <p>Your appointment has been scheduled:</p>
          <ul>
            <li><strong>Title:</strong> ${appointmentDetails.title}</li>
            <li><strong>Date:</strong> ${appointmentDetails.date}</li>
            <li><strong>Duration:</strong> ${appointmentDetails.duration} minutes</li>
            <li><strong>Mode:</strong> ${appointmentDetails.mode}</li>
            ${appointmentDetails.location ? `<li><strong>Location:</strong> ${appointmentDetails.location}</li>` : ''}
          </ul>
          <p>Looking forward to meeting you!</p>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('Appointment email sent', { to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send appointment email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send proposal notification
  sendProposalEmail: async (to, proposalDetails) => {
    if (!transporter) {
      logger.warn('Email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Proposal Submitted',
        html: `
          <h2>Proposal Submitted</h2>
          <p>We have submitted a proposal for your review:</p>
          <ul>
            <li><strong>Proposal Number:</strong> ${proposalDetails.proposalNumber}</li>
            <li><strong>Title:</strong> ${proposalDetails.title}</li>
            <li><strong>Amount:</strong> ${proposalDetails.currency} ${proposalDetails.amount}</li>
            <li><strong>Valid Until:</strong> ${proposalDetails.validityDate}</li>
          </ul>
          <p>Please review and let us know if you have any questions.</p>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('Proposal email sent', { to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send proposal email:', error);
      return { success: false, error: error.message };
    }
  }
};

// Initialize on module load
initializeEmailService();

module.exports = emailService;