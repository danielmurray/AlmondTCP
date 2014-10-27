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

	var callbackWrapper = function(a, b, c){
		console.log(localPath + ' synced')
	}

	exec(command, callbackWrapper);
}


AlmondFS.prototype.buildPath = function(remoteFilePath, callback){
	var that = this;
	var dirs = [];
	var splitPath = remoteFilePath.split('/')

	if( splitPath.length > 2 ){
		var pathUpTo = splitPath
						.slice(0,splitPath.length-1)
						.join('/');

		var ssh = new SSH({
		    host: this.ip,
		    user: this.user,
		    pass: this.pass
		});

		ssh.exec('mkdir '+ pathUpTo, {
		    exit: function(code, stdout, stderr){
				if( code ){
					// err
					// console.log('We Need to Go Deeper')
					that.buildPath(pathUpTo, function(){
						that.buildPath(remoteFilePath, callback)
					})

				}else{
					//success
					console.log('Remote$ mkdir', pathUpTo);
					if(callback)
						callback()
				}

		        ssh.end()
			}
		}).start();
		
	}
}

AlmondFS.prototype.diffRemoteFile = function(localFilePath, localFileText){
	var that = this
	var remoteFilePath = localFilePath.replace(this.rootDir, '')

	var ssh = new SSH({
	    host: this.ip,
	    user: this.user,
	    pass: this.pass
	});

	ssh.exec('cat '+ remoteFilePath, {
		err: function(stderr){
			console.log(remoteFilePath, '--- NO PATH')
			that.buildPath(remoteFilePath, function(){
				that.update(localFilePath, remoteFilePath)
			})
	        ssh.end()
		},
	    out: function(remoteFileText){
	        if( localFileText !== remoteFileText){
	        	console.log(remoteFilePath, '--- DIFF')
	        	that.update(localFilePath, remoteFilePath)
	        } else {
	        	console.log(remoteFilePath, '--- OK')
	        }
	        ssh.end()
		}
	}).start();
}

AlmondFS.prototype.updateFile = function(file, callbackWrapper){
	var that = this;

	if( !callbackWrapper ){
		var callbackWrapper = function (err, localfile) {
			if (err) {
				var code = err.code
				console.log('FOLLOWING CHANGE NOT SYNCED');
				switch (code) {
					case 'EISDIR':
						console.log('Local$ mkdir', file );
						break;
					case 'ENOENT':
						console.log('Local$ rmdir', file );
						break;
					default:
						console.log(err)
				}					
			}else{
				that.diffRemoteFile(file, localfile);
			}
		}
	}

	fs.readFile(file, 'utf8', callbackWrapper);
}

AlmondFS.prototype.updateFiles = function(){
	//Performs and update on all files in the local
	//TODO - This should probably be a Directory comparison, but for now this works

	var that = this;

	var files = this.getLocalFiles(this.rootDir);
	for(var i in files){
		var file = files[i];
		fs.readFile(file, 'utf8', this.updateFile(file) );
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
})

almond.connect()
almond.sync()


