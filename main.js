
var Debt = Backbone.Model.extend({
	defaults: {
		name: '',
		createTime: 0,
		firstStageDate: 0,
		payMethod: '',
		APR: 0,
		total: 0,
		stageTotal: 0,
		stageInterval: 1,
		isCurrentStagePaid: false,
	},
	firstStageDateGetYear: function(){
		return parseInt(this.get('firstStageDate').substr(0, 4));
	},
	firstStageDateGetMonth: function(){
		return parseInt(this.get('firstStageDate').substr(5, 7));
	},
	firstStageDateGetDay: function(){
		return parseInt(this.get('firstStageDate').substr(8, 10));
	},
	calcPayMoney: function(date){
		var payMoneyPerMon = 0;
		if (this.get('payMethod') === 'equal_principal_interest'){
			var yearRate = this.get('APR')/100;
			var monRate = yearRate/12;
			var x = this.get('total')*monRate*Math.pow(1+monRate, this.get('stageTotal'));
			var y = Math.pow(1+monRate, this.get('stageTotal')) - 1;
			payMoneyPerMon = x/y;
			payMoneyPerMon = payMoneyPerMon.toFixed(2);
			    
			return payMoneyPerMon;
		} else if (this.get('payMethod') === 'equal_principal')
		{
		}

		return this.get('total');
	},
	calcStatePaid: function(date){
		var yearDiff = parseInt(date.getFullYear()) - this.firstStageDateGetYear();
		var monthDiff = parseInt(date.getMonth()) + 1 - this.firstStageDateGetMonth();
		var dayDiff = parseInt(date.getDate()) - this.firstStageDateGetDay();

		if (dayDiff < 0) {
			dayDiff = 0;
		} else {
			dayDiff = 1;
		}

		var stagePaid = yearDiff*12 + monthDiff + dayDiff;

		if (stagePaid < 0){
			stagePaid = 0;
		}

		return stagePaid;
	},
});

//collection
var Debts = Backbone.Collection.extend({
	model: Debt,
	localStorage: new Backbone.LocalStorage("Debt2"),
	comparator: function(m){
		return m.get('firstStageDate').substr(8);
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
		"focus #addViewInStageTotal"	:       "focusThenClearMsg",
		"focus #addViewInTotal"			:       "focusThenClearMsg",
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
			$('#addViewPMsg').html("日期格式不对");
			return false;
		}

		//debts
		var data = {
			name: $('#addViewInName').val(),
			createTime: Date(),
			firstStageDate: $('#addViewInFirstStageDate').val(),
			stageTotal: parseInt($('#addViewInStageTotal').val()),
			total: parseFloat($('#addViewInTotal').val()),
			payMethod: $("input[name='addViewInPayMethod']:checked").val(),
			APR: parseFloat($('#addViewInAPR').val()),
		};

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
		
		$('#addViewInFirstStageDate').next().addClass('red');
		$("#addViewInFirstStageDate").data('valid', false);

		if (!regex.test(firstStageDate)){		
			return;
		}

		var year = parseInt(firstStageDate.substr(0,4));
		if (year < 1979){
			$('#addViewPFirstSateDateMsg').html("年不合法");
			return;
		} else {
			$('#addViewPFirstSateDateMsg').html('');
		}


		$('#addViewInFirstStageDate').next().removeClass('red');
		$("#addViewInFirstStageDate").data('valid', true);

	},
	focusThenClearMsg: function(){
		$('#addViewPMsg').html("");
	},
	switchToAddView: function(model){
		showView.$el.hide();
		this.$el.show();

		if (model) {
			$('#addViewInName').val(model.get('name'));
			$('#addViewInTotal').val(model.get('total'));
			$('#addViewInStageTotal').val(model.get('stageTotal'));
			$('#addViewInFirstStageDate').val(model.get('firstStageDate'));
			$('#addViewInAPR').val(model.get('APR'));
			for (var i=0; i<2; i++){
				if ($("input[name='addViewInPayMethod']").eq(i).attr('value') === model.get('payMethod')){
					$("input[name='addViewInPayMethod']").eq(i).attr('checked', 'checked');
				}
			}

			$('#addViewBtnSubmit').html('保存');
			$("#addViewBtnSubmit").data('id', model.id);
		} else {
			$('#addViewInName').val('');
			$('#addViewInTotal').val('');
			$('#addViewInStageTotal').val('');
			$('#addViewInFirstStageDate').val('');
			$('#addViewInAPR').val('');

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

	destroy: function(){
		this.model.destroy();
	},
	render: function(){
		var thisStageHasPaid = false;
		var debt = {};
		var now = new Date();
		var fisrtPayDay = new Date();
		fisrtPayDay.setFullYear(this.model.firstStageDateGetYear());
		fisrtPayDay.setMonth(this.model.firstStageDateGetMonth() - 1);
		fisrtPayDay.setDate(1);
		fisrtPayDay.setHours(0,0,0,0);

		debt.name = this.model.get('name');
		if (fisrtPayDay < now){
			debt.day = (now.getMonth()+1)+'/'+this.model.firstStageDateGetDay();
			if (now.getDate() > this.model.firstStageDateGetDay()){
				thisStageHasPaid = true;
			}
		} else {
			debt.day = this.model.firstStageDateGetMonth()+'/'+this.model.firstStageDateGetDay();
		}
		
		debt.firstStageDate = this.model.get('firstStageDate');
		debt.money = this.model.calcPayMoney(now);
		debt.stagePaid = this.model.calcStatePaid(now);
		debt.stageTotal = this.model.get('stageTotal');

		if (debt.stagePaid > debt.stageTotal){
			return null;
		}

		this.$el.html(this.template(debt));
		if (thisStageHasPaid){
			this.$el.addClass('green');
		}
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
		this.listenTo(debts, "add", this.renderCollection);
		this.listenTo(debts, "remove", this.renderCollection);

		debts.fetch({reset: true});
	},

	renderCollection: function(){
		if (debts.length === 0) return;

		var total = 0;

		var t = $("<p></p>");
		var t_future = $("<p></p>");

		$('#showViewList').empty();

		debts.each(function(d){
			var now = new Date();
			var fisrtPayDay = new Date();
			fisrtPayDay.setFullYear(d.firstStageDateGetYear());
			fisrtPayDay.setMonth(d.firstStageDateGetMonth() - 1);
			fisrtPayDay.setDate(1);
			fisrtPayDay.setHours(0,0,0,0);

			var view = new DebtView({model: d});

			if (fisrtPayDay < now){
				if (view.render()){
					t.append(view.render().el);	
					total += parseFloat(d.calcPayMoney());
				}
			} else {
				t_future.append(view.render().el);
			}		
		});

		$('#showViewList').append(t.children());
		$('#showViewList').append(t_future.children());
		$('#showViewTotal').html(total);
	},
});

var addView = new AddView();
var showView = new ShowView();





