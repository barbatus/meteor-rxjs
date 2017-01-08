'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
import { Observable, Subscriber } from 'rxjs';
import { g } from './utils';
var METEOR_RXJS_ZONE = 'meteor-rxjs-zone';
var fakeZone = {
    name: METEOR_RXJS_ZONE,
    parent: null,
    run: function (func) {
        return func();
    },
    fork: function (spec) {
        return fakeZone;
    },
    get: function (key) {
        return null;
    }
};
export function forkRxJsZone() {
    var zone = getParentZone() || fakeZone;
    return zone.fork({
        name: METEOR_RXJS_ZONE,
        properties: { 'isAngularZone': false },
    });
}
function getParentZone(zone) {
    zone = zone || (g.Zone && g.Zone.current);
    if (zone && (zone.name === METEOR_RXJS_ZONE)) {
        return zone.parent;
    }
    return zone;
}
var zoneRunners = new Map();
function runZone(zone) {
    if (!zoneRunners.get(zone)) {
        var runner_1 = _.debounce(function (run) { return run(); }, 30);
        zoneRunners.set(zone, runner_1);
    }
    var runner = zoneRunners.get(zone);
    runner(zone.run.bind(zone, function () { }));
}
export function zone(zone) {
    return this.lift(new ZoneOperator(zone || getParentZone()));
}
var ZoneOperator = (function () {
    function ZoneOperator(zone) {
        this.zone = zone;
    }
    ZoneOperator.prototype.call = function (subscriber, source) {
        return source._subscribe(new ZoneSubscriber(subscriber, this.zone));
    };
    return ZoneOperator;
}());
var ZoneSubscriber = (function (_super) {
    __extends(ZoneSubscriber, _super);
    function ZoneSubscriber(destination, zone) {
        _super.call(this, destination);
        this.zone = zone;
    }
    ZoneSubscriber.prototype._next = function (value) {
        var _this = this;
        var zone = getParentZone(this.zone);
        this.zone.run(function () { return _this.destination.next(value); });
        runZone(zone);
    };
    ZoneSubscriber.prototype._complete = function () {
        var _this = this;
        var zone = getParentZone(this.zone);
        this.zone.run(function () { return _this.destination.complete(); });
        runZone(zone);
    };
    ZoneSubscriber.prototype._error = function (err) {
        var _this = this;
        var zone = getParentZone(this.zone);
        this.zone.run(function () { return _this.destination.error(err); });
        runZone(zone);
    };
    return ZoneSubscriber;
}(Subscriber));
Observable.prototype.zone = zone;
//# sourceMappingURL=zone.js.map