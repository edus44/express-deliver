'use strict';

var q = require('q');
var exception = require('./exception');
var expressDomain = require('express-domain-middleware');
var emitter = require('./emitter');

module.exports = function(req,res,next){
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
    		if (data instanceof Error || data.prototype instanceof exception.BaseException || data == exception.BaseException || data.BaseException == exception.BaseException){
    			data = new exception.from(data);
    		}

    		//is base exception
    		if (data instanceof exception.BaseException){
    			res.deliverError(data);
    		}
    		else

    		//is promise
    		if (q.isPromise(data)){
    			data.then(function(data){
    				res.deliver(data);
    			})
    			.done();
    		}
    		else

    		//is thenable
    		if (data && typeof data.then == 'function'){
    			q(data).then(function(data){
    				res.deliver(data);
    			})
    			.done();
    		}
    		else

    		//Normal response
    		{
    			res.deliverSuccess(data);
    		}

    		return res;
    	};

    	res.deliverSuccess = function(data){
    		res.send({
    			status : true,
    			data : data
    		});
    		return res;
    	};

    	res.deliverError = function(err){
            
            emitter.error(err,req)

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

    		return res;
    	};

    	next();
    }
}
