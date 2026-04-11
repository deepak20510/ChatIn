import { Resend } from "resend";
import { ENV } from "./env.js";

if (!ENV.RESEND_API_KEY) {
  console.warn("⚠️  RESEND_API_KEY is not set — Email sending is disabled.");
}

export const resendClient = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

export const sender = {
  email: ENV.EMAIL_FROM || "noreply@yourdomain.com",
  name: ENV.EMAIL_FROM_NAME || "ChatIn",
};
