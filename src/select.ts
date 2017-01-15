'use strict';

import {Observable, Operator, Subscriber} from 'rxjs';

import {TeardownLogic} from 'rxjs/Subscription';

declare const _;

export function select<T, U>(this: Observable<T>, field: string): Observable<U> {
  return this.lift(new SelectOperator(field));
}

class SelectOperator<T, U> implements Operator<T, U> {
  constructor(private field: string) {}

  call(subscriber: Subscriber<U>, source: any): TeardownLogic {
    return source.subscribe(new SelectSubscriber(subscriber, this.field));
  }
}

class SelectSubscriber<T, U> extends Subscriber<T> {
  constructor(destination: Subscriber<U>,
              private field: string) {
    super(destination);
  }

  protected _next(value: T) {
    if (value && value instanceof Array) {
      const value0 = value[0];
      if (value0 && value0[this.field] instanceof Array) {
        const reduced = value
          .map(docs => docs[this.field])
          .reduce((result, fields) => result.concat(fields), []);
        return this.destination.next(reduced);
      }
      const result = value.map(doc => doc[this.field]);
      return this.destination.next(result);
    }
    this.destination.next(value && value[this.field]);
  }

  protected _complete() {
    this.destination.complete();
  }

  protected _error(err?: any) {
    this.destination.error(err);
  }
}

Observable.prototype.select = select;

declare module 'rxjs/Observable' {
  interface Observable<T> {
    select<T, U>(this: Observable<T>, field: string): Observable<U>;
  }
}
