const Movie = require('./../Models/movieModel');
const ApiFeature = require('./../utils/ApiFeatures');
const CustomError = require('./../utils/CustomError');
const asyncErrorHandler = require('./../utils/asyncErrorHandler');


exports.getMovies = asyncErrorHandler(async (req,res)=>{
    const features = new ApiFeature(Movie.find({}),req.query).filter().sort().limitFields().paginate();
    let movies = await features.query;
    res.status(200);
    res.json({
        status: 'success',
        httpMethod: 'get',
        method: 'getMovies',
        count: movies.length,
        data : movies
    })
})

exports.getMovie = asyncErrorHandler(async (req,res,next)=>{
    const id = req.params.id;
    const movie = await Movie.findById(id);
    if (!movie){
        let err = new CustomError('Movie with that ID not found',404);
        return next(err);
    }
    res.status(200);
    res.json({
        status: 'success',
        httpMethod: 'get',
        method: 'getMovie',
        data : movie
    })
})

exports.postMovie = asyncErrorHandler(async (req,res)=>{
    const movie = await Movie.create(req.body);
    res.status(200);
    res.json({
        status: 'success',
        httpMethod: 'post',
        method: 'postMovie',
        data : movie
    })
})

exports.updateMovie = asyncErrorHandler(async (req,res,next)=>{
    const id = req.params.id;
    const updatedMovie = await Movie.findByIdAndUpdate(id,req.body,{new:true,runValidators:true});
    if (!updatedMovie){
        let err = new CustomError('No movie with that ID found',404);
        return next(err);
    }
    res.status(200);
    res.json({
        status: 'success',
        httpMethod: 'patch',
        method: 'updateMovie',
        data : updatedMovie
    })
})

exports.deleteMovies = asyncErrorHandler(async (req,res)=>{
    //It deletes the already given movies data in database which not matches the current validation rule
    const movies = await Movie.deleteMany({
        "$or":[
            {"name": {$exists: false}},
            {"description": {$exists: false}},
            {"genre": {$exists: false}},
            {"duration": {$exists: false}},
            {"rating": {$exists: false}},
            {"releaseYear": {$exists: false}},
            {"price": {$exists: false}},
            {"releaseDate": {$exists: false}},
            {"created_at": {$exists: false}}
        ]
    });
    res.status(200);
    res.json({
        status: 'success',
        httpMethod: 'delete',
        method: 'deleteMovies',
        data: movies
    })
})

exports.deleteMovie = asyncErrorHandler(async (req,res,next)=>{
    const id = req.params.id;
    const movie = await Movie.findById(id);
    if (movie==null){
        let err = new CustomError('No movie with that ID found',404);
        return next(err);
    }
    await Movie.findByIdAndDelete(id);
    res.status(200);
    res.json({
        status: 'success',
        httpMethod: 'delete',
        method: 'deleteMovie',
    })
})

exports.getBasicMovieStats = asyncErrorHandler(async (req, res) => {
        const stats = await Movie.aggregate([
            { $match: { rating: { $gte: 7 } } },
            { 
                $group: {
                    _id: '$releaseYear',
                    avgRating: { $avg: '$rating' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    priceTotal: { $sum: '$price' },
                    movieCount: { $sum: 1 }
                } 
            },
            { $sort: { minPrice: 1 } }
        ]);

        res.json({
            status: 'success',
            httpMethod: 'get',
            method: 'getBasicMovieStats',
            data: {
                stats
            }
        });
});

exports.getGenreStats = asyncErrorHandler(async (req,res)=>{
    const stats = await Movie.aggregate([
        {$unwind: '$genre'},
        {$group: {
            _id: '$genre',
            movieCount: {$sum: 1},
            movies: {$push: '$name'}
        }},
        {$addFields: {genre: '$_id'}},
        {$project: {_id: 0}},
        {$sort: {movieCount: -1}},
        // {$limit: 6}
    ]);
    res.json({
        status: 'success',
        httpMethod: 'get',
        method: 'getBasicMovieStats',
        genresCount: stats.length,
        data: {
            stats
        }
    });
})
