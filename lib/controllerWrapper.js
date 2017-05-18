'use strict'

const co = require('co')
const errorResponse = require('./errorResponse')
const successResponse = require('./successResponse')

/** 
 * Check if function is wrappable and use its 
 * specific wrapper
 *
 * Wrappers are duplicated to reduce
 * needed variables and closures
 * 
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
module.exports = function(fn){
    if (typeof fn == 'function'){

        if (fn.constructor.name == 'AsyncFunction'){
            return controllerAsyncWrapper(fn)
        }else

        if (fn.constructor.name == 'GeneratorFunction'){
            return controllerCogeneratorWrapper(fn)
        }
    }
    return fn
}

/**
 * Wrap a user defined controller as a cogenerator
 * 
 * @param {GeneratorFunction} fn 
 * @returns {Function}
 */
function controllerCogeneratorWrapper(fn){

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

/**
 * Wrap a user defined controller as an async function
 * Almost the same as cogenerator one, but calling fn directly
 * instead of passing through co
 * 
 * @param {AsyncFunction} fn 
 * @returns {Function}
 */
function controllerAsyncWrapper(fn){

    //Return normal middleware controller function
    return function expressDeliverController(req,res,next){
        //Flag to ignore promise result
        let ignore = false

        //Exec async function
        //Binding fn context and arguments 
        fn.call(res.locals, req, res, err => {
            //Flag calling next to ignore future promise result
            ignore = true
            next(err)
        })
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
