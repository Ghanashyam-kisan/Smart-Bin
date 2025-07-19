const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: `"SmartBin System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendPickupConfirmation(user, pickupRequest) {
    const subject = 'Pickup Request Confirmed - SmartBin';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Pickup Request Confirmed</h2>
        <p>Dear ${user.name},</p>
        <p>Your pickup request has been confirmed with the following details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request ID:</strong> ${pickupRequest.requestId}</p>
          <p><strong>Requested Date:</strong> ${new Date(pickupRequest.requestedDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${pickupRequest.priority}</p>
          <p><strong>Status:</strong> ${pickupRequest.status}</p>
        </div>
        <p>We will notify you when your pickup is scheduled and when it's completed.</p>
        <p>Thank you for using SmartBin!</p>
      </div>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }

  async sendPickupScheduled(user, pickupRequest) {
    const subject = 'Pickup Scheduled - SmartBin';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Pickup Scheduled</h2>
        <p>Dear ${user.name},</p>
        <p>Your pickup has been scheduled:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request ID:</strong> ${pickupRequest.requestId}</p>
          <p><strong>Scheduled Date:</strong> ${new Date(pickupRequest.scheduledDateTime).toLocaleDateString()}</p>
          <p><strong>Scheduled Time:</strong> ${new Date(pickupRequest.scheduledDateTime).toLocaleTimeString()}</p>
          <p><strong>Vehicle:</strong> ${pickupRequest.assignedTo.vehicle}</p>
        </div>
        <p>Please ensure your bin is accessible at the scheduled time.</p>
        <p>Thank you for using SmartBin!</p>
      </div>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }

  async sendReportAcknowledged(user, report) {
    const subject = 'Report Acknowledged - SmartBin';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Report Acknowledged</h2>
        <p>Dear ${user.name},</p>
        <p>Thank you for reporting an issue. We have acknowledged your report:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Report ID:</strong> ${report.reportId}</p>
          <p><strong>Type:</strong> ${report.type}</p>
          <p><strong>Status:</strong> ${report.status}</p>
          <p><strong>Priority:</strong> ${report.priority}</p>
        </div>
        <p>We are working on resolving this issue and will keep you updated.</p>
        <p>Thank you for helping us maintain our service quality!</p>
      </div>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }

  async sendReportResolved(user, report) {
    const subject = 'Report Resolved - SmartBin';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Report Resolved</h2>
        <p>Dear ${user.name},</p>
        <p>We're pleased to inform you that your report has been resolved:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Report ID:</strong> ${report.reportId}</p>
          <p><strong>Type:</strong> ${report.type}</p>
          <p><strong>Resolution:</strong> ${report.resolution.description}</p>
          <p><strong>Resolved Date:</strong> ${new Date(report.resolution.resolvedAt).toLocaleDateString()}</p>
        </div>
        <p>If you have any feedback about the resolution, please let us know.</p>
        <p>Thank you for using SmartBin!</p>
      </div>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to SmartBin!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Welcome to SmartBin!</h2>
        <p>Dear ${user.name},</p>
        <p>Welcome to SmartBin, your intelligent waste management solution!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What you can do with SmartBin:</h3>
          <ul>
            <li>Schedule waste pickups</li>
            <li>Report bin issues</li>
            <li>Track your recycling statistics</li>
            <li>Monitor bin status in real-time</li>
          </ul>
        </div>
        <p>Get started by logging into your account and exploring the features.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Thank you for choosing SmartBin!</p>
      </div>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService();