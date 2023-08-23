const GETTEXT_DOMAIN = 'time-namaz-extension'

const {GObject, St, Soup, GLib} = imports.gi
const ExtensionUtils = imports.misc.extensionUtils
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Clutter = imports.gi.Clutter
const ByteArray = imports.byteArray
// const BoxPointer = imports.ui.BoxPointer
const _ = ExtensionUtils.gettext
//
const key = '31045ef5d8786c4b194013e79bc9d246'
const url = (city) => `https://muslimsalat.com/${city}.json?key=${key}`

// utils
const fetchTime = async () => {
	const httpSession = new Soup.Session()
	const request = Soup.Message.new('GET', url('dagestan'))

	request.request_headers.append('Accept', 'application/json')
	return await new Promise((resolve, reject) => {
		httpSession.send_and_read_async(request, GLib.PRIORITY_DEFAULT, null, (httpSession, message) => {
			const data = ByteArray.toString(httpSession.send_and_read_finish(message).get_data())
			const obj = JSON.parse(data)
			resolve(obj)
		})
	})
}
const getTime = (data, isFullTime = true) => {
	const arrTime = Object.entries(data.items[0]).filter(([name]) => name !== 'date_for')

	return arrTime.map(([name, fullTime]) => {
		const [time, type] = fullTime.split(' ')
		const [hours, minutes] = time.split(':').map(Number)
		const isFullTimeEnable = isFullTime && type === 'pm'
		const newHours = isFullTimeEnable ? hours + 12 : hours
		const newTime = isFullTime ? `${newHours}:${minutes}` : `${hours}:${minutes} ${type}`

		return {name, minutes, hours: newHours, time: newTime}
	})
}

const getNextTime = (times) => {
	const date = new Date()
	const nowHours = date.getHours()
	const nowMinutes = date.getMinutes()
	const defaultTime = times[0]

	const nextTime = times.find(({hours, minutes}) => {
		// && nowMinutes <= minutes
		return nowHours <= hours
	})
	return nextTime || defaultTime
}
const log = (text) => {
	console.log('\n---\n', text, '\n---')
}
//

const Indicator = GObject.registerClass(
	class Indicator extends PanelMenu.Button {
		_init() {
			super._init(.5, _('Time Namaz'))
			this._menuLayout = new St.BoxLayout()
			this.add_actor(this._menuLayout)

			this.addMenu()
			this.setTime()
		}

		addMenu() {
			this._icon = new St.Icon({
				icon_name: 'org.buddiesofbudgie.Settings-time-symbolic',
				style_class: 'system-status-icon',
			})
			this._menuLayout.add(this._icon)

			// this._menuLayout.add(new St.Label({
			// 	text: '\uD83D\uDD4B',  // 🕋, warning
			// 	y_align: Clutter.ActorAlign.CENTER,
			// 	style_class: 'system-status-icon',
			// }))

			this._timeLabel = new St.Label({
				text: '00:00',
				y_align: Clutter.ActorAlign.CENTER,
			})

			this._menuLayout.add(this._timeLabel)
		}

		addPopupMenu() {
			this.menu.removeAll()

			this.times.map(({name, time}) => {
				let wiki = new PopupMenu.PopupBaseMenuItem()
				wiki.actor.add_child(
					new St.Label({text: _(`${name}: ${time}`)}))

				this.menu.addMenuItem(wiki)
			})
		}

		async setTime() {
			const currentTime = await this.getTime()
			this._timeLabel.text = currentTime.time

			this.timeOut()
			this.addPopupMenu()
		}

		async getTime() {
			const dataTime = await fetchTime()
			this.times = getTime(dataTime)
			this.nextTime = getNextTime(this.times)

			return this.nextTime
		}

		timeOut() {
			if (!this.nextTime) {
				return
			}

			const date = new Date()
			const nowHours = date.getHours()
			const nowMinutes = date.getMinutes()

			const {hours, minutes} = this.nextTime
			// const {hours, minutes} = {hours: 16, minutes: nowMinutes}
			const bufferTime = 1
			const rangeTime = (hours * 60 + minutes) - (nowHours * 60 + nowMinutes)
			const timeMillisec = (rangeTime + bufferTime) * 60 * 1000
			const checkTime = timeMillisec > 0 ? timeMillisec : timeMillisec * -1

			// console.log(hours, minutes, nowHours, nowMinutes)

			log(timeMillisec / 1000)

			this._timeOut = setTimeout(() => {
				this.getTime().then(({time}) => {
					this._timeLabel.text = time
				})
				this.timeOut()
			}, checkTime)

		}

	})

class Extension {
	constructor(uuid) {
		this._uuid = uuid

		ExtensionUtils.initTranslations(GETTEXT_DOMAIN)
	}

	enable() {
		this._indicator = new Indicator()
		Main.panel.addToStatusArea(this._uuid, this._indicator)
	}

	disable() {
		this._indicator.destroy()
		this._indicator = null
	}
}

function init(meta) {
	return new Extension(meta.uuid)
}
