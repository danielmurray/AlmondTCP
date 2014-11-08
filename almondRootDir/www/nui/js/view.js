// Views, all inherit BaseView
var BaseView = Backbone.View.extend({
  initialize: function() {
  },

  assign: function(view, selector) {
    view.setElement(this.$(selector));
  },

  route: function(part, remaining) {
    return {};
  },

  dispose: function() {
    this.remove();
    this.off();
    // if (this.model) {
    //   this.model.off(null, null, this);
    // }
  }
});

var HomeView = BaseView.extend({
  el: "#viewport",
  events: {
    "click .tabWrapper":  "navigateTo",
  },
  initialize: function() {
    var that = this;
    this.viewData = this.determineView()

    this.template = window.Luci.loadBackboneTemplate("home");
    this.tabs = window.Luci.loadJson("tabs");
  },
  route: function(part, remaining) {
     
    if (!part) {
      navigate("devices", false); // don't trigger nav inside route
    }

    var viewMap = {
      'devices' :DevicesView,
      'scenes'  :ScenesView,
      'rule'    :RuleView,
      'rules'   :RulesView,
      'router'  :RouterView,
      'log'     :LogView,
      'advanced':AdvancedView
    }

    //establish pane data to be passed to view
    if(this.tabs[part]){
      this.currentTab = this.tabs[part];
    } else if(part == 'rule'){
      this.currentTab = this.tabs['rules'];  
    } else {
      //404 routes home
      this.currentTab = {
        "id": 'devices',
        "name": "Devices"
      };      
    }

    //find view in id-view map
    if (viewMap[part]){
      viewToBeReturned = new viewMap[part](this.currentTab);
    } else {
      viewToBeReturned = new TabView(this.currentTab)
    }
    console.log(viewToBeReturned)

    return {
      "#contentContainer": viewToBeReturned
    };        

  },
  render: function() {
    var renderedTemplate = this.template({
      viewData: this.viewData,
      tabs: this.tabs,
      currentTab: this.currentTab
    });
    this.$el.html(renderedTemplate);
  },
  navigateTo: function(click){
    var nextTarget = click.currentTarget.id;
    navigate(nextTarget, false); 
  },
  determineView: function(){
    //Here we can put code to determine the size of the view port
    //So that it looks nice on a laptop/desktop and mobile
    //For now I am just lazy

    return {
      width: 1002
    }
  }
});

var TabView = BaseView.extend({
  el: 'div',
  initialize: function(data){
    this.template = window.Luci.loadBackboneTemplate("nothingfound");
  },
  route: function(part, remaining) {

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    var renderedTemplate = this.template();
    this.$el.html(renderedTemplate);
  },

});

var DevicesView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.collection = window.Devices;
    this.devicesView = this.collection.devicesView
    this.template = window.Luci.loadBackboneTemplate("devices");

  },
  route: function(part, remaining) {
    this.devicesView = part

    if(this.collection.length == 0){
      return {}
    }

    if (!part) {
      navigate("devices/list", false); // don't trigger nav inside route
    }

    var viewMap = {
      'list'    :DeviceListView,
      'device'  :DeviceView
    }

    //find view in id-view map
    if (viewMap[part]){
      viewToBeReturned = new viewMap[part]();
    } else {
      viewToBeReturned = new viewMap['list' ]();
    }

    return {
      "#devicesWrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    var renderedTemplate = this.template({
      devicesView: this.devicesView
    });
    this.$el.html(renderedTemplate);
  },

});

var DeviceListView = BaseView.extend({
  el: 'div',
  events: {
    "mousemove  .expandCollapseOverlay": "mouseMove",
    "mouseout   .expandCollapseOverlay": "mouseOut",
    "click      .expandCollapseOverlay": "expandCollapse",
    "click      #listToBoxButton"      : "listToBox",
    "click      #boxToListButton"      : "boxToList"
  },
  boxToList: function(click){
    this.deviceView = "list"

    var deviceElems = this.$el.find(".item")
    for( var i = 0; i < deviceElems.length; i++){
      var deviceElem = deviceElems[i]
      var deviceContent = $(deviceElem).find('.item-content')
      var classes = deviceContent[0].classList
      deviceContent.addClass('w12')
    }
    
    this.container.packery();

    var deviceElems = this.$el.removeClass('boxView')
    var deviceElems = this.$el.addClass('listView')
  },
  listToBox: function(click){
    this.deviceView = "box"

    var deviceElems = this.$el.find(".item")
    for( var i = 0; i < deviceElems.length; i++){
      var deviceElem = deviceElems[i]
      var deviceContent = $(deviceElem).find('.item-content')
      deviceContent.removeClass('w12')
    }

    this.container.packery();

    var deviceElems = this.$el.removeClass('listView')
    var deviceElems = this.$el.addClass('boxView')
  },
  getMouseXY: function(event){
    var mouseX, mouseY

    if(event.offsetX == undefined){
      mouseX = event.originalEvent.layerX
      mouseY = event.originalEvent.layerY
    }else{
      mouseX = event.offsetX
      mouseY = event.offsetY
    }

    return [mouseX, mouseY]
  },
  expandCollapse: function(event){
    var mouseXY = this.getMouseXY(event)
    var mouseX = mouseXY[0]
    var mouseY = mouseXY[1]

    var elem = $(event.target).closest('.item');
    var elemContent = elem.find('.item-content');
    var elemContent = elem.find('.item-content');


    var horizontalVertical = this.horizontalVertical(elem, mouseX, mouseY)
    var heightWidth = this.heightWidth(elem, mouseX, mouseY)
    var currDimension = elem.attr(heightWidth)
    var nextDimension = this.oppositeDimension(elem, currDimension)

    elem.attr(heightWidth, nextDimension)
    elemContent.switchClass(currDimension,nextDimension,0)
    this.updateArrows(elem, horizontalVertical, currDimension, nextDimension)

    var deviceId = elem.attr('deviceId')
    var device = this.collection.get(deviceId)

    setObj = {}
    setObj['_'+heightWidth] = nextDimension
    device.setAttr(setObj)
    this.collection.save()

    this.container.packery( 'fit', elem[0] );
  },
  mouseMove: function(event){
    var mouseXY = this.getMouseXY(event)
    var mouseX = mouseXY[0]
    var mouseY = mouseXY[1]

    var elem = $(event.target).closest('.item');

    switch( this.horizontalVertical(elem, mouseX, mouseY) ){
      case'horizontal':
      //show horizontal expandCollapse arrow
        elem.find('.expandCollapse.horizontal').addClass('show', {duration:200});
        elem.find('.expandCollapse.vertical').removeClass('show', {duration:200});
        break;
      case'vertical':
      //show vertical expandCollapse arrow
        elem.find('.expandCollapse.horizontal').removeClass('show', {duration:200});
        elem.find('.expandCollapse.vertical').addClass('show', {duration:200});
        break;
    }

  },
  mouseOut: function(event){
    var elem = $(event.currentTarget);
    var deviceId = elem.attr('deviceId')
    elem.find('.expandCollapse').removeClass('show', {duration:200});
  },
  initialize: function(data){
    this.collection = window.Devices;
    this.devices = this.collection.getDevices();
    this.deviceView = "box"


    this.template = window.Luci.loadBackboneTemplate("deviceList");
  },
  route: function(part, remaining) {

    viewsToBeReturned = {}

    for(var i = 0; i < this.devices.length; i++){
      device = this.devices[i]
      deviceItemDivID = '#device'+device.id
      listView = new DeviceView(device)
      viewsToBeReturned[deviceItemDivID] = listView
    }

    return viewsToBeReturned;  
    
  },
  render: function() {    
    var renderedTemplate = this.template({
      devices     : this.devices,
      showArrows  : this.showArrows,
    });
    this.$el.html(renderedTemplate);
    setTimeout($.proxy(this.initBoxes), 1000, this);
  },
  initBoxes: function(self){
    var container = $('#deviceList');
    container.packery({
      columnWidth: 158,
      rowHeight: 158,
      gutter: 10,
      transitionDuration: '0.5s'
    });

    // get item elements, jQuery-ify them
    var $itemElems = $( container.packery('getItemElements') );
    // make item elements draggable
    $itemElems.draggable({ 
      distance: 75
    });
    // bind Draggable events to Packery
    container.packery( 'bindUIDraggableEvents', $itemElems );

    self.container = container

    function updateDeviceIndices(layout, items) {
      var elems = container.packery('getItemElements')
      for(var i = 0; i < elems.length; i++){
        item = elems[i]
        elem = $(item)
        device.id = elem.attr('deviceId')
        device = self.collection.get(device.id)

        device.setAttr({
          _index: i
        })
      }
      self.collection.save()
    }

    // container.packery( 'on', 'layoutComplete', updateUserDevicePreferences, this )
    container.packery( 'on', 'dragItemPositioned', updateDeviceIndices, self )
  },
  updateArrows: function(elem, horizontalVertical, currDimension, nextDimension){
    var wrapper = elem.find('.expandCollapse.' + horizontalVertical)
    var expandArrow = wrapper.find('.expand')
    var collapseArrow = wrapper.find('.collapse')
    if( currDimension < nextDimension){
  // collapse
      expandArrow.removeClass('show', {duration:200});
      collapseArrow.addClass('show', {duration:200});
    }else{
  // expand
      expandArrow.addClass('show', {duration:200});
      collapseArrow.removeClass('show', {duration:200});
    }
  },
  heightWidth: function(elem, mouseX, mouseY){
    switch( this.horizontalVertical(elem, mouseX, mouseY) ){
      case 'vertical':
        return 'height'
      case 'horizontal':
        return 'width'
    }
  },
  horizontalVertical: function(elem, mouseX, mouseY){
    var deviceId = elem.attr('deviceId')
    var device = this.collection.get(deviceId)
    if(this.dimensionExpanded(device,'height') || this.deviceView=='list' || this.dimensionExpanded(device,'width') && mouseX < mouseY){
        return 'vertical'
    }else{
        return 'horizontal'
    }
  },
  oppositeDimension: function(elem, nowDimension){
    var id = elem.attr('deviceId')
    var device = this.collection.get(id)
    var widthHeight = nowDimension[0]
    switch( widthHeight ){
      case 'w':
        if (nowDimension == 'w2')
          return device.getAttr('_maxWidth')
        else
          return 'w2'
      case 'h':
        if (nowDimension == 'h2')
          return device.getAttr('_maxHeight')
        else
          return 'h2'
    }
  },
  dimensionExpanded: function(device, dimension){
    var dimension = device.getAttr('_' + dimension)
    if( dimension[1] == '2' )
      return false
    else
      return true
  },
  showArrows: function(device){
    var doWeShowIt = function(device, dimension){
      var dimension = device.getAttr('_' + dimension)
      if( dimension[1] == '2' ){
        return {
          expand    :'show',
          collapse  :''
        }
      }else{
        return {
          expand    :'',
          collapse  :'show'
        }
      }
    }
    return {
      horizontal  :doWeShowIt(device,'width'),
      vertical    :doWeShowIt(device,'height')
    }
  }
});

var DeviceView = BaseView.extend({
  el: 'div',
  events: {
  },
  initialize: function(device){
    this.template = window.Luci.loadBackboneTemplate("device");
    this.model = device;
  },
  route: function(part, remaining) {
    
    var viewsToBeReturned = {};
    viewsToBeReturned['#device'+this.model.id+'icon'] = new DeviceIconView(this.model);
    viewsToBeReturned['#device'+this.model.id+'info'] = new DeviceInfoView(this.model);
    
    var displayValueIndices = this.model.getAttr('_displayValues')

    for(var i = 0; i < displayValueIndices.length; i++){
      var displayValueIndex = displayValueIndices[i];
      var valueModel = this.model.getValue(displayValueIndex);

      var valueType = valueModel.getAttr('_type');
      switch( valueType ){
        case 'switch':
          var valueView = new SwitchDisplayView(this.model, valueModel);
          break;
        case 'number':
        case 'bool':
          var valueView = new NumberDisplayView(this.model, valueModel);
      }
      
      var valueItemDivID = '#device'+this.model.id+'value'+displayValueIndex;
      viewsToBeReturned[valueItemDivID] = valueView;
    }
    return viewsToBeReturned;   
    
  },
  render: function() {
    var renderedTemplate = this.template({
      device : this.model,
      attrs  : this.model.get('attrs'),
      values : this.model.get('values')
    });
    this.$el.html(renderedTemplate);
  }
});

var DeviceIconView = BaseView.extend({
  el: 'div',
  events:{
    
  },
  initialize: function(device){
    var that = this;
    this.template = window.Luci.loadBackboneTemplate("deviceIcon");
    this.model = device
  },
  route: function(part, remaining) {
    this.listenTo(this.model,'change',this.render)

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    test
    
  },
  render: function() {
    var renderedTemplate = this.template({
      device :this.model,
    });
    this.$el.html(renderedTemplate);
  },

});

var NumberDisplayView = BaseView.extend({
  el: 'div',
  initialize: function(device, value){
    var that = this;
    this.template = window.Luci.loadBackboneTemplate("numberDisplay");
    this.model = value
    this.device = device
  },
  route: function(part, remaining) {
    this.listenTo(this.device,'change',this.render)

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    var renderedTemplate = this.template({
      value :this.model,
      device: this.device
    });
    this.$el.html(renderedTemplate);
  },
});

var SwitchDisplayView = BaseView.extend({
  el: 'div',
  events: {
    'click .deviceSwitch':'toggle'
  },
  toggle: function(click){
    if (this.model.get('value') ){
      this.turnOff()
    }else{
      this.turnOn()
    }
  },
  initialize: function(device, value){
    var that = this;
    this.template = window.Luci.loadBackboneTemplate("switchDisplay");
    this.model = value
    this.device = device
  },
  route: function(part, remaining) {
    this.listenTo(this.device,'change',this.render)
    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    var renderedTemplate = this.template({
      value :this.model,
      device: this.device
    });
    this.$el.html(renderedTemplate);
  },
  turnOn:function(){
    var elem = this.$el
    elem.find('.onSwitch').addClass('waitingOnCallBack', {duration:0})
    elem.find('.offSwitch').removeClass('selected waitingOnCallBack', {duration:0})
    var valueId = this.model.id;
    this.device.save({
      valueIndex: valueId,
      value: 1
    })
  },
  turnOff:function(){
    var elem = this.$el
    elem.find('.onSwitch').removeClass('selected waitingOnCallBack', {duration:0})
    elem.find('.offSwitch').addClass('waitingOnCallBack', {duration:0})
    var valueId = this.model.id;
    this.device.save({
      valueIndex: valueId,
      value: 0
    })
  }
});


var DeviceInfoView = BaseView.extend({
  el: 'div',
  events: {
    'change .userEditable':'update'
  },
  update: function(event){
    var elem = $(event.currentTarget);

    var deviceInfoObj = elem.closest('.infoItem');
    var deviceId = deviceInfoObj.attr('device');
    var attrId = deviceInfoObj.attr('attr');
    var enteredData = elem.val();

    saveObj = {
      "attrKey":attrId,
      "value":enteredData
    };

    var device = this.model;
    
    var thing = {}
    thing[attrId] = enteredData
    device.setAttr(thing)

    device.save(saveObj);
  },
  initialize: function(device){
    var that = this;
    this.template = window.Luci.loadBackboneTemplate("deviceInfo");
    this.model = device
  },
  route: function(part, remaining) {
    this.listenTo(this.model,'change',this.render)

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    var infoList = this.model.getInfoList()
    var renderedTemplate = this.template({
      device: this.model,
      infoModels :infoList,
    });
    this.$el.html(renderedTemplate);
  },

});


var RulesView = TabView.extend({
  el: 'div',
  events: {
    'click .filterIcon':'toggle'
  },
  initialize: function(data){
    var that = this;
    this.collection = window.Rules
    this.devices = window.Devices;
    this.deviceTypes = this.devices.getDeviceTypes();
    this.template = window.Luci.loadBackboneTemplate("rules");
  },
  route: function(part, remaining) {

    if (!part) {
      navigate("rules", false); // don't trigger nav inside route
    }

    viewToBeReturned = new RuleListView({
      rules: this.collection
    })

    return {
      "#ruleWrapper": viewToBeReturned
    };       
    
  },
  render: function() {
    var renderedTemplate = this.template({
      part: this.nextPart,
      deviceTypes: this.deviceTypes
    });
    console.log(renderedTemplate)
    this.$el.html(renderedTemplate);
  },
  toggle: function(click) {
    target = $(click.currentTarget);
    if (target.hasClass("unselected")){
      target.switchClass( "unselected", "selected", 0)
    }
    else if (target.hasClass("selected")){
      target.switchClass( "selected", "unselected", 0)
    }
  },

});

var RuleView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.collection = window.Rules
    this.template = window.Luci.loadBackboneTemplate("rule");
  },
  route: function(part, remaining) {
    this.model = this.collection.get(Number(part))

    var ruleHeader = new RuleListItemView({
      rule: this.model,
      editRule: true
    })

    var ruleBuilder = new RuleBuilderView({
      rule: this.model
    })

    return {
      "#ruleHeaderWrapper": ruleHeader,
      "#ruleBuilder": ruleBuilder
    };  
  },
  render: function() {
    var renderedTemplate = this.template({

    });
    this.$el.html(renderedTemplate);
  },
});

var RuleListView = TabView.extend({
  el: 'div',
  events: {
    'click .actionButton': 'edit'
  },
  initialize: function(data){
    var that = this;
    this.collection = data.rules
    this.rules = this.collection.models
    this.template = window.Luci.loadBackboneTemplate("ruleList");
  },
  route: function(part, remaining) {
    viewsToBeReturned = {}
    
    for(var i = 0; i < this.rules.length; i++){
      var rule = this.rules[i]
      var ruleItemDivId = '#ruleWrapper'+rule.id

      var ruleView = new RuleListItemView({
        rule: rule,
        editRule: false
      })
      
      viewsToBeReturned[ruleItemDivId] = ruleView
    }

    return viewsToBeReturned  
    
  },
  render: function() {
    var renderedTemplate = this.template({
      rules: this.rules
    });
    this.$el.html(renderedTemplate);
  },
  edit:function(click){
    var rulesHeader = $('.rulesHeaderWrapper')
    var listItem = $(click.currentTarget).closest('.ruleListItem')
    var rule = $(click.currentTarget).closest('.ruleWrapper')
    var otherRules = $(listItem).siblings('li').not(listItem)
    var ruleId = Number(rule[0].id.split('ruleWrapper')[1])

    var transitionDuration = 350

    otherRules.animate({
        opacity: 0,
        height: 0,
        margin: 0
      }, transitionDuration, function() {
        // Animation complete.
    });

    rulesHeader.animate({
        opacity: 0,
        height: 0,
        margin: 0
      }, transitionDuration, function() {
        navigate('rule/'+ ruleId, false)
    });
  }
});

var RuleListItemView = TabView.extend({
  el: 'div',
  events: {
    'click .switchWrapper':'toggle',
    'mousewheel .graphicWrapper': 'scroll'
  },
  toggle: function(click){
    if (this.model.get('status') ){
      this.turnOff()
    }else{
      this.turnOn()
    }
  },
  initialize: function(data){
    var that = this;
    this.model = data.rule
    this.editRule = data.editRule
    this.template = window.Luci.loadBackboneTemplate("ruleListItem");
  },
  route: function(part, remaining) {
    this.listenTo(this.model,'change',this.render)
    return {
      //"#dashboard-wrapper": viewToBeReturned
    };
  },
  render: function() {
    var renderedTemplate = this.template({
      rule: this.model,
      edit: this.editRule,
      devices: window.Devices,
      triggerGroups: window.TriggerGroups, 
      triggers: window.Triggers, 
      results: window.Results
    });
    this.$el.html(renderedTemplate);
  },
  scroll:function(data){
    var scrollDelta = data.originalEvent.deltaY

    var currentTarget = $(data.currentTarget)
    
    var value = currentTarget.scrollLeft()
    currentTarget.scrollLeft(value + scrollDelta)
  },
  turnOn:function(){
    this.model.save({
      status: 1
    })
  },
  turnOff:function(){
    this.model.save({
      status: 0
    })
  },
});

var RuleBuilderView = TabView.extend({
  el: 'div',
  events: {
    'click .actionButton':'done',
    'click .newTriggerWrapper':'newTrigger',
  },
  initialize: function(data){
    var that = this;
    this.model = data.rule
    this.triggerGroups = this.model.getTriggerGroups()
    this.results = this.model.getResults()
    this.template = window.Luci.loadBackboneTemplate("ruleBuilder");
  },
  route: function(part, remaining) {
    viewsToBeReturned = {}
    
    for(var i = 0; i < this.triggerGroups.length; i++){
      var triggerGroup = this.triggerGroups[i]
      var triggerGroupId = '#triggerBuilderWrapper'+triggerGroup.id

      var triggerBuilderView = new TriggerBuilderView({
        triggerGroup: triggerGroup
      })
      
      viewsToBeReturned[triggerGroupId] = triggerBuilderView
    }

    viewsToBeReturned['#resultsBuilderWrapper'] = new ResultsBuilderView({
      results: this.results
    })

    console.log(viewsToBeReturned)

    return viewsToBeReturned    
  },
  render: function() {
    var renderedTemplate = this.template({
      rule: this.model,
      edit: this.editRule,
      devices: window.Devices,
      triggerGroups: window.TriggerGroups, 
      triggers: window.Triggers, 
      results: window.Results
    });
    this.$el.html(renderedTemplate);
  },
  done:function(click){
    navigate('rules', false)
  },
  newTrigger:function(){
    var transitionDuration = 300

    $('.containerWrapper').fadeIn()

    $('.container').animate({
        height: 100
      }, transitionDuration, function() {

    });
  }
});

var TriggerBuilderView = TabView.extend({
  el: 'div',
  events: {
    'click .newTriggerWrapper':'newTrigger',
    'mousewheel .triggerGroupEdit': 'scroll',
    'mouseover .whenThenWrapper': 'highlightWhen',
    'mouseout  .whenThenWrapper': 'unHighlightWhen',
    'mouseover .triggerEditWrapper': 'highlightTrigger'
  },
  initialize: function(data){
    var that = this;
    this.model = data.triggerGroup
    this.template = window.Luci.loadBackboneTemplate("triggerBuilder");
  },
  route: function(part, remaining) {
    viewsToBeReturned = {}
    return viewsToBeReturned    
  },
  render: function() {
    var renderedTemplate = this.template({
      triggerGroup: this.model,
      edit: this.editRule,
      devices: window.Devices,
      triggerGroups: window.TriggerGroups, 
      triggers: window.Triggers, 
      results: window.Results
    });
    this.$el.html(renderedTemplate);
  },
  newTrigger:function(){
    var transitionDuration = 300

    $('.containerWrapper').fadeIn()

    $('.container').animate({
        height: 100
      }, transitionDuration, function() {

    });
  },
  scroll:function(data){
    var scrollDelta = data.originalEvent.deltaY

    var currentTarget = $(data.currentTarget)
    
    var value = currentTarget.scrollLeft()
    currentTarget.scrollLeft(value + scrollDelta)
  },
  highlightTrigger: function(hover){
    var triggerIcon = $(hover.currentTarget).find('#triggerEditIconWrapper')
    var triggerText = $(hover.currentTarget).find('#triggerDescriptionEdit')

    triggerIcon.addClass('hover')
    triggerText.addClass('hover')
  },
  highlightWhen: function(hover){
    var ellipsisSpan = $(hover.currentTarget).find('.ellipsisSpan')

    ellipsisSpan.addClass('hover')
  },
  unHighlightWhen: function(hover){
    var ellipsisSpan = $(hover.currentTarget).find('.ellipsisSpan')

    ellipsisSpan.removeClass('hover')
  }
});

var ResultsBuilderView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.collection = data.results
    this.results = this.collection
    this.template = window.Luci.loadBackboneTemplate("resultsBuilder");
  },
  route: function(part, remaining) {
    viewsToBeReturned = {}
    for(var i = 0; i < this.results.length; i++){
      var result = this.results[i]
      console.log(result)
      var resultId = '#resultBuilderWrapper'+result.id

      var resultBuilderView = new ResultBuilderView({
        result: result
      })
      
      viewsToBeReturned[resultId] = resultBuilderView
    }
    return viewsToBeReturned
  },
  render: function() {
    var renderedTemplate = this.template({
      results: this.collection,
    });
    this.$el.html(renderedTemplate);
  }
});

var ResultBuilderView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.model = data.result
    this.result = this.model
    this.template = window.Luci.loadBackboneTemplate("resultBuilder");
  },
  route: function(part, remaining) {
    viewsToBeReturned = {}
    return viewsToBeReturned
  },
  render: function() {
    var renderedTemplate = this.template({
      result: this.model,
    });
    this.$el.html(renderedTemplate);
  }
});

var ScenesView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.template = window.Luci.loadBackboneTemplate("scenes");
  },
  route: function(part, remaining) {
    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
  },
  render: function() {
    var renderedTemplate = this.template({
      currentCoder: 'Rajesh'
    });
    this.$el.html(renderedTemplate);
  },
});

var RouterView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.template = window.Luci.loadLuaTemplate("admin/router");
  },
  route: function(part, remaining) {

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    // var renderedTemplate = this.template();
    var renderedTemplate = this.template
    this.$el.html(renderedTemplate);
  },

});

var LogView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.template = window.Luci.loadBackboneTemplate("log");
  },
  route: function(part, remaining) {

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    // var renderedTemplate = this.template();
    var renderedTemplate = this.template;
    this.$el.html(renderedTemplate);
  },

});

var AdvancedView = TabView.extend({
  el: 'div',
  initialize: function(data){
    var that = this;
    this.template = window.Luci.loadLuaTemplate("/admin/advanced");
  },
  route: function(part, remaining) {

    return {
      //"#dashboard-wrapper": viewToBeReturned
    };    
    
  },
  render: function() {
    // var renderedTemplate = this.template();
    var renderedTemplate = this.template
    this.$el.html(renderedTemplate);
  },

});

