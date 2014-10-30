'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;
var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Device = require('./device.js').Device

var debugDevices = require('./DeviceList.json')

var Devices = function() {
    EventEmitter.call(this);

	var that = this;

	this.devicesJson = {};
	
	// Should this be private?
	this.devices = []
    
    this.ready = function(){
		that.emit('ready', that)	
	}

	this.listen = function(){
		console.log('-------Device Listener Fully Armed & Operational-------')
		fs.watch('/DeviceList.xml', function (curr, prev) {                                      
			that.fetchDevices();
		});
	}

	this.debugListen = function(){
		console.log('********************* DEBUG MODE **********************')
		console.log('-------Device Listener Fully Armed & Operational-------')
		fs.watch('DeviceList.json', function (curr, prev) {                                      
			that.debugFetchDevices()
		});
	}
	    	
	this.fetchDevices = function(callback){
		exec("/www/setdevice cmd=list",function(error, stdout, stderr){
			that.updateDevices(stdout);
			if(callback)
				callback()
		})
	}

	this.debugFetchDevices = function(){
		that.updateDevices(debugDevices)
	}

	this.updateDevices = function(devicesJson){
		if(devicesJson){
			this.devicesJson = JSON.parse(devicesJson)
			for( var key in this.devicesJson){
				var deviceJson = this.devicesJson[key]
				var device = this.getDevice(deviceJson.DeviceID)
				if( !device ){
					device = new Device();
					this.devices.push(device)
				}
				device.updateDevice(deviceJson)
			}
		}

	}

	this.getDevice = function(id){
		for( var i = 0; i < this.devices.length; i++){
			var device = this.devices[i]
			if (device.id == id)
				return device
		}
	}

	this.getDevices = function(){
		return this.devices;
	}
	

	this.fetchDevices(this.ready)
	this.listen()
	// this.debugFetchDevices()
	// this.debugListen()

}
util.inherits(Devices, EventEmitter);

var devicesReady = function(){
	var loLAMP = devices.getDevice(4)
	var motion = devices.getDevice(7)


	motion.on('change', function(device){
		var value = device.get('value', 1);
		if(value.value == 'true' )
			loLAMP.set('value', 2, true)
		else
			loLAMP.set('value', 2, false)
	})
}

var devices = new Devices();
devices.on('ready', devicesReady)




