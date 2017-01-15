'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
import { Observable, Subscriber } from 'rxjs';
export function select(field) {
    return this.lift(new SelectOperator(field));
}
var SelectOperator = (function () {
    function SelectOperator(field) {
        this.field = field;
    }
    SelectOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SelectSubscriber(subscriber, this.field));
    };
    return SelectOperator;
}());
var SelectSubscriber = (function (_super) {
    __extends(SelectSubscriber, _super);
    function SelectSubscriber(destination, field) {
        var _this = _super.call(this, destination) || this;
        _this.field = field;
        return _this;
    }
    SelectSubscriber.prototype._next = function (value) {
        var _this = this;
        if (value && value instanceof Array) {
            var value0 = value[0];
            if (value0 && value0[this.field] instanceof Array) {
                var reduced = value
                    .map(function (docs) { return docs[_this.field]; })
                    .reduce(function (result, fields) { return result.concat(fields); }, []);
                return this.destination.next(reduced);
            }
            var result = value.map(function (doc) { return doc[_this.field]; });
            return this.destination.next(result);
        }
        this.destination.next(value && value[this.field]);
    };
    SelectSubscriber.prototype._complete = function () {
        this.destination.complete();
    };
    SelectSubscriber.prototype._error = function (err) {
        this.destination.error(err);
    };
    return SelectSubscriber;
}(Subscriber));
Observable.prototype.select = select;
//# sourceMappingURL=select.js.map