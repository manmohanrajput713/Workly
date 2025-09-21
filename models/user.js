


const mongoose= require("mongoose")

const Schema= mongoose.Schema
const passportLocalmongoose=require("passport-local-mongoose")


const userSchema=new Schema({
    username:{
        type:"string",
        required :true
    },
    
    email:{
        type:"string",
        required:true
    },
    
    resetPasswordToken: {
        type: String,
        default: null, // Stores the token for password reset
    },
    resetPasswordExpires: {
        type: Date,
        default: null, // Stores the expiration time of the token
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    })

userSchema.plugin(passportLocalmongoose);

module.exports = mongoose.model('User', userSchema);