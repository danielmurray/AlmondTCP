'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;

var EventEmitter = require('events').EventEmitter;
var Attrs = require('./attrs.js').Attrs;

var Value = function(valueObj) {
    EventEmitter.call(this);
	var that = this;

	var update = function(value){
		that.emit('change', that)
	}

	this.id = valueObj.id;
	this.device = valueObj.device;

	this.attrs  = new Attrs({
		parent: this,
		type: valueObj.type
	});
	this.attrs.add({
		id: valueObj.id,
		value: 0
	}, this)

	this.attrs.on('change', update);
}
util.inherits(Value, EventEmitter);

var fromServerValue = function(value){
	var intVal = parseInt(value); 

	if(isNaN(intVal)){
		if (value == 'true')
			return 1
		else if (value == 'false')
			return 0
		else
			return value
	}else{
		return intVal
	}
}

var toServerValue = function(type, value){
	console.log(type, value)
	switch(type){
		case 'state':
		case 'switch':
			if(value == 0){
				return 'false'
			}else if(value == 1){
				return 'true'
			}
		case 'number':
		case 'slider':
			return value;
		default:
			return value;
	}

}

Value.prototype.update = function(valueJson){
	this.valueJson = valueJson;

	var value = fromServerValue(valueJson.value);
	
	this.attrs.update({
		index: valueJson.index,
		name: valueJson.name,
		value: value
	});

}

Value.prototype.get = function(key){
	if(!key)
		return this.attrs.get('value');
	else
		return this.attrs.getByKey(key);
}

Value.prototype.set = function(attrJSON){
	var index = this.get('index');
	attrJSON.index = index.value;

	var type = this.get('type');
	var value = toServerValue(type.value, attrJSON.value)
	attrJSON.value = value;

	this.attrs.set(attrJSON);	
}

Value.prototype.toJSON = function(){
	return {
		id: this.id,
		attrs: this.attrs.toJSON()
	}
}

Value.prototype.toJSONObj = function(){
	return this.attrs.toJSONObj()
}

module.exports.Value = Value;