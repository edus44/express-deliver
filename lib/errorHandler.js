'use strict'

const errorResponse = require('./errorResponse')

module.exports = function expressDeliverErrorHandler(app){
    app.use(function(req,res,next){
        next(new res.exception.RouteNotFound())
    })

    app.use(errorResponse)
}