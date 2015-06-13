/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";var __extends=this.__extends||function(e,t){function n(){this.constructor=e}for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);n.prototype=t.prototype,e.prototype=new n};define("vs/platform/request/nativeWorkerRequestService",["require","exports","vs/platform/services","vs/base/lib/winjs.base","vs/base/performance/timer","vs/base/async","vs/base/strings","vs/nls!vs/platform/request/nativeWorkerRequestService"],function(e,t,n,r,i,o,s,a){var l=function(t){function n(n){t.call(this,n),this._threadService=n.threadService,n.threadService.registerInstance(this),n.contextService.getConfiguration().processWorkers&&(this._nodeJSXHRFunctionPromise=new r.TPromise(function(t,n){e(["vs/native!server/contrib/http/rawHttpService"],function(e){t(e.xhr)},n)}))}return __extends(n,t),n.prototype.getId=function(){return"NativeRequestService"},n.prototype.makeRequest=function(e){var n=e.url;if(!n)throw new Error("IRequestService.makeRequest: Url is required");return s.startsWith(n,"file://")?r.xhr(e).then(null,function(e){return 0===e.status&&e.responseText?e:r.Promise.wrapError(new Error(a.localize("vs_platform_request_nativeWorkerRequestService",0)))}):t.prototype.makeRequest.call(this,e)},n.prototype.makeCrossOriginRequest=function(e){if(e.url.indexOf("localhost")>0)return null;if(this._nodeJSXHRFunctionPromise){var t=i.nullEvent;return this._telemetryService&&(t=this._telemetryService.start("NativeXHR",{url:e.url},!1)),this._nodeJSXHRFunctionPromise.then(function(n){return o.always(n(e),function(e){t.data&&(t.data.status=e.status),t.stop()})})}return this._threadService.MainThread(this,"makeCrossOriginRequest",null,[e])},n}(n.BaseRequestService);t.NativeWorkerRequestService=l});