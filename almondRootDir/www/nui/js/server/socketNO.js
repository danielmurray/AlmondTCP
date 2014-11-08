// Here is the code that should exist for the server
// Writen here to save time 
window.Luci = new Luci()
window.Colors = window.Luci.loadJson("colorDict");

window.ServerDevices = new ServerDeviceCollection()

window.ServerResults = new ServerResultCollection()
window.ServerTriggers = new ServerTriggerCollection()
window.ServerTriggerGroups = new ServerTriggerGroupCollection()
window.ServerRules = new ServerRuleCollection()

// The fact that this is a model is irrelevant
// It is just a basic class, build in a model for S&G's
var fakeSocket = Backbone.Model.extend({
	initialize: function(){
 	},

	connect: function(url){
 		if(url == 'devices'){
 			this.socket = window.ServerDevices
 			return this 
 		}else if(url == 'rules'){
 			this.socket = window.ServerRules
 			return this
 		}else if(url == 'triggerGroups'){
 			this.socket = window.ServerTriggerGroups
 			return this 
 		}else if(url == 'triggers'){
 			this.socket = window.ServerTriggers
 			return this 
 		}else if(url == 'results'){
 			this.socket = window.ServerResults
 			return this 
 		}else{
 			console.log('undefined url', url)
 			this.socket = window.ServerDevices
 			return this
 		}
 	},

 	emit: function(cmd, data){
 		switch ( cmd ){
 			case 'fetch':
 				deviceData = this.socket.toJSON()
 				this.socket.trigger('fetch', {
 					success: 'true',
 					data: deviceData
 				})
 				break;
 			case 'save':
 				this.socket.save(data.url, data.data)
 				break;
 			default:
 				console.log('no command')
 		}
 	},

 	on: function(listener, callback){
 		this.socket.on(listener, callback)
 	}


});