'use strict'

module.exports = class ExceptionPool{
    
    constructor(defs){
        Object.defineProperty(this,'_conversions',{
            value:[]
        })
        Object.defineProperty(this,'_isExceptionPool',{
            value:true
        })
        
        if (typeof defs == 'object')
            this.add(defs)
    }
    
    add(name,def){

        //Multiple definitions
        if (typeof name == 'object'){
            for(let i in name){
                this.add(i,name[i])
            }
            return
        }

        //Checks
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

        this[name] = class extends Error{
            constructor(data){
                super(def.message)
                this.name = name
                this.code = def.code
                this.statusCode = def.statusCode
                this.data = data
                this._isException = true
            }
        }
    }

    _convert(err){

        for(let i=0;i<this._conversions.length;i++){
            if (this._conversions[i].check(err)===true){
                let conv = this._conversions[i]
                let data = typeof conv.data == 'function' ? conv.data(err) : undefined

                let exp = new this[conv.name](data)

                exp.stack = err.stack

                return exp
            }
        }
    }
}