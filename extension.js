const GETTEXT_DOMAIN = 'my-indicator-extension'

const {GObject, St, Soup, GLib} = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Clutter = imports.gi.Clutter
const ByteArray = imports.byteArray

const _ = ExtensionUtils.gettext
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
		return nowHours <= hours && nowMinutes <= minutes
	})
	return nextTime || defaultTime
}
//

const Indicator = GObject.registerClass(
	class Indicator extends PanelMenu.Button {
		_init() {
			super._init(0.0, _('My Shiny Indicator'))
			this._menuLayout = new St.BoxLayout()
			this.add_actor(this._menuLayout)

			this._menuLayout.add(new St.Icon({
				icon_name: 'org.buddiesofbudgie.Settings-time-symbolic',
				style_class: 'system-status-icon',
			}))

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

			this.setTime()

			let item = new PopupMenu.PopupMenuItem(_('Show Notification'))
			item.connect('activate', () => {
				Main.notify(_('Whatʼs up, folks? 23'))
			})
			this.menu.addMenuItem(item)
		}

		async setTime() {
			const currentTime = await this.getTime()
			this._timeLabel.text = currentTime.time

			this.timeOut()
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
			const bufferTime = 2
			const rangeTime = (hours * 60 + minutes) - (nowHours * 60 + nowMinutes)
			const timeMillisec = (rangeTime + bufferTime) * 1000

			console.log('--- timer: ', timeMillisec / 1000)

			this._timeOut = setTimeout(() => {
				const currentTime = await this.getTime()
				this._timeLabel.text = currentTime.time
				this.timeOut()
			}, timeMillisec)

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
