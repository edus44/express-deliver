'use strict'

const exception = require('./exception')
const errorResponse = require('./errorResponse')

module.exports = function expressDeliverErrorHandler(app){
    app.use(function(req,res,next){
        next(new exception.RouteNotFound())
    })

    app.use(errorResponse)
}