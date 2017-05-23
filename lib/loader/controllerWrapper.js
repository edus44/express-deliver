'use strict'

const co = require('co')
const errorResponse = require('../response/error')
const successResponse = require('../response/success')

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
            return controllerWrapper(fn)
        }else

        if (fn.constructor.name == 'GeneratorFunction'){
            return controllerWrapper(co.wrap(fn))
        }
    }
    return fn
}

/**
 * Wrap a user defined controller
 * 
 * @param {GeneratorFunction} fn 
 * @returns {Function}
 */
function controllerWrapper(fn){

    //Return normal middleware controller function
    return function expressDeliverController(req,res,next){
        //Flag to ignore promise result
        let ignore = false

        //Exec controller
        fn.call(res.locals, req, res, err => {
            //Flag calling next to ignore future promise result
            ignore = true

            //Flag to not call next middleware
            if (err!=='ignore')
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