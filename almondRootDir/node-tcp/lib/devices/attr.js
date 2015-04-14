'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;
var util = require('util');

var EventEmitter = require('events').EventEmitter;

var Attr = function(attrObj) {
    EventEmitter.call(this);
	var that = this;

	this.id = attrObj.id;
	this.key = attrObj.key;
	this.value = attrObj.value;

	//If Attr has device attributed to it,
	//on set must relay data to setdevice
	if(attrObj.device)
		this.device = attrObj.device;
};
util.inherits(Attr, EventEmitter);

var set = function(deviceId, valueIndex, value, callback){
	//probably could add some error callbacks here...
	var command = "/www/setdevice cmd=set dev=" + deviceId + " idx=" + valueIndex + " val=" + value
	console.log(command)
	exec(command,function(error, stdout, stderr){
		if( callback ) 
			callback(error, stdout, stderr)
	})
}

Attr.prototype.update = function(attrValue){
	var old = this.value;

	if( old != attrValue){
		this.value = attrValue;
		this.emit('change', this);
	}
};

Attr.prototype.get = function(attrKey){
	return this.value
}

Attr.prototype.set = function(attrJSON){
	if( attrJSON.key == 'value'){
		var attrID = attrJSON.id.split('-');
		var devID = attrID[0];
		var valueIDX = attrJSON.index;

		set(devID, valueIDX, attrJSON.value, attrJSON.callback)
	}else{
		cosole.log('No set function made for', attrJSON)
	}
}

Attr.prototype.toJSON = function(){
	return {
		id: this.id,
		key: this.key,
		value: this.value
	};
}

module.exports.Attr = Attr;