//this is not how collections should be implemented...
//when we build the backend data should be stored flat
var NestedCollection = Backbone.Collection.extend({

  update:function(collectionData){
    for( var i = 0; i < collectionData.length; i++){
      modelData = collectionData[i]
      modelID = modelData.id
      model = this.get(modelID)
      model.update(modelData)
    }
  },

});

var NestedModel = Backbone.Model.extend({

  update:function(modelData){
    for( var key in modelData){
      attributeData = modelData[key]
      attribute = this.get(key)
      if(attribute instanceof Backbone.Collection){
        attribute.update(attributeData)
      }else{
        this.set(key, attributeData)
      }
    }
    this.trigger('change')

  },

});