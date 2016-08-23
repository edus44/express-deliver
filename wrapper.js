'use strict';

module.exports = function(actions){

    if (typeof actions == 'function'){
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

        for(let name in actions){
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