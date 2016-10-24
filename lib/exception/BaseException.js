'use strict';

module.exports = class BaseException extends Error{
	constructor(code,message,data){
		super(message);
		this.name = this.constructor.name;

		this
			.setCode(code)
			.setMessage(message)
			.setData(data);

	}
	setCode(code){

		if (typeof code == 'undefined')
			code = 1000;

		this.code = code;
		return this;
	}
	setMessage(message){

		if (typeof message == 'undefined')
			message = 'Unknown exception';

		this.message = message;
		return this;
	}
	setData(data){
		this.data = data;
		return this;
	}
	isInstance(obj){
		return this instanceof obj;
	}
};