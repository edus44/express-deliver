'use strict';

var express = require('express'); //npm install express

var expressDeliver = require('../');
var q = require('q');

var app = express();
var exception = expressDeliver.exception;

//Extends exceptions
exception.CustomError = class CustomError extends exception.BaseException{
    constructor(data){
        super(40001,'Custom Error',data);
    }
};

//Required middleware
app.use(expressDeliver)


expressDeliver.on('error',function(err){
    console.log('error',err);
})

//Sync response
app.get('/',expressDeliver.wrapper(function(req,res){
    return 'hi'
}))

//Promised response
app.get('/promise',expressDeliver.wrapper(function(req,res){
    return q.promise(function(resolve){
        setTimeout(function(){
            resolve('promised hi')
        },1000)
    })
}))

//Async response
app.get('/async',expressDeliver.wrapper(function(req,res){
    setTimeout(function(){
        res.deliver('async hi')
    },1000)
    return expressDeliver.ignore
}))

//Not deliver response
app.get('/out',expressDeliver.wrapper(function(req,res){
    res.send('something')
    return expressDeliver.ignore
}))

//Rejected promise
app.get('/promise-error',expressDeliver.wrapper(function(req,res){
    var defer = q.defer();

    setTimeout(function(){
        defer.reject(exception.CustomError)
    },500)

    return defer.promise
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
    }
})

//Error examples
app.get('/error',actions.error);
app.get('/error2',actions.error2);
app.get('/error3',actions.error3);
app.get('/error4',actions.error4);


expressDeliver.handlers(app)

app.listen(8080,function(){
    console.log('listening 8080');
})