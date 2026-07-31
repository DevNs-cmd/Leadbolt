// This is a placeholder - implement actual email sending later
export async function sendEmail({ to, subject, html }: any) {
  console.log(`📧 Email would be sent to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${html}`);
  return { success: true };
}