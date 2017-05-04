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
 * @returns {void}
 */
module.exports = function expressDeliverLoader(app){


    //Initialize only once
    if (app._expressDeliverLoaded)
        return false
    app._expressDeliverLoaded = true

    //Wrap every http method in express
    const allMethods = methods.concat(['all','use','param'])
    for(let method of allMethods){
        app[method] = wrapMethod(app,app[method])
    }

    //First middleware 
    app.use((req,res,next)=>{
        res.exception = exception
        res.ResponseData = ResponseData
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

