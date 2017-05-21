'use strict'

module.exports = class ExceptionPool{
    
    constructor(defs){
        this._pool = []
        this._conversions = []
        this._isExceptionPool = true

        if (typeof defs == 'object'){
            for(let name in defs){
                this.add(name,defs[name])
            }
        }
    }
    
    add(name,def){
        if (!def || !name || !def.code || !def.message){
            throw new Error('ExceptionPool: Invalid definition')
        }

        //Add to conversion stack
        if (def.conversion){
            let conv = def.conversion
            if (typeof conv == 'function'){
                conv = {check:conv}
            }
            if (typeof conv.check != 'function'){
                throw new Error('ExceptionPool: Conversion check is not a function')
            }
            conv.name = name
            this._conversions.unshift(conv)
        }

        this._pool[name] = class extends Error{
            constructor(data){
                super(def.message)
                this.name = def.name
                this.code = def.code
                this.statusCode = def.statusCode
                this.data = data
                this._isException = true
            }
        }
    }

    _convert(err){

        for(let i=0;i<this._conversions.length;i++){

            let conv = this._conversions[i]
            if (conv.check(err)===true){
                let data = typeof conv.data == 'function' ? conv.data(err) : undefined

                let exp = new this._pool[conv.name](data)

                exp.stack = err.stack

                return exp
            }
        }
    }
}