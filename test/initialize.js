'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const express = require('express')

describe('initialization',()=>{

    it('should load into express app',()=>{
        let app = express()
        expect(app._expressDeliverLoaded).to.not.exists
        expressDeliver(app)
        expect(app._expressDeliverLoaded).to.be.true
    })

    it('should load only once',()=>{
        let app = express()
        let r = expressDeliver(app)
        expect(r).to.be.true
        r = expressDeliver(app)
        expect(r).to.be.false
    })

    it('should load error handler',()=>{
        let app = express()
        expressDeliver(app)
        expect(app._expressDeliverErrorHandlerLoaded).to.not.exists
        expressDeliver.errorHandler(app)
        expect(app._expressDeliverErrorHandlerLoaded).to.be.true
    })

    it('should load error handler only once',()=>{
        let app = express()
        expressDeliver(app)
        let r = expressDeliver.errorHandler(app)
        expect(r).to.be.true
        r = expressDeliver.errorHandler(app)
        expect(r).to.be.false
    })

    it('should not load error handler without previous load',()=>{
        let app = express()
        expect(()=>{
            expressDeliver.errorHandler(app)
        }).to.throw(Error)
    })

})