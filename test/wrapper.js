'use strict';

const expressDeliver = require('..')
const expect = require('chai').expect;
const exception = expressDeliver.exception
const Promise = require('bluebird');
const supertest = require('supertest');
const sinon = require('sinon');

const app = require('./app')
const request = supertest.agent(app)

describe('server',()=>{
    var server;
    before((done)=>{
        server = app.listen(8009,done)
    })

    after(()=>{
        server.close()
    })

    it('should return true',(done)=>{
        request.get('/')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:true,
                data:'hi'
            });
            done()
        })
    })

    it('should return true with promise',(done)=>{
        request.get('/promise')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:true,
                data:'promised hi'
            });
            done()
        })
    })

    it('should return true with timed deliver',(done)=>{
        request.get('/async')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:true,
                data:'async hi'
            });
            done()
        })
    })

    it('should return custom data response',(done)=>{
        request.get('/custom-response')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:true,
                metadata:12551
            });
            done()
        })
    })
    it('should return custom response',(done)=>{
        request.get('/out')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.text).to.be.deep.equal('something');
            done()
        })
    })

    it('should return false with custom error',(done)=>{
        request.get('/promise-error')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:40001,
                    message:'Custom Error'
                }
            });
            done()
        })
    })

    it('should return false with error1',(done)=>{
        request.get('/error')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:40001,
                    message:'Custom Error'
                }
            });
            done()
        })
    })

    it('should return false with error2',(done)=>{
        request.get('/error2')
        .expect(200)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:1003,
                    message:'Internal Error'
                },
                data : 'foo is not defined'
            });
            done()
        })
    })

    it('should return false with error3 with statusCode',(done)=>{
        request.get('/error3')
        .expect(502)
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:40001,
                    message:'Custom Error'
                },
                data : 'this is 502'
            });
            done()
        })
    })

    it('should return false with error4',(done)=>{
        request.get('/error4')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code:1005,
                    message:'Syntax Error'
                },
                data : ''
            });
            done()
        })
    })

    it('should return true with throw-string',(done)=>{
        request.get('/throw-string')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:true,
                data : 'nothing'
            });
            done()
        })
    })

    it('should return false with throw-error',(done)=>{
        request.get('/throw-error')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code : 1003,
                    message : 'Internal Error'
                },
                data : 'err message'
            });
            done()
        })
    })

    it('should return false with throw-async-error',(done)=>{
        request.get('/throw-async-error')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code : 1003,
                    message : 'Internal Error'
                },
                data : 'err message'
            });
            done()
        })
    })
    it('should return false with double response',(done)=>{
        request.get('/double-response')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.text).to.be.deep.equal('response');
            done()
        })
    })
    it('should return false with middleware-order-error',(done)=>{
        request.get('/middleware-order-error')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code : 1002,
                    message : 'Unhandled Error'
                },
                data : 'res.deliver is not a function'
            });
            done()
        })
    })
    it('should return false with invented route',(done)=>{
        request.get('/invented-route')
        .end(function(err,res){
            expect(err).to.be.null;
            expect(res.body).to.be.deep.equal({
                status:false,
                error:{
                    code : 1004,
                    message : 'Route Not Found'
                }
            });
            done()
        })
    })
})