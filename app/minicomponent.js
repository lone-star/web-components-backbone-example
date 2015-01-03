
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
      var _this = this;

      if (!options) {
        throw new Error('a component name needs to be provided');
      }
      document.registerElement(options.name, {
        prototype: _.extend(Object.create(HTMLElement.prototype), {
          attachedCallback: function(){
            _this.el = this;
            this._services = _this.services;
            this._miniComponent = true;
            if (options.attachedCallback) {
              options.attachedCallback.apply(this, arguments);
            }
          },
          createdCallback: options.createdCallback || function(){}
        })
      });
    },

    registerView: function(name, View) {
      var _this = this;

      var component = new Component(name);
      component.registerComponent({
        name: name,
        attachedCallback: function() {
          var attributes = this.attributes;
          var namedItem;
          var options = {};

          _.each(_this.getAllServices(), function(service, key){
            if (attributes.getNamedItem(key)) {
              options[key] = service;
            }
          });

          if (namedItem = attributes.getNamedItem('collection')) {
            options[namedItem.value] = component.getService(namedItem.value);
            options['collection'] = component.getService(namedItem.value);
          }

          if (namedItem = attributes.getNamedItem('model')) {
            options[namedItem.value] = component.getService(namedItem.value);
            options['model'] = component.getService(namedItem.value);
          }

          view = new View(_.extend(options, {
            el: this,
          }));

          replaceChildrenNode(view, this.innerHTML);

          parseListeners(attributes, view, options);
        },
        createdCallback: function(){
        }
      });

      return component;
    },

    registerService: function(name, service) {
      if (this.el) {
        this.el._services[name] = service;
      } else {
        this.services[name] = service;
      }
    },

    getService: function(name) {
      var element =  this.el;
      var passedRoot = false;

      while(element.parentNode && !passedRoot) {
        element = element.parentNode;
        passedRoot = !!element._miniComponentRoot;

        if (element._miniComponent && element._services.hasOwnProperty(name)) {
          return element._services[name];
        }
      }

      return null;
    },

    getAllServices: function() {
      var element =  this.el;
      var passedRoot = false;
      var services = {};

      while(element.parentNode && !passedRoot) {
        element = element.parentNode;
        passedRoot = !!element._miniComponentRoot;

        if (element._miniComponent) {
          services = _.extend(element._services, services);
        }
      }
      return services;
    }
  };

  return function(name) {
    var component = new Component(name);
    component.registerComponent({
      name: name,
      createdCallback: function() {
        this._miniComponentRoot = true;
      }
    });
    return component;
  };
});
