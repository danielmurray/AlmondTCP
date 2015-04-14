'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;
var util = require('util');

var EventEmitter = require('events').EventEmitter;
var DeviceTypeDict = require('./dicts/deviceTypeDict');
var Device = require('./device.js').Device;

var debugDevices = require('./dicts/DeviceList.json')

var Devices = function(debug) {
    EventEmitter.call(this);
	var that = this;

	this.devices = [];
};
util.inherits(Devices, EventEmitter);

Devices.prototype.connect = function(){
	var that = this;

	var ready = function(){
		that.emit('ready', that);
	}

	this.fetch(ready);
	this.listen();
}

Devices.prototype.listen = function(){
	var that = this;

	console.log('-------Device Listener Fully Armed & Operational-------');
	fs.watch('/DeviceList.xml', function (curr, prev) {
		that.fetch();
	});
}

Devices.prototype.debugListen = function(){
	var that = this;
	
	console.log('********************* DEBUG MODE **********************');
	console.log('-------Device Listener Fully Armed & Operational-------');
	fs.watch('./dicts/DeviceList.json', function (curr, prev) {                                      
		that.debugFetchDevices();
	});
}
    	
Devices.prototype.fetch = function(callback){
	var that = this;
	
	exec("/www/setdevice cmd=list",function(error, stdout, stderr){
		that.update(stdout);
		if(callback)
			callback();
	});
}

Devices.prototype.debugFetch = function(){
	this.update(debugDevices);
}

Devices.prototype.update = function(devicesJson){
	if(devicesJson){
		this.devicesJson = JSON.parse(devicesJson);

		for( var key in this.devicesJson){
			var deviceJson = this.devicesJson[key];
			var device = this.get(deviceJson.DeviceID);

			if( !device ){
				device = new Device({
					id: deviceJson.DeviceID,
					type: deviceJson.DeviceType
				});
				this.add(device);
			}

			device.update(deviceJson);
		}
	}
}

Devices.prototype.get = function(devID){
	if(devID == undefined)
		return this.devices;

	for( var i = 0; i < this.devices.length; i++){
		var device = this.devices[i];
		if (device.id == devID)
			return device;
	}
}

Devices.prototype.set = function(attrJSON){
	var devID = attrJSON.id.split('-')[0];
	var device = this.get(devID);
	device.set(attrJSON);
}


Devices.prototype.add = function(device){
	var that = this
	
	var update = function(device){
		that.emit('change', that);
	}

	this.devices.push(device);
	device.on('change', update);
}

Devices.prototype.toJSON = function(){
	var devices = []
	for(var deviceID in this.devices){
		var device = this.devices[deviceID];
		var deviceJson = device.toJSON();
		devices.push(deviceJson);
	}
	return devices;
}

Devices.prototype.toJSONObj = function(){
	var devices = []
	for(var deviceID in this.devices){
		var device = this.devices[deviceID];
		var deviceJson = device.toJSONObj();
		devices.push(deviceJson);
	}
	return devices;
}


module.exports.Devices = Devices;