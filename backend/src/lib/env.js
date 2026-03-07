import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV,
};

// Validate critical environment variables
if (!ENV.JWT_SECRET) {
  console.error("❌ CRITICAL: JWT_SECRET is not set!");
  console.error("📖 Please follow these steps:");
  console.error(
    "   1. Generate JWT secret: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  );
  console.error("   2. Create backend/.env file");
  console.error("   3. Add: JWT_SECRET=your_generated_secret");
  console.error("   4. Restart the server");
  console.error("📚 For more help, see JWT_SETUP_GUIDE.md");
  process.exit(1);
}

if (!ENV.MONGO_URI) {
  console.warn("⚠️  MONGO_URI is not set - database connection will fail");
}
