# express-deliver
[![npm](https://img.shields.io/npm/v/express-deliver.svg)](https://www.npmjs.com/package/express-deliver)
[![Codecov branch](https://img.shields.io/codecov/c/github/edus44/express-deliver/master.svg)](https://codecov.io/gh/edus44/express-deliver)
[![Travis branch](https://img.shields.io/travis/edus44/express-deliver/master.svg)](https://travis-ci.org/edus44/express-deliver)
[![Code Climate](https://img.shields.io/codeclimate/github/edus44/express-deliver.svg)](https://codeclimate.com/github/edus44/express-deliver)

Make API json responses easily using generators (or async/await) and promises. 

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

//or using ES7 async/await 
app.get('/',async function(){
    return await getAsyncList()
})
```

It allows you to write simpler controllers, with easy to read & write 'synchronous' code thanks to __generators__ or __ES7 async/await__

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


## Async/await

_To use this feature you will need node >=7.6_

The same pattern used with generators can be used here, with the exception that you can only `await` for promises. So if you want to resolve promises in parallel you will need to use Promise.all for arrays or [bluebird](http://bluebirdjs.com/docs/getting-started.html) methods for something more sofisticated like `.props()`.

The same examples as before, but using async/await:

```javascript
async function(){
    return {lastVersion:15}
}
// --> 200 {"status":true,"data":{"lastVersion":15}}


async function(req){
    // getUser function returns a promise with user object
    return await getUser(req.query.userId) 
}
// --> 200 {"status":true,"data":{"name":"Alice"}}


async function(){
    // These promises are resolved in parallel
    return await bluebird.props({
        a: Promise.resolve(1),
        b: Promise.resolve(2),
    })
}
// --> 200 {"status":true,"data":{"a":1,"b":2}}


async function(){
    let [a,b] = await Promise.all([ Promise.resolve(1), Promise.resolve(2) ])
    return a + b
}
// --> 200 {"status":true,"data":3}

```
_In this document you will find all the examples written with generators, but the behaviors all are almost the same using async/await (just changing * for async and yield for await)._

## Promises

You can also return plain old promises. Your controller/middleware function name should ends in `'deliver'`. Examples:

```javascript
app.get('/',function deliver(){
    return Promise.resolve('hi')
})
/*
200 {"status":true,"data":"hi"}
*/

app.get('/user',function getUserDeliver(){
    return getUser(req.query.userId)
        .then( user => user.name )
})
/*
200 {"status":true,"data":"Alice"}
*/
```

## Synchronous response

You can deliver responses with data you already have (or can have synchronously). Your controller/middleware function name should ends in `'deliverSync'`. Examples:

```javascript
app.get('/',function deliverSync(){
    return config
})
/*
200 {"status":true,"data":{ "key": 1234 }}
*/

app.get('/user',function getUserDeliverSync(){
    return this.user.name
})
/*
200 {"status":true,"data":"Alice"}
*/


```

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
})
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


#### Custom Exceptions

Your custom exceptions are defined inside an `ExceptionPool` instance. 

Example `exceptionPool.js` file:

```javascript

const {ExceptionPool} = require('express-deliver')
// or const ExceptionPool = require('express-deliver').ExceptionPool

const exceptionPool = new ExceptionPool({
    MyCustomError: {
        code:2001,
        message:'This my public message',
        statusCode:412
    },
    MyError: {
        code:4000,
        message:'My message',
    }
})

//Optional post-creation exception adding
exceptionPool.add('OtherError',{
    code:1100,
    message:'Other error message'
})

module.exports = exceptionPool

```

These are passed to `expressDeliver` options:

```javascript
expressDeliver(app,{
    exceptionPool: require('./exceptionPool.js')
})

```



Throw example in a service:
```javascript
//service.js
const {exception} = require('./exceptionPool')

exports.getData(){
    throw new exception.MyCustomError()
}
```

The `exceptionPool` object is available in `res`:
```javascript
app.get('/',function(req,res){
    throw new res.exception.MyCustomError()
 })
/* --> 412 
{
    status:false,
    error:{
        code:2001,
        message:'This my public message'
    }
}
*/
```

The first argument of the contructor ends in `error.data` property of the response:
```javascript
app.get('/',function(req,res){
    throw new res.exception.MyCustomError({meta:'custom'})
 })
/* --> 412 
{
    status:false,
    error:{
        code:2001,
        message:'This my public message',
        data: {
            meta: 'custom'
        }
    }
}
*/
```

#### Converting errors to exceptions

Generic errors thrown by third parties can be converted automatically to your custom exceptions. 

Without conversion we got:
```javascript
app.get('/',function*(){
    return fs.readdirSync('/invalid/path')
 })
/* --> 500 
{
    status: false,
    error: {
        code: 1000,
        message: "Internal error",
        data: "Error: ENOENT: no such file or directory, scandir '/invalid/path'"
    }
}
*/
```

To enable exception conversion you can define your exceptions with a conversion function. This function gets the generic error as first parameter and should return a boolean.

For example:

```javascript
// Previously in our app 
// added to expressDeliver options also)
exceptionPool.add('NoSuchFile',{
    code:2004,
    statusCode:400,
    message:'No such file or directory',
    conversion: err => err.code=='ENOENT'
})

//Route controller
app.get('/',function*(){
    return fs.readdirSync('/invalid/path')
 })
/* --> 400 
{
    status: false,
    error: {
        code: 2004,
        message: "'No such file or directory"
    }
}
*/

// You can customize the response error.data with:
exceptionPool.add('ParsingError',{
    code:2005,
    message:'Cannot parse text',
    conversion:{
        check: err => err.message.indexOf('Unexpected token')===0,
        data: err=> 'Parsing problem on:' + err.message
    }
})
```

#### Error response options


Responses object can contain more info about errors:

```javascript

expressDeliver(app,{
    printErrorStack: true, //Default: false
    printInternalErrorData: true //Default: false *
})

//Default error response:
{
    status: false,
    error: {
        code: 1000,
        message: "Internal error"
    }
}

//With both set to true:
{
    status: false,
    error: {
        code: 1000,
        message: "Internal error",
        data: "ReferenceError: foo is not defined",
        stack: "ReferenceError: foo is not defined at null.<anonymous> (/home/eduardo.hidalgo/repo/own/file-manager/back/app/routes.js:13:9) at next (native) at onFulfilled (/home/eduardo.hidalgo/repo/own/express-deliver/node_modules/co/index.js:65:19) at .."
    }
}


```
Both should be set to `false` for production enviroments.

_* This documentation shows the responses as if `printInternalErrorData` were `true` by default_

#### Error logging

This example is using [debug](https://www.npmjs.com/package/debug) for logging to console:

```javascript
const debug = require('debug')('error')

expressDeliver(app,{
    onError(err,req,res){
        debug(err.name,err)
    }
})

//Example console output:
/*
  app:error InternalError { ReferenceError: foo is not defined
    at null.<anonymous> (controller.js:13:9)
    at ...
  name: 'InternalError',
  code: 1000,
  statusCode: 500,
  data: 'ReferenceError: foo is not defined',
  _isException: true } +611ms
*/

```

## Using Routers

You can use routers (or sub-apps) as usual, just remember to initialize it with `expressDeliver`. For example:

```javascript
// authRouter.js
const router = express.Router()

expressDeliver(router)

router.get('/',function*(){
    return 'hi from auth'
})

// errorHandler is not necesary, main app will manage it
module.exports = router



// main.js
const authRouter = require('./authRouter.js')
const app = express()

expressDeliver(app)

app.use('/auth',authRouter)

expressDeliver.errorHandler(app)


/*  Request to /auth --> 200 
{
    "status": true,
    "data": "hi from auth"
}
*/
```

The exceptions loaded into the `router` are only available within its controllers, as well as any other exceptions from parent apps or routers.

Any other option defined in routers are ignored in favor of main app options.


## Customizing responses

By default the responses look like:
```javascript
// Success:
{
    "status":true,
    "data":[your-data]
}

//Errors:
{
    "status":false,
    "error":{
        "code":[error-code],
        "message":[error-message],
        "data":[optional-error-data],
    }
}
```

#### Using ResponseData

Same as `exception`, `ResponseData` is available from the package and controller `res`. It can be used to extend the response properties.

```javascript
const {ResponseData} = require('express-deliver')
// or const ResponseData = require('express-deliver').ResponseData

app.get('/',function*(req,res){
    // res.ResponseData === ResponseData
    return new res.ResponseData({
        meta:'custom'
    })
})
/* --> 200 
{
    "status": true,
    "meta": "custom"
}
*/
```

You can remove the `status` from the response (with this option set to false, response data is not converted to object and you can send any other type):

```javascript
function*(req,res){
    return new res.ResponseData('my text response',{appendStatus:false})
}
/* --> 200 
my text response
*/
```

#### Transform responses option

In options parameter, you can set transformation for both success and error responses

Example:

```javascript
expressDeliver(app,{
    transformSuccessResponse(value,options,req){
        return {result:value}
    },
    transformErrorResponse(error,req){
        return {
            error:error.code,
            where:req.url
        }
    }
})


// Success:
{
    "result":[your-data]
}

//Errors:
{
    "error":[error-code],
    "where":[request-url]
}
```


## Corner cases

#### No json response

You should use this approach if you want to use coroutine capabilities but not ending in a json response:

```javascript
function*(req,res,next){
    next('ignore') //This tells expressDeliver to ignore coroutine result
    res.render('home',yield getData())
}

/* --> 200 
<html><head>...
*/
```

#### Empty return
```javascript
function*(){
    //Nothing here
}
//or
function*(){
    let a
    return a
}

/* --> 200 
{
    "status": true
}
*/
```


#### Sending a response before returning something

Resolving the response before returning something in generator, throws an error (`HeadersSent`) caughtable in `onError` logging option :

```javascript
function*(req,res){
    res.send('my previously sent data')
    return {foo:20}
}

expressDeliver(app,{
    onError(err,req,res){
        console.log(err.name) //HeadersSent
        console.log(err.data) //{status:true,data:{foo:20}}}
    }
})

/* --> 200 
my previously sent data
*/

```

## License

[MIT](LICENSE)