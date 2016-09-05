'use strict';

var exception = exports;
var BaseException = exports.BaseException = require('./BaseException');

exports.UnknownError = class UnknownError extends BaseException{
    constructor(data){
        super(1001,'Unknown Error',data);
    }
};

exports.UnhandledError = class UnhandledError extends BaseException{
    constructor(data){
        super(1002,'Unhandled Error',data);
    }
};

exports.InternalError = class InternalError extends BaseException{
    constructor(data){
        super(1003,'Internal Error',data);
    }
};

exports.RouteNotFound = class RouteNotFound extends BaseException{
    constructor(data){
        super(1004,'Route Not Found',data);
    }
};

exports.SyntaxError = class SyntaxError extends BaseException{
    constructor(data){
        super(1005,'Syntax Error',data);
    }
};


/**
 * Converts any input to a exception.BaseException
 * It checks for known error types
 * 
 * @param  {Mixed} errors
 * @return {exceptionexception.base} 
 */
exports.from = function from(error){

    //Empty argument
    if (error == null){
        return new exception.UnknownError();
    }
    
    //Delete domain error appends
    delete error.domain;
    delete error.domainThrown;

    //Uninstantiated BaseException
    if (error.BaseException == exception.BaseException){
        return new exception.BaseException();
    }

    //Uninstantiated exception
    if (error.prototype instanceof exception.BaseException || error == exception.BaseException){
        return new error();
    }

    //Exception itself
    if (error instanceof exception.BaseException){
        return error;
    }

    //Generic SyntaxError
    if (error instanceof SyntaxError){
        return new exception.SyntaxError(error.message);
    }

    //Generic Error
    if (error instanceof Error){
        var err = new exception.InternalError(error.message);
        err.stack = error.stack;
        err.statusCode = error.statusCode;
        return err;
    }

    //Unknown error
    return new exception.UnknownError(error);
};



exports.isInstance = function isInstance(error,obj){
    return exports.from(error).isInstance(obj);
};
