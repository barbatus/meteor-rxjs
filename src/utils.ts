'use strict';

import {Subscriber} from 'rxjs';

declare const _;

export declare type CallbacksObject = {
  onReady?: Function;
  onError?: Function;
  onStop?: Function;
};

export declare type MeteorCallbacks = ((...args) => any) | CallbacksObject;

export const subscribeEvents = ['onReady', 'onError', 'onStop'];

export function isMeteorCallbacks(callbacks: any): boolean {
  return _.isFunction(callbacks) || isCallbacksObject(callbacks);
}

// Checks if callbacks of {@link CallbacksObject} type.
export function isCallbacksObject(callbacks: any): boolean {
  return callbacks && subscribeEvents.some((event) => {
    return _.isFunction(callbacks[event]);
  });
};

declare const global;
export const g =
  typeof global === 'object' ? global :
    typeof window === 'object' ? window :
      typeof self === 'object' ? self : undefined;


export function removeObserver(observers: Subscriber<any>[],
                               observer: Subscriber<any>,
                               onEmpty?: Function) {
  const index = observers.indexOf(observer);
  observers.splice(index, 1);
  if (observers.length === 0 && onEmpty) {
    onEmpty();
  }
}
