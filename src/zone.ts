'use strict';

import {Observable, Operator, Subscriber} from 'rxjs';

import {TeardownLogic} from 'rxjs/Subscription';

import {g} from './utils';

const METEOR_RXJS_ZONE = 'meteor-rxjs-zone';

const fakeZone = {
  name: METEOR_RXJS_ZONE,
  parent: null,
  run(func: Function) {
    return func();
  },
  fork(spec: any) {
    return fakeZone;
  },
  get(key: string): any {
    return null;
  }
};

export function forkRxJsZone() {
  const zone = getParentZone() || fakeZone;
  return zone.fork({
    name: METEOR_RXJS_ZONE,
    properties: <any>{'isAngularZone': false},
  });
}

function getParentZone(zone?: Zone) {
  zone = zone || (g.Zone && g.Zone.current);
  if (zone && (zone.name === METEOR_RXJS_ZONE)) {
    return zone.parent;
  }
  return zone;
}

declare const _;

const zoneRunners = new Map();
function runZone(zone: Zone) {
  if (! zoneRunners.get(zone)) {
    const runner = _.debounce(run => run(), 30);
    zoneRunners.set(zone, runner);
  }
  const runner = zoneRunners.get(zone);
  runner(zone.run.bind(zone, () => {}));
}

export function zone<T>(zone?: Zone): Observable<T> {
  return this.lift(new ZoneOperator(zone || getParentZone()));
}

class ZoneOperator<T> implements Operator<T, T> {
  constructor(private zone: Zone) {}

  call(subscriber: Subscriber<T>, source: any): TeardownLogic {
    return source._subscribe(new ZoneSubscriber(subscriber, this.zone));
  }
}

class ZoneSubscriber<T> extends Subscriber<T> {
  constructor(destination: Subscriber<T>,
              private zone: Zone) {
    super(destination);
  }

  protected _next(value: T) {
    const zone = getParentZone(this.zone);
    this.zone.run(() => this.destination.next(value));
    runZone(zone);
  }

  protected _complete() {
    const zone = getParentZone(this.zone);
    this.zone.run(() => this.destination.complete());
    runZone(zone);
  }

  protected _error(err?: any) {
    const zone = getParentZone(this.zone);
    this.zone.run(() => this.destination.error(err));
    runZone(zone);
  }
}

export interface ZoneSignature<T> {
  (zone?: Zone): Observable<T>;
}

Observable.prototype.zone = zone;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    zone: ZoneSignature<T>;
  }
}
