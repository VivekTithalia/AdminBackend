import express from "express";
import { Webhook } from "svix";
import User from "../models/user.model.js";

const router = express.Router();

router.post(
    "/clerk",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            return res.status(500).json({ success: false });
        }

        const svixHeaders = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };

        let event;

        try {
            const wh = new Webhook(WEBHOOK_SECRET);
            event = wh.verify(req.body, svixHeaders);
        } catch (err) {
            console.error("Webhook verification failed:", err.message);
            return res.status(400).json({ success: false });
        }

        try {
            if (event.type === "user.created") {
                const user = event.data;

                const email =
                    user.email_addresses?.find(
                        (e) => e.id === user.primary_email_address_id
                    )?.email_address ||
                    user.email_addresses?.[0]?.email_address ||
                    null;

                const existingUser = await User.findOne({
                    clerkUserId: user.id,
                });

                if (!existingUser) {
                    await User.create({
                        clerkUserId: user.id,
                        email, // may be null
                        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                        image: user.image_url,
                    });

                    console.log("✅ User created:", user.id);
                }
            }

            if (event.type === "user.deleted") {
                await User.findOneAndDelete({
                    clerkUserId: event.data.id,
                });
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Webhook handler error:", error.message);
            return res.status(500).json({ success: false });
        }
    }
);

export default router;
