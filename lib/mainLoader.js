'use strict'

const methods = require('methods')
const controllerWrapper = require('./controllerWrapper')
const ResponseData = require('./ResponseData')
const ExceptionPool = require('./ExceptionPool')
const createDomain = require('domain').create


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

    options = typeof options == 'object' ? options : {}

    if (options.exceptionPool && options.exceptionPool._isExceptionPool!==true){
        throw new Error('ExpressDeliver: Invalid exceptionPool option')
    }

    //Dummy pool
    if(!options.exceptionPool){
        options.exceptionPool = new ExceptionPool()
    }

    //Cache parent exceptions pools
    let exceptionPoolCache = new Map()

    //First middleware 
    app.use((req,res,next)=>{

        //Sub-app or router with parent/s expressDeliver
        if (req._expressDeliverOptions){

            //Merge previous exception pool data
            if (!exceptionPoolCache.has(res.exception)){
                exceptionPoolCache.set(res.exception, Object.assign({},res.exception,options.exceptionPool._pool) )
            }
            res.exception = exceptionPoolCache.get(res.exception)
            req._exceptionPools.unshift(options.exceptionPool)
            return next()
        }

        req._expressDeliverOptions = options
        req._exceptionPools = [options.exceptionPool]

        //Useful injections
        res.exception = options.exceptionPool._pool
        res.ResponseData = ResponseData

        //Async error catching during request domain
        const domain = createDomain()
        domain.add(req)
        domain.add(res)
        domain.run(next)
        domain.on('error', next)
    })

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

