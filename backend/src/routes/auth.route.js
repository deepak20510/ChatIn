import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
const router = express.Router();

router.use(arcjetProtection);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Test endpoint to debug cookie issues
router.get("/test-cookies", (req, res) => {
  console.log("=== COOKIE TEST ENDPOINT ===");
  console.log("All cookies:", req.cookies);
  console.log("Raw cookie header:", req.headers.cookie);
  console.log("Origin:", req.headers.origin);
  console.log("User-Agent:", req.headers['user-agent']);
  console.log("============================");
  
  res.json({
    message: "Cookie test endpoint",
    cookies: req.cookies,
    rawCookieHeader: req.headers.cookie,
    origin: req.headers.origin
  });
});

router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, (req, res) =>
  res.status(200).json(req.user),
);

export default router;
