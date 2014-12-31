Backbone.sync = function(){
  return false;
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

app.registerService('tasks', new Tasks());

app.registerView('app-new-task', Backbone.View.extend({
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
}));


app.registerView('app-toggle-all-completed', Backbone.View.extend({
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
}));


app.registerView('app-task-list', Backbone.View.extend({
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
  }
}));

