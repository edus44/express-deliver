'use strict'

const sendResult = require('./sendResult')

//eslint-disable-next-line
module.exports = function expressDeliverErrorResponse(err,req,res,next){

    err = normalizeError(err,req._exceptionPools)
    res.status(getStatusCode(err))

    //Notify event
    if (typeof req._expressDeliverOptions.onError == 'function'){
        req._expressDeliverOptions.onError(err,req,res)
    }

    //Transform to result
    let transform = typeof req._expressDeliverOptions.transformErrorResponse == 'function' ? 
    req._expressDeliverOptions.transformErrorResponse : defaultTransformError

    let result = transform(err,req)

    sendResult(result,req,res)
}

/**
 * Tries to always return an expressDeliver exception 
 * @param  {any} err 
 * @return {Exception}     
 */
function normalizeError(err,pools){
    if (!(err instanceof Error)){
        err = new Error(err)
    }
    if (!err._isException){
        for(let i=0;i<pools.length;i++){
            let exception = pools[i]._convert(err)
            if (exception) return exception
        }
    }
    return err
}


/**
 * Return a valid error statusCode from err
 * @param  {Exception} err 
 * @return {Number}     
 */
function getStatusCode(err){
    let statusCode = err.statusCode|0

    if (statusCode < 400 || statusCode >= 600)
        statusCode = 500

    return statusCode
}


/**
 * Default error response transformation
 * @param  {Exception} err 
 * @param  {Request} req 
 * @return {Object}     
 */
function defaultTransformError(err,req){
    let body = {
        code: err.code,
        message: err.message,
        data: err.data,
    }

    if (req._expressDeliverOptions.printErrorStack===true){
        body.stack = err.stack
    }

    if (err.name == 'InternalError' && req._expressDeliverOptions.printInternalErrorData!==true){
        delete body.data
    }

    return {
        status:false,
        error:body
    }
}