'use strict';

var fs = require('fs')
var path = require('path')

module.exports = function (source) {
	var callback = this.async() //可异步
	var loader = this  //this.request.  请求的string eg:/abc/loader1.js?xyz!/abc/node_modules/loader2/index.js!/abc/resource.js?rrr
	var oneMatches = this.request.match(/[\/\\][^\/\\]+[\/\\]([^\/\\]+)[\/\\]([^\/\\]+)\.js$/)

	// /component_directory/component/component.js
	if (oneMatches && oneMatches[1] === oneMatches[2]) {
		return this.resolve( //
			this.context,  //A string. The directory of the module. 
			'./' + oneMatches[1] + '.css', 
			function (err, cssRequest) {
				if (fs.existsSync(cssRequest)) {
					source += '\nrequire("./' + oneMatches[1] +'.css")'
				}
				callback(null, source)
			})

	}
	// /component_directory/dir/component/component.js
	var dirMatches = this.request.match(/[\/\\][^\/\\]+[\/\\]([^\/\\]+)[\/\\]([^\/\\]+)[\/\\]([^\/\\]+)\.js$/)
	if (dirMatches && dirMatches[2] === dirMatches[3]) {
		return this.resolve(
			this.context,
			'./' + dirMatches[2] + '.css',
			function (err, cssRequest) {
				if (fs.existsSync(cssRequest)) {
					source += '\nrequire("./' + dirMatches[2] +'.css")'
				}
				callback(null, source)
			}
		)
	}
	return callback(null, source)
}