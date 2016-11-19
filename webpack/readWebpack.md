## 源码结构


### 包
先分析package.js分析测试，依赖，环境等信息。
memory-fs: A simple in-memory filesystem. Holds data in a javascript object.
watchpack: Wrapper library for directory and file watching.
webpack-sources：webpack 的源码处理类



## Tapable

[Tapable](https://github.com/webpack/tapable)是一个基于发布订阅模式的的插件模块.
 两个公众方法apply,plugin分别表示"发布"和"订阅".

apply同时还有并行(applyPluginsParallel),串行(applyPlugins),异常处理(applyPluginsAsync,applyPluginsAsyncWaterfall),和链式调用(applyPluginsWaterfall)等相关api


## 流程

webpack的入口是compile的run方法：

```javascript
function webpack(options, callback) {
	if(callback) {
		compiler.run(callback);
	}
	return compiler;
}
```
compiler 继承自`Tapable`：

```javascript
Compiler.prototype = Object.create(Tapable.prototype);
Compiler.prototype.constructor = Compiler;
```
 采用发布订阅模式，给很多事件发布了hook, 在插件开发时适时订阅。

webpack主流程和 事件hook:

 ```javascript
Compiler.prototype.run = function(callback) {
	var self = this;
	var startTime = new Date().getTime();

	self.applyPluginsAsync("before-run", self, function(err) {
		if(err) return callback(err);

		self.applyPluginsAsync("run", self, function(err) {
			if(err) return callback(err);

			self.readRecords(function(err) {
				if(err) return callback(err);

				self.compile(function onCompiled(err, compilation) {
					if(err) return callback(err);

					if(self.applyPluginsBailResult("should-emit", compilation) === false) {
						var stats = compilation.getStats();
						stats.startTime = startTime;
						stats.endTime = new Date().getTime();
						self.applyPlugins("done", stats);
						return callback(null, stats);
					}

					self.emitAssets(compilation, function(err) {
						if(err) return callback(err);

						if(compilation.applyPluginsBailResult("need-additional-pass")) {
							compilation.needAdditionalPass = true;

							var stats = compilation.getStats();
							stats.startTime = startTime;
							stats.endTime = new Date().getTime();
							self.applyPlugins("done", stats);

							self.applyPluginsAsync("additional-pass", function(err) {
								if(err) return callback(err);
								self.compile(onCompiled);
							});
							return;
						}

						self.emitRecords(function(err) {
							if(err) return callback(err);

							var stats = compilation.getStats();
							stats.startTime = startTime;
							stats.endTime = new Date().getTime();
							self.applyPlugins("done", stats);
							return callback(null, stats);
						});
					});
				});
			});
		});
	});
};

```
由于插件是需要监听事件，所以需要了解相关的事件hook.


compilation: 发布了多个事件hook


```javascript

````


