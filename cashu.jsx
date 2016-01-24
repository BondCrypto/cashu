// Util
function merge(obj1, obj2) { return Object.assign(obj1, obj2) }
function sum(array) { return array.reduce((a, b) => a + b, 0); }
function yesterday() { return moment().subtract(1, 'day') }
function listOfNums(N) { return Array.apply(null, {length: N}).map(Number.call, Number) }
function linkState(propName, ev) {
	let newState = {};
	newState[propName] = ev.target.value;
	this.setState(newState);
}


// Classes
class Cashflow {
	constructor(name, amount, howOftenReoccur, startDate, endDate) {
		this.name = name
		this.amount = amount
		this.howOftenReoccur = howOftenReoccur
		this.startDate = startDate
		this.endDate = endDate
	}

	getOneOffFlowsForDate(untilDate) {
		if(this.startDate.isAfter(untilDate)) return [];
		let flows = [];

		var nextDateForThisCashflow = moment(this.startDate).add(this.howOftenReoccur);

		// BUG: should be before or equal to with respect to the end date
		var minDateToCheckBefore = moment.min(this.endDate, untilDate);
		var today = moment();
		let MAX_ITERATIONS = 10000;
		let i = 0;
		while(nextDateForThisCashflow.isBefore(minDateToCheckBefore) && i < MAX_ITERATIONS) {
			i++;
			if(i > 1000) {
				debugger
			}

			if(nextDateForThisCashflow.isAfter(today)) {
				flows.push(new OneoffCashflow(this.name, this.amount, nextDateForThisCashflow))
			}

			nextDateForThisCashflow = moment(nextDateForThisCashflow).add(this.howOftenReoccur);
		}
		
		return flows;
	}

	toString() {
		return this.name + ' ' + this.startDate;
	}
}

class OneoffCashflow {
	constructor(desc, amount, date) {
		this.desc = desc
		this.amount = amount
		this.date = date
	}

	toString() {
		return this.desc + ' $'+this.amount + ' ' + this.date
	}
}


var datetime = {
	date: function(){},
	timedelta: function(){}
}

function TimeDelta(expr) {
	let expr_bits = expr.split(' ')
	return moment.duration(+expr_bits[0], expr_bits[1])
}

function Datetime(expr) {
	return moment(expr, 'DD/MM/YYYY')
}

function humanizeDuration(dur) {
	var x = dur.humanize()
	if(x === 'a day') return '1 day';
	return x;
}

// Hacks
window['Chartjs'] = Chart;
var LineChart = window['react-chartjs'].Line;


// UI
class CashflowView extends React.Component {
	render() {
		return <tr>
			<td>
			  <div className="ui small basic icon buttons">
			  <button className="ui button" onClick={this.props.deleteCashflow}><i className="delete icon"></i></button>
			  <button className="ui button" onClick={this.props.editCashflow}><i className="edit icon"></i></button>
			  </div>
			</td>
			<td>{this.props.name}</td>
			<td>${this.props.amount.toFixed(2)}</td>
			<td>{humanizeDuration(this.props.howOftenReoccur)}</td>
			<td>{this.props.startDate.format('DD/MM/YY')} - {this.props.endDate.format('DD/MM/YY')}</td>
		</tr>;
	}
}

class Notice extends React.Component {
	render() {
		return <div className={"ui message attached "+this.props.class}>
		  <i className="close icon"></i>
		  <div className="header">
		    {this.props.header}
		  </div>
		  <p>{this.props.msg}
		</p></div>
	}
}

class AddNewCashflowForm extends React.Component {
	constructor(props) {
		super(props)
		this.linkState = linkState
		this.state = merge({}, this.props.editingCashflow)
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.editingCashflow != null) {
			this.setState({
				name: nextProps.editingCashflow.name,
				amount: nextProps.editingCashflow.amount,
				howOftenReoccur: humanizeDuration(nextProps.editingCashflow.howOftenReoccur),
				startDate: nextProps.editingCashflow.startDate.format('YYYY-MM-DD'),
				endDate: nextProps.editingCashflow.endDate.format('YYYY-MM-DD'),
			})
		} else {
			this.resetForm()
		}
	}

	resetForm() {
		this.setState({
			name: null,
			amount: 102.2,
			howOftenReoccur: '14 days',
			startDate: moment().format('YYYY-MM-DD'),
			endDate: moment().format('YYYY-MM-DD'),
		})
	}

	save() {
		let cashflow = new Cashflow(this.state.name, +this.state.amount, new TimeDelta(this.state.howOftenReoccur), moment(this.state.startDate), moment(this.state.endDate))
		this.resetForm()
		this.props.saveCashflow(cashflow)
	}

	render() {
		return <div className="ui form">
		  <div className="inline field">
		    <label>Name</label>
		    <input type="text" placeholder="Cafe job" value={this.state.name} onChange={this.linkState.bind(this, 'name')}/>
		  </div>
		  <div className="inline field">
		    <label>$</label>
		    <input type="number" value={this.state.amount} onChange={this.linkState.bind(this, 'amount')}/>
		  </div>
		  <div className="inline field">
		    <label>Every</label>
		    <input type="text" placeholder="2 days" value={this.state.howOftenReoccur} onChange={this.linkState.bind(this, 'howOftenReoccur')}/>
		  </div>
		  <div className="field">
		    <label>First date</label>
		    <input type="date" value={this.state.startDate} onChange={this.linkState.bind(this, 'startDate')}/>
		  </div>
		  <div className="field">
		    <label>Last date</label>
		    <input type="date" value={this.state.endDate} onChange={this.linkState.bind(this, 'endDate')}/>
		  </div>
		  <button className='ui button small' onClick={this.save.bind(this)}>save</button>
		</div>;
	}
}

Chart.defaults.global.responsive = true;

class App extends React.Component {
	constructor(props) {
		super(props);
		this.linkState = linkState
		this.state = {
	  		regularFlows: [
	  			new Cashflow('BIT Scholarship', +576.92, TimeDelta('14 days'), new Datetime('30/12/2015'), new Datetime('12/12/2017')),
				new Cashflow('Rent', -246*2, TimeDelta('14 days'), new Datetime('21/12/2015'), new Datetime('06/12/2016')),
				new Cashflow('Centrelink', +566.86, TimeDelta('14 days'), new Datetime('24/12/2015'), new Datetime('01/06/2016')),
				new Cashflow('Living expenses', -246*2/14, TimeDelta('1 day'), new Datetime('12/12/2015'), new Datetime('6/12/2017'))
	  		],
	  		futureOneoffFlows: [],
	  		balance: 5206.30 + 779.78,
	  		numDays: 30,
	  		currentlyEditingCashflowKey: null
	  	};
	  	this.cachedDisposableCash = [];
	}

	getDisposableCash(atDate) {
		return this.state.balance + sum(this.getCashflows(atDate).map((flow) => flow.amount));
	}

	getCashflows(atDate) {
		let cashflows = []
		cashflows.push(...this.state.futureOneoffFlows)
		for(let cashflow of this.state.regularFlows) {
			cashflows.push(...cashflow.getOneOffFlowsForDate(atDate))
		}
		return cashflows
	}

	getBreakeven() {
		let normalisedFlows = []

		for(let flow of this.state.regularFlows) {
			// BUG TODO: this only normalises based on days
			let normalisedFlow = flow.amount / flow.howOftenReoccur._days;
			normalisedFlows.push(normalisedFlow);
		}
		
		return sum(normalisedFlows)
	}

	componentDidMount() {
		// let self = this;

		// if(this.props.saveStateOffline) {
		// 		localforage.getItem('appState', (err, localStorageState) => {
		// 		if(err) {
		// 			console.error("Couldn't retrieve state from local storage");
		// 			console.error(err);
		// 		} else {
		// 			self.setState(merge(this.state, localStorageState));
		// 		}
		//   	});
		// }
	}

	componentDidUpdate(prevProps, prevState) {
		// if(this.props.saveStateOffline) {
		// 	localforage.setItem('appState', this.state, (err, result) => {
		// 		if(err) {
		// 			console.error("Couldn't store state to local storage");
		// 			console.error(err);
		// 		}
		// 	});
		// }
	}

 	deleteCashflow(index) {
 		let flows = this.state.regularFlows;
 		flows.splice(index, 1);
 		var newEditingKey = this.state.currentlyEditingCashflowKey;
 		if(index === this.state.currentlyEditingCashflowKey) {
 			newEditingKey = null;
 		} else if(index < this.state.currentlyEditingCashflowKey) {
 			newEditingKey--;
 		}
 		this.setState({ regularFlows: flows, currentlyEditingCashflowKey: newEditingKey })
 	}

 	saveCashflow(cashflow) {
 		var flows = this.state.regularFlows;
 		if(this.state.currentlyEditingCashflowKey != null) {
 			flows[this.state.currentlyEditingCashflowKey] = cashflow
 		} else {
 			flows.push(cashflow)
 		}
 		debugger
 		this.setState({ regularFlows: flows, currentlyEditingCashflowKey: null })
 	}

 	editCashflow(i) {
 		this.setState({ currentlyEditingCashflowKey: i })
 	}

 	addCashflow() {
 		this.setState({ currentlyEditingCashflowKey: null })
 	}

	render() {
		let days = this.state.numDays;
		var maxPeriod = 30;
		let closingBalanceOverPeriod = new Array()
		for(let day = 1; day < maxPeriod+1; day++) {
			closingBalanceOverPeriod.push(this.getDisposableCash(moment().add(day, 'd')))
		}

		let lineChartData = {
			labels : listOfNums(days).map((v) => `${v}`),
			datasets : [
				{
					label: "Finances",
					fillColor : "rgba(220,220,220,0.2)",
					strokeColor : "rgba(220,220,220,1)",
					pointColor : "rgba(220,220,220,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(220,220,220,1)",
					data : closingBalanceOverPeriod.slice(0, days+1)
				}
			]
		}
		let chartOptions = {responsive: true};


		let breakeven = this.getBreakeven();
		var alert = breakeven < 0 ? <Notice msg="You are losing money!!!!!"/> : <Notice header="Good work" msg="You've got overall a positive cash flow. Nice." type="green"/>;
		var money = Math.min(...closingBalanceOverPeriod);

		var currentlyEditingCashflow = this.state.regularFlows[this.state.currentlyEditingCashflowKey];
	  	return <div className='ui container'>

	  		<h1>Cash<span style={{ color: 'blue' }}>u</span></h1>



<div className="ui two column grid container">


<div className="two column row">
<div className="column">

{alert}
	<section className="ui segment attached">
		<p>Your disposable balance: <strong>${money.toFixed(2)}</strong>, cash flow {breakeven < 0 ? 'negative' : 'positive'} by <strong>${breakeven<0?'':'+'}{breakeven.toFixed(2)}/day</strong> </p>


		<h3>Cashflows</h3> <button className='ui button small' onClick={this.addCashflow.bind(this)}>add new</button>


		<table className="ui very basic collapsing celled table">
		  <thead>
		    <tr>

		    <th></th>
		    <th>Name</th>
		    <th>Amount</th>
		    <th>How often</th>
		    <th>Start & End</th>

		  </tr></thead>
		  <tbody>
		  	{this.state.regularFlows.map((flow, i) => {
			  return <CashflowView key={i} {...flow} deleteCashflow={this.deleteCashflow.bind(this, i)} editCashflow={this.editCashflow.bind(this, i)}/>;
			})}
		  </tbody>
		</table>
	</section>



    <section className='ui segment'>
		<h3 className='ui header'>Add/Edit cashflow</h3>

		<AddNewCashflowForm saveCashflow={this.saveCashflow.bind(this)} editingCashflow={currentlyEditingCashflow}/>
    </section>

</div>
</div>

<div className="two column">
	<section className="ui segment">

	<p>How much do you currently have in total? <input type='number' onChange={this.linkState.bind(this, 'balance')} value={this.state.balance}/></p>
	<p>Numdays: <input type='number' onChange={this.linkState.bind(this, 'numDays')} value={this.state.numDays}/></p>
	<LineChart className="item" data={lineChartData} options={chartOptions}/>


	</section>
</div>




		</div>


	  </div>;
	}
}

ReactDOM.render(
	<App saveStateOffline={true}/>,
	document.getElementById('app')
);