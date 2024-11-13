const express = require('express');
const userRouter = express.Router();
const authController = require('./../Controllers/authController');

userRouter.post('/signup',authController.signup)
userRouter.post('/login',authController.login)
userRouter.route('/updatePassword').patch(
    authController.protect,
    authController.updatePassword
);
userRouter.route('/deleteMe').delete(
    authController.protect,
    authController.deleteMe
);
userRouter.post('/forgetPassword',authController.forgetPassword);   
userRouter.patch('/resetPassword/:token',authController.resetPassword);

module.exports = userRouter;