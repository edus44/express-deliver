'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const express = require('express')
const request = require('supertest')
const exception = expressDeliver.exception

function testCtrl(ctrl,statusCode,body,done){
    let app = express()
    expressDeliver(app,{
        printInternalErrorData:true
    })
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

describe('controller',()=>{

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
                data:'Error: foo'
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


    it('should deliver converted custom exception',(done)=>{
        exception.define({
            name:'CustomConvertedError',
            code: 4001,
            statusCode: 403,
            message: 'This is a custom converted error',
            conversion: err => err.message=='Custom message match'
        })
        testCtrl(function*(){
            throw new Error('Custom message match')
        },403,{
            status:false,
            error:{
                code:4001,
                message:'This is a custom converted error'
            }
        },done)
    })

    it('should deliver 500 with offlimit statusCode',(done)=>{
        exception.define({
            name:'CustomStatusCode',
            code: 4002,
            statusCode: 200,
            message: 'This is a custom error'
        })
        testCtrl(function*(req,res){
            throw new res.exception.CustomStatusCode()
        },500,{
            status:false,
            error:{
                code:4002,
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
                code:1002,
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
                data:'Error: async'
            }
        },done)
    })

    it('should deliver fail calling next with value and ignore promise rejection',(done)=>{
        testCtrl(function*(req,res,next){
            next('something')
            throw 'shit'
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'Error: something'
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

    it('should deliver custom response data',(done)=>{
        testCtrl(function*(req,res){
            return new res.ResponseData({
                paginated:true
            })
        },200,{
            status:true,
            paginated:true
        },done)
    })

    it('should deliver custom response data without status',(done)=>{
        testCtrl(function*(req,res){
            return new res.ResponseData({clean:true},{appendStatus:false})
        },200,{clean:true},done)
    })

    it('should deliver non-object response data with status',(done)=>{
        testCtrl(function*(req,res){
            return new res.ResponseData('algo',{appendStatus:true})
        },200,{status:true},done)
    })

    it('should deliver normal error',(done)=>{
        testCtrl(()=>{
            throw 'something'
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'Error: something'
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
                data:'ReferenceError: foo is not defined'
            }
        },done)
    })

    it('should avoid headers sent',(done)=>{
        testCtrl(function*(req,res){
            res.send({custom:'first'})
            return 'second'
        },200,{custom:'first'},done)
    })


    it('should use res.locals as context',(done)=>{
        let app = express()
        expressDeliver(app)
        app.get('/',function(req,res,next){
            res.locals.signal = 1
            next()
        },function*(){
            return this.signal
        })
        expressDeliver.errorHandler(app)
        request(app).get('/').end(function(err,res){
            expect(res.body).to.be.deep.equal({
                status:true,
                data:1
            })
            done()
        })
    })

})