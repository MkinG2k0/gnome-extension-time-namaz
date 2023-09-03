const {Soup, GLib} = imports.gi
const ByteArray = imports.byteArray

var key = '31045ef5d8786c4b194013e79bc9d246'
// var url = (city) => `https://muslimsalat.com/${city}.json?key=${key}`
var urlTime = (city = 'Dagestan') => `https://time-namaz.vercel.app/api/namaz?city=${city}`

var fetchTime = async () => {
	const httpSession = new Soup.Session()
	const request = Soup.Message.new('GET', urlTime('Dagestan'))

	request.request_headers.append('Accept', 'application/json')

	return await new Promise((resolve, reject) => {
		httpSession.send_and_read_async(request, GLib.PRIORITY_DEFAULT, null, (httpSession, message) => {
			const data = ByteArray.toString(httpSession.send_and_read_finish(message).get_data())
			const obj = JSON.parse(data)
			resolve(obj)
		})
	})
}

var getNextTime = (times) => {
	const date = new Date()
	const nowHours = date.getHours()
	const nowMinutes = date.getMinutes()
	const defaultTime = times[0]

	const nextTime = times.find(({hours, minutes}) => {
		return nowHours < hours || (nowHours === hours && nowMinutes < minutes)
	})

	return nextTime || defaultTime
}

var getTime = (data, isFullTime = true) => {
	const {
		asr,
		dhuhr,
		fajr,
		isha,
		maghrib,
		sunrise,
	} = data

	const arrTiems = [
		{name: 'asr', time: parseDate(asr)},
		{name: 'dhuhr', time: parseDate(dhuhr)},
		{name: 'fajr', time: parseDate(fajr)},
		{name: 'isha', time: parseDate(isha)},
		{name: 'maghrib', time: parseDate(maghrib)},
		{name: 'sunrise', time: parseDate(sunrise)},
	]

	return arrTiems.map(value => {
		const [hours, minutes] = value.time.split(':').map(Number)
		return {
			...value,
			hours, minutes,
		}
	}).sort((a, b) => a.hours - b.hours)
}

const parseDate = (date) => {
	return new Date(date).toTimeString().slice(0, 5)
}
