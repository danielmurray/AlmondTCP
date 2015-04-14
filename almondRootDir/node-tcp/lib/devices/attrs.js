'use strict';

var fs = require("fs");
var sys = require('sys')
var util = require('util');
var exec = require('child_process').exec;
var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Attr = require('./attr.js').Attr;

var Attrs = function(attrsObj) {
    EventEmitter.call(this);
	var that = this;

	this.parent = attrsObj.parent;
	
	this.attrs = [];

	this.add(attrsObj.type);
};
util.inherits(Attrs, EventEmitter);

Attrs.prototype.update = function(attrsJSON){
	for( var attrKey in attrsJSON){
		var attrValue = attrsJSON[attrKey]
		var attr = this.getByKey(attrKey);

		if( attr ){
			attr.update(attrValue)
		} 
	}
};

Attrs.prototype.getByKey = function(attrKey){
	if( attrKey == undefined )
		return this.attrs;

	for( var i = 0; i < this.attrs.length; i++){
		var attr = this.attrs[i];
		if (attr.key == attrKey)
			return attr;
	}
}

Attrs.prototype.get = function(id){
	if( id == undefined )
		return this.attrs;

	for( var i = 0; i < this.attrs.length; i++){
		var attr = this.attrs[i];
		if (attr.id == id)
			return attr;
	}
}

Attrs.prototype.set = function(attrJSON){
	var attr = this.get(attrJSON.id)
	return attr.set(attrJSON)
}

Attrs.prototype.add = function(attrsJSON, device){
	var that = this
	
	var update = function(attr){
		that.emit('change', that)
	}

	for( var attrKey in attrsJSON){
		var attrValue = attrsJSON[attrKey];
		var attr = new Attr({
			id: this.parent.id + '-' + attrKey,
			key: attrKey,
			value: attrValue,
			device: device
		})
		
		this.attrs.push(attr);
		attr.on('change', update);
	}
}

Attrs.prototype.toJSON = function(){
	var attrsJSON = []
	for(var i in this.attrs){
		var attr = this.attrs[i]
		var attrJSON = attr.toJSON()
		attrsJSON.push(attrJSON)
	}
	return attrsJSON;
}

Attrs.prototype.toJSONObj = function(){
	var attrsJSONObj = {};
	for(var i in this.attrs){		
		var attr = this.attrs[i];
		var key = attr.key;
		var value = attr.value;
		attrsJSONObj[key] = value;
	}
	return attrsJSONObj;
}



module.exports.Attrs = Attrs;