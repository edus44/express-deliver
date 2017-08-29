'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const express = require('express')
const request = require('supertest')
const ExceptionPool = expressDeliver.ExceptionPool


function testCtrl(ctrl,statusCode,body,done,exceptionPool){
    let app = express()
    expressDeliver(app,{
        exceptionPool,
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

//Check for async support
let m = process.version.match(/v(\d+).(\d+)/ )
let vMajor = m && m[1]
let vMinor = m && m[2]
let supportsAsync = vMajor>=8 || (vMajor==7 && vMinor >= 6)

describe('controller async',()=>{

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

    if (supportsAsync){
        //If called normally throws error in <7.6 
        eval(`
        it('should deliver success with async function',(done)=>{
            testCtrl(async function(){
                return await Promise.resolve('hi')
            },200,{
                status:true,
                data:'hi'
            },done)
        })
        `)
    }

    it('should deliver success from promise',(done)=>{

        testCtrl(function test1Deliver(){
            return Promise.resolve('hi')
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

        testCtrl(function*(req,res){
            throw new res.exception.CustomError()
        },403,{
            status:false,
            error:{
                code:4000,
                message:'This is a custom error'
            }
        },done, new ExceptionPool({
            CustomError:{
                code: 4000,
                statusCode: 403,
                message: 'This is a custom error',
            }
        }))
    })


    it('should deliver converted custom exception',(done)=>{

        testCtrl(function*(){
            throw new Error('Custom message match')
        },403,{
            status:false,
            error:{
                code:4001,
                message:'This is a custom converted error'
            }
        },done,new ExceptionPool({
            CustomConvertedError:{
                code: 4001,
                statusCode: 403,
                message: 'This is a custom converted error',
                conversion: err => err.message=='Custom message match'
            }
        }))
    })

    it('should deliver 500 with offlimit statusCode',(done)=>{

        testCtrl(function*(req,res){
            throw new res.exception.CustomStatusCode()
        },500,{
            status:false,
            error:{
                code:4002,
                message:'This is a custom error'
            }
        },done,new ExceptionPool({
            CustomStatusCode:{
                code: 4002,
                statusCode: 200,
                message: 'This is a custom error'
            }
        }))
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

    it('should ignore promise result',(done)=>{
        testCtrl(function*(req,res,next){
            next('ignore')
            res.status(201)
            res.send({message:'hi'})
        },201,{
            message:'hi'
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

    it('should avoid circular JSON',(done)=>{
        testCtrl(function*(){
            let a = {}
            a.self = a
            return a
        },500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error',
                data:'TypeError: Converting circular structure to JSON'
            }
        },done)
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


describe('controller sync',()=>{

    it('should deliver success',(done)=>{

        testCtrl(function test2DeliverSync(){
            return 'hi'
        },200,{
            status:true,
            data:'hi'
        },done)
    })


    it('should ignore promise result',(done)=>{
        testCtrl(function test3DeliverSync(req,res,next){
            next('ignore')
            res.status(201)
            res.send({message:'hi'})
        },201,{
            message:'hi'
        },done)
    })

    it('should deliver 404 with empty next',(done)=>{
        testCtrl(function test4DeliverSync(req,res,next){
            next()
        },404,{
            status:false,
            error:{
                code:1002,
                message:'Route not found'
            }
        },done)
    })


    it('should deliver fail',(done)=>{
        testCtrl(function test5DeliverSync(){
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

    it('should deliver fail calling next with value and ignore error thrown',(done)=>{
        testCtrl(function test6DeliverSync(req,res,next){
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
})