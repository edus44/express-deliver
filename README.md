# express-deliver

## Use
```js

var app = require('express')()
var q = require('q')
var expressDeliver = require('express-deliver')

app.use(expressDeliver)


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

// View more usages on test/app.js file


//At the end
expressDeliver.handlers(app)

app.listen(8080)
```

## Custom exceptions
```js
var exception = require('express-deliver').exception;

exception.CustomError = class CustomError extends exception.BaseException{
    constructor(data){
        super(40001,'Custom Error',data);
    }
};

// ...
// Somewhere in a controller
throw exception.CustomError
// or
throw new exception.CustomError('custom message')
```


## License
MIT