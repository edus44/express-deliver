'use strict';

var express = require('express');

var expressDeliver = require('../');
var q = require('q');
var Promise = require('bluebird');

var app = express();
var exception = expressDeliver.exception;

//Extends exceptions
exception.CustomError = class CustomError extends exception.BaseException{
    constructor(data){
        super(40001,'Custom Error',data);
    }
};


app.get('/middleware-order-error',function(req,res){
    res.deliver('test') //SHOULD FAIL
})


app.get('/middleware-order-async-error',function(req,res,next){
    setTimeout(function(){
        throw Error('ultimate async error')
    })
})

//Required middleware
app.use(expressDeliver)

expressDeliver.on('error',function(err){
    // console.log('error',err && err.message);
})

//Sync response
app.get('/',expressDeliver.wrapper(function(req,res){
    return 'hi'
}))

//Promised response
app.get('/promise',expressDeliver.wrapper(function(req,res){
    return Promise.delay(50).then(()=>{
        return Promise.resolve('promised hi')
    })
}))

//Promised response
app.get('/custom-response',expressDeliver.wrapper(function(req,res){
    return new expressDeliver.ResponseData({
        metadata : 12551
    })
}))

//Async response
app.get('/async',expressDeliver.wrapper(function(req,res){
    setTimeout(function(){
        res.deliver('async hi')
    },50)
    return expressDeliver.ignore
}))

//generator response
app.get('/generator',expressDeliver.wrapper(function*(req,res){
    var a = yield new Promise(function(resolve){
        setTimeout(function(){
            resolve('generator hi')
        },50)
    })
    return a
}))

//Not deliver response
app.get('/out',expressDeliver.wrapper(function(req,res){
    res.send('something')
    return expressDeliver.ignore
}))

//Rejected promise
app.get('/promise-error',expressDeliver.wrapper(function(req,res,next){
    return new Promise(function(resolve,reject){
        setTimeout(function(){
            reject(exception.CustomError)
        },50)
    })
}))

//Wrapper for objects
var actions = expressDeliver.wrapper({
    error : function(req,res){
        throw exception.CustomError
    },
    error2 : function(req,res){
        foo();
    },
    error3 : function(req,res){
        var error = new exception.CustomError('this is 502')
        error.statusCode = 502;
        throw error;
    },
    error4 : function(req,res){
        throw SyntaxError()
    },
    error5 : function * (req,res){
        throw exception.CustomError
    }
})

//Error examples
app.get('/error',actions.error);
app.get('/error2',actions.error2);
app.get('/error3',actions.error3);
app.get('/error4',actions.error4);
app.get('/error5',actions.error5);

app.get('/throw-string',function(req,res,next){
    throw 'nothing'  // same as: next('nothing')
});

app.get('/throw-error',function(req,res,next){
    throw Error('err message')   // same as: next(Error('err message'))
});

app.get('/throw-async-error',function(req,res,next){
    setTimeout(function(){
        throw Error('err message')
    },50)
});

app.get('/double-response',function(req,res,next){
    res.send('response')
    res.deliver('response')
    setTimeout(function(){
        next(Error('bad'))
    })
});


expressDeliver.handlers(app)

module.exports = app;

if (typeof describe !== 'function')
    app.listen(8008,function(){
        console.log('listening ',8008);
    })