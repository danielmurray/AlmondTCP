'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;

var EventEmitter = require('events').EventEmitter;
var Value = require('./value.js').Value

var Device = function() {
    EventEmitter.call(this);

	var that = this;
	this.deviceJson = {};

	// Should this be private?
	this.values = [];

	this.updateDevice = function(deviceJson){
		this.deviceJson = deviceJson;

		this.id = deviceJson.DeviceID;
		this.name = deviceJson.Name;
		this.type = deviceJson.DeviceType;
		this.location = deviceJson.Location;

		var values = deviceJson.DeviceValues;

		var change = false;
		for( var i in values){
			var valueJson = values[i];
			var value = this.getValue(valueJson.index)

			if( !value ){
				value = new Value(this);
				this.values.push(value);
			}

			change = value.updateValue(valueJson) || change
		}

		if(change){
			this.emit('change', this)
			return true
		}else{
			return false
		}
	}

	this.get = function(key, index){
		if(key == 'value')
			return this.getValue(index)
		else
			return this[key]
	}

	this.getValue = function(index){
		for( var i = 0; i < this.values.length; i++){
			var value = this.values[i]
			if (value.index == index)
				return value
		}
	}

	this.set = function(key, val, valVal){
		if(key == 'value')
			return this.setValue(val, valVal)
		else{
			var old = this[key]
			if( old != val){
				//This needs to be changed too
				this[key] = val
				this.emit('change', this)
				return true
			}else
				return false
		}
	}

	this.setValue = function(index, val){
		var value = this.getValue(index)		
		value.set('value', val)
	
	}

	this.getValues = function(id){
		return this.values;
	}
}
util.inherits(Device, EventEmitter);

module.exports.Device = Device;


