/*
 * Lua extensions for Backbone.Model and Backbone.Collection
 *
 */

var luaQuery = function(args){
  	$.ajax({
		type: args.type, 
        url: args.url,
        async: args.async,
        dataType: "text",
        data: args.data,
		success: function(data) {
			if(args.success)
				args.success(data)
		},
		error: function(message){
			if(args.error)
				args.error(message)
			else
				console.log(message.responseText)
		}
    });
}

var encodeData = function(data){
	$.each(data, function(key, value){
		if(typeof value === 'string'){
			data[key] = value.replace(/[~@#$%^&*()_|+\-=?;.<>\\\/]/gi, '');
		}
	})
}

var CollectionLuci = Backbone.Collection.extend({
	url :'/none',
	luciURL: window.luciURL + '/admin',

	add: function(model) {
	  	return this.models.push(model)
	},

	get: function(id) {
	  	var model = this.find(function(model){
			return model.id == id;
		})
		return model
	},

	toJSON: function() {
	  var modelsClones = _.clone(this.models);
	  var models = []
	  for(var i = 0; i < modelsClones.length; i ++) {
	  	modelClone = modelsClones[i]
	    if((modelClone instanceof Backbone.Model) || (modelClone instanceof Backbone.Collection)) {
			model = modelClone.toJSON();
			models.push(model) 
	    }
	  }
	  return models;
	},

	retrieve: function(callback){
	//fetches data and calls callback with text results
	//should we turn this into json? we would have to default all to json?
		args = {
			type: 'GET',
			url: this.luciURL + this.url,
			data:{
				cmd:'get'
			},
			success: callback,
			async: false
		}

		if(window.DEBUG){
			console.log('Hello Rajesh')
			window.Luci.debugData(args)
		}else{
			luaQuery(args)
		}
	},

	longPoll: function(callback, errorCallback){
	//standard long poll implementation, queries the back end
	//should we turn this into json? we would have to default all to json?	
		args = {
			type: 'GET',
			url: this.luciURL + this.url + '/longpoll',
			success: callback,
			error: errorCallback
		}

		if(window.DEBUG){
			console.log('Can\'t long poll without an almond+')
		}else{
			luaQuery(args)
		}
	}
});

var ModelLuci = Backbone.Model.extend({
	url :'/none',
	luciURL: window.luciURL + '/admin',
	
	toJSON: function() {
	  var json = _.clone(this.attributes);
	  for(var attr in json) {
	    if((json[attr] instanceof Backbone.Model) || (json[attr] instanceof Backbone.Collection)) {
	      json[attr] = json[attr].toJSON();   
	    }
	  }
	  return json;
	},

	post:function(data, callback, error){
		data.cmd = 'set'
		
		encodeData(data)
		
		args = {
			type: 'POST',
			url: this.luciURL + this.url,
			data:data,
			success: callback,
			async: true
		}
		
		luaQuery(args)
	}

});

