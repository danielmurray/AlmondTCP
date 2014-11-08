'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;
var util = require('util');

var EventEmitter = require('events').EventEmitter;

var Users = function() {
    EventEmitter.call(this);

	var that = this;

	this.devicesJson = {};
	
	// Should this be private?
	this.devices = []
    
    this.ready = function(){
		that.emit('ready', that)	
	}

	this.listen = function(){
		console.log('-------User Listener Fully Armed & Operational-------')
		fs.watch('/tmp/dhcp.leases', function (curr, prev) {                                      
			that.fetchUsers();
		});
	}
	    	
	this.fetchUsers = function(callback){
		exec("cat /tmp/dhcp.leases",function(error, stdout, stderr){
			that.updateUsers(stdout);
		})
	}

	this.updateUsers = function(leases){
		console.log(leases)
	}

	this.fetchUsers(this.ready)
	this.listen()
}
util.inherits(Users, EventEmitter);

var users = new Users();




