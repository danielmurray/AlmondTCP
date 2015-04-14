'use strict';

var Devices = require('./devices/devices.js').Devices;
var Values = require('./devices/values.js').Devices;
var Attrs = require('./devices/attrs.js').Devices;

var Almond = function(){
	this.devices = new Devices();
	this.values = new Values();
	this.attrs = new Attrs();
}

Almond.prototype.connect = function(){
	var that = this;

	this.devices.connect();
	this.devices.on('ready', function(devices){
		this.values.connect(devices);
		this.attrs.connect(devices);
	})

}

module.exports.Almond = Almond;