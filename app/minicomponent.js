
(function(root, factory) {

  if (typeof define === 'function' && define.amd) {

    define(['underscore'], function(_){
      root.miniComponent = factory(root, _);
      return root.miniComponent;
    });

  } else if (typeof exports != 'undefined') {

    var _ = require('underscore');
    module.exports = factory(root, _);

  } else {
    root.miniComponent = factory(root, root._);
  }

})(this, function(root, _) {

  function getCallersFromEventDefinition(eventDefinition) {
    var callers = eventDefinition.replace(/^.*\|/, '')
    return callers.replace(/,/g, ' ');
  };

  function getServiceFromEventDefinition(eventDefinition, options) {
    var serviceName = eventDefinition.replace(/\|(.+)$/, '')
    return options[serviceName];
  };

  function replaceChildrenNode(view, children) {

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
  };

  function parseListeners(attributes, view, options) {
    var attributesArray = Array.prototype.slice.call(attributes);
    var node;
    var method;

    for(key in attributesArray) {
      node = attributesArray[key];

      if (node.nodeName.match(/-on$/)) {
        method = node.nodeName.replace(/-on$/, '');

        registerMethod(method, node.value, view, options);
      }
    }
  };

  function registerMethod(method, eventsDefinition, view, options) {
    var eventArray = eventsDefinition.split(' ');
    var eventDefinition;
    var service;
    var callers;

    for(key in eventArray) {
      eventDefinition = eventArray[key];

      service = getServiceFromEventDefinition(eventDefinition, options);
      callers = getCallersFromEventDefinition(eventDefinition);

      view.listenTo(service, callers, view[method]);
    }
  };

  var Component = function(elementName) {
    this.services = {};
    this.elementName = elementName;
  };

  Component.prototype = {

    registerComponent: function(options) {
      if (!options) {
        throw new Error('a component name needs to be provided');
      }
      document.registerElement(options.name, {
        prototype: _.extend(Object.create(HTMLElement.prototype), {
          createdCallback: options.createdCallback || function(){}
        })
      });
    },

    registerView: function(name, View) {
      var _this = this;

      this.registerComponent({
        name: name,
        createdCallback: function(){
          var attributes = this.attributes;
          var namedItem;
          var options = {};

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

          replaceChildrenNode(view, this.innerHTML);

          parseListeners(attributes, view, options);
        }
      });
    },

    registerService: function(name, collection) {
      this.services[name] = collection;
    }
  };

  return function(name) {
    var component = new Component(name);
    component.registerComponent({
      name: name
    });
    return component;
  };
});
