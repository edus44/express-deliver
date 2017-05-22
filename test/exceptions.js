'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const ExceptionPool = expressDeliver.ExceptionPool

describe('exceptionPool',()=>{

    it('should be an function',()=>{
        expect(ExceptionPool).to.be.a('function')
    })

    it('should define an exception',()=>{
        let exceptionPool = new ExceptionPool({
            CustomError:{
                code:2000,
                message:'custom message',
            }
        })
        expect(exceptionPool.CustomError).to.be.a('function')
    })

    it('should fail to define with invalid options',()=>{
        expect(()=>{
            new ExceptionPool({
                CustomError:{}
            })
        }).to.throw(Error)
    })


    it('should instantiate an exception',()=>{
        let exceptionPool = new ExceptionPool({
            CustomError:{
                code:2000,
                message:'custom message',
            }
        })

        let exp = new exceptionPool.CustomError('mydata')
        expect(exp).to.be.instanceof(Error)
        expect(exp).to.be.instanceof(exceptionPool.CustomError)
        expect(exp.data).to.be.equal('mydata')
    })

})

describe('exceptionPool conversions',()=>{

    it('should define an exception with conversion',()=>{

        let exceptionPool = new ExceptionPool({
            CustomError:{
                code:2000,
                message:'custom message',
                conversion:err=>err.message=='match message'
            }
        })
        expect(exceptionPool.CustomError).to.be.a('function')
        expect(exceptionPool._conversions.length).to.be.equal(1)
    })


    it('should fail with invalid conversion',()=>{
        expect(()=>{
            new ExceptionPool({
                CustomError:{
                    code:2000,
                    message:'custom message',
                    conversion:'string'
                }
            })
        }).to.throw(Error)
    })

    it('should convert an error to known exception',()=>{

        let exceptionPool = new ExceptionPool({
            CustomError:{
                code:2000,
                message:'custom message',
                conversion:err=>err.message=='match message'
            }
        })

        let err = exceptionPool._convert(new Error('match message'))
        expect(err).to.be.instanceof(exceptionPool.CustomError)
    })


    it('should return undefined if not find conversion',()=>{

        let exceptionPool = new ExceptionPool({
            CustomError:{
                code:2000,
                message:'custom message',
                conversion:err=>err.message=='match message'
            }
        })

        let err = new Error('unkown error')
        let excep = exceptionPool._convert(err)
        expect(excep).to.not.exists
    })


})