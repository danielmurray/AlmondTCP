'use strict';

var fs = require("fs");
var sys = require('sys');
var util = require('util');
var exec = require('child_process').exec;

var SSH = require('simple-ssh');
var extend = require('xtend');
var JsDiff = require('diff');
var watchTree = require("fs-watch-tree").watchTree;



var AlmondFS = function(config){

	config = extend({
        ip: '192.168.1.1',
        user: 'root',
        pass: 'root',
        rootDir: 'almondRootDir'
    }, config);

    this.ip = config.ip;
    this.user = config.user;
    this.pass = config.pass;
    this.rootDir = config.rootDir;

    this.ssh = new SSH({
	    host: this.ip,
	    user: this.user,
	    pass: this.pass
	});

}

AlmondFS.prototype.ping = function(callback){
	function callbackWrapper(error, stdout, stderr) { 
		var success = false;
		if(stdout){
			var success = true;
		}
		callback(success, error);
	}

	exec("ping -c 1 " + this.ip + " | grep icmp* | wc -l", callbackWrapper);
}

AlmondFS.prototype.getLocalFiles = function(dir, files_){
    files_ = files_ || [];
    if (typeof files_ === 'undefined') files_=[];
    var files = fs.readdirSync(dir);
    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var name = dir+'/'+files[i];
        if (fs.statSync(name).isDirectory()){
            this.getLocalFiles(name,files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

AlmondFS.prototype.update = function(localPath, remotePath){

	var remoteFile = this.user + '@' + this.ip + ':'+ remotePath
	var command = 'sshpass -p \'' + this.pass + '\' scp ' + localPath + ' ' + remoteFile

	var callbackWrapper = function(){
		console.log(localPath + ' synced')
	}

	exec(command, callbackWrapper);

}

AlmondFS.prototype.diffRemoteFile = function(localFilePath, localFileText){
	var that = this
	var remoteFilePath = localFilePath.replace(this.rootDir, '')

	this.ssh.exec('cat '+ remoteFilePath, {
	    out: function(remoteFileText){
	        if( localFileText !== remoteFileText){
	        	console.log(remoteFilePath, 'is different!')
	        	that.update(localFilePath, remoteFilePath)
	        }
		}
	}).start();
}

AlmondFS.prototype.updateFiles = function(){
	var that = this;

	var files = this.getLocalFiles(this.rootDir);

	for(var i in files){
		var file = files[i];

		var callbackWrapper = function (err,localfile) {
			if (err) {
				return console.log(err);
			}else{
				that.diffRemoteFile(file, localfile);
			}
		}

		fs.readFile(file, 'utf8', callbackWrapper);
	}
}

AlmondFS.prototype.connect = function(){
	var that = this;

	var callbackWrapper = function(success,error){
		if(success){
			that.updateFiles()
		}else{
			console.log('No Almond+ Detected...')
			console.log('Check your WiFi Connection')
		}
	}

	this.ping(callbackWrapper)
}

AlmondFS.prototype.sync = function(){
	var that = this;

	var callbackWrapper = function(success,error){
		watchTree(that.rootDir, function (event) {
			var localFilePath = event.name
			var remoteFilePath = localFilePath.replace(that.rootDir, '')
			that.update(localFilePath, remoteFilePath)
		});
	}

	this.ping(callbackWrapper)
}


var almond = new AlmondFS({
	ip: '10.10.10.121',
	user: 'root',
	pass: 'root',
	rootDir: 'almondRootDir'
})

almond.connect()
almond.sync()


