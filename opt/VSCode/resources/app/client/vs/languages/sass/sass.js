/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";var __extends=this.__extends||function(e,t){function r(){this.constructor=e}for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);r.prototype=t.prototype,e.prototype=new r};define("vs/languages/sass/sass",["require","exports","vs/editor/modes/monarch/monarch","vs/editor/modes/monarch/monarchCompile","vs/base/lib/winjs.base","vs/editor/modes/modesExtensions","vs/platform/thread/attribute","vs/editor/modes/supports"],function(e,t,r,n,s,o,i,a){t.language={displayName:"SASS",name:"sass",mimeTypes:["text/x-scss"],fileExtensions:[".scss"],workerDescriptor:{moduleName:"vs/languages/sass/sassWorker",ctorName:"SassWorker"},nonWordTokens:["delimiter.curly.sass","delimiter.bracket.sass","delimiter.parenthesis.sass","delimiter.angle.sass"],wordDefinition:/(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g,defaultToken:"",lineComment:"//",blockCommentStart:"/*",blockCommentEnd:"*/",ws:"[ 	\n\r\f]*",brackets:[{open:"{",close:"}",token:"delimiter.curly"},{open:"[",close:"]",token:"delimiter.bracket"},{open:"(",close:")",token:"delimiter.parenthesis"},{open:"<",close:">",token:"delimiter.angle"}],tokenizer:{root:[{include:"@selector"},["[@](charset|namespace)",{token:"keyword",next:"@declarationbody"}],["[@](function)",{token:"keyword",next:"@functiondeclaration"}],["[@](mixin)",{token:"keyword",next:"@mixindeclaration"}]],selector:[{include:"@comments"},{include:"@import"},{include:"@variabledeclaration"},{include:"@warndebug"},["[@](include)",{token:"keyword",next:"@includedeclaration"}],["[@](keyframes|-webkit-keyframes|-moz-keyframes|-o-keyframes)",{token:"keyword",next:"@keyframedeclaration"}],["[@](page|content|font-face)",{token:"keyword"}],{include:"@controlstatement"},{include:"@selectorname"},["[&\\*]","tag"],["[>\\+,]","delimiter"],["\\[",{token:"delimiter.bracket",bracket:"@open",next:"@selectorattribute"}],["{",{token:"delimiter.curly",bracket:"@open",next:"@selectorbody"}]],selectorbody:[["[*_]?[\\w\\-]+@ws:(?=(\\s|\\d|[^{;}]*[;}]))","attribute.name","@rulevalue"],{include:"@selector"},["[@](extend)",{token:"keyword",next:"@extendbody"}],["[@](return)",{token:"keyword",next:"@declarationbody"}],["}",{token:"delimiter.curly",bracket:"@close",next:"@pop"}]],selectorname:[["#{",{token:"metatag",bracket:"@open",next:"@variableinterpolation"}],["(\\.|#(?=[^{])|%|\\w|\\-|:)+","tag"]],selectorattribute:[{include:"@term"},["]",{token:"delimiter.bracket",bracket:"@close",next:"@pop"}]],term:[{include:"@comments"},["url\\(",{token:"metatag",bracket:"@open",next:"@urldeclaration"}],{include:"@functioninvocation"},{include:"@numbers"},{include:"@strings"},{include:"@variablereference"},["([<>=\\+\\-\\*\\/\\^\\|\\~,]|and\\b|or\\b|not\\b)","operator"],{include:"@name"},[",","delimiter"],["!default","literal"],["\\(",{token:"delimiter.parenthesis",bracket:"@open",next:"@parenthizedterm"}]],rulevalue:[{include:"@term"},["!important","literal"],[";","delimiter","@pop"],["{",{token:"delimiter.curly",bracket:"@open",switchTo:"@nestedproperty"}],["(?=})",{token:"",next:"@pop"}]],nestedproperty:[["[*_]?[\\w\\-.]+@ws:","attribute.name","@rulevalue"],{include:"@comments"},["}",{token:"delimiter.curly",bracket:"@close",next:"@pop"}]],warndebug:[["[@](warn|debug)",{token:"keyword",next:"@declarationbody"}]],import:[["[@](import)",{token:"keyword",next:"@declarationbody"}]],variabledeclaration:[["\\$[\\w\\-]+@ws:","variable.decl","@declarationbody"]],urldeclaration:[{include:"@strings"},["[^)\r\n]+","string"],["\\)",{token:"metatag",bracket:"@close",next:"@pop"}]],parenthizedterm:[{include:"@term"},["\\)",{token:"delimiter.parenthesis",bracket:"@close",next:"@pop"}]],declarationbody:[{include:"@term"},[";","delimiter","@pop"],["(?=})",{token:"",next:"@pop"}]],extendbody:[{include:"@selectorname"},["!optional","literal"],[";","delimiter","@pop"],["(?=})",{token:"",next:"@pop"}]],variablereference:[["\\$[\\w\\-]+","variable.ref"],["\\.\\.\\.","operator"],["#{",{token:"metatag",bracket:"@open",next:"@variableinterpolation"}]],variableinterpolation:[{include:"@variablereference"},["}",{token:"metatag",bracket:"@close",next:"@pop"}]],comments:[["\\/\\*","comment","@comment"],["\\/\\/+.*","comment"]],comment:[["\\*\\/","comment","@pop"],[".","comment"]],name:[["[\\w\\-&]+","attribute.value"]],numbers:[["(\\d*\\.)?\\d+([eE][\\-+]?\\d+)?",{token:"number",next:"@units"}],["#[0-9a-fA-F_]+(?!\\w)","number.hex"]],units:[["(em|ex|ch|rem|vw|vh|vm|cm|mm|in|px|pt|pc|deg|grad|rad|turn|s|ms|Hz|kHz|%)?","number","@pop"]],functiondeclaration:[["[\\w\\-]+@ws\\(",{token:"metatag",bracket:"@open",next:"@parameterdeclaration"}],["{",{token:"delimiter.curly",bracket:"@open",switchTo:"@functionbody"}]],mixindeclaration:[["[\\w\\-]+@ws\\(",{token:"metatag",bracket:"@open",next:"@parameterdeclaration"}],["[\\w\\-]","metatag"],["{",{token:"delimiter.curly",bracket:"@open",switchTo:"@selectorbody"}]],parameterdeclaration:[["\\$[\\w\\-]+@ws:","variable.decl"],["\\.\\.\\.","operator"],[",","delimiter"],{include:"@term"},["\\)",{token:"metatag",bracket:"@close",next:"@pop"}]],includedeclaration:[{include:"@functioninvocation"},["[\\w\\-]","metatag"],[";","delimiter","@pop"],["(?=})",{token:"",next:"@pop"}],["{",{token:"delimiter.curly",bracket:"@open",switchTo:"@selectorbody"}]],keyframedeclaration:[["[\\w\\-]","metatag"],["{",{token:"delimiter.curly",bracket:"@open",switchTo:"@keyframebody"}]],keyframebody:[{include:"@term"},["{",{token:"delimiter.curly",bracket:"@open",next:"@selectorbody"}],["}",{token:"delimiter.curly",bracket:"@close",next:"@pop"}]],controlstatement:[["[@](if|else|for|while|each|media)",{token:"keyword.flow",next:"@controlstatementdeclaration"}]],controlstatementdeclaration:[["(in|from|through|if|to)\\b",{token:"keyword.flow"}],{include:"@term"},["{",{token:"delimiter.curly",bracket:"@open",switchTo:"@selectorbody"}]],functionbody:[["[@](return)",{token:"keyword"}],{include:"@variabledeclaration"},{include:"@term"},{include:"@controlstatement"},[";","delimiter"],["}",{token:"delimiter.curly",bracket:"@close",next:"@pop"}]],functioninvocation:[["[\\w\\-]+\\(",{token:"metatag",bracket:"@open",next:"@functionarguments"}]],functionarguments:[["\\$[\\w\\-]+@ws:","key"],["[,]","delimiter"],{include:"@term"},["\\)",{token:"metatag",bracket:"@close",next:"@pop"}]],strings:[['~?"',{token:"string.delimiter",bracket:"@open",next:"@stringenddoublequote"}],["~?'",{token:"string.delimiter",bracket:"@open",next:"@stringendquote"}]],stringenddoublequote:[["\\\\.","string"],['"',{token:"string.delimiter",next:"@pop",bracket:"@close"}],[".","string"]],stringendquote:[["\\\\.","string"],["'",{token:"string.delimiter",next:"@pop",bracket:"@close"}],[".","string"]]}};var l=function(e){function r(r,s){var o=this;e.call(this,r,s,n.compile(t.language)),this.extraInfoSupport=this,this.referenceSupport=new a.ReferenceSupport(this,{tokens:["attribute.name.sass","attribute.value.sass","variable.decl.sass","variable.ref.sass","metatag.sass","key.sass","tag.sass"],findReferences:function(e,t){return o.findReferences(e,t)}}),this.logicalSelectionSupport=this,this.declarationSupport=new a.DeclarationSupport(this,{tokens:["variable.decl.sass","variable.ref.sass","metatag.sass","key.sass","tag.sass"],findDeclaration:function(e,t){return o.findDeclaration(e,t)}}),this.outlineSupport=this,this.suggestSupport=new a.SuggestSupport(this,{triggerCharacters:[],excludeTokens:["comment.sass","string.sass"],suggest:function(e,t){return o.suggest(e,t)}})}return __extends(r,e),r.prototype._worker=function(t){var r=this;return o.getOrCreateMode("css").then(function(e){return e._worker(function(){return s.TPromise.as(!0)})}).then(function(){return e.prototype._worker.call(r,t)})},r.prototype.findReferences=function(e,t){return this._worker(function(r){return r.findReferences(e,t)})},r.prototype.getRangesToPosition=function(e,t){return this._worker(function(r){return r.getRangesToPosition(e,t)})},r.prototype.computeInfo=function(e,t){return this._worker(function(r){return r.computeInfo(e,t)})},r.prototype.getOutline=function(e){return this._worker(function(t){return t.getOutline(e)})},r.prototype.findDeclaration=function(e,t){return this._worker(function(r){return r.findDeclaration(e,t)})},r.prototype.findColorDeclarations=function(e){return this._worker(function(t){return t.findColorDeclarations(e)})},r.$findReferences=i.OneWorker(r,r.prototype.findReferences),r.$getRangesToPosition=i.OneWorker(r,r.prototype.getRangesToPosition),r.$computeInfo=i.OneWorker(r,r.prototype.computeInfo),r.$getOutline=i.OneWorker(r,r.prototype.getOutline),r.$findDeclaration=i.OneWorker(r,r.prototype.findDeclaration),r.$findColorDeclarations=i.OneWorker(r,r.prototype.findColorDeclarations),r}(r.MonarchMode);t.SASSMode=l});