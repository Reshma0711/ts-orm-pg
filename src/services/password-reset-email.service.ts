import {
  getEmailFromAddress,
  getEmailTransporter,
} from "../config/email.config";

export async function sendPasswordResetEmail(
  email: string,
  otp: string
): Promise<void> {
  await getEmailTransporter().sendMail({
    from: getEmailFromAddress(),
    to: email,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes and can only be used once.\n\nIf you did not request a password reset, you can ignore this email.`,
  });
}
