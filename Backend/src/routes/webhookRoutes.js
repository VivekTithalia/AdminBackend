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
            return res.status(500).json({ message: "Webhook secret not configured" });
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
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        // ✅ Handle events
        if (event.type === "user.created") {
            const user = event.data;

            await User.create({
                clerkUserId: user.id,
                email: user.email_addresses[0]?.email_address,
                name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                image: user.image_url,
            });
        }

        if (event.type === "user.deleted") {
            await User.findOneAndDelete({ clerkUserId: event.data.id });
        }

        res.status(200).json({ success: true });
    }
);

export default router;
