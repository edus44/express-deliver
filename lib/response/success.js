'use strict'

const ResponseData = require('../util/ResponseData')
const sendResult = require('./sendResult')

module.exports = function expressDeliverSuccessResponse(result,req,res){
    result = normalizeResult(result)

    //Choose user transform or default
    let transform = typeof req._expressDeliverOptions.transformSuccessResponse == 'function' ? 
    req._expressDeliverOptions.transformSuccessResponse : defaultTransformSuccess

    //Transform the result
    result = transform(result.value,result.options,req)

    sendResult(result,req,res)
}


/**
 * Tries to return a ResponseData object
 * @param  {any} result 
 * @return {ResponseData}        
 */
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
function defaultTransformSuccess(value,options){
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
