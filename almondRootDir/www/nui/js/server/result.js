var ServerResultCollection = CollectionLuci.extend({
  	url: '/results',
	model: ServerResultModel,

	initialize: function(){
	},

	update: function(ruleId, jsonResults){
		this.ruleId = ruleId
		for(var i = 0; i < jsonResults.length; i++){
			var jsonResult = jsonResults[i];
			
			var jsonResultId = [this.ruleId,i].join('-');
			var resultModel = this.get(jsonResultId)

			if(! resultModel){
				//Attribute model doesn't exit yet
				var resultType = jsonResult.type

				switch (resultType) {
				    case 'device':
				        resultModel = ServerDeviceResultModel;
				        break;
				    default:
				        resultModel = ServerResultModel;
				}

				var resultModel = new resultModel({
					id: [ this.ruleId, i].join('-'),
					ruleId: this.ruleId,
					resultIndex: i
				});

				this.add(resultModel)
				window.ServerResults.add(resultModel)
			}
			
			resultModel.update(jsonResult);
		}
	}
})

var ServerResultModel = ModelLuci.extend({
  	url: '/actions',
  	type: null,
  	token: null,

	initialize: function(){
		this.set({
			type: this.type
		})
	},
	
})

var ServerDeviceResultModel = ServerResultModel.extend({
	url: '/triggers',
	type: 'device',
	
	generateToken: function(jsonTrigger){
		return [
			jsonTrigger.type, 
			jsonTrigger.devId, 
			jsonTrigger.valueIndex, 
			jsonTrigger.value
		].join('_')
	},
	
	update: function(jsonTrigger){

		var token = this.generateToken(jsonTrigger)
		this.set({ 
			name: jsonTrigger.name,
			devId: jsonTrigger.devId,
			valueIndex: jsonTrigger.valueIndex,
			value: jsonTrigger.value,
			token: token
		})

	}
})