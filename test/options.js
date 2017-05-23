'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const express = require('express')
const request = require('supertest')

function testCtrl(options,ctrl,test){
    let app = express()
    expressDeliver(app,options)
    app.get('/',ctrl)
    expressDeliver.errorHandler(app)
    request(app).get('/').end(test)
}

describe('options',()=>{

    it('should not print stack',(done)=>{
        testCtrl({
            // printErrorStack:false
        },function*(){
            throw new Error()
        },(err,res)=>{
            expect(res.body.error.stack).to.not.exist
            done()
        })
    })
    
    it('should print stack',(done)=>{
        testCtrl({
            printErrorStack:true
        },function*(){
            throw new Error()
        },(err,res)=>{
            expect(res.body.error.stack).to.exist
            done()
        })
    })

    it('should not print InternalError data',(done)=>{
        testCtrl({
            // printInternalErrorData:false
        },function*(){
            throw new Error('random')
        },(err,res)=>{
            expect(res.body.error.data).to.not.exist
            done()
        })
    })

    it('should print InternalError data',(done)=>{
        testCtrl({
            printInternalErrorData:true
        },function*(){
            throw new Error('random')
        },(err,res)=>{
            expect(res.body.error.data).to.be.equal('Error: random')
            done()
        })
    })

    it('should print custom response',(done)=>{
        testCtrl({
            transformSuccessResponse(value){
                return {myData:value}
            }
        },function*(){
            return 'custom'
        },(err,res)=>{
            expect(res.body).to.be.deep.equal({myData:'custom'})
            done()
        })
    })

    it('should print custom error',(done)=>{
        testCtrl({
            transformErrorResponse(err){
                return {myError:err.data}
            }
        },function*(){
            throw new Error('custom')
        },(err,res)=>{
            expect(res.body).to.be.deep.equal({myError:'Error: custom'})
            done()
        })
    })

    it('should call error log',(done)=>{
        let calledErr
        testCtrl({
            onError(err){
                calledErr = err
            }
        },function*(){
            throw new Error('custom')
        },()=>{
            expect(calledErr).to.be.instanceof(Error)
            expect(calledErr.name).to.be.equal('InternalError')
            done()
        })
    })

    it('should call error log on headersSent',(done)=>{
        let calledErr
        testCtrl({
            onError(err){
                //Called twice InternalError & HeadersSent
                calledErr = err
            }
        },function*(req,res){
            res.send('first')
            throw new Error('custom')
        },()=>{
            expect(calledErr).to.be.instanceof(Error)
            expect(calledErr.name).to.be.equal('HeadersSent')
            done()
        })
    })

    it('should alert from invalid exceptionPool',()=>{
        expect(()=>{
            expressDeliver(express(),{
                exceptionPool:{}
            })
        }).to.throw(Error)
    })

    it('should alert from invalid defaultExceptionPool',()=>{
        expect(()=>{
            expressDeliver(express(),{
                defaultExceptionPool:{}
            })
        }).to.throw(Error)
    })

    it('should accept defaultExceptionPool',()=>{
        let ret = expressDeliver(express(),{
            defaultExceptionPool : new expressDeliver.ExceptionPool()
        })

        expect(ret).to.be.true
    })


})