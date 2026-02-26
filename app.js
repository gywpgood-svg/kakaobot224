const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("MongoDB 연결 성공"))
.catch(err=>console.log(err));

const UserSchema = new mongoose.Schema({
  uniqueId: String,
  nickHistory: [String],
  joinHistory: [String],
  leaveHistory: [String]
});

const User = mongoose.model("User", UserSchema);

function today(){
  const d = new Date();
  return d.getFullYear()+"."+
         String(d.getMonth()+1).padStart(2,"0")+"."+
         String(d.getDate()).padStart(2,"0");
}

app.get("/", (req,res)=>{
  res.send("alive");
});

app.post("/join", async (req,res)=>{
  const { uniqueId, nick } = req.body;
  let user = await User.findOne({uniqueId});

  if(!user){
    user = new User({
      uniqueId,
      nickHistory:[nick],
      joinHistory:[],
      leaveHistory:[]
    });
  }

  if(!user.nickHistory.includes(nick))
    user.nickHistory.push(nick);

  user.joinHistory.push(today());
  await user.save();

  res.json({status:"ok"});
});

app.post("/leave", async (req,res)=>{
  const { uniqueId } = req.body;
  let user = await User.findOne({uniqueId});
  if(!user) return res.json({status:"none"});

  user.leaveHistory.push(today());
  await user.save();
  res.json({status:"ok"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("서버 실행중"));
