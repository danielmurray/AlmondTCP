'use strict';

var fs = require("fs");
var sys = require('sys');
var util = require('util');
var exec = require('child_process').exec;
var execSync = require("exec-sync");

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

AlmondFS.prototype.buildPath = function(remoteFilePath){
	
	var that = this;
	var dirs = [];
	var splitPath = remoteFilePath.split('/')

	if( splitPath.length > 2 ){
		var pathUpTo = splitPath
						.slice(0,splitPath.length-1)
						.join('/');

		var remote = this.user + '@' + this.ip
		var sshCommand = 'sshpass -p \'' + this.pass + '\' ssh ' + remote;
		var command = sshCommand + ' mkdir ' + pathUpTo

		var output = execSync(command,true);
		
		if( output.stderr ){
			this.buildPath(pathUpTo)
		}else{
			console.log('Remote$ mkdir', pathUpTo);
		}
	}
}

AlmondFS.prototype.update = function(localPath, remotePath){

	var remoteFile = this.user + '@' + this.ip + ':'+ remotePath
	var command = 'sshpass -p \'' + this.pass + '\' scp ' + localPath + ' ' + remoteFile

	var output = execSync(command,true);
	
	if( output.stderr ){
		this.buildPath(remotePath)
		this.update(localPath, remotePath)
	}else{
		console.log(localPath + ' synced')
	}
}

AlmondFS.prototype.diffFile = function(localFilePath, remoteFilePath){
	var that = this
	
	var remote = this.user + '@' + this.ip
	var sshCommand = 'sshpass -p \'' + this.pass + '\' ssh ' + remote + ' cat ' + remoteFilePath
	var command = sshCommand + ' | diff - ' + localFilePath

	return execSync(command, true)

}

AlmondFS.prototype.updateFile = function(localFilePath){
	//Determine if the file requires a push to Almond
	var remoteFilePath = localFilePath.replace(this.rootDir, '')
	var diff = this.diffFile(localFilePath, remoteFilePath);

	if( diff.stderr ){
		if(diff.stderr.search('No such file or directory') >= 0){
			console.log('Local$ rmdir', localFilePath)
		} else if(diff.stderr.search('to a directory') >= 0){
			console.log('Local$ mkdir', localFilePath );			
		} else{
			console.log('Unknown Error')
			console.log(diff.stderr)			
		}
	}else{
		var dashCount = 80 - localFilePath.length > 0 ? 80 - localFilePath.length : 0
		if( diff.stdout ){
			console.log(localFilePath, Array(dashCount).join("-"), 'DIFF' )
			this.update(localFilePath, remoteFilePath)
		}else{
			console.log(localFilePath, Array(dashCount).join("-"), 'OK' )
		}	
	}

}

AlmondFS.prototype.updateFiles = function(){
	//Performs and update on all files in the local
	//TODO - This should probably be a Directory comparison, but for now this works

	var that = this;

	var files = this.getLocalFiles(this.rootDir);
	for(var i in files){
		var file = files[i];
		this.updateFile(file)
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
		console.log('-------File Listener Fully Armed & Operational-------')
		watchTree(that.rootDir, function (event) {
			var localFilePath = event.name
			that.updateFile(localFilePath)
		});
	}
	this.ping(callbackWrapper)
}


var almond = new AlmondFS({
	ip: '10.10.10.121',
	user: 'root',
	pass: 'root',
	rootDir: 'almondRootDir'
});

almond.connect()
// almond.sync()


