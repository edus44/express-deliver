'use strict'

const errorResponse = require('../response/error')

module.exports = function expressDeliverErrorHandler(app){
    if (!app._expressDeliverLoaded){
        throw new Error('expressDeliver: not loaded')
    }
    
    if (app._expressDeliverErrorHandlerLoaded)
        return false
    app._expressDeliverErrorHandlerLoaded = true

    app.use(function(req,res,next){
        next(new res.exception.RouteNotFound())
    })

    app.use(errorResponse)
    return true

}