const CustomError = require('./../utils/CustomError');

const devErrors = (res,error)=>{
    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        stackTrace: error.stack,
        error: error
    })
}

const prodErrors = (res,error)=>{
    if (error.isOperational){
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message
        })
    }
    else {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong! Please try again later.'
        })
    }
}

const CastErrorHandler = (res,err)=>{
    const msg = `Invalid value ${err.value} for field ${err.path}`;
    return new CustomError(msg,400);
}

const duplicateKeyErrorHandler = (err)=>{
    const name = err.keyValue.name;
    const email = err.keyValue.email;
    let msg;
    if (name)
        msg = `There is already movie with name ${name}. Please use another name`;
    else 
        msg = `There is already an user with same email. Please use another email`;
    return new CustomError(msg,400);
}

const validationErrorHandler = (err)=>{
    const errors = Object.values(err.errors).map(val=>val.message);
    const errorMessages = errors.join('.');
    const msg = `Invalid Input Data: ${errorMessages}`;
    return new CustomError(msg,400);
}

const handleExpiredJWT = (err)=>{
    return new CustomError('JWT has expired. Please login again!',401);
}

module.exports = (error,req,res,next)=>{
    error.status = error.status || 'error';
    error.statusCode = error.statusCode || 500;

    if (process.env.NODE_ENV === 'development'){
        devErrors(res,error);
    }
    else if (process.env.NODE_ENV === 'production'){
        // let err = {...error,name:error.name};
        if (error.name === 'CastError') error = CastErrorHandler(res,error);
        if (error.code === 11000) error = duplicateKeyErrorHandler(error);
        if (error.name === 'ValidationError') error = validationErrorHandler(error);
        if (error.name === 'TokenExpiredError') error = handleExpiredJWT(error);
        prodErrors(res,error);
    }
    return;
}