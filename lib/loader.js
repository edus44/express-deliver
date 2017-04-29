'use strict'

const methods = require('methods')
const co = require('co')
const errorResponse = require('./errorResponse')
const successResponse = require('./successResponse')
const exception = require('./exception')


/**
 * Load express deliver
 * 
 * @param {ExpressApp} app 
 * @returns {void}
 */
module.exports = function expressDeliverLoader(app){
    //Initialize only once
    if (app._expressDeliverLoaded)
        return
    app._expressDeliverLoaded = true

    for(let method of methods){
        app[method] = wrapMethod(app,app[method])
    }

    app.use((req,res,next)=>{
        res.exception = exception
        next()
    })
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
        //Check if last argument is a generator function
        const ctrl = args[args.length-1]
        if (isGenerator(ctrl)){
            //Wrap this so-called controller
            args[args.length-1] = wrapCtrl(ctrl)
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

/**
 * Wrap a user defined controller
 * 
 * @param {GeneratorFunction} fn 
 * @returns {Function}
 */
function wrapCtrl(fn){
    //Return normal middleware function
    return (req,res,next)=>{
        let ignore = false
        //Exec fn inside co passing req,res and custom next
        co.wrap(fn)(req,res,arg=>{
            ignore = true
            next(arg)
        })
            .then((result)=>{
                if (!ignore) successResponse(result,res)
            },(err)=>{
                if (!ignore) errorResponse(err,req,res,next)
            })
    }
}
