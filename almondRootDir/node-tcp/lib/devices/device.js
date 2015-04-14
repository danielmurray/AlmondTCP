'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;

var EventEmitter = require('events').EventEmitter;
var Values = require('./values.js').Values;
var Attrs = require('./attrs.js').Attrs;

var DeviceTypeDict = require('./dicts/deviceTypeDict')

var getDeviceType = function(type){
	switch(typeof type) {
	    case 'string':
	        var deviceType = DeviceTypeDict[type];
			if(!deviceType){
				console.log('undefined device', type)
				deviceType = DeviceTypeDict[0];
			}
			return deviceType;
		case 'object':
	        return type;
	    default:
	        return {}
	}
}

var Device = function(deviceObj) {
    EventEmitter.call(this);

	var that = this;

	var update = function(value){
		that.emit('change', that)
	}

	this.id = deviceObj.id;
	// var type = getDeviceType(deviceObj.type)
	var type = deviceObj.type

	this.attrs  = new Attrs({
		parent: this,
		type: type
	});
	this.attrs.add({
		id: deviceObj.id,
		name: "device",
		location: "location"
	}, this)
	this.attrs.on('change', update);

	this.values = new Values({
		device: this,
		type: type.valueTypes
	});
	this.values.on('change', update);

};
util.inherits(Device, EventEmitter);

Device.prototype.update = function(deviceJson){
	this.attrs.update({
		id: deviceJson.DeviceID,
		name: deviceJson.Name,
		location: deviceJson.Location,
	});
	var values = deviceJson.DeviceValues;
	this.values.update(values);
};

Device.prototype.get = function(key, index){
	console.log(this)
	if(key == 'value')
		return this.values.get(index);
	else
		return this.attrs.get(key);
}

Device.prototype.set = function(attrJSON){
	var attrID = attrJSON.id.split('-');

	if(attrID.length == 3){
		return this.values.set(attrJSON);
	}else if(attrID.length == 2){
		return this.attrs.set(key, val);
	}
}

Device.prototype.toJSON = function(){
	var device = {
		id: this.id,
		// attrs: this.attrs.toJSON(),
		values: this.values.toJSON()
	};
	return device;
}

Device.prototype.toJSONObj = function(){
	var device = this.attrs.toJSONObj();
	device.values = this.values.toJSONObj();
	return device;
}

module.exports.Device = Device;