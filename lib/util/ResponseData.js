'use strict'

module.exports = function ResponseData(value,options){
    return {
        _isResponseData: true,
        value,
        options: typeof options == 'object' ? options : {}
    }
}