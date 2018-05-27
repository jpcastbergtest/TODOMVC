/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	const NEW_TODO = document.getElementById('new-todo');
	const TOGGLE_ALL = document.getElementById('toggle-all');
	const FOOTER = document.getElementById('footer');
	const TODO_LIST = document.getElementById('todo-list');
	const MAIN = document.getElementById('main');
	const DESTROY_BUTTON = document.getElementById('destroy')
	var App = {


		init: function () {
			this.todos = util.store('todos-jquery');
			//this.todoTemplate = Handlebars.compile($('#todo-template').html());
      this.todoTemplate = Handlebars.compile(document.getElementById('todo-template').innerHTML);
			//this.footerTemplate = Handlebars.compile($('#footer-template').html());
      this.footerTemplate = Handlebars.compile(document.getElementById('footer-template').innerHTML);
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		bindEvents: function () {
			/*
			$('#new-todo').on('keyup', this.create.bind(this));
			$('#toggle-all').on('change', this.toggleAll.bind(this));
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			$('#todo-list')
			.on('change', '.toggle', this.toggle.bind(this))
			.on('dblclick', 'label', this.edit.bind(this))
			.on('keyup', '.edit', this.editKeyup.bind(this))
			.on('focusout', '.edit', this.update.bind(this))
			.on('click', '.destroy', this.destroy.bind(this));
			*/
      NEW_TODO.addEventListener('keyup', this.create.bind(this));
      TOGGLE_ALL.addEventListener('change', this.toggleAll.bind(this));
			FOOTER.addEventListener('click', this.destroyCompleted.bind(this));
			TODO_LIST.addEventListener('change', this.toggle.bind(this));
			TODO_LIST.addEventListener('dblclick', this.edit.bind(this));
			TODO_LIST.addEventListener('keyup', this.editKeyup.bind(this));
			TODO_LIST.addEventListener('focusout', this.update.bind(this));
			TODO_LIST.addEventListener('click', this.destroy.bind(this));
			//DESTROY_BUTTON.addEventListener('click', this.destroy.bind(this));
		},
		render: function () {
			//$('#todo-list').html(this.todoTemplate(todos));
			//$('#main').toggle(todos.length > 0);
			//$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			//$('#new-todo').focus();
			var todos = this.getFilteredTodos();
			TODO_LIST.innerHTML = this.todoTemplate(todos);
			if (todos.length === 0){
				MAIN.style.display = 'none';
			} else {
				MAIN.style.display = 'block';
			}
			if (this.getActiveTodos().length === 0){
				TOGGLE_ALL.checked = true;
			} else {
				TOGGLE_ALL.checked = false;
			}
			this.renderFooter();
			NEW_TODO.focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			//$('#footer').toggle(todoCount > 0).html(template);
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});
			if (todoCount > 0){
				FOOTER.innerHTML = template;
				FOOTER.style.display = 'block';
			} else {
				FOOTER.style.display = 'none';
			}
		},
		toggleAll: function (e) {
			//var isChecked = $(e.target).prop('checked');
			var isChecked = e.target.checked;
			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function (e) {
			if(e.target.id === 'clear-completed'){
				this.todos = this.getActiveTodos();
				this.filter = 'all';
				this.render();
			}
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			//var id = $(el).closest('li').data('id');
			var id = el.closest('li').dataset.id;
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			//var $input = $(e.target);
			//$input.val('');
			var $input = e.target;
			var val = $input.value.trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			$input.value = '';

			this.render();
		},
		toggle: function (e) {
			if(e.target.className ==='toggle'){
				var i = this.indexFromEl(e.target);
				this.todos[i].completed = !this.todos[i].completed;
				this.render();
			}
		},
		edit: function (e) {
			if (e.target.localName === 'label'){
				var $input = $(e.target).closest('li').addClass('editing').find('.edit');
				$input.val($input.val()).focus();
			}
		},
		editKeyup: function (e) {
			if (e.target.className === 'edit'){
				if (e.which === ENTER_KEY) {
					e.target.blur();
				}

				if (e.which === ESCAPE_KEY) {
					$(e.target).data('abort', true).blur();
				}
			}
		},
		update: function (e) {
			if (e.target.className === 'edit'){
				var el = e.target;
				var $el = $(el);
				var val = $el.val().trim();

				if (!val && e.type === 'focusout') {
					this.destroy(e);
					return;
				}

				if ($el.data('abort')) {
					$el.data('abort', false);
				} else {
					this.todos[this.indexFromEl(el)].title = val;
				}

				this.render();
			}
		},
		destroy: function (e) {
			if (e.target.className === 'destroy' || e.type === 'focusout'){
				this.todos.splice(this.indexFromEl(e.target), 1);
				this.render();
			}
		}
	};

	App.init();
});
