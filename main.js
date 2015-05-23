//backbone app

//model
var Stage = Backbone.Model.extend({
	defaults: {
		money: 0,
		payDay: 0
	}
});

var Util = {
	calcStageLeft: function(firstStageDate, stageNum){
		var now = new Date();
		var firstStageDateYear = parseInt(firstStageDate.substr(0, 4));
		var firstStageDateMonth = parseInt(firstStageDate.substr(5, 2));
		var firstStageDateDay = firstStageDate.substr(8, 2);
		var deltaMonth = (now.getFullYear() - firstStageDateYear)*12 +
						 (now.getMonth() + 1) - firstStageDateMonth;						 

		if (deltaMonth < 0) deltaMonth = 0;

		var stageLeft = stageNum - deltaMonth;
		if (stageLeft < 0) stageLeft = 0;

		return stageLeft;
	},
};

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
		stageIsPaid: [],
		firstStageDate: 0,
		payMoney: 0,
		remindDaysBeforePayDay: 3,

	},
	calcStageLeft: function(){
		return Util.calcStageLeft(this.attributes.firstStageDate, 
								  this.attributes.stageNum);
	},
});

//collection
var Debts = Backbone.Collection.extend({
	model: Debt,
	localStorage: new Backbone.LocalStorage("Debt"),
	comparator: function(m){
		return m.get('firstStageDate').substr(5);
	},
});

debts = new Debts();

var AddView = Backbone.View.extend({
	el:$('#addView'),
	events: {
		"submit #addViewForm"			: 		"submit",
		"keyup #addViewInFirstStageDate":   	"keyupInFirstStageDate",
		"blur #addViewInFirstStageDate" : 		"keyupInFirstStageDate",
		"focus #addViewInName"			:       "focusThenClearMsg",
		"focus #addViewInFirstStageDate":       "focusThenClearMsg",
		"focus #addViewInStageNum"		:       "focusThenClearMsg",
		"focus #addViewInPayMoney"		:       "focusThenClearMsg",
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
		if (false === $('#addViewInFirstStageDate').data('valid')){
			$('#addViewPMsg').html("ri qi ge shi bu dui");
			return false;
		}

		//debts
		var data = {
			name: $('#addViewInName').val(),
			createTime: Date(),
			firstStageDate: $('#addViewInFirstStageDate').val(),
			stageNum: parseInt($('#addViewInStageNum').val()),
			payMoney: parseFloat($('#addViewInPayMoney').val()),
		};

		var stageLeft = Util.calcStageLeft(data.firstStageDate, data.stageNum);
		if (stageLeft <= 0){
			$('#addViewPMsg').html("Have already paided!");
			return false;
		}

		data.stageIsPaid = new Array(parseInt(data.stageNum));
		data.stageLeft = stageLeft;
		data.stagePaid = data.stageNum - stageLeft;

		var id = $("#addViewBtnSubmit").data('id');

		if (id){
			debts.get(id).save(data, {wait: true});
		} else {
			debts.create(data, {wait: true});
		}
		showView.$el.show();
		this.$el.hide();

		return false;
	},
	keyupInFirstStageDate: function(){
		var firstStageDate = $('#addViewInFirstStageDate').val();
		var regex = /^\d{4}-\d{2}-\d{2}/;		
		
		if (regex.test(firstStageDate)){
			$('#addViewInFirstStageDate').next().removeClass('red');
			$("#addViewInFirstStageDate").data('valid', true);
		} else {
			$('#addViewInFirstStageDate').next().addClass('red');
			$("#addViewInFirstStageDate").data('valid', false);
		}
	},
	focusThenClearMsg: function(){
		$('#addViewPMsg').html("");
	},
	switchToAddView: function(model){
		showView.$el.hide();
		this.$el.show();

		if (model) {
			$('#addViewInName').val(model.get('name'));
			$('#addViewInStageNum').val(model.get('stageNum'));
			$('#addViewInFirstStageDate').val(model.get('firstStageDate'));
			$('#addViewInPayMoney').val(model.get('payMoney'));

			$('#addViewBtnSubmit').html('保存');
			$("#addViewBtnSubmit").data('id', model.id);
		} else {
			$('#addViewInName').val('');
			$('#addViewInStageNum').val('');
			$('#addViewInFirstStageDate').val('');
			$('#addViewInPayMoney').val('');

			$('#addViewBtnSubmit').html('创建');
			$("#addViewBtnSubmit").data('id', '');
		}
	},
});

var DebtView = Backbone.View.extend({
	tagName: "tr",
	template: _.template($('#debt-template').html()),

	events: {
		"click button": 	"destroy",
		"click input":      "clickRadio",
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
		//debt.createTime = this.dateFormat(debt.createTime);
		this.$el.html(this.template(debt));
		return this;
	},
	clickRadio: function(){
		var v = this.$("input:radio:checked").val();
		var stageIsPaid = this.model.get('stageIsPaid');
		var stageLeft = this.model.get('stageLeft');

		if (stageIsPaid[this.model.get('stagePaid')] == 'true' && v == 'true'){
			return;
		}

		if (stageIsPaid[this.model.get('stagePaid')] == 'false' && v == 'false'){
			return;
		}

		if (!stageIsPaid[this.model.get('stagePaid')] && v == 'false'){
			return;
		}


		stageIsPaid[this.model.get('stagePaid')] = v;

		if (v == 'true'){
			stageLeft -= 1;
		} else {
			stageLeft += 1;
		}

		this.model.set('stageLeft', stageLeft);
		this.model.set('stageIsPaid', stageIsPaid);
		this.model.save();

		showView.renderCollection();
	}
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
		this.listenTo(debts, "add", this.renderCollection);
		this.listenTo(debts, "remove", this.renderCollection);

		debts.fetch({reset: true});
	},

	renderCollection: function(){
		if (debts.length === 0) return;

		var total = 0;

		var t = $("<p></p>");
		var tPaided = $("<p></p>");

		$('#showViewList').empty();
		$('#showViewPaidedList').empty();

		debts.each(function(d){
			var calcLeft = Util.calcStageLeft(d.get('firstStageDate'), d.get('stageNum'));
			
			d.set('stagePaid', d.get('stageNum') - calcLeft);
			d.save();

			var view = new DebtView({model: d});

			if ('true' == d.get('stageIsPaid')[d.get('stageNum') - calcLeft]){				
				tPaided.append(view.render().el);
			} else {
				if (!d.get('stageLeft')) return;
				t.append(view.render().el);	
			}

			total += d.get('payMoney');
		});

		$('#showViewList').append(t.children());
		$('#showViewPaidedList').append(tPaided.children());
		$('#showViewTotal').html(total);
	},
});

var addView = new AddView();
var showView = new ShowView();





