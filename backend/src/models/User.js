import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Normalize emails to lowercase at DB level
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // createdAt and updatedAt
);

userSchema.index({ fullName: 1 });
// Email uniqueness is enforced above via unique:true + index:true

const User = mongoose.model("User", userSchema);
export default User;
