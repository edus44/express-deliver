# express-deliver
<!--[![npm](https://img.shields.io/npm/v/express-deliver.svg)](https://www.npmjs.com/package/express-deliver)
[![Codecov branch](https://img.shields.io/codecov/c/github/edus44/express-deliver/master.svg)](https://codecov.io/gh/edus44/express-deliver)
[![Travis branch](https://img.shields.io/travis/edus44/express-deliver/master.svg)](https://travis-ci.org/edus44/express-deliver)-->

Make API json responses easily using generators and promises. 

## Motivations
Tired of writting the same json responses and error catches everywhere across my express app controllers.

##### Example
In a normal API json-based app, a route controller could look like this:
```javascript
app.get('/',function(req,res){
    getAsyncList().then(list=>{
        res.send({status:true,data:list})
    })
    .catch(err=>{
        res.status(500)
        res.send({status:false,error:err.message})
    })
})
```
The same behaviour using `expressDeliver` becomes:
```javascript
app.get('/',function*(){
    return yield getAsyncList()
})
```

It allows you to write simpler controllers, with easy to read & write 'synchronous' code thanks to generators (see [tj/co](https://www.npmjs.com/package/co)) 

## Initialize
This is how to initialize `expressDeliver`:
```javascript
const expressDeliver = require('express-deliver')
const express = require('express')
const app = express()

//It should be before your first middleware
expressDeliver(app)

//This is your route controller (notice the *)
app.get('/',function*(){
    return 'hi'   // 200 {"status":true,"data":"hi"}
})

//It should be after your last middleware
expressDeliver.errorHandler(app)
```


## Returning and yielding

Everything you return inside the generator function ends in the json response body. Some examples

```javascript
function*(){
    return {lastVersion:15}
}
/*
200 {"status":true,"data":{"lastVersion":15}}
*/

function*(req){
    // getUser function returns a promise with user object
    return yield getUser(req.param.userId) 
}
/*
200 {"status":true,"data":{"name":"Alice"}}
*/

```

## Using as middleware

If you call `next()` the return value of generator is ignored. Also the context (`this`) used 

```javascript
function*(req,res,next){
    res.setHeader('x-session',yield getSession(req.body.token)
    next()
}

function*(req,res,next){
    res.setHeader('x-session',yield getSession(req.body.token)
    next()
}
```