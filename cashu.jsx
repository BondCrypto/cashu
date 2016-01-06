// Util
function merge(obj1, obj2) { return Object.assign(obj1, obj2) }
function sum(array) { return array.reduce((a, b) => a + b, 0); }


// Classes
class Cashflow {
	constructor(name, amount, howOftenReoccur, startDate, endDate) {
		this.name = name
		this.amount = amount
		this.howOftenReoccur = howOftenReoccur
		this.startDate = startDate
		this.endDate = endDate
	}

	getOneOffFlowsForDate(date) {
		return [new OneoffCashflow('', 200, new Datetime('12/02/2015'))]

			// 		if cashflow.startDate > untilDate:
			// 	continue

			// nextDateForThisCashflow = cashflow.startDate + cashflow.howOftenReoccur
			
			// while nextDateForThisCashflow <= untilDate:
			// 	if nextDateForThisCashflow > date.today():
			// 		cashflows.append(OneoffCashflow(cashflow.name, cashflow.amount, nextDateForThisCashflow))
			// 	nextDateForThisCashflow += cashflow.howOftenReoccur
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

class TimeDelta {
	constructor(expr) {
		let expr_bits = expr.split(' ')
		this.timedelta = moment.duration(expr_bits[0], expr_bits[1])
	}
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
	  			new Cashflow('BIT Scholarship', +576.92, new TimeDelta('2 days'), new Datetime('30/12/2015'), datetime.date(2017, 12, 12)),
				new Cashflow('Rent', -246*2, new TimeDelta('14 days'), new Datetime('21/12/2015'), new Datetime('06/12/2016')),
				new Cashflow('Centrelink', +566.86, new TimeDelta('14 days'), new Datetime('24/12/2015'), new Datetime('01/06/2015')),
				new Cashflow('Living expenses', -246*2 /14, new TimeDelta('1 day'), new Datetime('12/12/2015'), new Datetime('6/12/2017'))
	  		],
	  		futureOneoffFlows: [],
	  		balance: 5206.30 + 779.78
	  	};
	}

	getDisposableCash(atDate) {
		return this.state.balance + sum(this.getCashflows(atDate).map((flow) => flow.amount))
	}

	getCashflows(atDate) {
		let cashflows = []
		cashflows.push(...this.state.futureOneoffFlows)
		for(let cashflow of this.state.regularFlows) {
			cashflows.push(...cashflow.getOneOffFlowsForDate(atDate))
		}

		return cashflows
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
		var lineChartData = {
			labels : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'],
			datasets : [
				{
					label: "My First dataset",
					fillColor : "rgba(220,220,220,0.2)",
					strokeColor : "rgba(220,220,220,1)",
					pointColor : "rgba(220,220,220,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(220,220,220,1)",
					data : '5986.08,6517.797142857143,6482.654285714286,6447.511428571428,6412.368571428571,6377.225714285714,6342.082857142857,6883.860000000001,6848.717142857143,6813.574285714286,6778.431428571429,6743.288571428571,6216.145714285714,6181.002857142857,6145.86,6677.577142857143,6642.434285714286,6607.291428571429,6572.148571428572,6537.005714285715,6501.862857142858,7043.64,7008.497142857143,6973.354285714287,6938.211428571429,6903.068571428572,6375.925714285715,6340.782857142857,6305.64,6837.357142857144,6802.214285714286,6767.071428571429,6731.9285714285725,6696.785714285716,6661.642857142859,7203.419999999998,7168.277142857141,7133.1342857142845,7097.991428571428,7062.848571428571,6535.705714285716,6500.562857142858,6465.420000000001,6997.137142857141,6961.994285714284,6926.851428571426,6891.7085714285695,6856.565714285713,6821.422857142856,7363.199999999995,7328.057142857138,7292.9142857142815,7257.771428571424,7222.628571428567,6695.485714285713,6660.342857142856,6625.199999999998,7156.917142857137,7121.77428571428,7086.631428571423,7051.4885714285665,7016.345714285709,6981.202857142852,7522.979999999991,7487.8371428571345,7452.694285714278,7417.55142857142,7382.408571428563,6855.265714285709,6820.122857142852,6784.979999999994,7316.697142857134,7281.554285714277,7246.4114285714195,7211.268571428563,7176.125714285706,7140.982857142848,7682.759999999991,7647.617142857134,7612.474285714277,7577.33142857142,7542.188571428563,7015.045714285706,6979.902857142848,6944.759999999991,7476.477142857135,7441.334285714278,7406.191428571421,7371.048571428564,7335.905714285707,7300.7628571428495,7842.539999999995,7807.3971428571385,7772.254285714282,7737.111428571425,7701.968571428568,7174.825714285708,7139.6828571428505,7104.539999999994,7636.25714285714,'.split(',')
				}
			]
		}
		var chartOptions = {responsive: true};
		var disposable = this.getDisposableCash();

	  	return <div>
	  		{disposable}
	  		{this.state.regularFlows.map(flow => {
	  			return flow.toString() + ', ';
	  		})}
	  		<button onClick={this.do}>Apply</button>
	  		<LineChart data={lineChartData} options={chartOptions} width="600" height="250"/>
	  	</div>;
	}
}

ReactDOM.render(
	<App saveStateOffline={false}/>,
	document.getElementById('app')
);