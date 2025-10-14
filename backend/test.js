import { sendWelcomeEmail } from "./src/emails/emailHandler.js";
import "dotenv/config";

sendWelcomeEmail("yourrealemail@gmail.com", "Test User", "https://chatin.com")
  .then(() => console.log("✅ Email test passed"))
  .catch((err) => console.error("❌ Email test failed", err));
