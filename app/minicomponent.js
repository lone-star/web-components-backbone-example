
window.MiniComponent = function(appName){
  var _this = this;
  this.services = {};

  document.registerElement(appName, {
    prototype: _.extend(Object.create(HTMLElement.prototype), {
      createdCallback: function() {
        _this.el = this;
      }
    })
  });
};

MiniComponent.prototype = {
  registerView: function(name, View) {
    var _this = this;

    document.registerElement(name, {
      prototype: _.extend(Object.create(HTMLElement.prototype), {
        createdCallback: function() {
          var options = {};
          var attributes = this.attributes;
          var namedItem;

          _.each(_this.services, function(service, key){
            if (attributes.getNamedItem(key)) {
              options[key] = service;
            }
          });


          if (namedItem = attributes.getNamedItem('collection')) {
            options[namedItem.value] = _this.services[namedItem.value];
            options['collection'] = _this.services[namedItem.value];
          }

          if (namedItem = attributes.getNamedItem('collection')) {
            options[namedItem.value] = _this.services[namedItem.value];
            options['model'] = _this.services[namedItem.value];
          }

          view = new View(_.extend(options, {
            el: this,
          }));

          view.render();

          _this.parseListeners(attributes, view, options);
        }
      })
    });
  },

  parseListeners: function(attributes, view, options) {
    var attributesArray = Array.prototype.slice.call(attributes);
    var node;
    var method;

    for(key in attributesArray) {
      node = attributesArray[key];

      if (node.nodeName.match(/-on$/)) {
        method = node.nodeName.replace(/-on$/, '');

        this.registerMethod(method, node.value, view, options);
      }
    }
  },

  registerMethod: function(method, eventsDefinition, view, options) {
    var eventArray = eventsDefinition.split(' ');
    var eventDefinition;
    var service;
    var callers;

    for(key in eventArray) {
      eventDefinition = eventArray[key];

      service = this.getServiceFromEventDefinition(eventDefinition, options);
      callers = this.getCallersFromEventDefinition(eventDefinition);

      view.listenTo(service, callers, view[method]);
    }
  },

  getServiceFromEventDefinition: function(eventDefinition, options) {
    var serviceName = eventDefinition.replace(/\|(.+)$/, '')
    return options[serviceName];
  },

  getCallersFromEventDefinition: function(eventDefinition) {
    var callers = eventDefinition.replace(/^.*\|/, '')
    return callers.replace(/,/g, ' ');
  },

  registerService: function(name, collection) {
    this.services[name] = collection;
  }
};
