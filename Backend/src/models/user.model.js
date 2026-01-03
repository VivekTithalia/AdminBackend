import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        clerkUserId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            default: null,
        },
        name: String,
        image: String,
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User
