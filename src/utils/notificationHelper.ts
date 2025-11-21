// utils/notificationHelper.ts
export const NotificationHelper = {
  async sendSMS(to: string, message: string): Promise<void> {
    console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
  },

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
  }
};


// require('dotenv').config();
// const axios = require('axios');

// const NotificationHelper = {
//   async sendSMS(to, message) {
//     try {
//       let url = process.env.SMS_PROVIDER_URL;

//       const placeholders = {
//         '{{user}}': process.env.SMS_API_USER,
//         '{{apikey}}': process.env.SMS_API_KEY,
//         '{{senderid}}': process.env.SMS_SENDER_ID,
//         '{{tid}}': process.env.SMS_TEMPLATE_ID,
//         '{{to}}': encodeURIComponent(to),
//         '{{message}}': encodeURIComponent(message)
//       };

//       for (const [key, value] of Object.entries(placeholders)) {
//         url = url.replace(new RegExp(key, 'g'), value);
//       }

//       const response = await axios.get(url);
//       console.log('SMS sent:', response.data);
//       return response.data;
//     } catch (err) {
//       console.error('Error sending SMS:', err.message);
//       throw err;
//     }
//   }
// };

// module.exports = NotificationHelper;
