const express = require('express')
const app = express()
const cors = require("cors")
const { db } = require('./db/db');
//const User = require("./models/user.model")

require("dotenv").config();
//console.log("MONGO_URL:", process.env.MONGO_URL); // Log the MONGO_URL for debugging

const config = require("./config.json")
const mongoose = require("mongoose")

const User = require("./models/user.model")
const Note = require("./models/note.model")

const jwt = require("jsonwebtoken")
const { authenticateToken } = require("./utilities")
const PORT = 8000

app.use(express.json())
app.use(
    cors({
        origin :"*",
    })
)

app.get("/", (req,res) => {
    res.json({data: "hello"})
})

app.post("/create-acc", async (req, res) => {
    const {fullName, email, password} = req.body;
    if (!fullName){
        return res.status(400).json({error: true, message:"Full Name is required"})
    }

    if (!email){
        return res.status(400).json({error: true, message:"Email is required"})
    }

    if (!password){
        return res.status(400).json({error: true, message:"Password is required"})
    }

    const isUser = User.findOne({ email : email })

    // if (isUser){
    //     return res.json({
    //         error: true,
    //         message: "User already exists",
    //     })
    // }

    const user = new User ({
        fullName,
        email,
        password,
    })

    await user.save()

    let accessToken;
    try {
        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY is not defined");
        }
        accessToken = jwt.sign({user}, process.env.SECRET_KEY, {
            expiresIn : "30000m",
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }

    return res.json({
        error:false,
        user,
        accessToken,
        message: "Registration Successful"
});
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required"})
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required"})
    }
    const userInfo = await User.findOne({ email: email });
    if (!userInfo) {
        return res.status(400).json({ error: true, message: "User not found"})
    }
    if (userInfo.email == email && userInfo.password == password){
        const user ={ user : userInfo}
        const accessToken = jwt.sign(user, process.env.SECRET_KEY, {
        expiresIn:"36000m",
        })
        return res.json({
            error:false,
            message:"Login Successful",
            email,
            accessToken,
        })
    }
    else{
        return res.status(400).json({ error: true, message: "Invalid Password"})
    }
})

app.get("/get-user", authenticateToken, async (req,res) =>{
    const { user } = req.user;
    const isUser = await User.findOne({ _id: user._id });

    if(!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: isUser,
        message: "",
    });
});

app.post("/add-note", authenticateToken, async (req, res) =>{
    const { title, content, tags } = req.body;
    const { user } = req.user;

    if(!title){
        return res.status(400).json({error: true.valueOf, message: "Title is required"});
    }
    
    if(!content){
        return res.status(400).json({error: true, message:"Content is required"});
    }
    
    try{
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

    await note.save();
    
    return res.json({
        error: false,
        note,
        message: "Note added successfully",
        });
    }catch(error){
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        })
    }
});

app.put("/edit-note/:noteId", authenticateToken, async (req, res) =>{
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if(!title && !content && !tags){
        return res
        .status(400)
        .json({error: true, message: "No changes provided"});
    }
    
    try{
        const note = await Note.findById({_id: noteId, userId: user._id});

        if(!note){
            return res.status(404).json({error: true, message: "Note not found"})
        }
        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;
        
        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated successfully",
        });
        }catch(error){
            return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        })
    }
})

app.get("/get-all-notes", authenticateToken, async (req, res) =>{
    const { user } = req.user;

    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1});
        return res.json({
            error: false,
            notes,
            message: "Notes retrieved successfully",
            });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
            })
        }
    })

app.delete("/delete-notes/:noteId", authenticateToken, async (req, res) =>{
    const noteId = req.param.noteId;
    const { user } = req.user;

    try {
        const note = await Note.findOne({_id:noteId, userId: user._id});
        return res.json({
            error: false,
            message: "Note deleted successfully",
        });   
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
})

app.put("/update-note-isPinned/:noteId", authenticateToken, async (req, res) =>{
    const noteId = req.param.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if(!title && !content && !tags){
        return res
        .status(400)
        .json({error: true, message: "No changes provided"});
    }
    
    try{
        const note = await Note.findById({_id: noteId, userId: user._id});

        if(!note){
            return res.status(404).json({error: true, message: "Note not found"})
        }
        if (isPinned) note.isPinned = isPinned;
        
        await note.save();

        return res.json({ 
            error: false,
            note,
            message: "Note updated successfully",
        });
        }catch(error){
            console.log(error)
            return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        })
    }
})

const server = () => {
    db()
    app.listen(PORT, () => {
        console.log(`Listening to ${PORT}`)
    })
}

server()

module.exports = app

