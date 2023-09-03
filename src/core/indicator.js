'use strict'

const {GObject, St, Soup, GLib} = imports.gi
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Clutter = imports.gi.Clutter
const ByteArray = imports.byteArray

const Main = imports.ui.main
const ExtensionUtils = imports.misc.extensionUtils
const _ = ExtensionUtils.gettext

const {fetchTime, getNextTime, getTime} = imports.misc.extensionUtils.getCurrentExtension().imports.src.utils.time

class ClassIndicator extends PanelMenu.Button {
	_init() {
		super._init(.5, _('Time Namaz'))
		this._menuLayout = new St.BoxLayout()
		this.add_actor(this._menuLayout)

		this.addMenu()
		this.setTime()
	}

	addMenu() {
		this._icon = new St.Icon({
			icon_name: 'preferences-system-time-symbolic',
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
		const bufferTime = 2 * 60 * 1000
		const oneDayTime = 24 * 60 * 60 * 1000
		const rangeTime = (hours * 60 + minutes) - (nowHours * 60 + nowMinutes)
		const rangeMs = rangeTime * 60 * 1000
		const checkTime = (rangeMs > 0 ? rangeMs : oneDayTime - rangeMs * -1) + bufferTime

		log(checkTime / 1000 / 60 / 60)

		this._timeOut = setTimeout(() => {

			Main.notify(`Namaz ${this.nextTime.name}`, this.nextTime.time)

			this.nextTime = getNextTime(this.times)
	
			this._timeLabel.text = this.nextTime.time

			this.timeOut()
		}, checkTime)
	}
}

var Indicator = GObject.registerClass(ClassIndicator)
