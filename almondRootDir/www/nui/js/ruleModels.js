// Model definitions regarding to rule creation
var RuleModel = ModelWS.extend({
  url:'rule',
  initialize: function(data){
  },
  getTriggerGroups:function(){
    var triggerGroups = []

    var triggerGroupsJSON = this.get('triggerGroups')
    for(var i=0; i < triggerGroupsJSON.length; i++){
      var triggerGroupJSON = triggerGroupsJSON[i]
      var triggerGroupId = triggerGroupJSON.id
      var triggerGroup = window.TriggerGroups.get(triggerGroupId)
      triggerGroups.push(triggerGroup)
    }

    return triggerGroups
  },
  getResults:function(){
    var results = []

    var resultsJSON = this.get('results')
    for(var i=0; i < resultsJSON.length; i++){
      var resultJSON = resultsJSON[i]
      var resultId = resultJSON.id
      var result = window.Results.get(resultId)
      results.push(result)
    }

    return results
  },
})

var TriggerGroupModel = ModelWS.extend({
  initialize: function(data){
  },
  getTriggers:function(){
    var triggers = []

    var triggersJSON = this.get('triggers')
    for(var i=0; i < triggersJSON.length; i++){
      var triggerJSON = triggersJSON[i]
      var triggerId = triggerJSON.id
      var trigger = window.Triggers.get(triggerId)
      triggers.push(trigger)
    }

    return triggers
  },
  getDesciption:function(){
    var triggerDesciptions = []
    var triggers = this.getTriggers()
    for(var i in triggers){
      var trigger = triggers[i]
      var triggerDescription = trigger.getDesciption()
      triggerDesciptions.push(triggerDescription)

    }
    return triggerDesciptions.join(' and ')
  }
})

var TriggerModel = ModelWS.extend({
  initialize: function(data){
  },
})

var DeviceTriggerModel = TriggerModel.extend({
  initialize: function(){
    var status = this.deviceValueState()
    this.set({
      _text: status.text,
      _icon: status.icon,
    })
  },

  getDesciption:function(){
    var deviceName = this.getDevice().getAttr('name')
    var deviceStatus = this.get('_text')
    return {
      subject: deviceName,
      verb: 'is',
      object: deviceStatus
    }
  },

  getDevice: function(){
    var devId = this.get('devId')
    var devices = window.Devices
    var device = devices.get(devId)
    return device
  },

  getDeviceValue: function(){
    var device = this.getDevice()
    //Have to subtract by one for now because of contradicting opinions 
    //on how to id the values, index 0 or 1
    var valId = this.get('valueIndex') - 1
    var deviceValue = device.getValue(valId)
    return deviceValue
  },

  deviceValueState: function(){
    var deviceValue = this.getDeviceValue()
    var statusValue = this.get('value')
    var deviceValueState = deviceValue.getStatus(statusValue)
    return deviceValueState
  },

  getIcon: function(){
    var icon = this.get('_icon')
    var text = this.get('name')
    var color = this.getDevice().valueColor(this.get('value'), 1)

    return {
      icon: icon,
      text: text,
      color: color
    }
  }
})

var TimeTriggerModel = TriggerModel.extend({
  initialize: function(data){
  },

  getDesciption:function(){
    var deviceName = this.get('name')
    var deviceStatus = this.get('_text')
    return {
      subject: deviceName,
      verb: 'is',
      object: deviceStatus
    }
  },

  getIcon: function(){
    return {
      icon: 'time',
      text: 'Weekdays 8:30'
    }
  }
})

var ResultModel = ModelWS.extend({
  initialize: function(data){
  },
})

var DeviceResultModel = ResultModel.extend({
  initialize: function(){
    var status = this.deviceValueState()
    this.set({
      _text: status.text,
      _icon: status.icon,
    })
  },

  getDevice: function(){
    var devId = this.get('devId')
    var devices = window.Devices
    var device = devices.get(devId)
    return device
  },

  getDeviceValue: function(){
    var device = this.getDevice()
    //Have to subtract by one for now because of contradicting opinions 
    //on how to id the values, index 0 or 1
    var valId = this.get('valueIndex') - 1
    var deviceValue = device.getValue(valId)
    return deviceValue
  },

  deviceValueState: function(){
    var deviceValue = this.getDeviceValue()
    var statusValue = this.get('value')
    var deviceValueState = deviceValue.getStatus(statusValue)
    return deviceValueState
  },

  getIcon: function(){
    var icon = this.get('_icon')
    var text = this.get('name')
    var color = this.getDevice().valueColor(this.get('value'), 1)

    return {
      icon: icon,
      text: text,
      color: color
    }
  }
})