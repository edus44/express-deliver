'use strict';

var bluebird = require('bluebird');
var exception = require('./exception');
var ResponseData = require('./ResponseData');
var expressDomain = require('express-domain-middleware');
var emitter = require('./emitter');

module.exports = function(req,res,next){

    //Watch for response ending
    res.sent = false;
    var _write = res.write;
    res.write = function(){
        res.sent = true;
        _write.apply(res,arguments)
    }

    expressDomain.call(null,req,res,middleware)

    function middleware(err){

        //For domain thrown errors
        if (err){
            return next(err);
        }


    	/**
    	 * Deliver the response in a json form
    	 * {Error | baseException} as status:false 
    	 * {Promise | Mixed} as status:true 
    	 * @param  {Mixed} data 
    	 * @return {expressResponse}
    	 */
    	res.deliver = function(data){
    		if (data == null){
    			return res.deliverError();
    		}

    		//is error or uninstantiated exception, convert to exception
    		if (data instanceof Error || data.prototype instanceof exception.BaseException || data == exception.BaseException || data.BaseException == exception.BaseException || data == Error){
    			data = new exception.from(data);
    		}

    		//is base exception
    		if (data instanceof exception.BaseException){
    			res.deliverError(data);
    		}
    		else

    		//is promise
    		if (data instanceof bluebird){
    			data.then(function(data){
    				res.deliver(data);
    			})
    			.catch(next);
    		}
    		else

    		//is thenable
    		if (data && typeof data.then == 'function'){
                bluebird.resolve(data).then(function(data){
    				res.deliver(data);
    			})
    			.catch(next);
    		}
    		else

    		//Normal response
    		{
    			res.deliverSuccess(data);
    		}
    		return res;
    	};

    	res.deliverSuccess = function(data){
            if (res.sent){
                var err = new Error('Response already delivered')
                err.data = data;
                return emitter.error(err,req)
            }
            if (data instanceof ResponseData){
                res.send(Object.assign(data,{
                    status : true
                }));
            }else{
        		res.send({
        			status : true,
        			data : data
        		});
            }
            res.sent = true;
            return res;
        };
    	res.deliverError = function(err){

            emitter.error(err,req)
            
            if (res.sent){
                return emitter.error(Error('Response already delivered'),req)
            }

    		if (!err){
    			res.send({status:false})
    		}else{

    			if (err.statusCode|0)
    				res.status(err.statusCode)

    			res.send({
    				status : false,
    				error : {
    					code : err.code,
    					message : err.message,
    					// stack:err.stack
    				},
    				data : err.data
    			});
    		}
            res.sent = true;
    		return res;
    	};

    	next();
    }
}
