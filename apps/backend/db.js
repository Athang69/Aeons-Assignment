const mongoose = require("mongoose")
const schema = mongoose.Schema
const objectId = schema.ObjectId;

const users = new schema({
  email:{type:String, unique:true},
  password:String,
  username:String
})

const UserModel= mongoose.model('Users',users)

module.exports={
  UserModel
}