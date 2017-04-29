'use strict'

const headersSent = require('./headersSent')

module.exports = function expressDeliverErrorHandler (result,res){
    if (!headersSent(res)){
        res.send(transformSuccess(result))
    }
}

/**
 * Transform the result
 * 
 * @param {any} result 
 * @returns {Object}
 */
function transformSuccess(result){
    return {
        status:true,
        data:result
    }
}