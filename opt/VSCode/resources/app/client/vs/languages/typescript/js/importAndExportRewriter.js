/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";var __extends=this.__extends||function(e,t){function r(){this.constructor=e}for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);r.prototype=t.prototype,e.prototype=new r};define("vs/languages/typescript/js/importAndExportRewriter",["require","exports","vs/base/strings","vs/base/paths","vs/languages/typescript/lib/typescriptServices","vs/base/collections"],function(e,t,r,n,s,o){var i=function(){function e(e,t){this.offset=e,this.length=t}return e}();t.Node=i;var a=function(e){function t(){e.apply(this,arguments),this.items=[]}return __extends(t,e),t}(i);t.List=a;var l=function(e){function t(t,r,n){e.call(this,t,r),this.scope=n,this.requireStatements=[],this.exportsDotExpressions=[]}return __extends(t,e),t}(i);t.DefineNode=l;var c=function(e){function t(t,r,n){e.call(this,t,r),this.name=n}return __extends(t,e),t}(i);t.CallbackParameter=c;var u=function(e){function t(t,r,n){e.call(this,t,r),this.path=n}return __extends(t,e),t}(i);t.DependencyNode=u;var d=function(e){function t(t,r,n,s){e.call(this,t,r),this.name=n,this.path=s}return __extends(t,e),t}(i);t.RequireStatement=d;var p=function(e){function t(t,r,n){e.call(this,t,r),this.name=n}return __extends(t,e),t}(i);t.ExportsExpression=p;var h=function(e){function t(t,r){e.call(this,t,r)}return __extends(t,e),t}(i);t.GlobalExportsExpression=h;var m=function(){function e(){}return e.prototype.computeEdits=function(e){e.newInsert("declare var exports:any; declare var module:any; declare var require:any;\n"),this._context=e,this._currentScopeId=0,this._currentNode=null,this._bucket=[],this._variableNames=new b,this._visitNode(this._context.sourceFile);for(var t=!1,r=0,n=this._bucket.length;n>r;r++){var s=this._bucket[r];s instanceof l&&!t&&0===s.scope?(this._translateDefineNode(s),t=!0):s instanceof h?this._translateGlobalExportsExpression(s):s instanceof p?this._translateExportsExpression(s):s instanceof d&&this._translateRequireStatement(s)}},Object.defineProperty(e.prototype,"nodes",{get:function(){return this._bucket},enumerable:!0,configurable:!0}),e.prototype._untilParent=function(e,t){for(var r=e.parent;r&&r.kind!==t;)r=r.parent;return r},e.prototype._store=function(e){this._currentNode?e instanceof d?this._currentNode.requireStatements.push(e):e instanceof p&&this._currentNode.exportsDotExpressions.push(e):this._bucket.push(e)},e.prototype.visitBinaryExpression=function(e){var t;if(e.operator===s.SyntaxKind.EqualsToken&&e.parent.kind===s.SyntaxKind.ExpressionStatement){var r,n;if(f.isIdentifier(e.left,"exports"))r=e.left.getStart(),n=e.left.getEnd(),t=new h(r,n-r);else if(e.left.kind===s.SyntaxKind.PropertyAccessExpression){var o=e.left,i=o.name.text;if(o.expression.kind===s.SyntaxKind.Identifier){var a=s.getTextOfNode(o.expression);"exports"===a?t=new p(o.getStart(),o.getWidth(),i):"module"===a&&"exports"===i&&(t=new h(o.getStart(),o.getWidth()))}else if(o.expression.kind===s.SyntaxKind.PropertyAccessExpression){var l=o.expression;f.isIdentifier(l.expression,"module")&&f.isIdentifier(l.name,"exports")&&(t=new p(o.getStart(),o.getWidth(),i))}}}t?this._store(t):this._visitNode(e)},e.prototype.visitCallExpression=function(t){if(f.isIdentifier(t.expression,e._Require)){var r=t.arguments;if(f.isPath(r,s.SyntaxKind.StringLiteral)){var n,o=this._untilParent(t,s.SyntaxKind.VariableDeclaration);o&&(n=o.name.text),this._store(new d(s.getTokenPosOfNode(t),t.getWidth(),n,s.getTextOfNode(r[0])))}}else if(f.isIdentifier(t.expression,e._Define)){this._currentNode=new l(s.getTokenPosOfNode(t),t.getWidth(),this._currentScopeId);var r=t.arguments;if(f.isPath(r,s.SyntaxKind.ObjectLiteralExpression)?this._currentNode.objectLiteral=new i(s.getTokenPosOfNode(r[0]),r[0].getWidth()):f.isPath(r,s.SyntaxKind.FunctionExpression)?this._fillInParametersAndBody(r[0],this._currentNode):f.isPath(r,s.SyntaxKind.ArrayLiteralExpression,s.SyntaxKind.FunctionExpression)?(this._fillInDependencies(r[0],this._currentNode),this._fillInParametersAndBody(r[1],this._currentNode)):f.isPath(r,s.SyntaxKind.StringLiteral,s.SyntaxKind.ArrayLiteralExpression,s.SyntaxKind.FunctionExpression)?(this._currentNode.identifier=r[0].text,this._fillInDependencies(r[1],this._currentNode),this._fillInParametersAndBody(r[2],this._currentNode)):this._currentNode=null,this._currentNode)return this._bucket.push(this._currentNode),this._visitNode(t),this._currentNode=null,void 0}this._visitNode(t)},e.prototype._fillInDependencies=function(e,t){t.dependencyArray=new a(s.getTokenPosOfNode(e),e.getWidth());for(var r=0,n=e.elements.length;n>r;r++){var o=e.elements[r];t.dependencyArray.items.push(new u(s.getTokenPosOfNode(o),o.getWidth(),s.getTextOfNode(o)))}},e.prototype._fillInParametersAndBody=function(e,t){var r,n;r=e.parameters.pos,n=e.parameters.end,t.callbackParameters=new a(r,n-r);for(var o=e.parameters,l=0,u=o.length;u>l;l++){var d=o[l];t.callbackParameters.items.push(new c(s.getTokenPosOfNode(d),d.getWidth(),s.getTextOfNode(d)))}r=e.body.getStart()+1,n=e.body.getEnd()-1,t.callbackBody=new i(r,n-r)},e.prototype._visitNode=function(e){var t=this;s.forEachChild(e,function(e){switch(e.kind){case s.SyntaxKind.BinaryExpression:t.visitBinaryExpression(e);break;case s.SyntaxKind.CallExpression:t.visitCallExpression(e);break;case s.SyntaxKind.FunctionDeclaration:case s.SyntaxKind.FunctionExpression:case s.SyntaxKind.ArrowFunction:t._currentScopeId+=1,t._visitNode(e),t._currentScopeId-=1;break;default:t._visitNode(e)}})},e.prototype._translateRequireStatement=function(e){var t=this._variableNames.next(e.name||e.path);this._context.newInsert(r.format("import {0} = require({1});\n",t,e.path)),this._context.newReplace(e.offset,e.length,t)},e.prototype._translateGlobalExportsExpression=function(e){var t=this._variableNames.next();this._context.newReplace(e.offset,e.length,r.format("var {0}",t)),this._context.newAppend(r.format("\nexport = {0};",t))},e.prototype._translateExportsExpression=function(e){this._context.newReplace(e.offset,e.length-e.name.length,"export var ")},e.prototype._translateDefineNode=function(t){if(t.objectLiteral)this._context.newInsert(e._DeclareWithLiteral);else{if(t.dependencyArray)for(var n=0,s=t.callbackParameters.items.length;s>n;n++){var o=t.callbackParameters.items[n],i=t.dependencyArray.items[n];if(!e._SpecialCallbackParams.hasOwnProperty(o.name)&&i){var a=this._variableNames.next();this._context.newInsert(r.format("import {0} = require({1});\n",a,i.path)),this._context.newInsert(o.offset+o.length,r.format(":typeof {0}",a))}}for(var l=[],n=0,s=t.requireStatements.length;s>n;n++){var c=t.requireStatements[n],u=this._variableNames.next(),d=this._variableNames.next();this._context.newInsert(r.format("import {0} = require({1});\n",u,c.path)),this._context.newReplace(c.offset,c.length,d),l.push(r.format("{0}:typeof {1}",d,u))}l.length>0&&this._context.newInsert(t.callbackParameters.offset+t.callbackParameters.length,r.format("{0}{1}",t.callbackParameters.items.length>0?",":"",l.join(",")));for(var p=[],n=0,s=t.exportsDotExpressions.length;s>n;n++){var h=t.exportsDotExpressions[n],m=this._variableNames.next();this._context.newReplace(h.offset,h.length,r.format("var {0}",m)),p.push(h.name),p.push(":"),p.push(m),p.push(",")}p.length>0&&(p.pop(),this._context.newInsert(t.callbackBody.offset+t.callbackBody.length,r.format("return {{0}};",p.join(r.empty))));var f=t.identifier?"id,":r.empty,b=t.dependencyArray?"dep,":r.empty,g=t.callbackParameters.items.map(function(e){return e.name}).concat(t.requireStatements.map(function(e,t){return r.format("_p{0}",t)})).join(",");this._context.newInsert(r.format(e._DeclareTemplate,f,b,g))}var v=this._variableNames.next();this._context.newInsert(t.offset,r.format("var {0} = ",v)),this._context.newAppend(r.format("\nexport = {0};",v))},e._SpecialCallbackParams={exports:!0,module:!0,require:!0},e._DeclareWithLiteral="declare function define<T>(literal:T):T;\n",e._DeclareTemplate="declare function define<T>({0}{1}callback:({2})=>T):T;\n",e._Define="define",e._Require="require",e}();t.ImportsAndExportsCollector=m;var f,b=function(){function e(){this._counter=0,this._proposalToName={},this._allNames={}}return e.prototype.next=function(t){if(!t)return r.format("_var_{0}",this._counter++);var s=o.lookup(this._proposalToName,t);if(s)return s;if(s=t.replace(/["']/g,r.empty),s=n.basename(s),s=s.replace(e._RegExp,r.empty),0===s.length)return this.next();s=s.split(r.empty).join(e._SpecialChar),s+=e._SpecialChar;for(var i=s,a=1;o.contains(this._allNames,s);a++)s=i+a;return this._allNames[s]=!0,this._proposalToName[t]=s,s},e.prototype.allocateIfFree=function(e){return o.contains(this._allNames,e)?!1:(this._allNames[e]=!0,!0)},e.prototype.reset=function(){this._counter=0,this._proposalToName={},this._allNames={}},e._RegExp=/[^A-Za-z_$]/g,e._SpecialChar="̲",e}();!function(e){function t(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];if(t.length!==e.length)return!1;for(var n=0,s=t.length;s>n;n++)if(e[n].kind!==t[n])return!1;return!0}function r(e,t){return e.kind===s.SyntaxKind.Identifier&&s.getTextOfNode(e)===t}e.isPath=t,e.isIdentifier=r}(f||(f={}))});