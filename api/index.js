const express = require("express");
const cors=require("cors");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser =require("cookie-parser");
const multer =require("multer");
const User = require("./models/User");
const Post = require("./models/Post")
const CryptoJS=require("crypto-js");
const jwt=require("jsonwebtoken");

app.use(express.json());
app.use(cors());
dotenv.config();
app.use(cookieParser());

mongoose.connect(
    process.env.MONGO_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
).then(()=>{
    console.log("DB connection successfull")
}).catch((err)=>{
    console.log(err);
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "../client/public/upload");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname);
    },
  });

const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), function (req, res) {
  const file = req.file;
  res.status(200).json(file.filename);
});

app.post("/register", async (req, res) => {
    //console.log(req.body);
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(req.body.password,process.env.PASS_SEC)
        .toString()
    });
    //saving to database
    try {
        const user = await newUser.save();
        res.status(201).json(user);

    } catch (error) {
        res.status(500).json(error);
    }

});

app.post("/login", async (req, res) => {
    
    try {
        const user = await User.findOne({ email: req.body.username });
        if(!user) {
            console.log("wrong username!!")
            // res.status(404).json("Wrong Username");
        }
        else{

            //decrypted password
            const hashedPassword =CryptoJS.AES.decrypt(
                user.password,
                process.env.PASS_SEC

            )
            const OriginalPassword=hashedPassword.toString(CryptoJS.enc.Utf8);

            //checking equality of decrypted and entered password
            if(OriginalPassword!==req.body.password) {
                console.log("wrong password!!")
                // res.status(401).json("Wrong Password");
            }

        }
        
        

        //verifying using jwt
        const accessToken=jwt.sign(
            {
                id:user._id,
                isAdmin:user.isAdmin,

            },process.env.JWT_SEC,
            {expiresIn:"3d"}
        )

        const {password,...other}=user._doc;
        res.cookie("access_token", accessToken, {
            httpOnly: true
          })
          .status(200)
          .json({other,accessToken});
         
    } catch (err) {
        res.status(500).json(err);
    }
}
)

// app.post("/create", async (req,res)=>{
//     const token = req.cookies.access_token;
//     console.log(req.cookies)
//     console.log(req.cookies)
//     return
//     if(!token) return res.status(401).json("Not authenticated!");

//     let newPost;
//     jwt.verify(token,process.env.JWT_SEC,(err,userInfo)=>{
//         if (err) return res.status(403).json("Token is not valid!") 

//         newPost = new Post({
//             title:req.body.title,
//             desc:req.body.desc,
//             // img:req.body.img,
//             authorId:userInfo.id
//         });
//     })

    
//     //saving to database
//     try {
//         const post = await newPost.save();
//         res.status(201).json(post);

//     } catch (error) {
//         res.status(500).json(error);
//     }

// })

app.post("/create", async (req,res)=>{
    img_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    let newPost;
    newPost = new Post({
        title:req.body.title,
        desc:req.body.desc,
        img:img_url,
    });
    //saving to database
    try {
        const post = await newPost.save();
        res.status(201).json(post);

    } catch (error) {
        res.status(500).json(error);
    }

})

//update
app.put("/update/:id",async (req,res)=>{
    // const token = req.cookies.access_token;
    // console.log(token)
    // if(!token) return res.status(401).json("Not authenticated!");

    // jwt.verify(token,process.env.JWT_SEC,(err,userInfo)=>{
    //     if (err) return res.status(403).json("Token is not valid!")
    //     // else return res.status(201).json("Token is valid u can proceed");
    // })
    // console.log(req.params.id)

    try {
            const updatedPost = await Post.findByIdAndUpdate(req.params.id,
                {
                    $set: req.body
                }, {
                new: true
            });
            res.status(200).json(updatedPost)

    }catch (error) {
            res.status(500).json("error");
    }

})

//Delete
app.delete("/delete/:id",async (req,res)=>{
    // const token = req.cookies.access_token;
    // console.log(token)
    // if(!token) return res.status(401).json("Not authenticated!");

    // jwt.verify(token,process.env.JWT_SEC,(err,userInfo)=>{
    //     if (err) return res.status(403).json("Token is not valid!")
    //     // else return res.status(201).json("Token is valid u can proceed");
    // })

    try {
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json("The post has been deleted..")

    } catch (error) {
        res.status(500).json("error");
    }

})

//Read
app.get("/read/:id",async (req,res)=>{
    try {
        const post=await Post.findById(req.params.id);
        res.status(200).json(post);

    } catch (error) {
        res.status(500).json("error");
    }
})

//get category
app.get("/readcat",async (req,res)=>{

    try {
        const posts =await Post.find({ "cat": req.query.cat});
        res.status(200).json(posts.reverse())

    } catch (error) {
        res.status(500).json("error");
    }
})

//get all
app.get("/readall",async (req,res)=>{

    try {
        const posts =await Post.find();
        res.status(200).json(posts.reverse())

    } catch (error) {
        res.status(500).json("error");
    }
})

//log out
app.post("/logout",async (req,res)=>{
    res.clearCookie("access_token",{
        sameSite:"none",
        secure:true
      }).status(200).json("User has been logged out.")
})

app.listen(8000,(req,res)=>{
    console.log("server is running !!")
})