'use strict'

const ResponseData = require('../util/ResponseData')
const createDomain = require('domain').create

module.exports = (options)=>{

    //Cache parent exceptions pools
    let exceptionPoolCache = new Map()

    return (req,res,next)=>{

        //Sub-app or router with parent/s expressDeliver
        if (req._expressDeliverOptions){

            res.exception = extendPool(exceptionPoolCache,res.exception,options.exceptionPool)
            req._exceptionPools.unshift(options.exceptionPool)
            return next()
        }

        req._expressDeliverOptions = options
        req._exceptionPools = [options.exceptionPool,options.defaultExceptionPool]

        //Useful injections
        res.exception = extendPool(exceptionPoolCache,options.defaultExceptionPool,options.exceptionPool)
        res.ResponseData = ResponseData

        //Async error catching during request domain
        const domain = createDomain()
        domain.add(req)
        domain.add(res)
        domain.run(next)
        domain.on('error', next)
    }
}


function extendPool(cache,id,obj){
    if (!cache.has(id)){
        cache.set(id, Object.assign({},id,obj) )
    }
    return cache.get(id)
}