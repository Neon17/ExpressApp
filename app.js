const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const movieRouter = require('./routes/movieRouter');
const importData = require('./data/import-data');
const CustomError = require('./utils/CustomError');
const globalErrorHandler = require('./Controllers/errorController');
const userRouter = require('./routes/userRouter');


const app = express();
app.use(helmet());
app.use(express.json({limit: '10kb'}));
app.use(sanitize());
app.use(xss());
// hpp protects parameter pollution like ?sort = ratings&sort = releaseYear, sort is managed treating it as ratings,releaseYear but here is array
// we have whitelisted the below because it should be treated as multiple statements rather than combining array of sort in previous line
app.use(hpp({whitelist: ['duration','ratings','releaseYear','releaseDate','genres','directors','actors',
    'price'
]}))
app.use(express.static('./public'))
//public folder is considered default folder

let limiter = rateLimit({
    max: 1000,
    windowMs : 60*1000*1000,
    message: 'We have received so many requests. Try after one requests'
});
app.use('/api',limiter);

app.get('/',(req,resp)=>{
    resp.status(200);
    resp.json({
        status: 'success',
        message: 'GET method /'
    })
})

app.post('/import-data',importData);
app.use('/api/v1/movies',movieRouter);
app.use('/api/v1/users',userRouter);

app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on the server!`
    // })
    let err = new CustomError(`Can't find ${req.originalUrl} on the server!`,404);
    next(err);
})

app.use(globalErrorHandler);

module.exports = app;