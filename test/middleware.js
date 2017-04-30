'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const express = require('express')
const request = require('supertest')
const {exception} = expressDeliver

function testCtrl(ctrl,statusCode,body,done){
    let app = express()
    expressDeliver(app)
    app.get('/',ctrl)
    expressDeliver.errorHandler(app)

    let test = function(err,res){
        expect(res.status).to.be.equal(statusCode)
        expect(res.body).to.be.deep.equal(body)
        done()
    }
    if (typeof statusCode == 'function')
        test = statusCode

    request(app).get('/').end(test)
}

describe('middlewares',()=>{

    it('should respond normally',(done)=>{
        testCtrl((req,res)=>{
            res.send('hi')
        },(err,res)=>{
            expect(res.text).to.be.equal('hi')
            done()
        })
    })

    it('should deliver success',(done)=>{
        testCtrl(function*(){
            return 'hi'
        },200,{
            status:true,
            data:'hi'
        },done)
    })

    it('should deliver fail',(done)=>{
        testCtrl(function*(){
            throw new Error('foo')
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'foo'
            }
        },done)
    })


    it('should deliver custom exception',(done)=>{
        exception.define({
            name:'CustomError',
            code: 4000,
            statusCode: 403,
            message: 'This is a custom error',
        })
        testCtrl(function*(req,res){
            throw new res.exception.CustomError()
        },403,{
            status:false,
            error:{
                code:4000,
                message:'This is a custom error'
            }
        },done)
    })

    it('should deliver 404 with empty next',(done)=>{
        testCtrl(function*(req,res,next){
            next()
        },404,{
            status:false,
            error:{
                code:1001,
                message:'Route not found'
            }
        },done)
    })

    it('should deliver fail with async error',(done)=>{
        testCtrl(function(){
            setTimeout(()=>{
                throw new Error('async')
            })
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'async'
            }
        },done)
    })

    it('should deliver from promise',(done)=>{
        testCtrl(function*(){
            return yield Promise.resolve('from promise')
        },200,{
            status:true,
            data:'from promise'
        },done)
    })

    it('should deliver normal error',(done)=>{
        testCtrl(()=>{
            throw 'something'
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'something'
            }
        },done)
    })

    it('should deliver syntax error',(done)=>{
        testCtrl(function*(){
            //eslint-disable-next-line
            foo() 
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'foo is not defined'
            }
        },done)
    })

})