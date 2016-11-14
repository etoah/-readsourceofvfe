'use strict';
var nodedebug = require("debug");
var assert = require("assert");
var extend = require("extend");
var pigfarmRender = require("pigfarm-render");

var runDependenciesTree = require("./lib/asyncDependencies");
var createInjector = require("./lib/data-injector");
var fetchersFactory = require("./lib/fetchers");
var Promise = require("./lib/promise");

var createlog = nodedebug("auto-creating");
var servelog = nodedebug("auto-serving");
var EventEmitter = require("events");

var exportee = module.exports = function (config) {

	assert.equal(typeof (config.data = config.data || {}), 'object', 'please give pigfarm.js a datasource map');
	if (!config.render) {
		if (config.template) {
			config.render = pigfarmRender(config.template, config.helper || {})
		} else {
			config.render = config.render || (d=>JSON.stringify(d));
		}
	}

	// static data
	var _staticJSON = {};
	// read data sources
	var fetchers = {};

	var render = config.render;

	var exportee = function (fetchContext) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var errHandler = function (err) {
				err.status = err.status || 503;
				reject(err);
			};

			try {
				servelog('start');
				const contextParam = fetchContext || {};

				// copy the staticJSON
				var renderData = extend(contextParam, JSON.parse(JSON.stringify(_staticJSON)));

				var requestTree = {};

				servelog('fetch start');
				emitEvent(exportee, ['fetchstart', self]);

				// make the dependency tree for all requests
				Object.keys(fetchers).forEach(key=> {

					requestTree[key] = {
						dep: config.data[key].dependencies,
						factory: datas=> {

							return fetchers[key](extend({}, datas, contextParam))
								.then(function (ret) {
									ret = ret.data;
									if (ret === void 0 || ret === null || ret === false) {
										return {};

									} else {
										return ret;
									}
								});
						}
					};

				});
				runDependenciesTree.call(self, requestTree)
					.then(function (fetched) {
						servelog('fetch end');
						emitEvent(exportee, ['fetchend', self]);

						Object.keys(fetched).forEach(key=> {
							let result = fetched[key];
							let dep = config.data[key].dependencies;
							if (dep && !config.data[key].mountatglobal) {
								createInjector(key)(result, fetched[dep[0]])

							} else {
								createInjector(key, renderData)(result);

							}
						});
						emitEvent(exportee, ['renderstart', self]);
						// render
						servelog('renderData keys', Object.keys(renderData));

						var noError = true;
						try {
							var html = render(renderData);

						} catch (e) {
							e.status = e.status || 555;
							e.renderData = renderData;
							reject(e);
							noError = false;
						}

						if (noError) {
							emitEvent(exportee, ['renderend', self]);

							resolve(html);
						}
					}, errHandler).catch(errHandler);
			} catch (err) {
				errHandler.call(null, err);
			}

		});
	};

	extend(exportee, EventEmitter.prototype);

	createlog('reading data sources');

	Object.keys(config.data).forEach(key=> {
		var dataSource = config.data[key];

		if (dataSource.type == 'request') {
			// request, fetch them when user's requests come in
			// if this config is request, create fetchers
			fetchers[key] = dataSource.action;

		} else if (dataSource.type == 'static') {
			// static json, put it into result
			// _staticJSON[key] = value;

			// put the static data into result
			createInjector(key, _staticJSON)(dataSource.value);

		} else {
			throw new Error('must indicate a type for datasource');

		}
	});
	fetchers = fetchersFactory(fetchers);

	createlog('readed data sources, static:', _staticJSON);

	return exportee;
};

exportee.useFetcher = function (fetcher) {
    fetchersFactory.useFetcher.apply(this, arguments);
};

function emitEvent(emitter, args) {
	try {
		emitter.emit.apply(emitter, args);
	} catch(e) {}
}

function noop() {
}
