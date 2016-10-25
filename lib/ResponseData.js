'use strict'

module.exports = class ResponseData{
    constructor(obj){
        if (typeof obj == 'object')
            Object.assign(this,obj);
    }
}