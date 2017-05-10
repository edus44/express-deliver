# express-deliver
[![npm](https://img.shields.io/npm/v/express-deliver.svg)](https://www.npmjs.com/package/express-deliver)
[![Codecov branch](https://img.shields.io/codecov/c/github/edus44/express-deliver/master.svg)](https://codecov.io/gh/edus44/express-deliver)
[![Travis branch](https://img.shields.io/travis/edus44/express-deliver/master.svg)](https://travis-ci.org/edus44/express-deliver)
[![Code Climate](https://img.shields.io/codeclimate/github/edus44/express-deliver.svg)](https://codeclimate.com/github/edus44/express-deliver)

Make API json responses easily using generators and promises. 

## Motivations
Tired of writting the same json responses and error catches everywhere across the express app controllers.

##### Example
In a normal API json-based app, a route controller could look like this:
```javascript
app.get('/',function(req,res){
    getAsyncList()
    .then(list=>{
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
    return 'hi'   
})
// --> 200 {"status":true,"data":"hi"}

//It should be after your last middleware
expressDeliver.errorHandler(app)
```


## Returning and yielding

Everything you return inside the generator function ends in the json response body. Some controller examples:

```javascript
function*(){
    return {lastVersion:15}
}
// --> 200 {"status":true,"data":{"lastVersion":15}}


function*(req){
    // getUser function returns a promise with user object
    return yield getUser(req.query.userId) 
}
// --> 200 {"status":true,"data":{"name":"Alice"}}


function*(){
    // These promises are resolved in parallel
    return yield {
        a: Promise.resolve(1),
        b: Promise.resolve(2),
    }
}
// --> 200 {"status":true,"data":{"a":1,"b":2}}


function*(){
    let [a,b] = yield [ Promise.resolve(1), Promise.resolve(2) ]
    return a + b
}
// --> 200 {"status":true,"data":3}

```

See more yield options in [co](https://www.npmjs.com/package/co) documentation


## Using as middleware

If you call `next()`, no response is generated, the return value is ignored.

Also `res.locals` is used as the context (`this`) of the generator.

```javascript
app.use(function*(req,res,next){
    res.setHeader('x-session',yield getSession(req.body.token))
    this.user = yield getUser(req.query.userId) 
    // same as res.locals.user = ..
    next()
})
//Later in other controller of the same request
app.get('/',function*(){
    return this.user.name
}
/*
200 {"status":true,"data":"Alice"}
*/
```

## Error handling

Every error thrown in the request middleware chain gets caught by `expressDeliver` error handler (also async ones by using domains).

All errors caught are converted to error-like custom exceptions, so they can hold more options useful in the responses, like error code or extra data.

```javascript
app.get('/',function(req,res,next){
    throw new Error('My error')
    // same as next(new Error('My error'))
})
/* --> 500 
{
    status:false,
    error:{
        code:1000,
        message:'Internal error',
        data:'Error: foo'
    }
}
*/
```

