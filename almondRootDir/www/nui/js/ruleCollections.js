// Collection definitions regarding to rule creation
var RuleCollection = CollectionWS.extend({
  url: 'rules',
  model: RuleModel,
  initialize: function(){
  },
})

var TriggerGroupCollection = CollectionWS.extend({
  url: 'triggerGroups',
  model: TriggerGroupModel,
  initialize: function(triggerGroup){
  },
})

var TriggerCollection = CollectionWS.extend({
  url: 'triggers',
  model: TriggerModel,
  initialize: function(){
  },

  parse: function (triggers) {
    var triggerArray = []
    _.each(triggers, function (trigger) {
      switch (trigger.type) {
        case 'device':
          triggerModelClass = DeviceTriggerModel;
          break;
        case 'time':
          triggerModelClass = TimeTriggerModel;
          break;
        case 'web':
          triggerModelClass = TriggerModel;
          break;
        default:
          triggerModelClass = TriggerModel;
      }
      var triggerModel = new triggerModelClass(trigger)
      triggerArray.push(triggerModel)
    });
    return triggerArray
  }
})

var ResultCollection = CollectionWS.extend({
  url: 'results',
  model: ResultModel,
  initialize: function(results){
  },

  parse: function (results) {
    var resultArray = []
    _.each(results, function (result) {
      switch (result.type) {
        case 'device':
          resultModelClass = DeviceResultModel;
          break;
        default:
          resultModelClass = ResultModel;
      }
      var resultModel = new resultModelClass(result)
      resultArray.push(resultModel)
    });
    return resultArray
  }
})
