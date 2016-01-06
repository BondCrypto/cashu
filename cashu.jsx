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
		while(nextDateForThisCashflow.isBefore(this.endDate) && 
				nextDateForThisCashflow.isBefore(untilDate)) {

			// console.log(`${this.name} - ${nextDateForThisCashflow._d}`)
			if(nextDateForThisCashflow.isAfter(moment())) {
				flows.push(new OneoffCashflow(this.name, this.amount, moment(nextDateForThisCashflow)))
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


// UI
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
	  		balance: 5206.30 + 779.78
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
			console.log(flow.howOftenReoccur)
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
 
	render() {
		var days = 50;
		console.log(this.getDisposableCash(moment().add(50, 'd')))
		console.log(this.getDisposableCash(moment().add(50, 'd')))
		console.log(this.getDisposableCash(moment().add(50, 'd')))
		var disposable = this.getDisposableCash(moment().add(days, 'd'));
		let breakeven = this.getBreakeven();

		var disposableOverDays = [];
		for(let i = 1; i < days+1; i++) {
			disposableOverDays.push(this.getDisposableCash(moment().add(i, 'd')))
		}

		var lineChartData = {
			labels : listOfNums(days).map((v) => `${v}`),
			datasets : [
				{
					label: "My First dataset",
					fillColor : "rgba(220,220,220,0.2)",
					strokeColor : "rgba(220,220,220,1)",
					pointColor : "rgba(220,220,220,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(220,220,220,1)",
					data : disposableOverDays
				}
			]
		}
		var chartOptions = {responsive: true};

	  	return <div>
	  		Disposable: {disposable}, Breakeven: {breakeven}
	  		<button onClick={this.do}>Apply</button>
	  		<LineChart data={lineChartData} options={chartOptions} width="600" height="250"/>
	  	</div>;
	}
}

ReactDOM.render(
	<App saveStateOffline={false}/>,
	document.getElementById('app')
);