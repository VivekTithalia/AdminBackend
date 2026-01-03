import express from "express";
import { Webhook } from "svix";
import User from "../models/user.model.js";

const router = express.Router();

router.post(
    "/clerk",
    // IMPORTANT: raw body is required for Clerk webhook verification
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            console.error("❌ CLERK_WEBHOOK_SECRET missing");
            return res.status(500).json({ message: "Webhook secret not configured" });
        }

        // Clerk / Svix headers
        const svixHeaders = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };

        let event;

        // ✅ Verify webhook signature
        try {
            const wh = new Webhook(WEBHOOK_SECRET);
            event = wh.verify(req.body, svixHeaders);
        } catch (err) {
            console.error("❌ Webhook verification failed:", err.message);
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        try {
            // ===============================
            // USER CREATED
            // ===============================
            if (event.type === "user.created") {
                const user = event.data;

                // ✅ Correct way to get primary email from Clerk
                const primaryEmail = user.email_addresses?.find(
                    (email) => email.id === user.primary_email_address_id
                )?.email_address;

                // Safety check
                if (!primaryEmail) {
                    console.warn("⚠️ No primary email found for user:", user.id);
                    return res.status(200).json({ success: true });
                }

                // Avoid duplicate users
                const existingUser = await User.findOne({
                    clerkUserId: user.id,
                });

                if (!existingUser) {
                    await User.create({
                        clerkUserId: user.id,
                        email: primaryEmail,
                        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                        image: user.image_url,
                    });

                    console.log("✅ User created in MongoDB:", user.id);
                }
            }

            // ===============================
            // USER DELETED
            // ===============================
            if (event.type === "user.deleted") {
                await User.findOneAndDelete({
                    clerkUserId: event.data.id,
                });

                console.log("🗑️ User deleted from MongoDB:", event.data.id);
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("❌ Webhook handler error:", error.message);
            return res.status(500).json({ success: false });
        }
    }
);

export default router;
