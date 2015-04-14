'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;
var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Value = require('./value.js').Value

var Values = function(valuesObj) {
    EventEmitter.call(this);
	var that = this;

	this.device = valuesObj.device;

	this.values = [];
	this.add(valuesObj.type)
};
util.inherits(Values, EventEmitter);

Values.prototype.update = function(values){
	for( var i in values){
		var valueJson = values[i];
		var value = this.getByAttr('index', valueJson.index);
		if( value ){
			value.update(valueJson)
		} 
	}
};

Values.prototype.getByAttr = function(attr, val){
	if( attr == undefined )
		return this.values
	
	for( var i = 0; i < this.values.length; i++){
		var value = this.values[i];
		if (value.get(attr).get() == val)
			return value;
	}
}

Values.prototype.get = function(id){
	if( id == undefined )
		return this.values

	for( var i = 0; i < this.values.length; i++){
		var value = this.values[i];
		if (value.id == id)
			return value;
	}
}

Values.prototype.set = function(attrJSON){
	var attrID = attrJSON.id.split('-');
	var valueID = attrID[0] + '-' + attrID[1];

	var value = this.get(valueID)
	return value.set(attrJSON)
}

Values.prototype.add = function(valuesJSON){
	var that = this
	
	var update = function(value){
		that.emit('change', that)
	}

	for( var i in valuesJSON){
		var valueType = valuesJSON[i];
		var value = new Value({
			id: this.device.id + '-' + i,
			type: valueType,
			device: this.device
		})
		
		this.values.push(value);
		value.on('change', update);
	}
}

Values.prototype.toJSON = function(){
	var values = []
	for(var valueID in this.values){
		var value = this.values[valueID]
		var valueJson = value.toJSON()
		values.push(valueJson)
	}
	return values;
}

Values.prototype.toJSONObj = function(){
	var values = []
	for(var valueID in this.values){
		var value = this.values[valueID]
		var valueJson = value.toJSONObj()
		values.push(valueJson)
	}
	return values;
}

module.exports.Values = Values;