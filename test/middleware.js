'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const sinon = require('sinon')
const express = require('express')
const request = require('supertest')
const {exception} = expressDeliver

function testIO(ctrl,test){
    let app = express()
    expressDeliver(app)
    app.get('/',ctrl)
    expressDeliver.errorHandler(app)

    request(app).get('/').end(test)
}

describe('middlewares',()=>{

    it('should respond normally',(done)=>{
        testIO((req,res)=>{
            res.send('hi')
        },(err,res)=>{
            expect(res.text).to.be.equal('hi')
            done()
        })
    })

    it('should deliver success',(done)=>{
        testIO(function*(){
            return 'hi'
        },(err,res)=>{
            expect(res.status).to.be.equal(200)
            expect(res.body).to.be.deep.equal({
                status:true,
                data:'hi'
            })
            done()
        })
    })

    it('should deliver fail',(done)=>{
        testIO(function*(){
            throw new Error('foo')
        },(err,res)=>{
            expect(res.status).to.be.equal(500)
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:1000,
                    message:'Internal error',
                    data:'foo'
                }
            })
            done()
        })
    })


    it('should deliver custom exception',(done)=>{
        exception.define({
            name:'CustomError',
            code: 4000,
            statusCode: 403,
            message: 'This is a custom error',
        })
        testIO(function*(){
            throw new exception.CustomError()
        },(err,res)=>{
            expect(res.status).to.be.equal(403)
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:4000,
                    message:'This is a custom error'
                }
            })
            done()
        })
    })

    it('should deliver 404 with empty next',(done)=>{
        testIO(function*(req,res,next){
            next()
        },(err,res)=>{
            expect(res.status).to.be.equal(404)
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:1001,
                    message:'Route not found'
                }
            })
            done()
        })
    })

})