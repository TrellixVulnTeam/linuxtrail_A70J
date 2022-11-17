/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
define("vs/css!vs/workbench/parts/debug/browser/media/debugViewlet",["vs/css!vs/workbench/parts/debug/browser/debugViewlet"],{});var __extends=this&&this.__extends||function(e,t){function i(){this.constructor=e}for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);e.prototype=null===t?Object.create(t):(i.prototype=t.prototype,new i)},__decorate=this&&this.__decorate||function(e,t,i,n){if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)return Reflect.decorate(e,t,i,n);switch(arguments.length){case 2:return e.reduceRight(function(e,t){return t&&t(e)||e},t);case 3:return e.reduceRight(function(e,n){return void(n&&n(t,i))},void 0);case 4:return e.reduceRight(function(e,n){return n&&n(t,i,e)||e},n)}},__param=this&&this.__param||function(e,t){return function(i,n){t(i,n,e)}};define("vs/workbench/parts/debug/browser/debugActionItems",["require","exports","vs/base/common/lifecycle","vs/base/common/errors","vs/base/browser/dom","vs/base/browser/ui/actionbar/actionbar","vs/workbench/parts/debug/common/debug","vs/platform/configuration/common/configuration"],function(e,t,i,n,o,s,r,a){var c=function(e){function t(t,i,n){e.call(this,null,t),this.debugService=i,this.select=document.createElement("select"),this.select.className="debug-select action-bar-select",this.toDispose=[],this.registerListeners(n)}return __extends(t,e),t.prototype.registerListeners=function(e){var t=this;this.toDispose.push(o.addStandardDisposableListener(this.select,"change",function(e){t.actionRunner.run(t._action,e.target.value).done(null,n.onUnexpectedError)})),this.toDispose.push(this.debugService.addListener2(r.ServiceEvents.STATE_CHANGED,function(){t.select.disabled=t.debugService.getState()!==r.State.Inactive})),this.toDispose.push(e.addListener2(a.ConfigurationServiceEventTypes.UPDATED,function(e){t.setOptions().done(null,n.onUnexpectedError)}))},t.prototype.render=function(e){o.addClass(e,"select-container"),e.appendChild(this.select),this.setOptions().done(null,n.onUnexpectedError)},t.prototype.focus=function(){this.select&&this.select.focus()},t.prototype.blur=function(){this.select&&this.select.blur()},t.prototype.setOptions=function(){var e=this,t=this.select.selectedIndex;return this.select.options.length=0,this.debugService.loadLaunchConfig().then(function(i){if(!i||!i.configurations)return e.select.options.add(e.createOption("<none>")),void(e.select.disabled=!0);var n=i.configurations;e.select.disabled=n.length<1;for(var o=!1,s=e.debugService.getConfigurationName(),r=0;r<n.length;r++)e.select.options.add(e.createOption(n[r].name)),s===n[r].name&&(e.select.selectedIndex=r,o=!0);return!o&&n.length>0?((!t||0>t||t>=n.length)&&(t=0),e.select.selectedIndex=t,e.actionRunner.run(e._action,n[t].name)):void 0})},t.prototype.createOption=function(e){var t=document.createElement("option");return t.value=e,t.text=e,t},t.prototype.dispose=function(){this.debugService=null,this.toDispose=i.disposeAll(this.toDispose),e.prototype.dispose.call(this)},t=__decorate([__param(1,r.IDebugService),__param(2,a.IConfigurationService)],t)}(s.BaseActionItem);t.SelectConfigActionItem=c});var __extends=this&&this.__extends||function(e,t){function i(){this.constructor=e}for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);e.prototype=null===t?Object.create(t):(i.prototype=t.prototype,new i)},__decorate=this&&this.__decorate||function(e,t,i,n){if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)return Reflect.decorate(e,t,i,n);switch(arguments.length){case 2:return e.reduceRight(function(e,t){return t&&t(e)||e},t);case 3:return e.reduceRight(function(e,n){return void(n&&n(t,i))},void 0);case 4:return e.reduceRight(function(e,n){return n&&n(t,i,e)||e},n)}},__param=this&&this.__param||function(e,t){return function(i,n){t(i,n,e)}};define("vs/workbench/parts/debug/browser/debugViewlet",["require","exports","vs/nls!vs/workbench/parts/debug/browser/debugViewlet","vs/base/browser/dom","vs/base/browser/builder","vs/base/common/winjs.base","vs/base/common/errors","vs/base/common/lifecycle","vs/base/common/events","vs/workbench/browser/actionBarRegistry","vs/base/parts/tree/browser/treeImpl","vs/base/browser/ui/splitview/splitview","vs/workbench/common/memento","vs/workbench/browser/viewlet","vs/workbench/parts/debug/common/debug","vs/workbench/parts/debug/common/debugModel","vs/workbench/parts/debug/browser/debugViewer","vs/workbench/parts/debug/electron-browser/debugActions","vs/workbench/parts/debug/browser/debugActionItems","vs/platform/contextview/browser/contextView","vs/platform/instantiation/common/instantiation","vs/platform/progress/common/progress","vs/platform/workspace/common/workspace","vs/platform/telemetry/common/telemetry","vs/platform/message/common/message","vs/platform/storage/common/storage","vs/css!./media/debugViewlet"],function(e,t,i,n,o,s,r,a,c,l,p,d,u,h,v,g,S,f,b,m,E,w,_,A,y,x){function I(e){var t=document.createElement("div");return n.addClass(t,"debug-view-content"),e.appendChild(t),t}var D=v.IDebugService,C=function(e){return{indentPixels:8,twistiePixels:20,ariaLabel:e}},M=o.$,B=function(e){function t(n,o,s,r,a,c){e.call(this,n,!!o[t.MEMENTO],i.localize(0,null),s,r),this.settings=o,this.debugService=a,this.instantiationService=c}return __extends(t,e),t.prototype.renderHeader=function(t){e.prototype.renderHeader.call(this,t);var n=M("div.title").appendTo(t);M("span").text(i.localize(1,null)).appendTo(n)},t.prototype.renderBody=function(e){var t=this;n.addClass(e,"debug-variables"),this.treeContainer=I(e),this.tree=new p.Tree(this.treeContainer,{dataSource:new S.VariablesDataSource(this.debugService),renderer:this.instantiationService.createInstance(S.VariablesRenderer),controller:new S.BaseDebugController(this.debugService,this.contextMenuService,new S.VariablesActionProvider(this.instantiationService))},C(i.localize(2,null)));var o=this.debugService.getViewModel();this.tree.setInput(o);var s=this.instantiationService.createInstance(h.CollapseAction,this.tree,!1,"explorer-action collapse-explorer");this.toolBar.setActions(l.prepareActions([s]))(),this.toDispose.push(o.addListener2(v.ViewModelEvents.FOCUSED_STACK_FRAME_UPDATED,function(){return t.onFocusedStackFrameUpdated()})),this.toDispose.push(this.debugService.addListener2(v.ServiceEvents.STATE_CHANGED,function(){s.enabled=t.debugService.getState()===v.State.Running||t.debugService.getState()===v.State.Stopped}))},t.prototype.onFocusedStackFrameUpdated=function(){var e=this;this.tree.refresh().then(function(){var t=e.debugService.getViewModel().getFocusedStackFrame();return t?t.getScopes(e.debugService).then(function(t){return t.length>0?e.tree.expand(t[0]):void 0}):void 0}).done(null,r.onUnexpectedError)},t.prototype.shutdown=function(){this.settings[t.MEMENTO]=this.state===d.CollapsibleState.COLLAPSED,e.prototype.shutdown.call(this)},t.MEMENTO="variablesview.memento",t=__decorate([__param(2,y.IMessageService),__param(3,m.IContextMenuService),__param(4,D),__param(5,E.IInstantiationService)],t)}(h.CollapsibleViewletView),T=function(e){function t(n,o,s,r,a,c){var l=this;e.call(this,n,!!o[t.MEMENTO],i.localize(3,null),s,r),this.settings=o,this.debugService=a,this.instantiationService=c,this.toDispose.push(this.debugService.getModel().addListener2(v.ModelEvents.WATCH_EXPRESSIONS_UPDATED,function(e){e instanceof g.Expression&&l.expand()}))}return __extends(t,e),t.prototype.renderHeader=function(t){e.prototype.renderHeader.call(this,t);var n=M("div.title").appendTo(t);M("span").text(i.localize(4,null)).appendTo(n)},t.prototype.renderBody=function(e){var t=this;n.addClass(e,"debug-watch"),this.treeContainer=I(e);var o=new S.WatchExpressionsActionProvider(this.instantiationService);this.tree=new p.Tree(this.treeContainer,{dataSource:new S.WatchExpressionsDataSource(this.debugService),renderer:this.instantiationService.createInstance(S.WatchExpressionsRenderer,o,this.actionRunner),controller:new S.WatchExpressionsController(this.debugService,this.contextMenuService,o)},C(i.localize(5,null))),this.tree.setInput(this.debugService.getModel());var s=this.instantiationService.createInstance(f.AddWatchExpressionAction,f.AddWatchExpressionAction.ID,f.AddWatchExpressionAction.LABEL),a=this.instantiationService.createInstance(h.CollapseAction,this.tree,!1,"explorer-action collapse-explorer"),d=this.instantiationService.createInstance(f.RemoveAllWatchExpressionsAction,f.RemoveAllWatchExpressionsAction.ID,f.RemoveAllWatchExpressionsAction.LABEL);this.toolBar.setActions(l.prepareActions([s,a,d]))(),this.toDispose.push(this.debugService.getModel().addListener2(v.ModelEvents.WATCH_EXPRESSIONS_UPDATED,function(e){return t.onWatchExpressionsUpdated(e)})),this.toDispose.push(this.debugService.getViewModel().addListener2(v.ViewModelEvents.SELECTED_EXPRESSION_UPDATED,function(e){e&&e instanceof g.Expression&&t.tree.refresh(e,!1).then(function(){t.tree.setHighlight(e);var i=t.tree.addListener(c.EventType.HIGHLIGHT,function(n){n.highlight||(t.debugService.getViewModel().setSelectedExpression(null),t.tree.refresh(e).done(null,r.onUnexpectedError),i())})}).done(null,r.onUnexpectedError)}))},t.prototype.onWatchExpressionsUpdated=function(e){var t=this;this.tree.refresh().done(function(){return e instanceof g.Expression?t.tree.reveal(e):s.Promise.as(!0)},r.onUnexpectedError)},t.prototype.shutdown=function(){this.settings[t.MEMENTO]=this.state===d.CollapsibleState.COLLAPSED,e.prototype.shutdown.call(this)},t.MEMENTO="watchexpressionsview.memento",t=__decorate([__param(2,y.IMessageService),__param(3,m.IContextMenuService),__param(4,D),__param(5,E.IInstantiationService)],t)}(h.CollapsibleViewletView),L=function(e){function t(n,o,s,r,a,c){e.call(this,n,!!o[t.MEMENTO],i.localize(6,null),s,r),this.settings=o,this.debugService=a,this.instantiationService=c}return __extends(t,e),t.prototype.renderHeader=function(t){e.prototype.renderHeader.call(this,t);var n=M("div.title").appendTo(t);M("span").text(i.localize(7,null)).appendTo(n)},t.prototype.renderBody=function(e){var t=this;n.addClass(e,"debug-call-stack"),this.renderMessageBox(e),this.treeContainer=I(e),this.tree=new p.Tree(this.treeContainer,{dataSource:new S.CallStackDataSource,renderer:this.instantiationService.createInstance(S.CallStackRenderer)},C(i.localize(8,null)));var o=this.debugService.getModel();this.tree.setInput(o),this.toDispose.push(this.tree.addListener2("selection",function(e){if(e.selection.length){var i=e.selection[0];if(i instanceof g.StackFrame){var n=i;t.debugService.setFocusedStackFrameAndEvaluate(n);var o="mouse"===e.payload.origin,s=o,a=e&&e.payload&&e.payload.originalEvent;a&&o&&2===a.detail&&(s=!1,a.preventDefault());var c=a&&(a.ctrlKey||a.metaKey);t.debugService.openOrRevealEditor(n.source,n.lineNumber,s,c).done(null,r.onUnexpectedError)}}})),this.toDispose.push(o.addListener2(v.ModelEvents.CALLSTACK_UPDATED,function(){t.tree.refresh().done(null,r.onUnexpectedError)})),this.toDispose.push(this.debugService.getViewModel().addListener2(v.ViewModelEvents.FOCUSED_STACK_FRAME_UPDATED,function(){var e=t.debugService.getModel().getThreads()[t.debugService.getViewModel().getFocusedThreadId()];return e&&e.stoppedReason&&"step"!==e.stoppedReason?(t.messageBox.textContent=i.localize(9,null,e.stoppedReason),"exception"===e.stoppedReason?t.messageBox.classList.add("exception"):t.messageBox.classList.remove("exception"),void(t.messageBox.hidden=!1)):void(t.messageBox.hidden=!0)})),this.toDispose.push(this.debugService.getViewModel().addListener2(v.ViewModelEvents.FOCUSED_STACK_FRAME_UPDATED,function(){var e=t.debugService.getViewModel().getFocusedStackFrame();if(e){var i=t.debugService.getModel().getThreads();for(var n in i)i[n].callStack.some(function(t){return t===e})&&t.tree.expand(i[n]);t.tree.setFocus(e)}}))},t.prototype.layoutBody=function(t){var i=this.messageBox&&!this.messageBox.hidden?t-27:t;e.prototype.layoutBody.call(this,i)},t.prototype.renderMessageBox=function(e){this.messageBox=document.createElement("div"),n.addClass(this.messageBox,"debug-message-box"),this.messageBox.hidden=!0,e.appendChild(this.messageBox)},t.prototype.shutdown=function(){this.settings[t.MEMENTO]=this.state===d.CollapsibleState.COLLAPSED,e.prototype.shutdown.call(this)},t.MEMENTO="callstackview.memento",t=__decorate([__param(2,y.IMessageService),__param(3,m.IContextMenuService),__param(4,D),__param(5,E.IInstantiationService)],t)}(h.CollapsibleViewletView),k=function(e){function t(n,o,s,r,a,c){var l=this;e.call(this,n,t.getExpandedBodySize(a.getModel().getBreakpoints().length+a.getModel().getFunctionBreakpoints().length+a.getModel().getExceptionBreakpoints().length),!!o[t.MEMENTO],i.localize(10,null),s,r),this.settings=o,this.debugService=a,this.instantiationService=c,this.toDispose.push(this.debugService.getModel().addListener2(v.ModelEvents.BREAKPOINTS_UPDATED,function(){return l.onBreakpointsChange()}))}return __extends(t,e),t.prototype.renderHeader=function(t){e.prototype.renderHeader.call(this,t);var n=M("div.title").appendTo(t);M("span").text(i.localize(11,null)).appendTo(n)},t.prototype.renderBody=function(e){var t=this;n.addClass(e,"debug-breakpoints"),this.treeContainer=I(e);var o=new S.BreakpointsActionProvider(this.instantiationService);this.tree=new p.Tree(this.treeContainer,{dataSource:new S.BreakpointsDataSource,renderer:this.instantiationService.createInstance(S.BreakpointsRenderer,o,this.actionRunner),controller:new S.BreakpointsController(this.debugService,this.contextMenuService,o),sorter:{compare:function(e,t,i){var n=t,o=i;return n instanceof g.ExceptionBreakpoint?-1:o instanceof g.ExceptionBreakpoint?1:n instanceof g.FunctionBreakpoint?-1:o instanceof g.FunctionBreakpoint?1:n.source.uri.toString()!==o.source.uri.toString()?n.source.uri.toString().localeCompare(o.source.uri.toString()):n.desiredLineNumber-o.desiredLineNumber}}},C(i.localize(12,null)));var s=this.debugService.getModel();this.tree.setInput(s),this.toDispose.push(this.tree.addListener2("selection",function(e){if(e.selection.length){var i=e.selection[0];if(i instanceof g.Breakpoint){var n=i;if(!n.source.inMemory){var o="mouse"===e.payload.origin,s=o,a=e&&e.payload&&e.payload.originalEvent;a&&o&&2===a.detail&&(s=!1,a.preventDefault());var c=a&&(a.ctrlKey||a.metaKey);t.debugService.openOrRevealEditor(n.source,n.lineNumber,s,c).done(null,r.onUnexpectedError)}}}}))},t.prototype.getActions=function(){return[this.instantiationService.createInstance(f.ReapplyBreakpointsAction,f.ReapplyBreakpointsAction.ID,f.ReapplyBreakpointsAction.LABEL),this.instantiationService.createInstance(f.ToggleBreakpointsActivatedAction,f.ToggleBreakpointsActivatedAction.ID,f.ToggleBreakpointsActivatedAction.LABEL),this.instantiationService.createInstance(f.RemoveAllBreakpointsAction,f.RemoveAllBreakpointsAction.ID,f.RemoveAllBreakpointsAction.LABEL)]},t.prototype.onBreakpointsChange=function(){var e=this.debugService.getModel();this.expandedBodySize=t.getExpandedBodySize(e.getBreakpoints().length+e.getExceptionBreakpoints().length+e.getFunctionBreakpoints().length),this.tree&&this.tree.refresh()},t.getExpandedBodySize=function(e){return 22*Math.min(t.MAX_VISIBLE_FILES,e)},t.prototype.shutdown=function(){this.settings[t.MEMENTO]=this.state===d.CollapsibleState.COLLAPSED,e.prototype.shutdown.call(this)},t.MAX_VISIBLE_FILES=9,t.MEMENTO="breakopintsview.memento",t=__decorate([__param(2,y.IMessageService),__param(3,m.IContextMenuService),__param(4,D),__param(5,E.IInstantiationService)],t)}(h.AdaptiveCollapsibleViewletView),R=function(e){function t(t,i,n,o,s,r){var a=this;e.call(this,v.VIEWLET_ID,t),this.progressService=i,this.debugService=n,this.instantiationService=o,this.contextService=s,this.progressRunner=null,this.viewletSettings=this.getMemento(r,u.Scope.WORKSPACE),this.views=[],this.toDispose=[],this.toDispose.push(this.debugService.addListener2(v.ServiceEvents.STATE_CHANGED,function(){a.onDebugServiceStateChange()}))}return __extends(t,e),t.prototype.create=function(t){var n=this;if(e.prototype.create.call(this,t),this.$el=t.div().addClass("debug-viewlet"),this.contextService.getWorkspace()){var o=this.getActionRunner();this.views.push(this.instantiationService.createInstance(B,o,this.viewletSettings)),this.views.push(this.instantiationService.createInstance(T,o,this.viewletSettings)),this.views.push(this.instantiationService.createInstance(L,o,this.viewletSettings)),this.views.push(this.instantiationService.createInstance(k,o,this.viewletSettings)),this.splitView=new d.SplitView(this.$el.getHTMLElement()),this.toDispose.push(this.splitView),this.views.forEach(function(e){return n.splitView.addView(e)})}else this.$el.append(M(['<div class="noworkspace-view">',"<p>",i.localize(13,null),"</p>","<p>",i.localize(14,null),"</p>","</div>"].join("")));return s.Promise.as(null)},t.prototype.setVisible=function(t){var i=this;return e.prototype.setVisible.call(this,t).then(function(){return s.Promise.join(i.views.map(function(e){return e.setVisible(t)}))})},t.prototype.layout=function(e){this.splitView&&this.splitView.layout(e.height)},t.prototype.focus=function(){e.prototype.focus.call(this),this.views.length>0&&this.views[0].focusBody()},t.prototype.getActions=function(){var e=this;return this.debugService.getState()===v.State.Disabled?[]:(this.actions||(this.actions=[this.instantiationService.createInstance(f.StartDebugAction,f.StartDebugAction.ID,f.StartDebugAction.LABEL),this.instantiationService.createInstance(f.SelectConfigAction,f.SelectConfigAction.ID,f.SelectConfigAction.LABEL),this.instantiationService.createInstance(f.ConfigureAction,f.ConfigureAction.ID,f.ConfigureAction.LABEL),this.instantiationService.createInstance(f.ToggleReplAction,f.ToggleReplAction.ID,f.ToggleReplAction.LABEL)],this.actions.forEach(function(t){e.toDispose.push(t)})),this.actions)},t.prototype.getActionItem=function(e){return e.id===f.SelectConfigAction.ID?this.instantiationService.createInstance(b.SelectConfigActionItem,e):null},t.prototype.onDebugServiceStateChange=function(){this.progressRunner&&this.progressRunner.done(),this.debugService.getState()===v.State.Initializing?this.progressRunner=this.progressService.show(!0):this.progressRunner=null},t.prototype.dispose=function(){this.toDispose=a.disposeAll(this.toDispose),e.prototype.dispose.call(this)},t.prototype.shutdown=function(){this.views.forEach(function(e){return e.shutdown()}),e.prototype.shutdown.call(this)},t=__decorate([__param(0,A.ITelemetryService),__param(1,w.IProgressService),__param(2,D),__param(3,E.IInstantiationService),__param(4,_.IWorkspaceContextService),__param(5,x.IStorageService)],t)}(h.Viewlet);t.DebugViewlet=R});