'use strict';

var exception = require('./exception');
var emitter = require('./emitter');
var self = module.exports = function(app){
    app.use(self.error404);
    app.use(self.error500);
};

module.exports.error404 = function(req,res){
    res.status(404).deliver(exception.RouteNotFound);
}

module.exports.error500 = function(err,req,res,next){
    if (res.deliver){
        return res.deliver(err);
    }

    emitter.error(err,req)

    //Vanilla error handler 
    try{
        res
            .status(500)
            .send({
                status : false,
                error : {
                    code : 1002,
                    message : 'Unhandled Error',
                },
                data : err && err.message || err
            });
    }catch(e){
    }
}