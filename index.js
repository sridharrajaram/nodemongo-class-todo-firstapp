const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
console.log(process.env);
const PORT = process.env.PORT || 3001;
//const url = "mongodb://localhost:27017"
const url = process.env.DB_URL


function authenticate(req, res, next) {
    try {
        console.log(req.headers.authorization)
        //check if token is present
        // if present, check whether it is valid token
        if (req.headers.authorization) {

            jwt.verify(req.headers.authorization, process.env.JWT_SECRET, function (err, decoded) {
                if (err) {
                    res.status(401).json({
                        message: "UnAuthorized"
                    })
                } else {
                    next()
                }
            })

        } else {
            res.status(404).json({
                message: "No Token Present"
            })
        }
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Issue"
        })
    }
}

// to avoid cors error
app.use(cors({
    origin: "*"
}))

app.use(express.json()) //this middleware will extract the body from request and store it in req.body variable

/* let tasks =[]; */ //as we are going to use mongoDB

app.post("/register", async function (req, res) {
    console.log(req.body);
    try {
        //connect the database
        let client = await mongoClient.connect(url) //since it is returning the promise, we are puting in try catch async

        //select the db
        let db = client.db("todo_app")

        //select the collection and perform the action
        delete req.body.confirmpassword

        //Hashing the password before storing in database
        var salt = bcrypt.genSaltSync(10); //tearing in pieces
        var hash = bcrypt.hashSync(req.body.password, salt) //mixing with secret key
        req.body.password = hash; // newgenerated to password

        let data = await db.collection("users").insertOne(req.body) //since it is returning the promise we put await

        //close the database
        await client.close();

        res.json({
            message: "User registered sucessfully",
            id: data._id
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "something went wrong"
        })
    }

})



app.post("/login", async function (req, res) {

    try {
        //connect the database
        let client = await mongoClient.connect(url) //since it is returning the promise, we are puting in try catch async

        //select the db
        let db = client.db("todo_app")

        //find the user with his email address
        let user = await db.collection("users").findOne({ emailAddress: req.body.emailAddress });

        if (user) {
            //Hash the incoming password
            //compare the password with user's password
            let matchPwd = bcrypt.compareSync(req.body.password, user.password)
            if (matchPwd) {
                // Generate JWT token and shared to react APP
                let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
                console.log(token);
                res.json({
                    message: true,
                    token
                })
            }
            else {
                res.status(400).json({
                    message: "email address / password does not match"
                })
            }
        } else {
            res.status(400).json({
                message: "email address / password does not match"
            })
        }

        //close the database
        await client.close();

    } catch (error) {
        res.status(500).json({
            message: "something went wrong"
        })
    }

})

app.get("/todo-list", [authenticate], async function (req, res) {

    // mongodb Database concept introduced
    try {
        //connect the database
        let client = await mongoClient.connect(url) //since it is returning the promise, we are puting in try catch async

        //select the db
        let db = client.db("todo_app")

        //select the collection and perform the action
        let data = await db.collection("tasks").find().toArray() //since it is returning the promise we put await, what see is cursor pointer, so toArray

        //close the database
        await client.close();

        res.json(data) //reply with data

    } catch (error) {
        res.status(500).json({
            message: "something went wrong"
        })
    }

})

app.post("/create-task",[authenticate], async function (req, res) {

    // mongodb Database concept introduced
    try {
        //connect the database
        let client = await mongoClient.connect(url) //since it is returning the promise, we are puting in try catch async

        //select the db
        let db = client.db("todo_app")

        //select the collection and perform the action
        let data = await db.collection("tasks").insertOne(req.body) //since it is returning the promise we put await

        //close the database
        await client.close();

        res.json({
            message: "Task added sucessfully"
        })
    } catch (error) {
        res.status(500).json({
            message: "something went wrong"
        })
    }

})

app.put("/update-task/:id",[authenticate], async function (req, res) {

    // mongodb Database concept introduced
    try {
        //connect the database
        let client = await mongoClient.connect(url) //since it is returning the promise, we are puting in try catch async

        //select the db
        let db = client.db("todo_app")

        //select the collection and perform the action
        let data = await db.collection("tasks")
            .findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body })

        //close the database
        await client.close();

        res.json({
            message: "Task updated sucessfully"
        })
    } catch (error) {
        res.status(500).json({
            message: "something went wrong"
        })
    }

})


app.delete("/delete-task/:id",[authenticate], async function (req, res) {

    // mongodb Database concept introduced
    try {
        //connect the database
        let client = await mongoClient.connect(url) //since it is returning the promise, we are puting in try catch async

        //select the db
        let db = client.db("todo_app")

        //select the collection and perform the action
        let data = await db.collection("tasks")
            .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) })

        //close the database
        await client.close();

        res.json({
            message: "Task deleted sucessfully"
        })
    } catch (error) {
        res.status(500).json({
            message: "something went wrong"
        })
    }

})


app.get("/dashboard", [authenticate], async function (req, res, next) {
    res.json({
        message: "protected data"
    })
})

app.listen(PORT, function (req, res) {
    console.log(`the app is listening in port ${PORT}`)
})
