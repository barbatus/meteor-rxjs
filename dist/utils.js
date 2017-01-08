'use strict';
export var subscribeEvents = ['onReady', 'onError', 'onStop'];
export function isMeteorCallbacks(callbacks) {
    return _.isFunction(callbacks) || isCallbacksObject(callbacks);
}
// Checks if callbacks of {@link CallbacksObject} type.
export function isCallbacksObject(callbacks) {
    return callbacks && subscribeEvents.some(function (event) {
        return _.isFunction(callbacks[event]);
    });
}
;
export var g = typeof global === 'object' ? global :
    typeof window === 'object' ? window :
        typeof self === 'object' ? self : undefined;
export function removeObserver(observers, observer, onEmpty) {
    var index = observers.indexOf(observer);
    observers.splice(index, 1);
    if (observers.length === 0 && onEmpty) {
        onEmpty();
    }
}
//# sourceMappingURL=utils.js.map