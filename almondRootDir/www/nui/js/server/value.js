//Different groupings of test
var ServerAttrCollection = CollectionLuci.extend({
  	url: '/devices',
	model: ServerAttrModel,

	initialize: function(){
	},

	update: function(deviceId, attrs){
		for(var i = 0; i < attrs.length; i++){
			var attr = attrs[i];

			var attrID = attr[0];

			var attrModel = this.find(function(model){
				return model.id == attrID;
			})

			if(! attrModel){
				//Attribute model doesn't exit yet
				var attrModel = new ServerAttrModel();
				this.models.push(attrModel);
			}

			attrModel.update(deviceId, attr[0], attr[1], attr[2]);  	
		}
	}
})

var ServerAttrModel = ModelLuci.extend({
  	url: '/devices',

	initialize: function(){
	},

	update: function(deviceId, id, value, whereToSave){
		this.set({ id: id })
		this.set({ deviceId: deviceId })
		this.set({ value: value })
		this.set({ whereToSave: whereToSave })
	},


})

var ServerValueCollection = CollectionLuci.extend({
  	url: '/devices',
	model: ServerValueModel,

	getValueTypeDict: function(typeOfValues, valueType){
		var typeOfValue = typeOfValues[valueType];
		if(typeOfValue){
			return typeOfValue
		}else{
			return typeOfValues[0]
		}
  	},

	initialize: function(){
	},

	update: function(deviceID, values, types){
		for(var i = 0; i < values.length; i++){
			var value = values[i];

			//Back end works in index 1
			//I prefer to work in index 0
			//To accomplish that I subtract 1
			//from the value index when pulling
			var valueID = value.index - 1;

			var valueModel = this.find(function(model){
				return model.id == valueID;
			})

			if(! valueModel){
				//Value model doesn't exit yet
				var valueModel = new ServerValueModel();
				this.models.push(valueModel);
			}

			var typeOfValue = this.getValueTypeDict(types, valueID)
			valueModel.update(deviceID, valueID, value, typeOfValue);  	
		}
	}

})

var ServerValueModel = ModelLuci.extend({
  	url: '/devices',
  	
	initialize: function(){
		this.set({ attrs: new ServerAttrCollection() })
	},
	
	update: function(deviceId, id, data, type){
		
		this.set({ id: id })
		this.set({ deviceId: deviceId })
		
		this.set({ value: this.toNumber(data) })

		var attrs = [
			['name', type.name, 0],
			['_type', type.type, 0],
			['_value', type.value, 0],
		];
		//this is where we could add some bullshit 
		//tag stuff by prepending it to attr Collection
		this.get('attrs').update([deviceId,id], attrs)		
	},

	getAttr: function(attrID){
		attrs = this.get('attrs').models
		for(var i = 0; i < attrs.length; i ++){
			attr = attrs[i]
			if(attr.get('id') == attrID)
				return attr.get('value')
		}
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
	}
})