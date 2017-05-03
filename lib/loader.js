'use strict'

const methods = require('methods')
const co = require('co')
const errorResponse = require('./errorResponse')
const successResponse = require('./successResponse')
const exception = require('./exception')
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

    for(let method of methods){
        app[method] = wrapMethod(app,app[method])
    }

    app.use((req,res,next)=>{
        res.exception = exception
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
                args[i] = wrapCtrl(args[i])
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

/**
 * Wrap a user defined controller
 * 
 * @param {GeneratorFunction} fn 
 * @returns {Function}
 */
function wrapCtrl(fn){

    //Return normal middleware function
    return (req,res,next)=>{
        //Flag to ignore promise result
        let ignore = false

        //Exec fn inside co passing req,res and custom next
        co.wrap( fn )( 
            req, 
            res,
            //Custom next that response posible error or 
            //continue middleware stack ignoring promise result
            err => {
                ignore = true
                next(err)
            }
        )   
            //Coroutine finished
            .then(
                //Fullfilled
                (result)=>{
                    if (!ignore) successResponse(result,req,res)
                },
                //Rejected
                (err)=>{
                    if (!ignore) next(err)
                }
            )
    }
}
