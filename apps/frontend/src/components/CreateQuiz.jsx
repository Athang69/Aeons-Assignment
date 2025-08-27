const axios = require("axios");
const { useState } = require("react");


export default function CreateQuiz(){
  const [title,setTitle]=useState("")
  const [description,setDescription]=useState("")
  const [questions,setQuestions]=useState("")

  const token=localStorage.getItem("token")
  async function handleCreateQuiz(){
    await axios.post("http://localhost:3000/quiz/create",
      {title, description, isPublic:true, questions},
      {headers:{token}}
    )
    window.location.reload()
  }

  return <>
    
  </>
}