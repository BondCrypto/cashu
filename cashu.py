import datetime
from datetime import date
import time
import sys

class Cashflow(object):
	def __init__(self, name, amount, howOftenReoccur, startDate, endDate):
		self.name = name
		self.amount = amount
		self.howOftenReoccur = howOftenReoccur # timedelta interval
		self.startDate = startDate
		self.endDate = endDate

class OneoffCashflow(object):
	def __init__(self, desc, amount, date):
		self.desc = desc
		self.amount = amount
		self.date = date

	def __repr__(self):
		return self.desc + ' $'+str(self.amount) + ' ' + str(self.date)

# is this an income or a bill
# when did the last one come in?
# how much?
# how often do these payments occur

regularFlows = [
	Cashflow('BIT Scholarship', +576.92, datetime.timedelta(days = 14), datetime.date(2015, 12, 30), datetime.date(2017, 12, 12)),
	Cashflow('Rent', -246*2, datetime.timedelta(days = 14), datetime.date(2015, 12, 21), datetime.date(2017, 12, 6)),
	Cashflow('Centrelink', +566.86, datetime.timedelta(days = 14), datetime.date(2015, 12, 24), datetime.date(2016, 6, 1)),

	Cashflow('Living expenses', -246*2 /14, datetime.timedelta(days = 1), datetime.date(2015, 12, 12), datetime.date(2017, 12, 6))
]

oneoffCashflows = [
	# ('ANZ', +5206.30, datetime.today()),
	# ('CUA', +800, datetime.today())
]

futureOneoffs = []

balance = 5206.30 + 779.78

def getCashflows(untilDate):
	cashflows = []
	cashflows += futureOneoffs
	for cashflow in regularFlows:
		if cashflow.startDate > untilDate:
			continue

		nextDateForThisCashflow = cashflow.startDate + cashflow.howOftenReoccur
		
		while nextDateForThisCashflow <= untilDate:
			if nextDateForThisCashflow > date.today():
				cashflows.append(OneoffCashflow(cashflow.name, cashflow.amount, nextDateForThisCashflow))
			nextDateForThisCashflow += cashflow.howOftenReoccur
	
	return cashflows + oneoffCashflows + futureOneoffs

def disposableCash(date):
	return balance + sum(cashflow.amount for cashflow in getCashflows(date))

def getMin():
	normalisedFlows = []
	for flow in regularFlows:
		normalisedFlow = flow.amount / (flow.howOftenReoccur.days)
		normalisedFlows.append(normalisedFlow)
	# Kind of like Costs = Revenues
	return sum(normalisedFlows)

duration = int(sys.argv[1])
# print('Starting balance: $'+str(balance))
# print('Balance in '+str(duration)+' days time is $'+str(disposableCash(date.today() + datetime.timedelta(days = duration))))
# getMin()
# print("Break point is $"+str(getMin()))

strx = ''
for i in range(0, 100):
	strx += str(disposableCash(date.today() + datetime.timedelta(days = i))) + ','
print(strx)