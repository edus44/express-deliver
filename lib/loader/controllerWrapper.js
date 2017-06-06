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
            return controllerAsyncWrapper(fn)
        }else

        if (fn.constructor.name == 'GeneratorFunction'){
            return controllerAsyncWrapper(co.wrap(fn))
        }else

        if (fn.name.match(/Deliver$/) || fn.name == 'deliver'){
            return controllerAsyncWrapper(promiseWrap(fn))
        }else

        if (fn.name.match(/DeliverSync$/) || fn.name == 'deliverSync'){
            return controllerSyncWrapper(fn)
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
function controllerAsyncWrapper(fn){

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


function promiseWrap(fn){
    return function(){
        return Promise.resolve(fn.apply(this,arguments))
    }
}

function controllerSyncWrapper(fn){

    //Return normal middleware controller function
    return function expressDeliverController(req,res,next){
        //Flag to ignore result
        let ignore = false

        //Exec controller
        try{
            let result = fn.call(res.locals, req, res, err => {
                //Flag calling next to ignore future promise result
                ignore = true

                //Flag to not call next middleware
                if (err!=='ignore')
                    next(err)
            })

            if (!ignore) {
                successResponse(result,req,res)
            }
        }catch(err){
            if (!ignore){
                errorResponse(err,req,res,next)
            }
        }
    }
}