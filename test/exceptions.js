'use strict'

const expressDeliver = require('..')
const expect = require('chai').expect
const exception = expressDeliver.exception

describe('exceptions',()=>{

    it('should should be an object',()=>{
        expect(exception).to.be.an('object')
    })

    it('should define an exception',()=>{
        exception.define({
            name:'CustomError',
            code:2000,
            message:'custom message',
        })
        expect(exception.CustomError).to.be.a('function')
    })

    it('should fail to define with invalid options',()=>{
        expect(()=>{
            exception.define({
                name:'CustomError2'
            })
        }).to.throw(Error)
    })


    it('should instantiate an exception',()=>{
        let exp = new exception.CustomError('mydata')
        expect(exp).to.be.instanceof(Error)
        expect(exp).to.be.instanceof(exception.CustomError)
        expect(exp.data).to.be.equal('mydata')
    })

})

describe('exceptions conversions',()=>{

    it('should define an exception with conversion',()=>{
        exception.define({
            name:'CustomError',
            code:2000,
            message:'custom message',
            conversion:err=>err.message=='match message'
        })
        expect(exception.CustomError).to.be.a('function')
    })

    it('should define an exception with conversion',()=>{
        exception.define({
            name:'CustomError',
            code:2000,
            message:'custom message',
            conversion:err=>err.message=='match message'
        })
        expect(exception.CustomError).to.be.a('function')
    })


    it('should fail with invalid conversion',()=>{
        expect(()=>{
            exception.define({
                name:'CustomError',
                code:2000,
                message:'custom message',
                conversion:'string'
            })
        }).to.throw(Error)
    })

    it('should convert an error to a generic exception',()=>{
        let err = exception._convert(new Error('unkown error'))
        expect(err).to.be.instanceof(exception.InternalError)
    })


    it('should convert an error to known exception',()=>{
        let err = exception._convert(new Error('match message'))
        expect(err).to.be.instanceof(exception.CustomError)
    })

})