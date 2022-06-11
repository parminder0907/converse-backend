import express from 'express';
import mongoose from 'mongoose';
import Messages from './messagesDB.js';
import Pusher from 'pusher';
import cors from 'cors'
import { config } from 'dotenv';

config()
const PUSHER_ID=process.env.PUSHER_ID
const PUSHER_KEY=process.env.PUSHER_KEY
const PUSHER_SECRET=process.env.PUSHER_SECRET
const port = process.env.PORT || 9000;

const app = express();

let uptime = ""

//Pusher - real time
const pusher = new Pusher({
    appId: PUSHER_ID,
    key: `"${PUSHER_KEY}"`,
    secret: `"${PUSHER_SECRET}"`,
    cluster: "ap2",
    useTLS: true
});

//MIDDLEWARE
app.use(express.json())
app.use(cors({ origin: true }))

//DB CONFIG
const DB_CONN_URL=`mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@cluster0.j8sft.mongodb.net/?retryWrites=true&w=majority`
mongoose.connect(DB_CONN_URL,
    err => {
        if(err) throw err;
        console.log('Connected to MongoDB') 
    }
);

const db = mongoose.connection

db.once( "open", () => {
    console.log("DB connected and watching messagescollections for any changes...")

    const msgCollection = db.collection("messagescollections")
    const changeStream = msgCollection.watch()

    changeStream.on("change", (change) => {
        console.log("Change detected")
        if (change.operationType == 'insert') {
            pusher.trigger("messages", "inserted", change.fullDocument)
        } else {
            console.log("Error triggering pusher")
        }
    })
} )


app.get("/api/v1/messages/sync", (req,res) => {
    Messages.find((err, data) => {
        if(err) {
            res.status(500).json(err)
        } else {
            res.status(200).json(data)
        }
    })
})
app.post("/api/v1/messages/new", (req,res) => {
    const message = req.body

    Messages.create(message, (err, data) => {
        if(err) {
            res.status(500).json(err)
        } else {
            res.status(201).json(data)
        }
    })
})


app.get("/", (req,res) => {
    res.status(200).send(`${uptime} : Server is up and running.`)
})

app.listen(port, () => {
    uptime = new Date().toUTCString()
    console.log(`${uptime} : Server listening at port ${port}`)
})
