import mongoose from "mongoose";

const messagesSchema = mongoose.Schema({
    message: String,
    uname: String,
    timestamp: String,
    received: Boolean
})

export default mongoose.model('messagescollections', messagesSchema)