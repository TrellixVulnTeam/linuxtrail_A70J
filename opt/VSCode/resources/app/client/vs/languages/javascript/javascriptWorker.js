/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";define("vs/languages/javascript/javascript.configuration",["require","exports","vs/base/severity","vs/base/collections"],function(e,r,s,n){var o=function(){function e(e){this._lintSettings=e,this._severities={},this._severities[2322]=this._severities[2323]=this._severities[2345]=s.fromValue(e.forcedTypeConversion),this._severities[2362]=this._severities[2363]=this._severities[2365]=this._severities[2356]=this._severities[2357]=s.fromValue(e.mixedTypesArithmetics),this._severities[2359]=this._severities[2358]=s.fromValue(e.primitivesInInstanceOf),this._severities[2339]=s.fromValue(e.unknownProperty),this._severities[2304]=s.fromValue(e.undeclaredVariables),this._severities[2403]=s.fromValue(e.redeclaredVariables),this._severities[2350]=s.fromValue(e.newOnReturningFunctions)}return e.prototype.classify=function(e){var r=e.code;return 2e3>r?s.Error:2339===r&&n.lookup(this._severities,r)!==s.Ignore&&/The property '[\w\d_]+' does not exist on value of type '(any|{})'\./.test(e.messageText)?s.Ignore:n.lookup(this._severities,r,s.Ignore)},e}();r.JavaScriptDiagnosticsClassifier=o,r.defaultLintSettings={curlyBracketsMustNotBeOmitted:"ignore",emptyBlocksWithoutComment:"ignore",comparisonOperatorsNotStrict:"ignore",missingSemicolon:"ignore",reservedKeywords:"warning",typeScriptSpecifics:"warning",unknownTypeOfResults:"warning",semicolonsInsteadOfBlocks:"ignore",functionsInsideLoops:"ignore",tripleSlashReferenceAlike:"warning",unusedVariables:"warning",unusedFunctions:"ignore",newOnLowercaseFunctions:"warning",newOnReturningFunctions:"warning",redeclaredVariables:"warning",undeclaredVariables:"warning",unknownProperty:"ignore",primitivesInInstanceOf:"error",mixedTypesArithmetics:"warning",forcedTypeConversion:"warning"},r._internalDefaultValidationSettings={scope:"/",baseUrl:"",noImplicitAny:!1,noLib:!1,extraLibs:["vs/text!vs/languages/typescript/lib/lib.d.ts"],semanticValidation:!0,syntaxValidation:!0,target:"ES5",module:"",lint:r.defaultLintSettings},r.defaultValidationSettings={target:"ES5",module:"",baseUrl:"",lint:r.defaultLintSettings},r.defaultSuggestSettions={alwaysAllWords:!1,useCodeSnippetsOnMethodSuggest:!1}});var __extends=this.__extends||function(e,r){function s(){this.constructor=e}for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n]);s.prototype=r.prototype,e.prototype=new s};define("vs/languages/typescript/js/textEdits",["require","exports","vs/base/arrays","vs/base/strings","vs/base/collections"],function(e,r,s,n,o){function t(e,r){return-a(e,r)}function a(e,r){return e.offset===r.offset?r.length-e.length:r.offset-e.offset}function i(e){var r={};s.forEach(e,function(e,s){if(e.isInsert()){var n=o.lookupOrInsert(r,e.offset,e);n!==e&&(n.text+=e.text,s())}})}function l(e,r){var s,o=[],t=r.length,l=[],c=[];i(e),e.sort(a);for(var d=0,u=e.length;u>d;d++)s=e[d],o.push(r.substring(s.end,t)),o.push(s.text),t=s.offset,l.push(s.deltaLength),c.push(new m(s.offset,s.text.length,r.substr(s.offset,s.length)));o.push(r.substring(0,t));for(var h=0,d=c.length-1;d>=0;d--)c[d].offset+=h,h+=l[d];return{value:o.reverse().join(n.empty),doEdits:e,undoEdits:c}}function c(e,r,s){"undefined"==typeof s&&(s=u.None),e.sort(t);for(var n,o=0,a=0,i=e.length;i>a;a++)if(n=e[a],n.end<r)o+=n.deltaLength;else{if(n.offset>r)break;n.offset<=r&&n.end>=r&&(s===u.None?o+=Math.min(0,n.offset+(n.length+n.deltaLength)-r):s===u.StickLeft?o+=n.offset-r:s===u.StickRight&&(o+=n.end+n.deltaLength-r))}return r+o}var d=function(){function e(e,r){this.offset=e,this.length=r}return e.from=function(r){return new e(r.offset,r.length)},Object.defineProperty(e.prototype,"end",{get:function(){return this.offset+this.length},enumerable:!0,configurable:!0}),e.prototype.equals=function(e){return this.offset===e.offset&&this.length===e.length},e.prototype.before=function(e){return this.end<=e.offset},e.prototype.after=function(r){return new e(r.offset,r.length).before(this)},e.prototype.contains=function(e){return e.offset>=this.offset&&e.offset<this.end&&e.offset+e.length<=this.end},e.prototype.overlaps=function(r){var s=new e(r.offset,r.length);return this.offset<s.offset&&this.end>=s.offset&&this.end<=s.end||s.offset<this.offset&&s.end>=this.offset&&s.end<=this.end},e}();r.TextSpan=d;var m=function(e){function r(r,s,n){e.call(this,r,s),this.text=n}return __extends(r,e),Object.defineProperty(r.prototype,"deltaLength",{get:function(){return this.text.length-this.length},enumerable:!0,configurable:!0}),Object.defineProperty(r.prototype,"deltaEnd",{get:function(){return this.end+this.deltaLength},enumerable:!0,configurable:!0}),r.prototype.isInsert=function(){return 0===this.length&&this.text.length>0},r.prototype.isReplace=function(){return this.length>0&&this.text.length>0},r.prototype.isDelete=function(){return this.length>0&&0===this.text.length},r.prototype.equals=function(r){return this.text===r.text&&e.prototype.equals.call(this,r)},r.prototype.toString=function(){return n.format("{0}-{1}/{2}",this.offset,this.length,this.text)},r}(d);r.Edit=m,r.compareAscending=t,r.compareDecending=a,r.apply=l,function(e){e[e.None=0]="None",e[e.StickLeft=1]="StickLeft",e[e.StickRight=2]="StickRight"}(r.TranslationBehaviour||(r.TranslationBehaviour={}));var u=r.TranslationBehaviour;r.translate=c}),define("vs/languages/typescript/js/javaScriptRewriter",["require","exports","vs/base/strings","vs/languages/typescript/lib/typescriptServices","vs/languages/typescript/js/textEdits"],function(e,r,s,n,o){function t(e,r,s){r||(r=n.createSourceFile("fakefilename.ts",s,n.ScriptTarget.ES5,"",!1),n.bindSourceFile(r));for(var t=new l(r),a=0,i=e.length;i>a;a++)e[a].computeEdits(t);return 0===t.edits.length?{value:s,doEdits:[],undoEdits:[]}:o.apply(t.edits,s)}function a(e){return"function"==typeof e.computeEdits&&1===e.computeEdits.length}var i=function(){function e(){}return e.prototype.to=function(e){return e},e.prototype.from=function(e){return e},Object.defineProperty(e.prototype,"report",{get:function(){return{isInserted:function(){return!1}}},enumerable:!0,configurable:!0}),e.Instance=new e,e}();r.IdentityTranslator=i,r.translate=t;var l=function(){function e(e){this.sourceFile=e,this.sourceUnitStart=e.getStart(),this.edits=[]}return e.prototype.newInsert=function(e,r){var s;"string"==typeof e?(s=this.sourceUnitStart,r=e):s=e,this.edits.push(new o.Edit(s,0,r))},e.prototype.newDelete=function(e,r){this.edits.push(new o.Edit(e,r,s.empty))},e.prototype.newReplace=function(e,r,s){this.edits.push(new o.Edit(e,r,s))},e.prototype.newAppend=function(e){this.edits.push(new o.Edit(this.sourceFile.getFullWidth(),0,e))},e}();r.AnalyzerContext=l,r.isISyntaxRewriter=a});var __extends=this.__extends||function(e,r){function s(){this.constructor=e}for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n]);s.prototype=r.prototype,e.prototype=new s};define("vs/languages/javascript/project/languageServiceHosts",["require","exports","vs/base/strings","vs/editor/core/position","vs/languages/typescript/lib/typescriptServices","vs/languages/typescript/js/javaScriptRewriter","vs/languages/typescript/js/textEdits"],function(e,r,s,n,o,t,a){var i=function(){function e(e){this._delegate=e}return e.prototype.dispose=function(){this._delegate.dispose()},e.prototype.getStateId=function(){return this._delegate.getStateId()},e.prototype.addScriptSnapshot=function(e,r){return this._delegate.addScriptSnapshot(e,r)},e.prototype.removeScriptSnapshot=function(e){return this._delegate.removeScriptSnapshot(e)},e.prototype.getCompilationSettings=function(){return this._delegate.getCompilationSettings()},e.prototype.getScriptFileNames=function(){return this._delegate.getScriptFileNames()},e.prototype.getScriptVersion=function(e){return this._delegate.getScriptVersion(e)},e.prototype.getScriptIsOpen=function(e){return this._delegate.getScriptIsOpen(e)},e.prototype.getScriptSnapshot=function(e){return this._delegate.getScriptSnapshot(e)},e.prototype.getLocalizedDiagnosticMessages=function(){return this._delegate.getLocalizedDiagnosticMessages()},e.prototype.getCancellationToken=function(){return this._delegate.getCancellationToken()},e.prototype.getCurrentDirectory=function(){return this._delegate.getCurrentDirectory()},e.prototype.getDefaultLibFilename=function(e){return this._delegate.getDefaultLibFilename(e)},e.prototype.log=function(e){this._delegate.log(e)},e}();r.DelegateLanguageServiceHost=i;var l=function(){function e(e){this._lineStarts=e.getLineStartPositions()}return e.prototype.getPosition=function(e,r){return o.getPositionFromLineAndCharacter(this._lineStarts,e,r)},e.prototype.getLineAndCharacterFromPosition=function(e){return o.getLineAndCharacterOfPosition(this._lineStarts,e)},e}(),c=function(){function e(e,r,s){this._textOperationResult=e,this._lineMapModified=new l(r),this._lineMapOriginal=new l(s)}return e.prototype.to=function(e){if(n.isIPosition(e))return this._doTranslate(this._textOperationResult.doEdits,this._lineMapOriginal,this._lineMapModified,e,a.TranslationBehaviour.None);var r=e,s=this._doTranslate(this._textOperationResult.doEdits,this._lineMapOriginal,this._lineMapModified,{lineNumber:r.startLineNumber,column:r.startColumn},a.TranslationBehaviour.None),o=this._doTranslate(this._textOperationResult.doEdits,this._lineMapOriginal,this._lineMapModified,{lineNumber:r.endLineNumber,column:r.endColumn},a.TranslationBehaviour.None);return{startLineNumber:s.lineNumber,startColumn:s.column,endLineNumber:o.lineNumber,endColumn:o.column}},e.prototype.from=function(e){if(n.isIPosition(e))return this._doTranslate(this._textOperationResult.undoEdits,this._lineMapModified,this._lineMapOriginal,e,a.TranslationBehaviour.None);var r=e,s=this._doTranslate(this._textOperationResult.undoEdits,this._lineMapModified,this._lineMapOriginal,{lineNumber:r.startLineNumber,column:r.startColumn},a.TranslationBehaviour.StickLeft),o=this._doTranslate(this._textOperationResult.undoEdits,this._lineMapModified,this._lineMapOriginal,{lineNumber:r.endLineNumber,column:r.endColumn},a.TranslationBehaviour.StickRight);return{startLineNumber:s.lineNumber,startColumn:s.column,endLineNumber:o.lineNumber,endColumn:o.column}},e.prototype._doTranslate=function(e,r,s,n,o){var t=r.getPosition(n.lineNumber,n.column),i=a.translate(e,t,o),l=s.getLineAndCharacterFromPosition(i);return{lineNumber:l.line,column:l.character}},Object.defineProperty(e.prototype,"report",{get:function(){return this},enumerable:!0,configurable:!0}),e.prototype.isInserted=function(e){var r;r=n.isIPosition(e)?n.PositionUtils.asEmptyRange(e):e;for(var s=this._lineMapModified.getPosition(r.startLineNumber,r.startColumn),o=this._lineMapModified.getPosition(r.endLineNumber,r.endColumn),t=this._textOperationResult.undoEdits,i=0,l=t.length;l>i;i++)if(t[i].contains(new a.TextSpan(s,o-s)))return!0;return!1},e}(),d=function(){function e(e){this._value=e,this._lineStarts=o.computeLineStarts(e)}return e.prototype.getText=function(e,r){return this._value.substring(e,r)},e.prototype.getLength=function(){return this._value.length},e.prototype.getLineStartPositions=function(){return this._lineStarts},e.prototype.getChangeRange=function(){return null},e}(),m=function(e){function r(r,s){e.call(this,r),this._rewriter=s,this._rewrittenSnapshots=Object.create(null)}return __extends(r,e),r.prototype.dispose=function(){},r.prototype.getScriptSnapshot=function(r){var s=this._getOrCreateRewrittenSnapshot(r);return s?s.snapshot:e.prototype.getScriptSnapshot.call(this,r)},r.prototype.getTranslator=function(e){var r=this._getOrCreateRewrittenSnapshot(e);return r?r.translator:null},r.prototype._getOrCreateRewrittenSnapshot=function(r){if(!s.endsWith(r,".js"))return null;if(!e.prototype.getScriptSnapshot.call(this,r))return null;var n=this.getScriptVersion(r),o=this._rewrittenSnapshots[r];if(!o||o.versionId!==n){var a=e.prototype.getScriptSnapshot.call(this,r),i=t.translate(this._rewriter,null,a.getText(0,a.getLength())),l=new d(i.value);o={versionId:this.getScriptVersion(r),snapshot:l,translator:new c(i,l,a)},this._rewrittenSnapshots[r]=o}return o},r}(i);r.RewritingLanguageServiceHost=m}),define("vs/languages/typescript/js/shebangRewriter",["require","exports"],function(){var e=function(){function e(){}return e.prototype.computeEdits=function(r){var s=r.sourceFile.getFullText();if(s.charCodeAt(0)===e._hash&&s.charCodeAt(1)===e._bang){var n=~s.indexOf("\n")||~s.indexOf("\r");n=n?~n:s.length,r.newDelete(0,n)}},e._hash="#".charCodeAt(0),e._bang="!".charCodeAt(0),e}();return e});var __extends=this.__extends||function(e,r){function s(){this.constructor=e}for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n]);s.prototype=r.prototype,e.prototype=new s};define("vs/languages/javascript/project/javascriptProject",["require","exports","vs/languages/typescript/lib/typescriptServices","vs/languages/javascript/project/languageServiceHosts","vs/languages/typescript/project/typescriptProject","vs/languages/typescript/js/javaScriptRewriter","vs/languages/typescript/js/shebangRewriter"],function(e,r,s,n,o,t,a){var i=function(e){function r(r,s,n,o,t,i,l,c){e.call(this,r,n,o,t,i,l,c),this._rewriter=s,this._rewriter.push(new a)}return __extends(r,e),r.prototype.syntaxLanguageService=function(){if(!this._syntaxLanguageService){var r=e.prototype.syntaxLanguageService.call(this),o=new n.RewritingLanguageServiceHost(r.host,[new a]);this._disposables.push(o),this._applyCompileConfig(o.getCompilationSettings());var t=s.createLanguageService(o,s.createDocumentRegistry());t.host=o,this._disposables.push(o),this._syntaxLanguageService=t}return this._syntaxLanguageService},r.prototype.semanticLanguageService=function(){if(!this._semanticLanguageService){var r=e.prototype.semanticLanguageService.call(this),o=new n.RewritingLanguageServiceHost(r.host,this._rewriter);this._disposables.push(o),this._applyCompileConfig(o.getCompilationSettings());var t=s.createLanguageService(o,s.createDocumentRegistry());t.host=o,this._semanticLanguageService=t}return this._semanticLanguageService},r.prototype.getTranslater=function(e){var r=this.semanticLanguageService().host;return r.getTranslator(e.toString())||t.IdentityTranslator.Instance},r}(o.TypeScriptProject);r.JavascriptProject=i});var __extends=this.__extends||function(e,r){function s(){this.constructor=e}for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n]);s.prototype=r.prototype,e.prototype=new s};define("vs/languages/javascript/javascriptWorker",["require","exports","vs/base/strings","vs/base/objects","vs/base/arrays","vs/editor/modes/modesFilters","vs/editor/core/model/mirrorModel","vs/languages/typescript/typescriptWorker2","vs/languages/typescript/typescript.configuration","vs/languages/javascript/javascript.configuration","vs/languages/typescript/js/javaScriptRewriter","vs/languages/javascript/project/javascriptProject","vs/languages/typescript/features/validationStrategy"],function(e,r,s,n,o,t,a,i,l,c,d,m,u){var h=function(e){function r(r,s,n){e.call(this,r,s,n)}return __extends(r,e),r.prototype._doConfigure=function(r){for(var s=l.sanitize(r,c._internalDefaultValidationSettings,c.defaultSuggestSettions),n=0,o=s.validate.length;o>n;n++){var t=new c.JavaScriptDiagnosticsClassifier(s.validate[n].lint);s.validate[n].diagnosticClassifier=t.classify.bind(t)}return e.prototype._doConfigure.call(this,s)},r.prototype._isMirrorModelAndMyMode=function(r){var n=e.prototype._isMirrorModelAndMyMode.call(this,r);if(n)return!0;if(!(r instanceof a.AbstractMirrorModel))return!1;var o=r,t=o.getModeId();if("typescript"!==t)return!1;var i=o.getAssociatedResource().getPath();return s.endsWith(i,"_references.ts")||s.endsWith(i,".d.ts")?!0:!1},r.prototype._createProject=function(e,r,s,n,o){return this._instantiationService.createInstance(m.JavascriptProject,this._getWorkerParticipants(function(e){return d.isISyntaxRewriter(e)}),this._getMode(),e,s,r,n,o)},r.prototype.translator=function(e){var r=this.findProject(e);return r.getTranslater(e)},r.prototype._isRelevantForValidationPurposes=function(e){return s.endsWith(e.toString(),".d.ts")||s.endsWith(e.toString(),"_references.ts")},r.prototype._shouldValidate=function(e){return!this._isRelevantForValidationPurposes(e)},r.prototype.doValidateOnChange=function(r,s,n){var o=this._shouldValidate.bind(this);e.prototype.doValidateOnChange.call(this,r.filter(o),s.filter(o),n)},r.prototype._shouldIncludeModelInValidation=function(r){if(!(r instanceof a.MirrorModel||r instanceof a.MirrorModelEmbedded))return!1;if(e.prototype._shouldIncludeModelInValidation.call(this,r))return!0;var s=r;return this._isRelevantForValidationPurposes(s.getAssociatedResource())},r.prototype._publishMarkersForResource=function(r,s,n){if(s!==u.ValidationType.Syntax){var t=this.translator(r);o.forEach(n,function(e,r){var s={startLineNumber:e.startLineNumber,startColumn:e.startColumn,endLineNumber:e.endLineNumber,endColumn:e.endColumn};t.report.isInserted(s)?r():(s=t.from(s),e.startLineNumber=s.startLineNumber,e.startColumn=s.startColumn,e.endLineNumber=s.endLineNumber,e.endColumn=s.endColumn)})}return e.prototype._publishMarkersForResource.call(this,r,s,n)},r.prototype.doSuggest=function(r,s){return e.prototype.doSuggest.call(this,r,this.translator(r).to(s))},r.prototype.getSuggestionFilter=function(){return t.and(function(e,r){return r.label.indexOf("̲")<0},e.prototype.getSuggestionFilter.call(this))},r.prototype.getSuggestionDetails=function(r,s,n){return e.prototype.getSuggestionDetails.call(this,r,this.translator(r).to(s),n)},r.prototype.getParameterHints=function(r,s){return e.prototype.getParameterHints.call(this,r,this.translator(r).to(s))},r.prototype.findOccurrences=function(r,s,n){var t=this;return e.prototype.findOccurrences.call(this,r,this.translator(r).to(s),n).then(function(e){return o.forEach(e,function(e,s){t.translator(r).report.isInserted(e.range)?s():e.range=t.translator(r).from(e.range)}),e})},r.prototype._findTypeScriptDeclaration=function(r,s){var n=this;return e.prototype._findTypeScriptDeclaration.call(this,r,this.translator(r).to(s)).then(function(e){if(e){var r=n.translator(e.resourceUrl);if(!r.report.isInserted(e.range))return e.range=r.from(e.range),e}return null})},r.prototype.findReferences=function(r,s,n){var t=this;return e.prototype.findReferences.call(this,r,this.translator(r).to(s),n).then(function(e){return o.forEach(e,function(e,r){var s=t.translator(e.resourceUrl);s.report.isInserted(e.range)?r():e.range=s.from(e.range)}),e})},r.prototype.computeInfo=function(r,s){var n=this;return e.prototype.computeInfo.call(this,r,this.translator(r).to(s)).then(function(e){return e&&(e.range=n.translator(r).from(e.range)),e})},r.prototype.runQuickFixAction=function(r,s,n){var o=this.translator(r);return e.prototype.runQuickFixAction.call(this,r,o.to(s),n).then(function(e){return e&&e.editOperations.forEach(function(e){return e.range=o.from(e.range)}),e})},r.prototype.getQuickFixes=function(r,s){var o=this.translator(r).to(s);return n.mixin(o,s,!1),e.prototype.getQuickFixes.call(this,r,o)},r}(i.TypeScriptWorker2);r.JavaScriptWorker=h});