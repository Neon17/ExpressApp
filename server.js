const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path:"./config.env"});

process.on('uncaughtException',(err)=>{
    console.log(err.name,err.message);
    console.log('Uncaught Exception!');
    process.exit(1);
})

const app = require('./app');

mongoose.connect(process.env.CONN_STR,{
    useNewUrlParser:true
}).then((conn)=>{
    console.log('connected successfully');
}).catch((err)=>{
    console.error(err.message);
})

app.get('/',(req,resp)=>{
    resp.status(200);
    resp.send("hello world");
    resp.end();
})

const port = process.env.PORT || 3000;

const server = app.listen(port, (conn)=>{
    console.log(`connected to localhost:${port}`);
})

process.on('unhandledRejection',(err)=>{
    console.log(err.name,err.message);
    console.log('Unhandled Rejection Occured! Shutting down...');
    server.close(()=>{
        process.exit(1);
    })
})

module.exports = app;