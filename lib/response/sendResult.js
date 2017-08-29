'use strict'

module.exports = function(result,req,res){
    //Try to send the result
    if (!res.headersSent){
        try{
            res.send(result)
        }catch(err){

            // Last change to response something
            if (res._expressDeliverSendError){
                return res.status(500).send(err && err.message)
            }

            // Flag the response and build an error
            res._expressDeliverSendError = true
            require('./error')(err,req,res) // :| Circular dep
        }
    } else{
        //Notify event
        if (typeof req._expressDeliverOptions.onError == 'function'){
            let err = new res.exception.HeadersSent(result)
            req._expressDeliverOptions.onError(err,req,res)
        }
    }
}