import mongoose from "mongoose";
const meetingSchema = new mongoose.meetingSchema({
    user_id:{type: String, required: true},
    meeting_id:{type: String, required: true},
    meeting_password:{type: String, required: true},
    meeting_time:{type: Date, default: Date.now}
})
export default mongoose.model("Meeting", meetingSchema)