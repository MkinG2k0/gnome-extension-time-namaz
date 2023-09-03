const GETTEXT_DOMAIN = 'time-namaz-extension'

const Main = imports.ui.main
const ExtensionUtils = imports.misc.extensionUtils

const {getFile} = imports.misc.extensionUtils.getCurrentExtension().imports.src.utils['get-file']
const {Indicator} = getFile('core/indicator')

const {log} = getFile('utils/util')

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
