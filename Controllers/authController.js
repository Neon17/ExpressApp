const User = require('./../Models/userModel');
const jwt = require('jsonwebtoken');
const asyncErrorHandler = require('./../utils/asyncErrorHandler');
const CustomError = require('./../utils/CustomError');
const util = require('node:util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({id: id},process.env.SECRET_STR,{
        expiresIn: process.env.LOGIN_EXPIRES
    })
}

const filterReqObj = (obj,...allowedFields)=>{
    const newObj = {};
    Object.keys(obj).forEach(prop => {
        if (allowedFields.includes(prop))
            newObj.prop = obj.prop;
    });
    return newObj;
}

const createSendResponse = (user,statusCode,res)=>{
    const token = signToken(user._id);

    const options = {
        maxAge: process.env.LOGIN_EXPIRES,
        // secure: true, //only for https
        httpOnly: true
    }
    
    // if (process.env.NODE_ENV == 'production')
    //     options.secure = true;

    res.cookie('jwt',token,options);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = asyncErrorHandler(async (req,res,next) =>{
    const newUser = await User.create(req.body);
    createSendResponse(newUser,201,res);
})

exports.login = (async (req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password){
        return next(new CustomError('Please provide email and password for login',400));
    }
    const user = await User.findOne({email}).select('+password');
    if (!user || !await user.comparePasswordInDb(password,user.password)){
        return next(new CustomError('Invalid Email or Password',400));
    }
    createSendResponse(user,200,res);
})

exports.protect = asyncErrorHandler(async(req,res,next)=>{
    //read the token and check if it exists
    const testToken = req.headers.authorization;
    if (!testToken){
        return next(new CustomError('You are not logged in!'),401);
    }
    let token;
    if (testToken.startsWith('Bearer'))
        token = testToken.split(' ')[1];
    if (!token){
        return next(new CustomError('You are not logged in!'),401);
    }

    //validate the token
    const decodedToken = await util.promisify(jwt.verify)(token,process.env.SECRET_STR);  
    if (!decodedToken)
        return next(new CustomError('Time expired. Please login again',403));
    
    //check if user exists
    const user = await User.findById(decodedToken.id);
    if (!user)
        return next(new CustomError("User with given token doesn't exists",403));

    //check if user changed password recently
    if (await user.isPasswordChanged(decodedToken.iat))
        return next(new CustomError("Password changed recently. Please login again!",401));

    //allow user to access route
    req.user = user;
    next();
})

exports.restrict = (role)=>{
    //here we allow only for restricted users like admin
    return (req,res,next)=>{
        if (req.user.role!=role)
            return next(new CustomError("Don't have permission",403));
        next();
    }
}

exports.forgetPassword = asyncErrorHandler(async (req,res,next)=>{
    //send generated password reset token to user email

    //get user based on posted email
    const user = await User.findOne({email: req.body.email});

    //generate a random reset token
    const resetToken = await user.createResetPasswordToken();
    await user.save({validateBeforeSave: false});

    //just after email sent is failed
    res.status(200).json({
        status: 'success',
        token: resetToken
    })

    // send the token back to the user email
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // const message = `We have received a password reset request. Please use the below link to reset your password.\n\n${resetUrl}\n\nThis reset password link will be valid only for 10 minutes.`;
    // try {
    //     await sendEmail({
    //         email: user.email,
    //         subject: 'Password Change Request Received',
    //         message: message
    //     })
    //     res.status(200).json({
    //         status: 'success',
    //         message: 'password reset link sent to the user email'
    //     })
    // }
    // catch (err) {
    //     user.passwordResetToken = undefined;
    //     user.passwordResetTokenExpires = undefined;
    //     user.save({validateBeforeSave: false});
    //     next(err);
    //     // next(new CustomError('Cannot send email. Try again later..',500));
    // }
})

exports.resetPassword = asyncErrorHandler(async (req,res,next)=>{
    //sets new password after user clicks on password reset token link in email
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetTokenExpires: {$gt: Date.now()}
    });
    if (!user)
        return next(new CustomError('Token is invalid or has expired',403));
    
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    user.save();

    createSendResponse(user,200,res);
})

exports.updatePassword = asyncErrorHandler(async(req,res,next)=>{
    const user = await User.findById(req.params.id).select('+password');
    if (!await user.comparePasswordInDb(user.password, req.body.currentPassword))
        return next(new CustomError('Wrong Current Password',401));
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();
    await User.save();
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
})

exports.updateMe = asyncErrorHandler(async(req,res,next)=>{
    if (req.body.password || req.body.confirmPassword)
        return next(new CustomError('You cannot update your password using this endpoint',401));

    const filterObj = filterReqObj(...req.body,'name','email');
    const user = await User.findByIdAndReplace(req.params.id, filterObj, {runValidators:true, new:true});
    createSendResponse(user,200,res);
})

exports.deleteMe = asyncErrorHandler(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.params.id,{active:false});
    res.status(200).json({
        status: 'success',
        message: 'successfully deleted'
    })
})
