import express from "express";
import Meeting from "../models/meeting.js";

const router = express.Router();

// ─── Save Meeting ──────────────────────────────────
router.post("/save", async (req, res) => {
    try {
        const { user_id, meeting_id, label } = req.body;

        if (!user_id || !meeting_id) {
            return res.status(400).json({ message: "User ID and Meeting ID are required" });
        }

        // Upsert logic: Update time if already exists for this user, otherwise create
        await Meeting.findOneAndUpdate(
            { user_id, meeting_id },
            { label, meeting_time: new Date() },
            { upsert: true, new: true }
        );

        // Keep only the 5 most recent meetings (cleanup)
        const allMeetings = await Meeting.find({ user_id }).sort({ meeting_time: -1 });
        if (allMeetings.length > 5) {
            const oldestToKeep = allMeetings[4].meeting_time;
            await Meeting.deleteMany({ 
                user_id, 
                meeting_time: { $lt: oldestToKeep } 
            });
        }

        res.status(200).json({ message: "Meeting saved successfully" });
    } catch (error) {
        console.error("Save meeting error:", error);
        res.status(500).json({ message: "Server error while saving meeting" });
    }
});

// ─── Get Recent Meetings ──────────────────────────
router.get("/list/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;

        const meetings = await Meeting.find({ user_id })
            .sort({ meeting_time: -1 })
            .limit(5);

        res.status(200).json(meetings);
    } catch (error) {
        console.error("Fetch meetings error:", error);
        res.status(500).json({ message: "Server error while fetching meetings" });
    }
});

export default router;
