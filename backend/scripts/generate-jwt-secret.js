#!/bin/bash

const crypto = require("crypto");

console.log("\n🔐 Generating Secure JWT Secret Key...\n");

// Generate 32 random bytes and convert to hex
const jwtSecret = crypto.randomBytes(32).toString("hex");

console.log("✅ Your JWT Secret Key:");
console.log("━".repeat(80));
console.log(jwtSecret);
console.log("━".repeat(80));

console.log("\n📝 Steps to use this key:");
console.log("1. Copy the key above");
console.log("2. Create a .env file in backend/ folder");
console.log("3. Add: JWT_SECRET=" + jwtSecret);
console.log(
  "4. For Render production, add the same key to environment variables",
);
console.log("\n⚠️  Keep this key SECRET - never commit to git!\n");
