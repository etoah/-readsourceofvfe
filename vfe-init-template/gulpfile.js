'use strict';

var gulp = require('gulp')
var path = require('path')
var vfe = require('vfe')
var watch = require('gulp-watch')
var here = require('gulp-here')
var meta = require('./package.json')
var _ = require('underscore')
/**
 * Build configures
 */
var COMPONENT_MODULES = 'c'
var dev_dir = './dev'
var release_dir = './release'
var config = {
	html: 'views/index.html',
	componentsDirectories: [COMPONENT_MODULES],
	bindle: {}
}
config.bindle[meta.name + '_lib'] = ['./views/lib/*.js']

gulp.task('default', [clean('dev', dev_dir)], build(_.extend({}, config, {
	dest: dev_dir,
	minify: false // default us minify
})))
gulp.task('release', [clean('release', release_dir)], build(_.extend({}, config, {
	dest: release_dir,
	prefix: 'http://host/path/to/js' 
})))
gulp.task('watch', function () {
	// do not reurn watch stream
	watch(['views/**', COMPONENT_MODULES + '/**'], {read: false, verbose: true}, vfe.util.once(function (next) {
		gulp.start('default', function (err) {
			next()
		})
	}))
})

function clean(env, dist) {
	var name = 'clean-' + env
	gulp.task(name, function () {
		return gulp.src(dist, { read: false }).pipe(vfe.clean())
	})
	return name
}
/**
 * Components build handler
 */
function build (options) {
	return function () {
		var streams = [] // js & css build
		var usingHash = options.hash !== false
		var minify = options.minify !== false
		var bindle = options.bindle
		// Step 1: If need, create bundle files.
		if (bindle) Object.keys(bindle).forEach(function (name) {
			streams.push(
				vfe.bundle(bindle[name], _.extend({}, options, {
					name: name
				}))
			)
		})
		// Step 2: Build component modules.
		streams.push(
			vfe({
				minify: minify,
				hash: usingHash, // default is enable
				output: {
					filename: (meta.name || 'components') + '.js',
				},
				entry: options.entry || './views/index.js',
				modulesDirectories: ['node_modules'],
				components: {
					directories: options.componentsDirectories || ['c'],
					extensions: ['js']
				}
			})
			
		)
		// Step 3: Inject resource link to html.
		return vfe.merge(
				gulp.src(options.html || './views/index.html')
					.pipe(here(
						vfe.merge.apply(vfe, streams)
							.pipe(gulp.dest(options.dest))
							.pipe(vfe.filter(function (file) {
								return minify
									? /\.min\.js$/.test(file.path) 
									: !/\.min\.js$/.test(file.path)
							})),
						{
							transform: function (file, target, options) {
								/**
								 * Javascript release prefix
								 */
								var uri = (options.prefix || '/') + path.basename(file.path)
								if (/\.css$/.test(uri)) {
									return '<link rel="stylesheet" href="%s" />'.replace('%s', uri)
								} else {
									return '<script type="text/javascript" src="%s"></script>'.replace('%s', uri)
								}
							}
						}
					))
					.pipe(gulp.dest(options.dest)),
				/**
				 * static resources copy directly
				 */
				gulp.src(options.asserts || ['./views/asserts/**/*'])
					.pipe(gulp.dest(path.join(options.dest, 'asserts')))
			)
	}
}