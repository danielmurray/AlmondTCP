'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;

var EventEmitter = require('events').EventEmitter;

var Value = function(device) {
    EventEmitter.call(this);

	var that = this;

	this.device = device;
	this.valueJson = {};

	//
	var set = function(deviceId, valueIndex, value, callback){
		//probably could add some error callbacks here...
		var command = "/www/setdevice cmd=set dev=" + deviceId + " idx=" + valueIndex + " val=" + value
		exec(command,function(error, stdout, stderr){
			if( callback ) 
				callback(stdout)
		})
	}

	// Should this be private?
	this.updateValue = function(valueJson){
		this.valueJson = valueJson;
		var index = this.update('index', valueJson.index)
		var name  = this.update('name', valueJson.name)
		var value = this.update('value', valueJson.value)

		var change = index || name || value
		if(change){
			this.emit('change', this)
			return true
		}else{
			return false
		}
	}

	this.get = function(key){
		if(!key)
			return this.value
		else
			return this[key]
	}
	
	this.update = function(key, val){
		var old = this[key]

		if( old != val){
			this[key] = val
			return true
		}else
			return false

	}

	this.set = function(key, val, callback){		
		if(key == 'value'){
			console.log(key, val, callback)
			set(this.device.get('id'), this.get('index'), val, callback)
		}
	}

}
util.inherits(Value, EventEmitter);

module.exports.Value = Value;