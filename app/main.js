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

          _.each(_this.collections, function(collection, key){
            if (attributes.getNamedItem(key)) {
              options[key] = collection;
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
        }
      })
    });
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

  initialize: function() {
    _.bindAll(this, 'render');
    this.collection.on('add change remove reset', this.render);
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

  initialize: function(options){
    _.bindAll(this, 'render');
    this.collection.on('add change remove reset', this.render);
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

