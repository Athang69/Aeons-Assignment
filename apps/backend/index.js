require('dotenv').config()
const express=require("express")
const app=express()
const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")
const { z }=require("zod")
app.use(express.json())
const {UserModel,QuestionModel, attemptModel, QuizModel}=require("./db")

// console.log(process.env.MONGO_URL)

async function connect_DB(){
  const mongoose=require("mongoose");
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to DB")
}
connect_DB();

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

app.get("/dashboard",auth,async function(req,res){
  const user = await UserModel.findById(req.userId)
  if(!user){
    res.status(403).json({
      message:"This user does not exist"
    })
  }
  else{
    try{
      const quizzes = await QuizModel.find({owner:req.userId})
      const attempts = await attemptModel.find({user:req.userId}).populate('quiz')
      const dashboardData = quizzes.map(quiz => {
        const quizAttempts = attempts.filter(attempt => String(attempt.quiz._id) === String(quiz._id))
        const totalScore = quizAttempts.reduce((acc, attempt) => acc + attempt.score, 0)
        const totalMaxScore = quizAttempts.reduce((acc, attempt) => acc + attempt.maxScore, 0)
        return{
          quizId: quiz._id,
          title: quiz.title,
          description: quiz.description,
          owner: quiz.owner,
          isPublic: quiz.isPublic,
          questionCount: quiz.questions.length,
          quizAttempts,
          totalScore,
          totalMaxScore
        }
      })
      res.status(200).json({
        dashboardData
      })
    }
  catch(e){
    res.status(404).json({
      error:e.message
    })
}}
})  

app.post("/quiz/create",auth, async function(req,res){
  try{
    const {title, description, isPublic, questions}=req.body
    const quiz = await QuizModel.create({
      owner:req.userId,
      title,
      description,
      isPublic,
      questions
    })
    res.status(200).json(quiz)
  }
  catch(e){
    res.status(400).json({
      error:e.message
    })
  }
})

app.get("/quiz/:id",async function(req,res){
  try{
    const quiz = await QuizModel.findById(req.params.id).select("-questions.correctOption")
    if(!quiz){
      res.status(404).json({
        message:"Quiz not found"
      })
      return
    }
    res.status(200).json(quiz)
  }
  catch(e){
    res.status(404).json({
      error:e.message
    })
  }
})

app.post("/quiz/:id/attempt",auth,async function(req,res){
  try{
    const quiz = await QuizModel.findById(req.params.id)
    if(!quiz){
      res.status(404).json({
        message:"Quiz not found"
      })
      return
    }

    const {answers}=req.body
    let score=0
    let maxScore=0  
    const evaluated=[]

    quiz.questions.forEach(q => {
      const ans=answers.find(a => a.questionId === String(q._id))
      if (!ans){
        return
      }
      const correct=ans.chosenIndex===q.correctOption
      const points=correct?q.points:0
      score+=points
      maxScore+=q.points
      evaluated.push({
        questionId:q._id,
        chosenIndex:ans.chosenIndex,
        correct,
        pointsAwarded:points
      })
    })
    const attemp=await attemptModel.create({
      quiz:quiz._id,
      user:req.userId,
      answers:evaluated,
      score,
      maxScore
    }) 
    res.status(200).json({
      score:score,
      maxScore:maxScore,
      attempt:attemp
    })
  }
  catch(e){
    res.status(400).json({
      error:e.message
    })
  }
})
app.listen(3000);