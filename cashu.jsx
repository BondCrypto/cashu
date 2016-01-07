// Util
function merge(obj1, obj2) { return Object.assign(obj1, obj2) }
function sum(array) { return array.reduce((a, b) => a + b, 0); }
function yesterday() { return moment().subtract(1, 'day') }
function listOfNums(N) { return Array.apply(null, {length: N}).map(Number.call, Number) }

class ChartistGraph extends React.Component {

  displayName: 'ChartistGraph'

  componentWillReceiveProps(newProps) {
    this.updateChart(newProps);
  }

  componentWillUnmount() {
    if (this.chartist) {
      try {
        this.chartist.detach();
      } catch (err) {
        throw new Error('Internal chartist error', err);
      }
    }
  }

  componentDidMount() {
    this.updateChart(this.props);
  }

  updateChart(config) {
    let { type, data } = config;
    let options = config.options || {};
    let responsiveOptions = config.responsiveOptions || [];
    let event;

    if (this.chartist) {
      this.chartist.update(data, options, responsiveOptions);
    } else {
      this.chartist = new Chartist[type](ReactDOM.findDOMNode(this), data, options, responsiveOptions);

      if (config.listener) {
        for (event in config.listener) {
          if (config.listener.hasOwnProperty(event)) {
            this.chartist.on(event, config.listener[event]);
          }
        }
      }

    }

    return this.chartist;
  }

  render() {
    const className = this.props.className ? ' ' + this.props.className : ''
    const style = this.props.style ? this.props.style : {};
    return (<div className={'ct-chart' + className} style={style} />)
  }

}

ChartistGraph.propTypes = {
  type: React.PropTypes.string.isRequired,
  data: React.PropTypes.object.isRequired,
  className: React.PropTypes.string,
  options: React.PropTypes.object,
  responsiveOptions: React.PropTypes.array
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
		return <div>
			{this.props.name} {this.props.amount} every {this.props.howOftenReoccur.humanize()}
		</div>;
	}
}

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
	  		numDays: 50
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

	render() {
		let days = this.state.numDays;

		let closingBalanceOverPeriod = [];
		for(let i = 1; i < days+1; i++) {
			closingBalanceOverPeriod.push(this.getDisposableCash(moment().add(i, 'd')))
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
					data : closingBalanceOverPeriod
				}
			]
		}
		let chartOptions = {responsive: true};


		var simpleLineChartData = {
		  labels: listOfNums(days).map((v) => `${v}`),
		  series: [
		    closingBalanceOverPeriod,
		  ]
		}

		let breakeven = this.getBreakeven();
		var alert = breakeven < 0 ? "You are losing money!!!!!" : "You've got overall a positive cash flow. Good work";
		var money = Math.min(...this.cashflows);

	  	return <div className='ui container'>
	  		{alert}
	  		Your balance {money}

	  		Balance: <input type='number' onChange={this.updateState.bind(this, 'balance')} value={this.state.balance}/>
	  		Numdays: <input type='number' onChange={this.updateState.bind(this, 'numDays')} value={this.state.numDays}/>
	  		
	  		Add/remove regular flows
	  		-> for example, add a savings plan for your term deposit.
	  		-> or save for something.
	  		-> or just say, I'm budgeting this amount of money per week to having a coffe with a friend.

	  		{this.state.regularFlows.map((flow) => {
	  			return <CashflowView key={flow.name} {...flow}/>;
	  		})}

			{//<ChartistGraph data={simpleLineChartData} type={'Line'} />
		}

	  		<LineChart data={lineChartData} options={chartOptions} width={800} height={200}/>
	  	</div>;
	}
}

ReactDOM.render(
	<App saveStateOffline={false}/>,
	document.getElementById('app')
);