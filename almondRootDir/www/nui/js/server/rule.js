// Collection definitions of general devices
var ServerRuleCollection = CollectionLuci.extend({
  url: '/rules',
  _idAttr: 'id',
  model: ServerDeviceModel,

	refresh: function(data){
		var ruleUpdate = $.parseJSON(data);
		_ruleCollection.updateRules(ruleUpdate);
		// _deviceCollection.longPoll(_deviceCollection.refresh);
	},

	localRetrieve: function(callback){
		rules = window.Luci.loadData("rules");
		callback(rules)
	},

	initialize: function(){
		_ruleCollection = this;
		this.localRetrieve(this.refresh);
		// this.retrieve(this.refresh);
	},

	save: function(url, data){
		switch( url ){
			case 'rules':
				console.log('save rules?')
				break;
			case 'rule':
				console.log('save rule')
				break;
		}
		return
	},

	updateRules: function(jsonRules){
		for(var i = 0; i < jsonRules.length; i++){
			var jsonRule = jsonRules[i];

			var ruleId = jsonRule.id;

			var ruleModel = this.find(function(model){
				return model.id == ruleId;
			})

			if(!ruleModel){
				//Device model doesn't exit yet
				var ruleModel = new ServerRuleModel({
					id: ruleId
				});
				this.models.push(ruleModel);
			}

			ruleModel.update(jsonRule);
		}
		this.trigger('update', this.toJSON())
	},

	saveRule: function(rule){
		console.log('Save one rule')
	},

	saveRules: function(rule){
		console.log('Save all rules')
	},

})

// Models
var ServerRuleModel = ModelLuci.extend({
  	url: '/devices',

  	initialize: function(){
  		this.set({ 
  			triggerGroups: new ServerTriggerGroupCollection(),
  			results: new ServerResultCollection()
		});
	},

	getStatus: function(device){
		return device.status
	},

	update: function(jsonRule){
		this.get('triggerGroups').update(this.id, jsonRule.triggergroups);
		this.get('results').update(this.id, jsonRule.results);

		this.set({ 
			name: jsonRule.name,
			status: this.getStatus(jsonRule)
		});
	},

	getValues: function(){
		console.log('getValues')
	},

	getValue: function(valueId){
		console.log('getValue')
	},

	getAttr: function(attrId){
		console.log('getAttr')
	},

	setValue: function(valueData, newValue){
		console.log('setValue')
	},

	saveRule: function(attr, value){
		console.log('saveDevice')
	},

	toNumber: function(valueObj){
		console.log('toNumber')
	},

	toServerPoop: function(value, type){
		console.log('toServerPoop')
	}

})