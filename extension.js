const GETTEXT_DOMAIN = 'my-indicator-extension'

const {GObject, St} = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Clutter = imports.gi.Clutter

const _ = ExtensionUtils.gettext

// utils

//

const Indicator = GObject.registerClass(
	class Indicator extends PanelMenu.Button {
		_init() {
			super._init(0.0, _('My Shiny Indicator'))
			this._menuLayout = new St.BoxLayout()
			this.add_actor(this._menuLayout)

			this._menuLayout.add(new St.Icon({
				icon_name: 'org.buddiesofbudgie.Settings-time-symbolic',
			}))

			// this._menuLayout.add(new St.Label({
			// 	text: '\uD83D\uDD4B',  // 🕋, warning
			// 	y_align: Clutter.ActorAlign.CENTER,
			// }))

			this._menuLayout.add(new St.Label({
				text: 'time',
				y_align: Clutter.ActorAlign.CENTER,
			}))

			let item = new PopupMenu.PopupMenuItem(_('Show Notification'))
			item.connect('activate', () => {
				Main.notify(_('Whatʼs up, folks? 23'))
			})
			this.menu.addMenuItem(item)
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
