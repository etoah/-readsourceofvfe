### 目录结构

```
|- lib
    |- pattern.js: 正则
|- loader
    |- component.js: component loader，引用css
|- plugins
    |- component.js: 
|- tasks
    |-save.js
|-index.js:

```


### 



### 如何写一个loader
loader，有一点类似gulp中的pipe, 可以链式处理，但是又需要保持
独立性，两个之前没有依赖。
同时可以用url的查询的参数。

传入的是源码，输出的也是源码。
webpack [loader](http://webpack.github.io/docs/loaders.html)所有的api,挂在this上.


### 如何写一个Plugin
1. [如何写一个webpack插件](https://github.com/lcxfs1991/blog/issues/1)


### 问题

- loader的作用，引用css? 为什么要这样做
- 

