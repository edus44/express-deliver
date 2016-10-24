'use strict';

const expressDeliver = require('..')
const expect = require('chai').expect;
const sinon = require('sinon');
const exception = expressDeliver.exception

const bluebird = require('bluebird');
const q = require('q');

function getRes(done){
    var sendSpy = sinon.spy()
    return {
        sendSpy : sendSpy,
        send : function(){
            sendSpy.apply(null,arguments)
            done()
        },
        status : sinon.spy()
    }
}

function getArg(obj){
    var call = obj.getCall(0);
    return call && call.args[0]

}

function testIO(input,dataOutput,statusOutput){
    var res = getRes(expectation);

    expressDeliver({},res,nextValue=>{
        if (nextValue){
            res.deliver(nextValue)
        }
    })
    res.deliver(input)

    function expectation(){
        expect(res.sendSpy.calledOnce).to.be.true

        if (statusOutput){
            expect(res.status.called).to.be.true
            expect(res.status.args[0][0]).to.be.equal(statusOutput)
        }else{
            expect(res.status.called).to.be.false
        }

        expect(res.sendSpy.args[0][0]).to.be.deep.equal(dataOutput);
    }
}


describe('expressDeliver() success',()=>{

    before(()=>{
        var res = {};
        expressDeliver({},res,()=>{
            expect(res.deliver).to.be.a('function')
            expect(res.deliverSuccess).to.be.a('function')
            expect(res.deliverError).to.be.a('function')
        })
    })

    it('should success with non null data',()=>{
        var input = 0
        var output = {
            status:true,
            data:0
        }
        testIO(input,output)
    })

    it('should success with API Promise',()=>{

        var input = Promise.resolve('my data')
        var output = {
            status:true,
            data:'my data'
        }
        testIO(input,output)
    })

    it('should success with bluebird Promise',()=>{

        var input = bluebird.resolve('my data')
        var output = {
            status:true,
            data:'my data'
        }
        testIO(input,output)
    })

    it('should success with q Promise',()=>{

        var input = q.resolve('my data')
        var output = {
            status:true,
            data:'my data'
        }
        testIO(input,output)
    })
});




describe('expressDeliver() fail',()=>{

    it('should fail with empty data',()=>{
        var input;
        var output = {
            status:false
        }
        testIO(input,output)
    })


    it('should fail with API Promise rejection',()=>{
        var input = Promise.reject(Error('my error data'))
        var output = {
            status:false,
            error:{
                code:1003,
                message:'Internal Error'
            },
            data : 'my error data'
        }
        testIO(input,output)
    })


    it('should fail with q Promise rejection',()=>{
        var input = q.reject(Error('my error data'))
        var output = {
            status:false,
            error:{
                code:1003,
                message:'Internal Error'
            },
            data : 'my error data'
        }
        testIO(input,output)
    })

    it('should fail with thenable',()=>{
        var input = {
            then : function(resolve){
                resolve(Error('my error data'))
            }
        }
        var output = {
            status:false,
            error:{
                code:1003,
                message:'Internal Error'
            },
            data : 'my error data'
        }
        testIO(input,output)
    })


    it('should fail with bluebird rejection',()=>{
        var input = Promise.reject(Error('my error data'))
        var output = {
            status:false,
            error:{
                code:1003,
                message:'Internal Error'
            },
            data : 'my error data'
        }
        testIO(input,output)
    })

    // it('should fail with async error',()=>{
    //     var input = new Promise(function(resolve,reject){
    //         setTimeout(function(){
    //             throw Error('my error data')
    //         })
    //     })
    //     var output = {
    //         status:false,
    //         error:{
    //             code:1003,
    //             message:'Internal Error'
    //         },
    //         data : 'my error data'
    //     }
    //     testIO(input,output)
    // })


    it('should fail with Error',()=>{
        var input = new Error('Custom error');
        var output = {
            status:false,
            error:{
                code:1003,
                message:'Internal Error'
            },
            data : 'Custom error'
        }
        testIO(input,output)
    })

    it('should fail with flat exception',()=>{

        var input = exception
        var output = {
            status:false,
            error:{
                code:1000,
                message:'Unknown exception'
            },
            data : undefined
        }
        testIO(input,output)
    })

    it('should fail with flat Error',()=>{

        var input = Error
        var output = {
            status:false,
            error:{
                code:1001,
                message:'Unknown Error'
            },
            data : undefined
        }
        testIO(input,output)
    })


    it('should fail with flat BaseException',()=>{

        var input = exception.BaseException
        var output = {
            status:false,
            error:{
                code:1000,
                message:'Unknown exception'
            },
            data : undefined
        }
        testIO(input,output)
    })

    it('should fail with new BaseException',()=>{
        var input = new exception.BaseException(9999,'exception message','exception data');
        var output = {
            status:false,
            error:{
                code:9999,
                message:'exception message'
            },
            data : 'exception data'
        }
        testIO(input,output)
    })

    it('should fail with flat custom exception',()=>{
        var CustomException = class CustomException extends exception.BaseException{
            constructor(data){
                super(40001,'Custom Exception',data);
            }
        };

        var input = CustomException
        var output = {
            status:false,
            error:{
                code:40001,
                message:'Custom Exception'
            },
            data : undefined
        }
        testIO(input,output)
    })

    it('should fail with new custom exception',()=>{

        var CustomException = class CustomException extends exception.BaseException{
            constructor(data){
                super(40001,'Custom Exception',data);
            }
        };

        var input = new CustomException('custom data');
        var output = {
            status:false,
            error:{
                code:40001,
                message:'Custom Exception'
            },
            data : 'custom data'
        }
        testIO(input,output)
    })

    it('should fail,data and statusCode with Error with statusCode',()=>{
        var input = new Error('custom err');
        input.statusCode = 401;
        var output = {
            status:false,
            error:{
                code:1003,
                message:'Internal Error'
            },
            data : 'custom err'
        }
        testIO(input,output,401)
    })

})