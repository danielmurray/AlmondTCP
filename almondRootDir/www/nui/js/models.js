// Models
var DeviceModel = ModelWS.extend({
	url:'device',
	initialize: function(data){
		var attrs = data.attrs
		this.set({attrs: new AttrCollection(attrs)})
		var values = data.values
		this.set({values: new ValueCollection(values)})
	},

	getValue: function(valueID){
		var valueModel = this.get('values').get(valueID)
		return valueModel
	},

	setAttr: function(setObj){
		that = this
		$.each(setObj, function(key, value){
	        var attrs = that.get('attrs')
	        var attrModel = attrs.get(key)

	        attrModel.set({
	          value: value
	        })
	    });
	},

	getAttr: function(attrID){
		var attrModel = this.get('attrs').get(attrID)
		return attrModel.get('value')
	},

	getTypeID: function(valueID){
		var type = this.getAttr('_type')
		return type
	},

	getColor: function(){
		var currentStatus = this.getAttr('_status')
		return this.valueColor(currentStatus.value, 1)
	},

	valueColor: function(currentStatus, opacity){
		var colorIndex = this.getAttr('_color')
		var rgb = $.extend({}, window.Colors[colorIndex])
		if(!currentStatus){
	// If the the current status is not on
	// then dim the color
			var dimmingMultiplier = 0.3
			rgb.r = rgb.r * dimmingMultiplier
			rgb.g = rgb.g * dimmingMultiplier
			rgb.b = rgb.b * dimmingMultiplier
		}
		var string = rgbaToString( rgb.r, rgb.g, rgb.b, opacity)
		return string
	},

	getInfoList: function(){
		var attrs = this.get('attrs').getInfoList()
		var values = this.get('values').getInfoList()
		var infoList = attrs.concat(values)
		return infoList
	}
})

var ValueModel = NestedModel.extend({
	initialize: function(data){
		var attrs = data.attrs
		this.set({attrs: new AttrCollection(attrs)})
	},

	textValue: function(){
		var value = this.get('value');
		var ioType = this.getAttr('_type')
		var valueDict = this.getAttr('_value')
		var valueType = valueDict.type
		switch( valueType ){
			case 'analog':
				return {
					main: Math.round(value),
					sub: valueDict.unit
				}
			case 'state':
				states = valueDict.states
				return{
					main: states[value].text
				}
			case 'undefined':
				return {
					top: "Unsupported Device",
					main: "(╥_╥)"
				}

		}

	},

	setAttr: function(setObj){
		that = this
		$.each(setObj, function(key, value){
	        var attrs = that.get('attrs')
	        var attrModel = attrs.get(key)

	        attrModel.set({
	          value: value
	        })
	    });
	},

	getAttr: function(attrID){
		var attrModel = this.get('attrs').get(attrID)
		return attrModel.get('value')
	},

	getInfo: function(){
		var valueInfo = this.get('attrs').jsonIt()
		var value = this.textValue()
		valueText = value.main 
		if(value.sub != undefined)
			valueText = valueText + ' ' + value.sub
		return {
			key: valueInfo.name,
			value: valueText,
			editable: 0
		}
	},

	getStatus: function(statusValue){
		var attrs = this.get('attrs').jsonIt()
		var states = attrs._value.states
		var state = states[statusValue]
		if(state){
			return state
		}else{
			return statusValue[0]
		}

	}
})

var AttrModel = NestedModel.extend({
	initialize: function(data){
	},

	getValue: function(){
		return this.get('value')
	},

	getInfo: function(){
		id = this.get('id')
		value = this.get('value')
		return {
			key: id,
			value: value,
			editable: this.get('whereToSave')
		}
	},
})