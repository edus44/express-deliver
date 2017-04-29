'use strict'

module.exports = (res)=>{
    if (res.headersSent){
        console.log('Headers sent')
        return true
    }
    return false
}