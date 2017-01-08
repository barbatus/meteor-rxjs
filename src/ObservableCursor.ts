'use strict';

import {Observable, Subscriber, Subject} from 'rxjs';
import {removeObserver, g} from './utils';
import {forkRxJsZone} from './zone';

declare const _;

export class ObservableCursor<T> extends Observable<T[]> {
  private _zone: Zone = forkRxJsZone();
  private _data: Array <T> = [];
  private _cursor: Mongo.Cursor<T>;
  private _hCursor: Meteor.LiveQueryHandle;
  private _observers: Subscriber<T[]>[] = [];
  private _countObserver: Subject<number> = new Subject<number>();
  private _handleChangeDebounced: Function;
  private _init = false;

  /**
   *  Static method which creates an ObservableCursor from Mongo.Cursor.
   *  Use this to create an ObservableCursor object from an existing Mongo.Cursor.
   *  Prefer to create an Cursors from the ObservableCollection instance instead.
   *
   *  @param {Mongo.Cursor<T>} cursor - The Mongo.Cursor to wrap.
   *  @static
   *  @returns {ObservableCursor} Wrapped Cursor.
   */
  static create<T>(cursor: Mongo.Cursor<T>): ObservableCursor<T> {
    return new ObservableCursor<T>(cursor);
  }

  /**
   * @constructor
   * @extends Observable
   * @param {Mongo.Cursor<T>} cursor - The Mongo.Cursor to wrap.
   */
  constructor(cursor: Mongo.Cursor<T>) {
    super((observer: Subscriber<T[]>) => {
      if (this._init) {
        observer.next(this._data);
      }

      this._observers.push(observer);

      if (! this._hCursor) {
        this._hCursor = this._observeCursor(cursor);
      }

      return () => {
        removeObserver(this._observers,
          observer, () => this.stop());
      };
    });

    _.extend(this, _.omit(cursor, 'count', 'map'));

    this._cursor = cursor;
    this._handleChangeDebounced = _.debounce(() => {
      this._handleChange();
      this._init = true;
    }, 0);
  }

  /**
   * Returns the actual Mongo.Cursor that wrapped by current ObservableCursor instance.
   * @return {Mongo.Cursor<T>} The actual MongoDB Cursor.
   */
  get cursor(): Mongo.Cursor<T> {
    return this._cursor;
  }

  /**
   * A wrapper for Mongo.Cursor.count() method - returns an Observable of number, which
   * triggers each time there is a change in the collection, and exposes the number of
   * objects in the collection.
   * @returns {Observable} Observable which trigger the callback when the
   * count of the object changes.
   */
  collectionCount(): Observable<number> {
    return this._countObserver.asObservable();
  }

  /**
   * Stops the observation on the cursor.
   */
  stop() {
    this._zone.run(() => {
      this._runComplete();
    });

    if (this._hCursor) {
      this._hCursor.stop();
    }

    this._data = [];
    this._hCursor = null;
  }

  /**
   * Clears the Observable definition.
   * Use this method only when the Observable is still cold, and there are no active subscriptions yet.
   */
  dispose() {
    this._observers = null;
    this._cursor = null;
  }

  /**
   * Return all matching documents as an Array.
   *
   * @return {Array<T>} The array with the matching documents.
   */
  fetch(): Array<T> {
    return this._cursor.fetch();
  }

  /**
   * Watch a query. Receive callbacks as the result set changes.
   * @param {Mongo.ObserveCallbacks} callbacks - The callbacks object.
   * @return {Meteor.LiveQueryHandle} The array with the matching documents.
   */
  observe(callbacks: Object): Meteor.LiveQueryHandle {
    return this._cursor.observe(callbacks);
  }

  /**
   * Watch a query. Receive callbacks as the result set changes.
   * Only the differences between the old and new documents are passed to the callbacks.
   * @param {Mongo.ObserveChangesCallbacks} callbacks - The callbacks object.
   * @return {Meteor.LiveQueryHandle} The array with the matching documents.
   */
  observeChanges(callbacks: Object): Meteor.LiveQueryHandle {
    return this._cursor.observeChanges(callbacks);
  }

  _runComplete() {
    this._countObserver.complete();

    this._observers.forEach(observer => {
      observer.complete();
    });
  }

  _runNext(data: Array<T>) {
    this._countObserver.next(this._data.length);

    this._observers.forEach(observer => {
      observer.next(data);
    });
  }

  _addedAt(doc, at, before) {
    doc = this._zoneObservables(doc);
    this._data.splice(at, 0, doc);
    if (! this._init) {
      return this._handleChangeDebounced();
    }
    this._handleChange();
  }

  _changedAt(doc, old, at) {
    this._data[at] = doc;
    this._handleChange();
  }

  _removedAt(doc, at) {
    this._data.splice(at, 1);
    this._handleChange();
  }

  _movedTo(doc, fromIndex, toIndex) {
    this._data.splice(fromIndex, 1);
    this._data.splice(toIndex, 0, doc);
    this._handleChange();
  }

  _handleChange() {
    this._runNext(this._data);
  }

  _zoneObservables(doc) {
    if (! doc) { return doc; }

    const proto = Object.getPrototypeOf(doc) || {};
    const props = [].concat(
      Object.keys(doc),
      Object.keys(proto),
    );

    for (const prop of props) {
      const value = doc[prop];
      if (value instanceof Observable) {
        Object.defineProperty(doc, prop, {
          configurable: true,
          enumerable: true,
          value: value.zone.call(value, this._zone),
        });
      }
    }

    return doc;
  }

  _observeCursor(cursor: Mongo.Cursor<T>) {
    return this._zone.run<Meteor.LiveQueryHandle>(
      () => cursor.observe({
        addedAt: this._addedAt.bind(this),
        changedAt: this._changedAt.bind(this),
        movedTo: this._movedTo.bind(this),
        removedAt: this._removedAt.bind(this)
      })
    );
  }
}
