var assert = require("assert");
var Promise = require("./promise");
/**
 *
 * @items: {
 *  ${key}: {
 *   dep: [...${keys}],
 *   factory: ()=> Promise
 *  }
 * }
 */
module.exports = function (items) {
    var waitingDefers = {};
    var childrenmap = {}; //for preventing circle dependency
    var context = this;

    // promise tree
    var keys = Object.keys(items);
    keys.forEach(key=> {
        // promise for waiting dependency
        waitingDefers[key] = defer();
        waitingDefers[key].promise = waitingDefers[key].promise
            .then(datas=> {
                var param = {};
                items[key].dep && items[key].dep.forEach((depkey, depindex)=> {
                    param[depkey] = datas[depindex];
                });
                return items[key].factory.call(context, param)
            });
        if (!items[key].dep) {
            waitingDefers[key].resolve([]);

        } else {
            items[key].dep.forEach(function (dep) {
                childrenmap[dep] || (childrenmap[dep] = []);
                childrenmap[dep].push(key);
            });
        }
    });

    keys.forEach(key=> {
        if (!items[key].dep) return;
        // use Promise.all to wait for dependency, and then resolve the waitingDefer
        Promise.all(
            items[key].dep.map(k=> {
                assert(!!waitingDefers[k], 'invalid dependency:' + k);
                return waitingDefers[k].promise
            })
        ).then(waitingDefers[key].resolve)
    });


    return Promise
        .all(keys.map(key=> waitingDefers[key].promise))
        .then(function (arr) {
            var ret = {};
            arr.forEach((data, dataindex) => {
                ret[keys[dataindex]] = data;
            });
            return ret;
        });
};

function defer() {
    var resolve = null;
    var reject  = null;
    var promise = new Promise(function (rs, rj) {
        resolve = rs;
        reject = rj;
    });

    return {promise, resolve, reject}
}