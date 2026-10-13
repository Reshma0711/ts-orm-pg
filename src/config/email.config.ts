import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env.config";

let emailTransporter: Transporter | undefined;

export function getEmailTransporter(): Transporter {
  if (emailTransporter) {
    return emailTransporter;
  }

  const { host, port, username, password } = env.email;

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
  const from = env.email.from;
  if (!from) {
    throw new Error("Email is not configured. Set SMTP_FROM.");
  }

  return from;
}
