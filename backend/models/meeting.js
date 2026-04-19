import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    user_id: {
        type: String, 
        required: true,
        index: true // index for faster queries
    },
    meeting_id: {
        type: String, 
        required: true
    },
    label: {
        type: String,
        default: "Meeting Session"
    },
    meeting_time: {
        type: Date, 
        default: Date.now
    }
}, { timestamps: true });

// Prevent duplicate meeting_id for the same user
meetingSchema.index({ user_id: 1, meeting_id: 1 }, { unique: true });

export default mongoose.model("Meeting", meetingSchema);