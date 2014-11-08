//Different groupings of 
var ServerTriggerGroupCollection = CollectionLuci.extend({
  	url: '/triggerGroups',
	model: ServerTriggerGroupModel,

	initialize: function(){
	},

	update: function(ruleId, jsonTriggerGroups){
		this.ruleId = ruleId

		for(var i = 0; i < jsonTriggerGroups.length; i++){
			var jsonTriggerGroup = jsonTriggerGroups[i];
			
			var triggerGroupId = [this.ruleId,i].join('-');
			var triggerGroupModel = this.get(triggerGroupId)

			if(! triggerGroupModel){
				//Attribute model doesn't exit yet
				var triggerGroupModel = new ServerTriggerGroupModel({ 
					id: [ this.ruleId, i].join('-'),
					ruleId: this.ruleId,
					triggerGroupIndex: i
				});

				this.add(triggerGroupModel)
				window.ServerTriggerGroups.add(triggerGroupModel)
			}
			
			triggerGroupModel.update(jsonTriggerGroup);
		}
	}
})

var ServerTriggerGroupModel = ModelLuci.extend({
  	url: '/triggerGroups',
  	groupingType: 'AND',

  	generateToken: function(triggerGroup){
		var triggers = this.get('triggers').models
		var triggerTokens = []
		for(var i = 0; i < triggers.length; i++){
			var trigger = triggers[i];
			var triggerToken = trigger.get('token');
			triggerTokens.push(triggerToken)
		}
		return triggerTokens.join(this.groupingType)
	},

	initialize: function(ruleId, triggerGroupIndex){
		this.set({ 
			triggers: new ServerTriggerCollection()
		})
	},

	update: function(jsonTriggerGroup){
		this.get('triggers').update(this.get('ruleId'), this.get('triggerGroupIndex'), jsonTriggerGroup.triggers);

		var token = this.generateToken()

		this.set({ 
			name: jsonTriggerGroup.name,
			token: token
		})

	},


})

var ServerTriggerCollection = CollectionLuci.extend({
  	url: '/triggers',
	model: ServerTriggerModel,

	generateToken: function(triggerGroup){
		var triggers = triggerGroup.triggers
		var triggerIds = []
		for(var i = 0; i < triggers.length; i++){
			var trigger = triggers[i];
			var triggerId = this.generateTriggerId(trigger);
			triggerIds.push(triggerId)
		}
		return triggerIds.join('_')
	},

	initialize: function(){
	},

	update: function(ruleId, triggerGroupIndex, jsonTriggers){
		this.ruleId = ruleId,
		this.triggerGroupIndex = triggerGroupIndex
		
		for(var i = 0; i < jsonTriggers.length; i++){
			var jsonTrigger = jsonTriggers[i];
			
			var triggerId = [this.ruleId,this.triggerGroupIndex,i].join('-')
			var triggerModel = this.get(triggerId)
			if( !triggerModel ){
				//Attribute model doesn't exit yet
				var triggerType = jsonTrigger.type

				switch (triggerType) {
				    case 'device':
				        triggerModel = ServerDeviceTriggerModel;
				        break;
				    case 'time':
				        triggerModel = ServerTimeTriggerModel;
				        break;
				    case 'web':
				        triggerModel = ServerTriggerModel;
				        break;
				    default:
				        triggerModel = ServerTriggerModel;
				}

				var triggerModel = new triggerModel({ 
					id: [ this.ruleId, this.triggerGroupIndex, i].join('-'),
					ruleId: this.ruleId,
					triggerGroupIndex: this.triggerGroupIndex,
					triggerIndex: i
				})
				
				this.add(triggerModel)
				window.ServerTriggers.add(triggerModel)
			}

			triggerModel.update(jsonTrigger);
		}
	}

})




var ServerTriggerModel = ModelLuci.extend({
  	url: '/triggers',
  	type: null,
  	token: null,

	initialize: function(){
		this.set({
			type: this.type
		})
	},
	
})

var ServerDeviceTriggerModel = ServerTriggerModel.extend({
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

	},

	getIcon: function(){
		console.log('this shouldn\'t work')
	}
})

var ServerTimeTriggerModel = ServerTriggerModel.extend({
  	url: '/triggers',
  	type: 'time',

  	generateToken: function(jsonTrigger){
		return [
			jsonTrigger.type, 
			jsonTrigger.hour, 
			jsonTrigger.month, 
			jsonTrigger.week,
			jsonTrigger.day, 
			jsonTrigger.hour
		].join('_')
	},
	
	update: function(jsonTrigger){

		var token = this.generateToken(jsonTrigger)

		this.set({ 
			hour: jsonTrigger.hour,
			month: jsonTrigger.month,
			week: jsonTrigger.week,
			day: jsonTrigger.day,
			hour: jsonTrigger.hour,
			token: token
		})

	}
})