'use strict'

const ExceptionPool = require('./ExceptionPool')

const exceptionPool = new ExceptionPool()

exceptionPool.add('InternalError',{
    code: 1000,
    statusCode: 500,
    message: 'Internal error',
    conversion:{
        check:()=>true,
        data:err=>`${err.name}: ${err.message}`
    }
})

exceptionPool.add('HeadersSent',{
    code: 1001,
    message: 'Headers already sent'
})

exceptionPool.add('RouteNotFound',{
    code: 1002,
    statusCode: 404,
    message: 'Route not found',
})

module.exports = exceptionPool