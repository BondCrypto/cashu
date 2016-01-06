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
print('Starting balance: $'+str(balance))
print('Balance in '+str(duration)+' days time is $'+str(disposableCash(date.today() + datetime.timedelta(days = duration))))
print('Balance in '+str(duration)+' days time is $'+str(disposableCash(date.today() + datetime.timedelta(days = duration))))
print('Balance in '+str(duration)+' days time is $'+str(disposableCash(date.today() + datetime.timedelta(days = duration))))
# getMin()
print("Break point is $"+str(getMin()))

# strx = ''
# for i in range(0, 100):
# 	strx += str(disposableCash(date.today() + datetime.timedelta(days = i))) + ','
# print(strx)


# '5986.08,6517.797142857143,6482.654285714286,6447.511428571428,6412.368571428571,6377.225714285714,6342.082857142857,6883.860000000001,6848.717142857143,6813.574285714286,6778.431428571429,6743.288571428571,6216.145714285714,6181.002857142857,6145.86,6677.577142857143,6642.434285714286,6607.291428571429,6572.148571428572,6537.005714285715,6501.862857142858,7043.64,7008.497142857143,6973.354285714287,6938.211428571429,6903.068571428572,6375.925714285715,6340.782857142857,6305.64,6837.357142857144,6802.214285714286,6767.071428571429,6731.9285714285725,6696.785714285716,6661.642857142859,7203.419999999998,7168.277142857141,7133.1342857142845,7097.991428571428,7062.848571428571,6535.705714285716,6500.562857142858,6465.420000000001,6997.137142857141,6961.994285714284,6926.851428571426,6891.7085714285695,6856.565714285713,6821.422857142856,7363.199999999995,7328.057142857138,7292.9142857142815,7257.771428571424,7222.628571428567,6695.485714285713,6660.342857142856,6625.199999999998,7156.917142857137,7121.77428571428,7086.631428571423,7051.4885714285665,7016.345714285709,6981.202857142852,7522.979999999991,7487.8371428571345,7452.694285714278,7417.55142857142,7382.408571428563,6855.265714285709,6820.122857142852,6784.979999999994,7316.697142857134,7281.554285714277,7246.4114285714195,7211.268571428563,7176.125714285706,7140.982857142848,7682.759999999991,7647.617142857134,7612.474285714277,7577.33142857142,7542.188571428563,7015.045714285706,6979.902857142848,6944.759999999991,7476.477142857135,7441.334285714278,7406.191428571421,7371.048571428564,7335.905714285707,7300.7628571428495,7842.539999999995,7807.3971428571385,7772.254285714282,7737.111428571425,7701.968571428568,7174.825714285708,7139.6828571428505,7104.539999999994,7636.25714285714,'.split(',')