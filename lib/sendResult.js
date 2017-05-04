'use strict'

module.exports = function(result,req,res){
    //Try to send the result
    if (!res.headersSent){
        res.send(result)
    } else{
        //Notify event
        if (typeof req._expressDeliverOptions.onError == 'function'){
            let err = new res.exception.HeadersSent(result)
            req._expressDeliverOptions.onError(err,req,res)
        }
    }
}