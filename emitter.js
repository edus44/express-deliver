'use strict';

var EventEmitter = require('events').EventEmitter;

var Emitter = class Emitter extends EventEmitter{
    constructor(){
        super();
    }
    error(err){
        process.nextTick(()=>{
            this.emit('error',err)
        })
    }
}


module.exports = new Emitter()