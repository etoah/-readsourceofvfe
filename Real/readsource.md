

### 怎么用
```html
<div id="app" r-show="{show}" r-class="{hl: hl}">Hi, Reve</div>
<script src="./real.js"></script>
<script>
var $app = new Reve({
    el: '#app',
    data: function () {
        // define some state of ViewModel
        return {
            show: true,
            hl: true
        }
    },
    ready: function () {
        // ... do something when instance compele ...
    },
    methods: {
        // ... define methods of the ViewModel ...
    }
})
</script>
```
## 原理 
初看下来，没有后端渲染的能力。是一个类vue的框架

### 代码结构
```
|-lib
    |-directives
        |- build-in.js :  定义了attr,style,html,on,class,show,text,model指令
        - scoped-directives.js : 定义了if指令
    |-tools
        |-compile.js : 生成解析$scope的函数，with这里有隐患，严格模式和ES6不能用
        |-consoler.js: 生成兼容IE的console
        |-detection.js: 浏览器特性检测
        |-dom.js: 常见的dom操作，类似一个jqlite
        |-execute.js: 执行表达式
        |-expression.js:表达式处理(?)
        |-is.js:dom 节点类型判断
        |-keypath.js:实现类似于xpath的路径访问，可防止报ReferenceError错误
        |-query.js:实现兼容ie的选择器
        |-util.js:工具类，如html entity encode,对es5做的ie兼容，对象比较， 树遍历，immutable和继承
    |-conf.js: 配置
    |-directive.js: Directive类
    |-scope.js: Scope类
|-reve.js 入口文件
```

### 启动流程

应用的总入口为Real,  当Real实例化时，像很多库/框架一样，会处理默认参数，
兼容dom element和选择器的处理。

然后就是，template, repalce参数处理，作用应该和angular一致。


在此时(编译前)会触发`created`事件(create hook)，
$compile,取出所有指令:

```javascript
var _diretives = util.extend({}, buildInDirectives, buildInScopedDirectives, _externalDirectives) //所有指令
```
再迭代编译所有指令：

```javascript
    util.forEach(util.keys(_diretives), function (dname) {
                d = new Directive(vm, tar, def, dname, expr, scope)
                $directives.push(d)
    })
```
在指令的构造函数里会bind函数.

对于一般的指令，bind函数只会写属性，但对于有双向绑定功能的model指令来说，
有点不同。


#### 双向绑定原理
model指令会监听input,textarea,select的change,input,keyup事件：

```javascript
            util.forEach(this.evtType.split(','), function (t) {
                $el.on(t, that._requestChange) //监听所有事件，执行类angular 的digest
            })
```
_requestChange:

```javascript
            this._requestChange = function () {
                if (!that._prop) return
                var value = that.$el[vType]
                var state = vm.$data[that._prop]

                if (util.diff(value, state)) {   //DOM树对比
                    vm.$set(that._prop, value)
                }
            }

```
$set会执行 Real实例的$set方法。

```javascript
Real.prototype.$set = function (/*[keypath, ]*/value) {
    var keypath = util.type(value) == 'string' ? value : ''
    if (keypath) {
        value = arguments[1]
        KP.set(this.$data, keypath, value)
    } else {
        this.$data = util.extend(this.$data, value)
    }
    this.$update()
}
```
而`$update`方法，会把变更执行到child componets,dirctives.

>对于单向绑定，直接用get,set就好。


### 生命周期
 component 继承于Real


created
ready


Real.prototype.$destory会调用所有的component,directive,的destroy,并会把所有函数指向noop,
对象的指向空。


#### 组件初始化
获取所有指令：
```javascript
    var _diretives = util.extend({}, buildInDirectives, buildInScopedDirectives, _externalDirectives) //所有指令
```
### 静态方法
Real.create :  创建应用，继承自Real
Real.component : 组件继承自Real
Real.directive : 定义指令 
Real.set：设置配置


###  组件和指令的区别

组件继承自Real, 有单独的lifecycle hook,
 指令更轻量，一般只重置bind,unbind,update方法

--- 

### 更新机制&性能

在angular中，大量的双向绑定一直存在是广为诟病的性能问题，
angular会在所有的UI事件(ng-click,ng-change...)，网络事件($http)，定时事件(timeout,interval)时直接的或间接的($apply)
调用$digest, 当watch列表一大时，会有严重的性能问题。
 但Real不一样， Real虽然监听了部份UI事件(change,keyup), 但是通过主动的$set, 来间接的调用component,directive
 的update方法。

这时能不能有效的，少量的部份更新Dom, 减少部份的重绘和重画就成了性能优化的关键。
着重的分析一下更新机制.

这里有两个关键：
- util.diff
- Real.prototype.$set

#### util.diff


#### Real.prototype.$update



#### 性能优化

- 少量更新： 
- 批量更新：下一个事件循环更新


### 问题

 1. server-side render?
 2. scoped?  会调用$compile？