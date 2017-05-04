'use strict'

const ResponseData = require('./ResponseData')

module.exports = function expressDeliverSuccessHandler (result,req,res){
    if (!res.headersSent){
        result = normalizeResult(result)
        res.send(transformSuccess(result.value,result.options,req))
    }else{
        //TODO LOG
        console.log('headers sent')
    }
}


function normalizeResult(result){
    if (!result || result._isResponseData !== true)
        return ResponseData(result,{default:true})
    return result
}

/**
 * Transform the responseData
 * 
 * @param {any} value 
 * @param {Object} options 
 * @param {Request} req 
 * @returns {Object}
 */
function transformSuccess(value,options){
    if (options.default === true){
        return {
            status:true,
            data:value
        }
    }
    
    if (options.appendStatus !== false){
        let obj = typeof value == 'object' ? value : {}
        return Object.assign(obj,{status:true})
    }

    return value
}
