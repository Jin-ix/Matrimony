// Email notification service (placeholder for production)
// In production, integrate SendGrid, Mailgun, or AWS SES

export async function sendEmailNotification(
    email: string,
    subject: string,
    body: string
): Promise<void> {
    // In production:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to: email, from: 'noreply@icm.com', subject, html: body });

    console.log(`📧 Email to ${email}: ${subject}`);
}
