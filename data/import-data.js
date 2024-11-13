const fs = require('fs');
const Movie = require('./../Models/movieModel');

const data = JSON.parse(fs.readFileSync('./data/data.json','utf-8'));

const importData = async (req,res)=>{
    try {
        const movie = await Movie.insertMany(data);
        res.status(200);
        res.json({
            status: 'success',
            data: movie
        })
    }
    catch (err) {
        res.status(404);
        res.json({
            status: 'fail',
            message: err.message
        })
    }
}
module.exports = importData;