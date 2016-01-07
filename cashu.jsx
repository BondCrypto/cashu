// Util
function merge(obj1, obj2) { return Object.assign(obj1, obj2) }
function sum(array) { return array.reduce((a, b) => a + b, 0); }
function yesterday() { return moment().subtract(1, 'day') }
function listOfNums(N) { return Array.apply(null, {length: N}).map(Number.call, Number) }


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
		while(nextDateForThisCashflow.isBefore(minDateToCheckBefore)) {
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

// Hacks
window['Chartjs'] = Chart;
var LineChart = window['react-chartjs'].Line;
var linkState = React.addons.LinkedStateMixin.linkState;


// UI
class CashflowView extends React.Component {
	render() {
		return <tr>
			<td><small onClick={this.props.deleteCashflow}>del</small> <small>edit</small></td>
			<td>{this.props.name}</td>
			<td>${this.props.amount.toFixed(2)}</td>
			<td>{this.props.howOftenReoccur.humanize()}</td>
			<td>{this.props.startDate.format('DD/MM/YY')} - {this.props.endDate.format('DD/MM/YY')}</td>
		</tr>;
	}
}

class CashflowEdit extends React.Component {
	render() {
		return <div></div>;
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

Chart.defaults.global.responsive = true;

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
	  		regularFlows: [
	  			new Cashflow('BIT Scholarship', +576.92, TimeDelta('14 days'), new Datetime('30/12/2015'), new Datetime('12/12/2017')),
				new Cashflow('Rent', -246*2, TimeDelta('14 days'), new Datetime('21/12/2015'), new Datetime('06/12/2016')),
				new Cashflow('Centrelink', +566.86, TimeDelta('14 days'), new Datetime('24/12/2015'), new Datetime('01/06/2016')),
				new Cashflow('Living expenses', -246*2/14, TimeDelta('1 day'), new Datetime('12/12/2015'), new Datetime('6/12/2017'))
	  		],
	  		futureOneoffFlows: [],
	  		balance: 5206.30 + 779.78,
	  		numDays: 30
	  	};

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
		this.cashflows = cashflows;

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
		let self = this;

		if(this.props.saveStateOffline) {
				localforage.getItem('appState', (err, localStorageState) => {
				if(err) {
					console.error("Couldn't retrieve state from local storage");
					console.error(err);
				} else {
					self.setState(merge(this.state, localStorageState));
				}
		  	});
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if(this.props.saveStateOffline) {
			localforage.setItem('appState', this.state, (err, result) => {
				if(err) {
					console.error("Couldn't store state to local storage");
					console.error(err);
				}
			});
		}
	}
 	
 	updateState(propName, ev) {
 		let newState = {};
 		newState[propName] = ev.target.value;
		this.setState(newState);
 	}

 	deleteCashflow(index) {
 		let flows = this.state.regularFlows;
 		flows.splice(index, 1);
 		this.setState({ regularFlows: flows })
 	}

	render() {
		let days = this.state.numDays;
		var maxPeriod = 100;
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


	  	return <div className='ui container'>

	  		<h1>Cash<span style={{ color: 'blue' }}>u</span></h1>

			<div className="ui two column stackable grid container">

 
			  <div className="column">
			    <div className="ui segment">

	  		<p>How much do you currently have in total? <input type='number' onChange={this.updateState.bind(this, 'balance')} value={this.state.balance}/></p>
	  		<p>Numdays: <input type='number' onChange={this.updateState.bind(this, 'numDays')} value={this.state.numDays}/></p>
	  		<LineChart className="item" data={lineChartData} options={chartOptions}/>


			    </div>
			  </div>

			  <div className="column">

			  {alert}
			    <div className="ui segment attached">

	  		<p>Your disposable balance: <strong>${money.toFixed(2)}</strong>, cash flow {breakeven < 0 ? 'negative' : 'positive'} by <strong>${breakeven<0?'':'+'}{breakeven.toFixed(2)}/day</strong> </p>


<h3>Cashflows</h3> <button className='ui button small' onClick={this.addCashflow}>add new</button>


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
	  return <CashflowView key={i} {...flow} deleteCashflow={this.deleteCashflow.bind(this, i)}/>;
	})}
  </tbody>
</table>

	  		

			    </div>

			    <div className='ui segment'>



<h3 className='ui header'>Add new cashflow</h3>
<form className="ui form">
  <div className="field">
    <label>Name</label>
    <input type="text" placeholder="Cafe job"/>
  </div>
  <div className="inline field">
    <label>$</label>
    <input type="number" placeholder="120.2"/>
  </div>
  <div className="inline field">
    <label>Every</label>
    <input type="text" placeholder="2 days"/>
  </div>
  <div className="field">
    <label>First date</label>
    <input type="date"/>
  </div>
  <div className="field">
    <label>Last date</label>
    <input type="date"/>
  </div>
  <button className='ui button small'>save</button>
</form>

			    </div>
			  </div>

			</div>


	  	</div>;
	}
}

ReactDOM.render(
	<App saveStateOffline={false}/>,
	document.getElementById('app')
);