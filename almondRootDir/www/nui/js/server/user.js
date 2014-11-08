var ServerUserCollection = CollectionLuci.extend({
	url: '/users',
	model: ServerUserModel,

	setUser: function(userData){
		this.models[0].setUser(userData)
	},

	getUser: function(index){
		if(this.models[0]){
			return this.models[0]
		}else{
			var userModel = new ServerUserModel()
			this.models.push(userModel)
			return userModel
		}
	},
	
	initialize: function(){
		_users = this
		this.retrieve(this.refresh)
	},

	updateUser: function(usersJson){
		for(var i = 0; i < usersJson.length; i++){
			var userJson = usersJson[i]
			userID = userJson.id

			var userModel = this.find(function(model){
				return model.id == userID
			})

			if(! userModel){
			//Device model doesn't exit yet
				var userModel = new ServerUserModel()
				this.models.push(userModel)
			}

			userModel.update(userJson)
		}
	},

	refresh: function(textData){
		data = $.parseJSON(textData)
		if( data && data.length > 0 ){
			var usersUpdate = data;
		}else{
			var usersUpdate = [{"id":0,"type":"admin","devices":{}}]
		}
		_users.updateUser(usersUpdate)
	}
})


var ServerUserModel = ModelLuci.extend({
	url :'/users',
	
	initialize: function(data){
	},

	getDevice: function(deviceID){
		var device = this.devices[deviceID]
		if( device == null){
			device = {
				index: 0,
				color: 0,
				height: 'h2',
				width: 'w2'
			}
			this.devices[deviceID] = device
		}
		return device
	},

	update: function(userJson){
		this.id = userJson.id;
		this.type = userJson.type;
		this.devices = userJson.devices;
	  	this.trigger('change');  	
	},

	setUser: function(user){
		args = {
			id: 0,
			val: JSON.stringify(user)
		}

		this.post(args)
	},

})