var mongoose = require("mongoose");
var URI = "mongodb+srv://harshit09a:<password>@cluster0.ptuyu.mongodb.net/yelp_camp?retryWrites=true&w=majority"
var connectDB = async()=>{
    await mongoose.connect(URI,{
        useNewUrlParser:true,
        useUnifiedTopology: true,
        useFindAndModify:false
    }).then(()=>{console.log("Connected To DB")})
    .catch((err)=>{console.log("Error",err.message)});
}
module.exports = connectDB;
