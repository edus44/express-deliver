'use strict';

const expressDeliver = require('..')
const expect = require('chai').expect;
const sinon = require('sinon');
const exception = expressDeliver.exception

const bluebird = require('bluebird');
const q = require('q');

function getRes(){
    return {
        send : sinon.spy(),
        status : sinon.spy()
    }
}

function getArg(obj){
    var call = obj.getCall(0);
    return call && call.args[0]

}

describe('expressDeliver() success',()=>{
    this
})