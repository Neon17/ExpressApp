const express = require('express');
const movieRouter = express.Router();
const movieController = require('./../Controllers/movieController');
const authController = require('./../Controllers/authController');

const logger = (req,res,next)=>{
    console.log('logger middleware called');
    next();
}

movieRouter.route('/')
    .get(authController.protect,authController.restrict('admin'),movieController.getMovies)
    .post(movieController.postMovie)
    .delete(movieController.deleteMovies)

movieRouter.use(logger);

movieRouter.get('/genre-stats',movieController.getGenreStats);
movieRouter.get('/basic-stats',movieController.getBasicMovieStats);

movieRouter.route('/:id')
    .get(movieController.getMovie)
    .patch(movieController.updateMovie)
    .delete(movieController.deleteMovie)


module.exports = movieRouter;