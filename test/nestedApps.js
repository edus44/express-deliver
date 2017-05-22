'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const express = require('express')
const request = require('supertest')
const ExceptionPool = expressDeliver.ExceptionPool


function testApp(app,endpoint,statusCode,body,done){
    let test = function(err,res){
        expect(res.status).to.be.equal(statusCode)
        expect(res.body).to.be.deep.equal(body)
        done()
    }
    request(app).get(endpoint).end(test)
}

function getApp(routes){
    let app = express()

    expressDeliver(app,{
        exceptionPool: new ExceptionPool({
            CustomFromApp:{
                code:4000,
                message:'Message from app'
            }
        })
    })

    app.get('/',function*(){
        return 'hi from app'
    })

    app.get('/error-app',function*(req,res){
        throw new res.exception.CustomFromApp()
    })

    if (routes) routes(app)

    expressDeliver.errorHandler(app)

    return app
}

function getRouterA(){
    let router = express.Router()

    expressDeliver(router,{
        exceptionPool: new ExceptionPool({
            CustomFromRouterA:{
                code:4001,
                message:'Message from router A'
            }
        })
    })

    router.get('/',function*(){
        return 'hi from router a'
    })

    router.get('/error-a',function*(req,res){
        throw new res.exception.CustomFromRouterA()
    })

    router.get('/error-app',function*(req,res){
        throw new res.exception.CustomFromApp()
    })

    return router
}

function getRouterB(){
    let router = express.Router()

    expressDeliver(router,{
        exceptionPool: new ExceptionPool({
            CustomFromRouterB:{
                code:4003,
                message:'Message from router B'
            }
        })
    })


    router.get('/error-a',function*(req,res){
        throw new res.exception.CustomFromRouterA()
    })

    router.get('/error-app',function*(req,res){
        throw new res.exception.CustomFromApp()
    })

    router.get('/error-b',function*(req,res){
        throw new res.exception.CustomFromRouterB()
    })

    return router
}

describe('nested apps',()=>{

    it('should respond from app',(done)=>{
        let app = getApp()
        testApp(app,'/',200,{
            status:true,
            data:'hi from app'
        },done)
    })

    it('should respond from router',(done)=>{
        let app = getApp(app=>{
            app.use('/a',getRouterA())
        })

        testApp(app,'/a',200,{
            status:true,
            data:'hi from router a'
        },done)
    })

    it('should respond app-error from app',(done)=>{
        let app = getApp()

        testApp(app,'/error-app',500,{
            status:false,
            error:{
                code:4000,
                message:'Message from app'
            }
        },done)
    })


    it('should respond app-error from router',(done)=>{
        let app = getApp(app=>{
            app.use('/a',getRouterA())
        })

        testApp(app,'/a/error-app',500,{
            status:false,
            error:{
                code:4000,
                message:'Message from app'
            }
        },done)
    })

    it('should respond app-error from router',(done)=>{
        let app = getApp(app=>{
            app.use('/a',getRouterA())
        })

        testApp(app,'/a/error-app',500,{
            status:false,
            error:{
                code:4000,
                message:'Message from app'
            }
        },done)
    })

    it('should respond router-error from router',(done)=>{
        let app = getApp(app=>{
            app.use('/a',getRouterA())
        })

        testApp(app,'/a/error-a',500,{
            status:false,
            error:{
                code:4001,
                message:'Message from router A'
            }
        },done)
    })

    it('should fail responding router-error-a from router-b',(done)=>{
        let app = getApp(app=>{
            app.use('/b',getRouterB())
        })

        testApp(app,'/b/error-a',500,{
            status:false,
            error:{
                code:1000,
                message:'Internal error'
            }
        },done)
    })

    it('should respond router-error-b from nested router-b',(done)=>{
        let app = getApp(app=>{
            let routerA = getRouterA()
            routerA.use('/b',getRouterB())
            app.use('/a',routerA)
        })

        testApp(app,'/a/b/error-b',500,{
            status:false,
            error:{
                code:4003,
                message:'Message from router B'
            }
        },done)
    })

    it('should respond router-error-a from nested router-b',(done)=>{
        let app = getApp(app=>{
            let routerA = getRouterA()
            routerA.use('/b',getRouterB())
            app.use('/a',routerA)
        })

        testApp(app,'/a/b/error-a',500,{
            status:false,
            error:{
                code:4001,
                message:'Message from router A'
            }
        },done)
    })

    it('should use pool cache',(done)=>{
        let app = getApp()

        testApp(app,'/',200,{
            status:true,
            data:'hi from app'
        },()=>{
            testApp(app,'/',200,{
                status:true,
                data:'hi from app'
            },done)
        })
    })

})