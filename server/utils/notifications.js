const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.emailService = emailService;
  }

  async sendPickupNotification(user, pickupRequest, type) {
    try {
      // Check user preferences
      if (!user.preferences?.notifications?.email) {
        return;
      }

      switch (type) {
        case 'confirmed':
          await this.emailService.sendPickupConfirmation(user, pickupRequest);
          break;
        case 'scheduled':
          await this.emailService.sendPickupScheduled(user, pickupRequest);
          break;
        default:
          console.log('Unknown pickup notification type:', type);
      }
    } catch (error) {
      console.error('Failed to send pickup notification:', error);
    }
  }

  async sendReportNotification(user, report, type) {
    try {
      // Check user preferences
      if (!user.preferences?.notifications?.email) {
        return;
      }

      switch (type) {
        case 'acknowledged':
          await this.emailService.sendReportAcknowledged(user, report);
          break;
        case 'resolved':
          await this.emailService.sendReportResolved(user, report);
          break;
        default:
          console.log('Unknown report notification type:', type);
      }
    } catch (error) {
      console.error('Failed to send report notification:', error);
    }
  }

  async sendWelcomeNotification(user) {
    try {
      await this.emailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
    }
  }

  // In-app notification methods (for future implementation)
  async createInAppNotification(userId, title, message, type = 'info') {
    // This would typically save to a notifications collection in the database
    console.log(`In-app notification for user ${userId}: ${title} - ${message}`);
  }

  async sendBinOverflowAlert(binId, users) {
    try {
      const title = 'Bin Overflow Alert';
      const message = `Bin ${binId} is overflowing and requires immediate attention.`;

      // Send to all assigned users and authorities
      for (const user of users) {
        if (user.preferences?.notifications?.email) {
          // Send email notification
          await this.emailService.sendEmail(
            user.email,
            title,
            `<p>${message}</p><p>Please schedule a pickup as soon as possible.</p>`,
            message
          );
        }

        // Create in-app notification
        await this.createInAppNotification(user._id, title, message, 'warning');
      }
    } catch (error) {
      console.error('Failed to send bin overflow alert:', error);
    }
  }

  async sendMaintenanceReminder(binId, users) {
    try {
      const title = 'Bin Maintenance Reminder';
      const message = `Bin ${binId} is due for maintenance.`;

      for (const user of users) {
        if (user.role === 'authority' && user.preferences?.notifications?.email) {
          await this.emailService.sendEmail(
            user.email,
            title,
            `<p>${message}</p><p>Please schedule maintenance for this bin.</p>`,
            message
          );
        }

        await this.createInAppNotification(user._id, title, message, 'info');
      }
    } catch (error) {
      console.error('Failed to send maintenance reminder:', error);
    }
  }

  async sendPickupReminder(user, pickupRequest) {
    try {
      if (!user.preferences?.notifications?.email) {
        return;
      }

      const title = 'Pickup Reminder';
      const message = `Your scheduled pickup is tomorrow. Please ensure your bin is accessible.`;

      await this.emailService.sendEmail(
        user.email,
        title,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Pickup Reminder</h2>
          <p>Dear ${user.name},</p>
          <p>This is a reminder that your pickup is scheduled for tomorrow:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Request ID:</strong> ${pickupRequest.requestId}</p>
            <p><strong>Scheduled Date:</strong> ${new Date(pickupRequest.scheduledDateTime).toLocaleDateString()}</p>
            <p><strong>Scheduled Time:</strong> ${new Date(pickupRequest.scheduledDateTime).toLocaleTimeString()}</p>
          </div>
          <p>Please ensure your bin is accessible and placed at the pickup location.</p>
          <p>Thank you for using SmartBin!</p>
        </div>
        `,
        message
      );

      await this.createInAppNotification(user._id, title, message, 'info');
    } catch (error) {
      console.error('Failed to send pickup reminder:', error);
    }
  }
}

module.exports = new NotificationService();