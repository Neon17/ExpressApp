const mongoose = require('mongoose');
const fs = require('fs');

const movieSchema = mongoose.Schema({
    "_id": mongoose.Types.ObjectId,
    "name": {
        type: String,
        unique: true,
        trim: true,
        required: ['true','Name is required']
    },
    "description": {
        type: String,
        required: ['true','Description is required']
    },
    "genre":[{
        type: String,
        required: ['true','Genre is required']
    }],
    "duration": {
        type: String,
        required: ['true','Duration is required']
    },
    "rating": {
        type: Number,
        default: 0,
        min: [0,'Rating should be at least 0'],
        max: [10,'Rating must not be greater than 10'],
        required: true
    },
    "releaseYear": {
        type: Number,
        required: [true, 'release year should be given']
    },
    "price":{
        type: Number,
        required: [true,'price to buy is required']
    },
    "releaseDate": {
        type: Date,
        required: [true,'release date should be given']
    },
    "created_at": {
        type: Date,
        default: Date.now,
        required: true
    },
    "createdBy": {
        type: String
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

movieSchema.virtual('durationInHours').get(function(){
    return this.duration/60;
})

movieSchema.pre('save',function(next){
    this.createdBy = 'Neon Brother';
    next();
})

movieSchema.post('save',function(doc,next){
    const content = `A new movie with name ${doc.name} is created by ${doc.createdBy}`;
    fs.writeFileSync('./../logs/log.txt',content,{flag: 'a'},(err)=>{
        if (err) console.log(err.message);
    })
})

movieSchema.pre(/^find/,function(next){
    this.find({releaseYear: {$lte: Date.now()}});
    this.startTime = Date.now();
    next();
})

movieSchema.post(/^find/,function(docs,next){
    this.endTime = Date.now();
    const content = `Query took ${this.endTime - this.startTime} milliseconds to fetch the documents\n`;
    fs.writeFileSync('logs/log.txt',content,{flag:'a'},(err)=>{
        if (err) console.log(err.message);
    })
    next();
})

movieSchema.pre('aggregate',function(next){
    this.pipeline().unshift(
        {$match: {releaseDate: {$lte: new Date()}}}
    )
    next();
})

const Movie = mongoose.model('movies',movieSchema);

module.exports = Movie;

