// Collection definitions of general devices
var ServerDeviceCollection = CollectionLuci.extend({
  url: '/devices',
  _idAttr: 'id',
  model: ServerDeviceModel,

  	getDeviceTypeDict: function(deviceType){
		var typeOfDevices = _deviceCollection.deviceDict;
		var typeOfDevice = typeOfDevices[deviceType];
		if(typeOfDevice){
			return typeOfDevice
		}else{
			return typeOfDevices[0]
		}

  	},

  	longPollTimeout: function(data){
  		//If longpoll dies or timeouts we restart it
  		//Maybe here we can prompt the user to restart it
  		console.log('Longpolling died', data)
		// _deviceCollection.longPoll(_deviceCollection.refresh);
	},

	refresh: function(data){
		var deviceUpdate = $.parseJSON(data);
		_deviceCollection.updateDevices(deviceUpdate);
		_deviceCollection.longPoll(_deviceCollection.refresh, _deviceCollection.longPollTimeout);
	},

	initialize: function(){
		_deviceCollection = this;
		this.deviceDict = window.Luci.loadJson("deviceTypeDict");
		this.users = new ServerUserCollection();
		this.retrieve(this.refresh);
	},

	save: function(url, data){
		switch( url ){
			case 'devices':
				this.saveDevices(data)
				break;
			case 'device':
				if( data.valueIndex != undefined  ){
					//update value
					// console.log('update some value')
					var deviceId = data.id
					var device = this.findDevice(deviceId)
					var valueId = data.valueIndex
					var value = data.values.get(valueId)
					device.setValue(value, data.value)
				}else if( data.attrKey != undefined  ){
					//update attr
					// console.log('update some attr')
					byAttr = function(element, attrName) {
						if (element.id == attrName)
							return element
						else
							return false
						
					}	
			

					var deviceId = data.id
					var device = this.findDevice(deviceId)
					var attrId = data.attrKey

					var deviceAttrObj = data.attrs.jsonIt()
					var attrObj = deviceAttrObj[data.attrKey]

					var attrObj = arrayFind(data.attrs.models, byAttr,  attrId)
					var value = data.value

					switch( attrObj.get('whereToSave') ){
						case 'device':
							// console.log('saving to device');
							device.saveDevice(attrId, value)
							break;
						case 'user':
							console.log('saving to the user');
							break;
					}
					
				}else{
					console.log('I don\'t know what you want to update')
				}

				break;
		}
		return
	},

	updateDevices: function(jsonDevices){
		var defaultUser = _deviceCollection.users.getUser();

		for(var i = 0; i < jsonDevices.length; i++){
			var jsonDevice = jsonDevices[i];

			var deviceID = jsonDevice.DeviceID;
			var deviceType = jsonDevice.DeviceType;

			var deviceModel = this.find(function(model){
				return model.id == deviceID;
			})

			if(! deviceModel){
				//Device model doesn't exit yet
				var deviceModel = new ServerDeviceModel();
				this.models.push(deviceModel);
			}

			var typeOfDevice = _deviceCollection.getDeviceTypeDict(deviceType)
			var preferencesDevice = defaultUser.getDevice(deviceID);

			deviceModel.update(deviceID, jsonDevice, typeOfDevice, preferencesDevice);
		}
		this.trigger('update', this.toJSON())
	},

	saveDevices: function(devices){
		var user = {
			id: 0,
			type: 'admin',
			devices: {}
		}
		var device = {}

		byAttr = function(element, attrName) {
			if (element.id == attrName)
				return element.value
			else
				return false
			
		}		    

		for(var i = 0; i < devices.length; i++){
			device = devices[i]
			attrs = device.attrs.toJSON()
			values = device.values.toJSON()
			user.devices[device.id] = {
				id 		: device.id,
				index 	: arrayFind(attrs, byAttr,  '_index'),
				color 	: arrayFind(attrs, byAttr,  '_color'), 
				height 	: arrayFind(attrs, byAttr,  '_height'),
				width 	: arrayFind(attrs, byAttr,  '_width')
			}
		}

		
		this.users.setUser(user)
	},

	findDevice: function(deviceId){
		for(var i = 0; i < this.models.length; i++){
			var device = this.models[i]
			if(device.get('id') == deviceId)
				return device
		}
	}

})

// Models
var ServerDeviceModel = ModelLuci.extend({
  	url: '/devices',

	initialize: function(){
		this.set({ attrs: new ServerAttrCollection() })
		this.set({ values: new ServerValueCollection() })
	},

	getState: function(states, stateValue){
		var value = this.toNumber(stateValue);
		var stateObj = states[value]

		if(!stateObj){
			stateObj = states[0]
		}

		stateObj.value = value

		return stateObj

	},

	getStatus: function(device, deviceDict){
		//Here we define the status object
		var deviceValues = device.DeviceValues;
		var statusValueIndex = deviceDict.statusValue;

		var statusValue = deviceValues[statusValueIndex];
		var valueStates = deviceDict.values[statusValueIndex].value.states;
		
		return this.getState(valueStates, statusValue)
	},

	update: function(id, data, type, preferences){

		this.set({ id: Number(id) })

		var status = this.getStatus(data, type);
		
		//Color is assigned by the type id modded by the number of colors
		var colorIndex = (type.id+5)%Object.keys(window.Colors).length

		var attrs = [
			['name', data.Name, 'device'],
			['location', data.Location, 'device'],
			['status', status.text, 0],
			['_status', status, 0],
			['_color', colorIndex, 'user'],
			['_width', preferences.width, 'user'],
			['_height', preferences.height, 'user'],
			['_maxWidth', type.maxWidth, 0],
			['_maxHeight', type.maxHeight, 0],
			['_index', preferences.index, 'user'],
			['_type', type.id, 0],
			['_displayValues', type.displayValues, 0],
		];
		//this is where we could add some bullshit 
		//tag stuff by prepending it to attr Collection
		this.get('attrs').update(id, attrs)

		var jsonValues = data.DeviceValues
		var typeOfValues = type.values
		this.get('values').update(id, jsonValues, typeOfValues)
	},

	getValues: function(){
		displayValues = []
		for(var i = 0; i < this.deviceValues.length; i++){
			value = this.deviceValues[i]
			if(value.displayIndex){
				displayValues.push(value)
			}
		}
		return displayValues
	},

	getValue: function(valueId){
		var values = this.get('values').models
		for(var i = 0; i < values.length; i++){
			var value = values[i]
			if(value.get('id') == valueId)
				return value
		}
	},

	getAttr: function(attrId){
		var attrs = this.get('attrs').models
		for(var i = 0; i < attrs.length; i++){
			attr = attrs[i]
			if (attr.id == attrId)
				return attr.get('value')
		}
	},

	setValue: function(valueData, newValue){
		args = {
			dev: this.id
		}
		//Back end works in index 1
		//I prefer to work in index 0
		//To accomplish that I add 1 to
		//the value index when pushing
		var valueId = valueData.id
		args.idx = valueId + 1

		var value = this.getValue(valueId)
		var type = value.getAttr('_type')

		//server stores data stupid, this combats that
		args.val = this.toServerPoop(newValue, type)
		this.post(args)
	},

	saveDevice: function(attr, value){
		args = {
			dev: this.id,
			name: this.getAttr('name'),
			location: this.getAttr('location')
		}
		args[attr] = value
		this.post(args)
	},

	toNumber: function(valueObj){
		value = valueObj.value
		switch(typeof value){
			case 'number':
				return value
			case 'string':
				result = parseInt(value)
				if(isNaN(result)){
					if (value == 'true')
						return 1
					else
						return 0
				}

			default:
				return 0
		}
		return 0
	},

	toServerPoop: function(value, type){
		switch(type){
			case 'number':
				return value
			case 'switch':
				if(value)
					return 'true'
				else
					return 'false'
			default:
				return 0
		}
		return 0
	}

})