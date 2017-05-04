'use strict'

let self = exports

self._conversions = []

self._convert = function findConvertedException(err){

    for(let i=0;i<self._conversions.length;i++){

        let conv = self._conversions[i]
        if (conv.check(err)===true){
            let data = typeof conv.data == 'function' ? conv.data(err) : undefined

            let exp = new self[conv.name](data)

            exp.stack = err.stack

            return exp
        }
    }
}

self.define = function defineException(opts){
    if (!opts || !opts.name || !opts.code || !opts.message){
        throw new Error('express-deliver exception define: Invalid options argument')
    }

    //Add to conversion stack
    if (opts.conversion){
        let conv = opts.conversion
        if (typeof conv == 'function'){
            conv = {check:conv}
        }
        if (typeof conv.check != 'function'){
            throw new Error('express-deliver exception define: Conversion check is not a function')
        }
        conv.name = opts.name
        self._conversions.unshift(conv)
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
    conversion:{
        check:()=>true,
        data:err=>`${err.name}: ${err.message}`
    }
})
self.define({
    name:'HeadersSent',
    code: 1001,
    message: 'Headers already sent'
})

self.define({
    name:'RouteNotFound',
    code: 1002,
    statusCode: 404,
    message: 'Route not found',
})