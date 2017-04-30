'use strict'

const exception = require('./exception')

//eslint-disable-next-line
module.exports = function expressDeliverErrorHandler(err,req,res,next){
    if (!res.headersSent){
        //TODO LOG
        err = normalizeError(err)
        res.status(getStatusCode(err))
        res.send(transformFail(err))
    }else{
        //TODO LOG
        console.log('headers sent')
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

function getStatusCode(err){
    let statusCode = err.statusCode|0

    if (statusCode < 400 || statusCode >= 600)
        statusCode = 500

    return statusCode
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