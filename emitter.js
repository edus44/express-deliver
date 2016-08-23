'use strict';

var EventEmitter = require('events').EventEmitter;

var Emitter = class Emitter extends EventEmitter{
    constructor(){
        super();
    }
    error(err,req){
        process.nextTick(()=>{
            try{
                err._request = req;
            }catch(e){
                err = {_request : req}
            }
            this.emit('error',err)
        })
    }
}


module.exports = new Emitter()