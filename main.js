//backbone app

//model
var Stage = Backbone.Model.extend({	
	defaults: {
		money: 0,
		payDay: 0
	}
});

var Debt = Backbone.Model.extend({	
	defaults: {
		name: '',
		createTime: 0,
		total: 0,
		capital: 0,
		interest: 0,
		paid: 0,
		left: 0,
		stageNum: 0,
		stagePaid: 0,
		stageLeft: 0,
		payDay: 0,
		payMoney: 0,
		remindDaysBeforePayDay: 3
	},
});

//collection
var Debts = Backbone.Collection.extend({
	model: Debt,
	localStorage: new Backbone.LocalStorage("Debt"),
});

debts = new Debts();

var AddView = Backbone.View.extend({
	el:$('#addView'),
	events: {
		"submit #addViewForm": 		"submit",
		"click #addViewBtnBack":    function(){
			this.$el.hide();
			showView.$el.show();
		},
	},
	initialize: function() {
		
		
	},
	render: function() {
		debts.each(function(d){
			console.log(d);
		});		
	},
	submit: function(){
		//debts
		var data = {
			name: $('#addViewInName').val(),
			createTime: Date(),
			payDay: $('#addViewInPayDay').val(),
			payMoney: $('#addViewInPayMoney').val(),
		};

		var id = $("#addViewBtnSubmit").data('id');
		
		if (id){
			debts.get(id).save(data);
		} else {
			debts.create(data);		
		}
		showView.$el.show();
		this.$el.hide();

		return false;
	},
	switchToAddView: function(model){
		showView.$el.hide();
		this.$el.show();

		if (model) {
			$('#addViewInName').val(model.get('name'));
			$('#addViewInStageNum').val(model.get('stageNum'));	
			$('#addViewInStagePaid').val(model.get('stagePaid'));			
			$('#addViewInPayDay').val(model.get('payDay'));
			$('#addViewInPayMoney').val(model.get('payMoney'));

			$('#addViewBtnSubmit').html('Save');
			$("#addViewBtnSubmit").data('id', model.id);
		} else {
			$('#addViewInName').val('');
			$('#addViewInStageNum').val('');	
			$('#addViewInStagePaid').val('');		
			$('#addViewInPayDay').val('');
			$('#addViewInPayMoney').val('');

			$('#addViewBtnSubmit').html('Add');
			$("#addViewBtnSubmit").data('id', '');	
		}		
	},
});

var DebtView = Backbone.View.extend({
	//tagName: "tr",
	template: _.template($('#debt-template').html()),

	events: {
		"click button": 	"destroy",
		"dblclick": 		function(){
			addView.switchToAddView(this.model);
		},
	},

	initialize: function(){
		this.listenTo(this.model, 'destroy', 	this.remove);
		this.listenTo(this.model, 'change', 	this.render);
	},

	dateFormat: function(date){
		var d = new Date(date);
		var y = d.getFullYear();
		var m = d.getMonth() + 1;
		var day = d.getDate();
		var hh = d.getHours();
		var mm = d.getMinutes();
		var ss = d.getSeconds();
		var week = ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'];
		var w = d.getDay();
		if (mm<10) mm = '0' + mm;
		if (ss<10) ss = '0' + ss;
		return y+'-'+m+'-'+day+', '+week[w]+' '+hh+':'+mm+':'+ss;
	},
	destroy: function(){
		this.model.destroy();
	},
	render: function(){
		var debt = this.model.toJSON();
		debt.createTime = this.dateFormat(debt.createTime);
		this.$el.html(this.template(debt));
		return this;
	},
});

var ShowView = Backbone.View.extend({
	el:$('#showView'),
	
	events: {		
		"click button":    function(){
			addView.switchToAddView();
		},		
	},
	initialize: function() {
		this.listenTo(debts, "reset", this.renderCollection);
		this.listenTo(debts, "add", this.renderModel);

		debts.fetch({reset: true});
	},
	renderModel: function(d){
		var view = new DebtView({model: d});
		$('#showViewList').prepend(view.render().el);
	},
	renderCollection: function(){		
		//this.$el.empty();		
		if (debts.length === 0) return;

		var t = $("<p></p>");

		debts.each(function(d){
			var view = new DebtView({model: d});
			t.append(view.render().el);
		});

		$('#showViewList').append(t.children());
	},
});

var addView = new AddView();
var showView = new ShowView();





