/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var Delayer = (function () {
    function Delayer(defaultDelay) {
        this.defaultDelay = defaultDelay;
        this.timeout = null;
        this.completionPromise = null;
        this.onSuccess = null;
        this.task = null;
    }
    Delayer.prototype.trigger = function (task, delay) {
        var _this = this;
        if (delay === void 0) { delay = this.defaultDelay; }
        this.task = task;
        if (delay >= 0) {
            this.cancelTimeout();
        }
        if (!this.completionPromise) {
            this.completionPromise = new Promise(function (resolve) {
                _this.onSuccess = resolve;
            }).then(function () {
                _this.completionPromise = null;
                _this.onSuccess = null;
                var result = _this.task();
                _this.task = null;
                return result;
            });
        }
        if (delay >= 0 || this.timeout === null) {
            this.timeout = setTimeout(function () {
                _this.timeout = null;
                _this.onSuccess(null);
            }, delay >= 0 ? delay : this.defaultDelay);
        }
        return this.completionPromise;
    };
    Delayer.prototype.forceDelivery = function () {
        if (!this.completionPromise) {
            return null;
        }
        this.cancelTimeout();
        var result = this.completionPromise;
        this.onSuccess(null);
        return result;
    };
    Delayer.prototype.isTriggered = function () {
        return this.timeout !== null;
    };
    Delayer.prototype.cancel = function () {
        this.cancelTimeout();
        this.completionPromise = null;
    };
    Delayer.prototype.cancelTimeout = function () {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    return Delayer;
})();
exports.Delayer = Delayer;
