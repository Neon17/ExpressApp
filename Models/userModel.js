const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    "name" : {
        type: String,
        required: [true, 'Name is required']
    },
    "email" : {
        type: String,
        required: [true,'Email is required'],
        validate: [validator.isEmail, 'Email Address should be valid'],
        unique: true
    },
    "photo" : String,
    "password": {
        type: String,
        minlength: [8,'Password must be 8 characters long'],
        required: [true,'Password is required'],
        select:false
    },
    "confirmPassword": {
        type: String,
        required: [true, 'Confirm Password is required'],
        validate: {
            validator: function(val){
                return val == this.password;
            },
            message: 'Passwords do not match'
        }
    },
    "role":{
        type: String,
        enum: ['user','admin'],
        default: 'user'
    },
    "passwordChangedAt": Date,
    "passwordResetToken": String,
    "passwordResetTokenExpires": Date
});

userSchema.pre('save', async function(next){
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,12);
    this.confirmPassword = undefined;
    next();
})

userSchema.pre(/^find/,async function(next){
    this.find({active: {$ne: false}});
    next();
})

userSchema.methods.comparePasswordInDb = async (pswd,pswdDB)=>{
    return await bcrypt.compare(pswd,pswdDB);
}

userSchema.methods.isPasswordChanged = async function(JWTTimestamp){
    if (this.passwordChangedAt){
        const pswdChangedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimestamp>pswdChangedTimeStamp;
    }
    return false;
}

userSchema.methods.createResetPasswordToken = async function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpires = Date.now()+10*60*1000; //10 mins
    return resetToken;
}

const User = mongoose.model('User',userSchema);

module.exports = User;