'use strict'

const methods = require('methods')
const controllerWrapper = require('./controllerWrapper')
const ExceptionPool = require('../util/ExceptionPool')
const defaultExceptionPool = require('../util/defaultExceptionPool')
const middleware = require('./middleware')


/**
 * Load express deliver
 * 
 * @param {ExpressApp} app 
 * @param {object} options 
 *      printErrorStack boolean (false)
 *      printInternalErrorData boolean (false)
 *      onError fn(err,req,res) (null)
 *      transformSuccessResponse fn(value,options,req)
 *      transformErrorResponse fn(err,req)
 * @returns {void}
 */
module.exports = function expressDeliverLoader(app,options){


    //Initialize only once
    if (app._expressDeliverLoaded)
        return false
    app._expressDeliverLoaded = true

    //Wrap every http method in express
    const allMethods = methods.concat(['all','use','param'])
    for(let method of allMethods){
        app[method] = wrapMethod(app,app[method])
    }

    //Normalize options
    options = typeof options == 'object' ? options : {}

    if (options.exceptionPool && options.exceptionPool._isExceptionPool!==true){
        throw new Error('ExpressDeliver: Invalid exceptionPool option')
    }
    if (options.defaultExceptionPool && options.defaultExceptionPool._isExceptionPool!==true){
        throw new Error('ExpressDeliver: Invalid defaultExceptionPool option')
    }

    //Dummy pool
    if(!options.exceptionPool){
        options.exceptionPool = new ExceptionPool()
    }

    //Default exception pool
    if(!options.defaultExceptionPool){
        options.defaultExceptionPool = defaultExceptionPool
    }

    //Set first middleware 
    app.use(middleware(options))

    return true
}

/**
 * Wrap an express method handler
 * 
 * @param {ExpressApp} app 
 * @param {Function} fn 
 * @returns {Function}
 */
function wrapMethod(app,fn){
    //Override original express method
    return function(){
        let args = Array.prototype.slice.call(arguments)
        //Check if any middleware argument is a generator function
        for( let i=0; i<args.length; i++ ){
            //Wrap this if necessary
            args[i] = controllerWrapper(args[i])
        }
        
        //Call original method handler
        return fn.apply(app,args)
    }
}

