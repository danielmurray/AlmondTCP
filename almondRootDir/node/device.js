'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;

var EventEmitter = require('events').EventEmitter;


var Devices = function() {
    EventEmitter.call(this);

	that = this;
	this.devicesJson = {};
	this.devices = []
        	
	var listen = function(){
		fs.watch('/DeviceList.xml', function (curr, prev) {                                      
			that.fetchDevices();
		});
	}
	    	
	var fetchDevices = function(){
		exec("/www/setdevice cmd=list",function(error, stdout, stderr){
			that.updateDevices(stdout);
		})
	}

	var updateDevices = function(devicesJson){
		this.devicesJson = JSON.parse(devicesJson)
		for( var key in this.devicesJson){
			var deviceJson = this.devicesJson[key]
			var device = this.getDevice(deviceJson.DeviceID)
			if( !device )
				

		}
		this.emit('change', this.devices)
	}

	this.getDevice = function(id){
		for( var i = 0; i < this.devices.length; i++){
			var device = this.devices[i]
			if (device.DeviceID == id)
				return device
		}
	}

	this.getDevices = function(){
		console.log()
	}
	
	this.listen()
}
util.inherits(Devices, EventEmitter);

var emitFunction = function(devicesJson){
	//console.log(devicesJson)
	console.log('Device Update!')
	
}

var devices = new Devices();
devices.on('change', emitFunction)
