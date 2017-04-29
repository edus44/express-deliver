'use strict'

const exception = require('./exception')
const headersSent = require('./headersSent')

module.exports = function expressDeliverErrorHandler(err,req,res,next){
    if (!headersSent(res)){
        err = normalizeError(err)
        res.status(getStatusCode(err))
        res.send(transformFail(err))
    }
}

function normalizeError(err){
    if (!(err instanceof Error)){
        err = new exception.InternalError(err)
    }
    if (!err._isException){
        err = new exception.InternalError(err.message)
        err.stack = err.stack
    }
    return err
}

function transformFail(err){
    return {
        status:false,
        error:{
            code: err.code,
            message: err.message,
            data: err.data,
        }
    }
}

function getStatusCode(err){
    let statusCode = err.statusCode|0

    if (statusCode < 400 || statusCode >= 600)
        statusCode = 500

    return statusCode
}