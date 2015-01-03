
(function(root, factory) {

  if (typeof define === 'function' && define.amd) {

    define(['underscore'], function(_){
      root.MiniComponent = factory(root, _);
      return root.MiniComponent;
    });

  } else if (typeof exports != 'undefined') {

    var _ = require('underscore');
    module.exports = factory(root, _);

  } else {
    root.MiniComponent = factory(root, root._);
  }

})(this, function(root, _) {

  var Component = function(elementName) {
    this.services = {};
    this.elementName = elementName;
  };

  Component.prototype = {

    registerComponent: function(options) {
      options = options || {};
      document.registerElement(this.elementName, {
        prototype: _.extend(Object.create(HTMLElement.prototype), {
          createdCallback: options.createdCallback || function(){}
        })
      });
    }

  };

  var MiniComponent = function(appName){
    this.mainComponent = new Component(appName);
    this.mainComponent.registerComponent();
  };

  MiniComponent.prototype = {
    registerView: function(name, View) {
      var _this = this;

      document.registerElement(name, {
        prototype: _.extend(Object.create(HTMLElement.prototype), {
          createdCallback: function() {
            var attributes = this.attributes;
            var namedItem;
            var options = {};

            _.each(_this.mainComponent.services, function(service, key){
              if (attributes.getNamedItem(key)) {
                options[key] = service;
              }
            });

            if (namedItem = attributes.getNamedItem('collection')) {
              options[namedItem.value] = _this.mainComponent.services[namedItem.value];
              options['collection'] = _this.mainComponent.services[namedItem.value];
            }

            if (namedItem = attributes.getNamedItem('collection')) {
              options[namedItem.value] = _this.mainComponent.services[namedItem.value];
              options['model'] = _this.mainComponent.services[namedItem.value];
            }

            view = new View(_.extend(options, {
              el: this,
            }));

            _this.replaceChildrenNode(view, this.innerHTML);

            _this.parseListeners(attributes, view, options);
          }
        })
      });
    },

    replaceChildrenNode: function(view, children) {

      if (children.length > 0) {
        var render = view.render;

        view.render = function() {

          var element;
          var parentNode;
          var newElement;

          render.apply(view);
          element = document.getElementsByTagName('mini-children')[0];
          parentNode = element.parentNode;

          setTimeout(function(){
            newElement = document.createElement('div');
            newElement.innerHTML = children;
            parentNode.replaceChild(newElement, element);
          });
        };

        view.render();

      } else {
        view.render();
      }
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
      this.mainComponent.services[name] = collection;
    }
  };

  return MiniComponent;
});
