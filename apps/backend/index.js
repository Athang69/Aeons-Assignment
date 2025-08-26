const express=require("express")
const app=express();
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const { z }=require("zod");
require('dotenv').config()
app.use(express.json());

async function connect_DB(){
  const mongoose=require("mongoose");
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to DB")
}
connect_DB();

const {UserModel}=require("./db")


function auth(req,res,next){
  try {
    const token=req.headers.token
    const decoded_data=jwt.verify(token,process.env.JWT_Secret)
    req.userId=decoded_data.id
    next()
  } catch (e) {
    res.status(403).json({
      message:"Invalid token or user does not exist"
    });
  }
}

app.post("/signup",async function(req,res){
  const requiredBody=z.object({
    email:z.string().min(5).max(50).email(),
    password:z.string().min(8).max(100).refine((val)=>{
      return (
      /[a-z]/.test(val) &&
      /[A-Z]/.test(val)&&
      /[^a-zA-Z0-9]/.test(val) 
      );
    }),
    username:z.string().min(3).max(100)
  })
  const parsedData=requiredBody.safeParse(req.body);
  if(!parsedData.success){
    res.json({
      message:"The format you entered is not valid (input validation failed)",
      error:parsedData.error.flatten().fieldErrors
    })
    return
  }
  const email=req.body.email;
  const password=req.body.password;
  const username=req.body.username;
  let errorthrown=false;
    try{
    const hashedPassword=await bcrypt.hash(password, 5);
    console.log(hashedPassword);
    await UserModel.create({
      email:email,
      password:hashedPassword,
      username:username
    })
  }
  catch(e){
  if (e.code===11000) { 
    res.status(409).json({
      message: "User already exists with this email"
    });
  } else {
    console.error("Signup error:", e);
    res.status(500).json({
      message: "Internal server error"
    });
  }
  errorthrown=true;
  }
  if(!errorthrown){
  res.json({
    message:"You are Signed up"
  })
}
})

app.post("/signin",async function(req,res){
  const email=req.body.email;
  const password=req.body.password;
  
  const user=await UserModel.findOne({
      email:email
  })
  if(!user){
    res.status(403).json({
      message:"The user does not exist in our database"
    })
    return
  }
  const passwordmatch=await bcrypt.compare(password,user.password); 
  if(passwordmatch){
    const token=jwt.sign({
      id:user._id.toString()
    },process.env.JWT_Secret);
    res.json({
      token:token
    })
  }
  else{
    res.status(403).json({
      message:"Invalid Credentials"
    })
  }
})

app.listen(3000);