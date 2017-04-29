'use strict'

let self = exports

self.define = function defineException(opts){
    if (!opts || !opts.name || !opts.code || !opts.message){
        throw new Error('express-deliver exception define: Invalid options argument')
    }
    self[opts.name] = class extends Error{
        constructor(data){
            super(opts.message)
            this.name = opts.name
            this.code = opts.code
            this.statusCode = opts.statusCode
            this.data = data
            this._isException = true
        }
    }
}


self.define({
    name:'InternalError',
    code: 1000,
    statusCode: 500,
    message: 'Internal error',
})

self.define({
    name:'RouteNotFound',
    code: 1001,
    statusCode: 404,
    message: 'Route not found',
})