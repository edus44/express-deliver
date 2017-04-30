'use strict'

module.exports = function expressDeliverErrorHandler (result,req,res){
    if (!res.headersSent){
        res.send(transformSuccess(result))
    }else{
        //TODO LOG
        console.log('headers sent')
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