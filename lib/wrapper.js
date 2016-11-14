/* jshint loopfunc:true */
'use strict';

const co = require('co')

function isGenerator(fn){
    return typeof fn == 'function' && fn.constructor.name == 'GeneratorFunction'
}

module.exports = function(actions){

    if (typeof actions == 'function'){
        if (isGenerator(actions)){
            actions = co.wrap(actions)
        }

        //Wrap a normal function
        return function(req,res){

            var result = actions.apply(res.locals,arguments);

            if (result != ignoreFlag){
                res.deliver(result);
            }
        };
    }else{
        //Wrap a object of functions
        var wrapedActions = {};

        //Copy original object
        actions = Object.assign({},actions)

        for(let name in actions){

            //If is generator wrap in a Coroutine
            if (isGenerator(actions[name])){
                actions[name] = co.wrap(actions[name])
            }

            wrapedActions[name] = function(req,res){
                var result = actions[name].apply(res.locals,arguments);

                if (result != ignoreFlag){
                    res.deliver(result);
                }
            };
        }

        return wrapedActions;
    }

};

var ignoreFlag = module.exports.ignore = {}