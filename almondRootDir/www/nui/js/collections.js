// Collection definitions of general devices
var DeviceCollection = CollectionWS.extend({
  url: 'devices',
  model: DeviceModel,
  initialize: function(){
    this.deviceDict = window.Luci.loadJson("deviceTypeDict");
  },

  sortModelsByAttr: function(attr){
    modelObjs= []
    for(var i = 0; i < this.models.length; i++){
      model = this.models[i]
      modelObj = {}
      modelObj['model'] = model
      modelObj[attr] = model.getAttr(attr)
      modelObjs.push(modelObj)
    }

    modelObjs.sort(function(a,b){
      return a[attr] - b[attr]
    })

    return modelObjs.map(function(obj){return obj.model})
  },

  getDevices: function(){
    return this.sortModelsByAttr('_index')
  },

  getDeviceTypes: function(){
    devices = this.getDevices()
    typesObj = {}
    for(var i = 0; i < devices.length; i++){
      device = devices[i]
      typeID = device.getTypeID()
      if (!typesObj.hasOwnProperty(typeID)){
        typesObj[typeID] = this.deviceDict[typeID]
      }
    }
    typesArray = $.map(typesObj, function(value, index) { return [value]; });
    return typesArray
  }

})

//Different groupings of 
var ValueCollection = NestedCollection.extend({
  model: ValueModel,
  initialize: function(){
  },

  getInfoList: function(){
    var values = this.models
    var infoArray = []
    for( var i = 0; i < values.length; i++){
      var value = values[i]
      infoArray.push(value)
    }
    return infoArray
  },
})

var AttrCollection = NestedCollection.extend({
  model: AttrModel,
  initialize: function(){
  },

  getValue: function(id){
    model = this.get(id)
    return model.getValue()
  },

  getInfoList: function(){
    var attrs = this.models
    var infoArray = []
    for( var i = 0; i < attrs.length; i++){
      var attr = attrs[i]
      var attrID = attr.get('id')
      if( attrID[0] == '_' ){
        //hidden attribute so we don't care about it
      }else{
        infoArray.push(attr)
      }
    }
    return infoArray
  },

  jsonIt: function(){
    attrs = {}
    modelsJson = this.toJSON()
    for(var i= 0; i < modelsJson.length; i ++){
      modelJson = modelsJson[i]
      key = modelJson.id
      value = modelJson.value
      attrs[key] = value
    }
    return attrs
  },
})