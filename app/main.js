Backbone.sync = function(){
  return false;
};

var MiniComponent = function(appName){
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
  registerView: function(View, name) {
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
          })

          if (namedItem = attributes.getNamedItem('collection')) {
            options['collection'] = _this.services[namedItem.value];
          }

          if (namedItem = attributes.getNamedItem('collection')) {
            options['model'] = _this.services[namedItem.value];
          }

          view = new View(_.extend(options, {
            el: this,
          }));

          view.render();

          _this.parseListeners(attributes, view);
        }
      })
    });
  },

  parseListeners: function(attributes, view) {
    var attributesArray = Array.prototype.slice.call(attributes);
    var node;
    var method;

    for(key in attributesArray) {
      node = attributesArray[key];

      if (node.nodeName.match(/-on$/)) {
        method = node.nodeName.replace(/-on$/, '');

        this.registerMethod(method, node.value, view);
      }
    }
  },

  registerMethod: function(method, eventsDefinition, view) {
    var eventArray = eventsDefinition.split(' ');
    var eventDefinition;
    var service;
    var callers;

    for(key in eventArray) {
      eventDefinition = eventArray[key];

      service = this.getServiceFromEventDefinition(eventDefinition);
      callers = this.getCallersFromEventDefinition(eventDefinition);

      view.listenTo(service, callers, view[method]);
    }
  },

  getServiceFromEventDefinition: function(eventDefinition) {
    var serviceName = eventDefinition.replace(/:(.+)$/, '')
    return this.services[serviceName];
  },

  getCallersFromEventDefinition: function(eventDefinition) {
    var callers = eventDefinition.replace(/^.*:/, '')
    return callers.replace(/,/g, ' ');
  },

  registerService: function(collection, name) {
    this.services[name] = collection;
  }
};

var app = new MiniComponent('app-main');

var Task = Backbone.Model.extend({
  defaults: {
    description: '',
    completed: false
  }
});

var Tasks = Backbone.Collection.extend({
  model: Task,

  hasIncomplete: function(){
    return this.length > 0 ? this.reduce(function(mod, task){
      return !task.get('completed') || mod;
    }, false) : true;
  },

  toggleCompleted: function() {
    var value = this.hasIncomplete();
    this.each(function(task){
      task.set({completed: value}, {silent: true});
    });
    this.trigger('reset');
  }
});

app.registerService(new Tasks(), 'tasks');

var NewTaskView = Backbone.View.extend({
  template: '<input type="text" name="new-task"/>',

  events: {
    "keyup [name=new-task]": 'addTask'
  },

  render: function() {
    this.el.innerHTML = this.template;
    return this;
  },

  addTask: function() {
    if(event.keyCode == 13){
      var description = this.$('[name=new-task]').val();
      this.$('[name=new-task]').val('');
      this.collection.create({
        description: description
      });
    }
  }
});

app.registerView(NewTaskView, 'app-new-task');


var ToggleAllCompleted = Backbone.View.extend({
  template: _.template(document.getElementById('toggle-all-completed-template').innerHTML),

  events: {
    "change [name=toggle-completed]": 'toggleCompleted'
  },

  render: function() {
    this.el.innerHTML = this.template({
      tasks: this.collection
    });
    return this;
  },

  toggleCompleted: function() {
    this.collection.toggleCompleted();
  }
});

app.registerView(ToggleAllCompleted, 'app-toggle-all-completed');


var TaskListView = Backbone.View.extend({
  template: _.template(document.getElementById('task-item-template').innerHTML),

  events: {
    'change .toggle-completed': 'toggleCompleted',
    'click .delete': 'deleteItem'
  },

  render: function() {
    this.el.innerHTML = this.collection.map(function(task){
      return this.template({
        task: task
      });
    }, this).join('');
    return this;
  },

  toggleCompleted: function(e) {
    e.preventDefault();
    var id = this.$(e.target).closest('.item').data('id');
    var task = this.collection.get(id);
    task.set('completed', !task.get('completed'));
  },

  deleteItem: function(e){
    e.preventDefault();
    var id = this.$(e.target).closest('.item').data('id');
    var task = this.collection.get(id);
    this.collection.remove(task);
  },
});

app.registerView(TaskListView, 'app-task-list');

