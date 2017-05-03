'use strict'

const co = require('co')
const errorResponse = require('./errorResponse')
const successResponse = require('./successResponse')

/**
 * Wrap a user defined controller
 * 
 * @param {GeneratorFunction} fn 
 * @returns {Function}
 */
module.exports = function controllerWrapper(fn){

    //Return normal middleware controller function
    return function expressDeliverController(req,res,next){
        //Flag to ignore promise result
        let ignore = false

        //Exec cogenerator
        //Binding fn context and arguments 
        co(fn.bind(res.locals, req, res, err => {
            //Flag calling next to ignore future promise result
            ignore = true
            next(err)
        }))
            .then((result)=>{
                if (!ignore) {
                    successResponse(result,req,res)
                }
            },(err)=>{
                if (!ignore){
                    errorResponse(err,req,res,next)
                }
            })
    }
}
