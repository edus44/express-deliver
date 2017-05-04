'use strict'

const methods = require('methods')
const exception = require('./exception')
const controllerWrapper = require('./controllerWrapper')
const ResponseData = require('./ResponseData')
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

    //First middleware 
    app.use((req,res,next)=>{

        //Useful injections
        req._expressDeliverOptions = options
        res.exception = exception
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
    return (...args)=>{
        //Check if any middleware argument is a generator function
        for( let i=0; i<args.length; i++ ){
            if (isGenerator(args[i])){
                //Wrap this controller
                args[i] = controllerWrapper(args[i])
            }
        }
        
        //Call original method handler
        return fn.apply(app,args)
    }
}

/**
 * Check if is generator function
 * 
 * @param {any} fn 
 * @returns {Boolean}
 */
function isGenerator(fn){
    return typeof fn == 'function' && fn.constructor.name == 'GeneratorFunction'
}

