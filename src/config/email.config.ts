import nodemailer, { Transporter } from "nodemailer";

let emailTransporter: Transporter | undefined;

export function getEmailTransporter(): Transporter {
  if (emailTransporter) {
    return emailTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !username ||
    !password
  ) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD."
    );
  }

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: username,
      pass: password,
    },
  });

  return emailTransporter;
}

export function getEmailFromAddress(): string {
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new Error("Email is not configured. Set SMTP_FROM.");
  }

  return from;
}
