var getFile = (path) => {
	let baseUrl = imports.misc.extensionUtils.getCurrentExtension().imports.src
	const splitPath = path.split('/')

	splitPath.forEach(value => {
		baseUrl = baseUrl?.[value]
	})

	return baseUrl
}

