// luci class definition
var Luci = function() {
	this.cachedTemplates = {};
	this.luciURL = window.luciURL
}

Luci.prototype.loadLuaTemplate = function(template){

	if (this.cachedTemplates[template]) {
		return this.cachedTemplates[template];
	}

	var url = this.luciURL + '/' + template

	var text;
	$.ajax({
		url: url,
		success: function(t) {
			//console.log(t);
			text = t;
		},
		error: function(stuff) {
			console.log(stuff.responseText)
			console.log('template loading is failing')
		},
		async: false
	});

	var tpl = text
	var tpl = _.template(text);
	this.cachedTemplates[template] = tpl;
	return tpl;
}

Luci.prototype.loadBackboneTemplate = function(template){

	if (this.cachedTemplates[template]) {
		return this.cachedTemplates[template];
	}

	var url = "/nui/views/" + template + ".html"
	
	var text;
	$.ajax({
		url: url,
		async: false,
		success: function(t) {
			//console.log(t);
			text = t;
		},
		error: function() {
			console.log('template loading is failing')
		}
	});
	var tpl = _.template(text);
	this.cachedTemplates[template] = tpl;
	return tpl;
}

Luci.prototype.debugData = function(args){

	var url = args.url.split('/')
	var file = url[url.length-1]
	var url = "/nui/dicts/" + file + ".json"
	$.ajax({
		type: args.type, 
        url: url,
        async: args.async,
        dataType: "text",
        data: args.data,
		success: function(data) {
			if(args.success)
				args.success(data)	
		},
		error: function(message) {
			if(args.error)
				args.error(message)
			else
				console.log(message.responseText)
		}
	});
}

Luci.prototype.loadData = function(data){

	var url = "/nui/dicts/" + data + ".json"

   	var data;
	$.ajax({
		url: url,
		async: false,
		dataType: "text",
		success: function(d) {
			//console.log(d);
			data = d;
		},
		error: function() {
			return false;
		}
	});

	return data;
  
}

Luci.prototype.loadJson = function(json){

	var data = this.loadData(json)
	return JSON.parse(data);
  
}