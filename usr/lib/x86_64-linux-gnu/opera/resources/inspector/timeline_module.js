WebInspector.CountersGraph=function(title,delegate,model)
{WebInspector.SplitView.call(this,true,false);this.element.id="memory-graphs-container";this._delegate=delegate;this._model=model;this._calculator=new WebInspector.TimelineCalculator(this._model);this._graphsContainer=new WebInspector.VBox();this.setMainView(this._graphsContainer);this._createCurrentValuesBar();this._canvasView=new WebInspector.VBoxWithResizeCallback(this._resize.bind(this));this._canvasView.show(this._graphsContainer.element);this._canvasContainer=this._canvasView.element;this._canvasContainer.id="memory-graphs-canvas-container";this._canvas=this._canvasContainer.createChild("canvas");this._canvas.id="memory-counters-graph";this._canvasContainer.addEventListener("mouseover",this._onMouseMove.bind(this),true);this._canvasContainer.addEventListener("mousemove",this._onMouseMove.bind(this),true);this._canvasContainer.addEventListener("mouseleave",this._onMouseLeave.bind(this),true);this._canvasContainer.addEventListener("click",this._onClick.bind(this),true);this._timelineGrid=new WebInspector.TimelineGrid();this._canvasContainer.appendChild(this._timelineGrid.dividersElement);this._infoView=new WebInspector.VBox();this._infoView.element.classList.add("sidebar-tree");this._infoView.element.createChild("div","sidebar-tree-section").textContent=title;this.setSidebarView(this._infoView);this._counters=[];this._counterUI=[];}
WebInspector.CountersGraph.prototype={target:function()
{return this._model.target();},_createCurrentValuesBar:function()
{this._currentValuesBar=this._graphsContainer.element.createChild("div");this._currentValuesBar.id="counter-values-bar";},createCounter:function(uiName,uiValueTemplate,color)
{var counter=new WebInspector.CountersGraph.Counter();this._counters.push(counter);this._counterUI.push(new WebInspector.CountersGraph.CounterUI(this,uiName,uiValueTemplate,color,counter));return counter;},view:function()
{return this;},dispose:function()
{},reset:function()
{for(var i=0;i<this._counters.length;++i){this._counters[i].reset();this._counterUI[i].reset();}
this.refresh();},_resize:function()
{var parentElement=this._canvas.parentElement;this._canvas.width=parentElement.clientWidth*window.devicePixelRatio;this._canvas.height=parentElement.clientHeight*window.devicePixelRatio;var timelinePaddingLeft=15;this._calculator.setDisplayWindow(timelinePaddingLeft,this._canvas.width);this.refresh();},setWindowTimes:function(startTime,endTime)
{this._calculator.setWindow(startTime,endTime);this.scheduleRefresh();},scheduleRefresh:function()
{WebInspector.invokeOnceAfterBatchUpdate(this,this.refresh);},draw:function()
{for(var i=0;i<this._counters.length;++i){this._counters[i]._calculateVisibleIndexes(this._calculator);this._counters[i]._calculateXValues(this._canvas.width);}
this._clear();for(var i=0;i<this._counterUI.length;i++)
this._counterUI[i]._drawGraph(this._canvas);},_onClick:function(event)
{var x=event.x-this._canvasContainer.totalOffsetLeft();var minDistance=Infinity;var bestTime;for(var i=0;i<this._counterUI.length;++i){var counterUI=this._counterUI[i];if(!counterUI.counter.times.length)
continue;var index=counterUI._recordIndexAt(x);var distance=Math.abs(x*window.devicePixelRatio-counterUI.counter.x[index]);if(distance<minDistance){minDistance=distance;bestTime=counterUI.counter.times[index];}}
if(bestTime!==undefined)
this._revealRecordAt(bestTime);},_revealRecordAt:function(time)
{var recordToReveal;function findRecordToReveal(record)
{if(!this._model.isVisible(record))
return false;if(record.startTime()<=time&&time<=record.endTime()){recordToReveal=record;return true;}
if(!recordToReveal||record.endTime()<time&&recordToReveal.endTime()<record.endTime())
recordToReveal=record;return false;}
this._model.forAllRecords(null,findRecordToReveal.bind(this));this._delegate.select(recordToReveal?WebInspector.TimelineSelection.fromRecord(recordToReveal):null);},_onMouseLeave:function(event)
{delete this._markerXPosition;this._clearCurrentValueAndMarker();},_clearCurrentValueAndMarker:function()
{for(var i=0;i<this._counterUI.length;i++)
this._counterUI[i]._clearCurrentValueAndMarker();},_onMouseMove:function(event)
{var x=event.x-this._canvasContainer.totalOffsetLeft();this._markerXPosition=x;this._refreshCurrentValues();},_refreshCurrentValues:function()
{if(this._markerXPosition===undefined)
return;for(var i=0;i<this._counterUI.length;++i)
this._counterUI[i].updateCurrentValue(this._markerXPosition);},refresh:function()
{this._timelineGrid.updateDividers(this._calculator);this.draw();this._refreshCurrentValues();},refreshRecords:function(textFilter)
{},_clear:function()
{var ctx=this._canvas.getContext("2d");ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);},highlightSearchResult:function(record,regex,selectRecord)
{},setSelection:function(selection)
{},__proto__:WebInspector.SplitView.prototype}
WebInspector.CountersGraph.Counter=function()
{this.times=[];this.values=[];}
WebInspector.CountersGraph.Counter.prototype={appendSample:function(time,value)
{if(this.values.length&&this.values.peekLast()===value)
return;this.times.push(time);this.values.push(value);},reset:function()
{this.times=[];this.values=[];},setLimit:function(value)
{this._limitValue=value;},_calculateBounds:function()
{var maxValue;var minValue;for(var i=this._minimumIndex;i<=this._maximumIndex;i++){var value=this.values[i];if(minValue===undefined||value<minValue)
minValue=value;if(maxValue===undefined||value>maxValue)
maxValue=value;}
minValue=minValue||0;maxValue=maxValue||1;if(this._limitValue){if(maxValue>this._limitValue*0.5)
maxValue=Math.max(maxValue,this._limitValue);minValue=Math.min(minValue,this._limitValue);}
return{min:minValue,max:maxValue};},_calculateVisibleIndexes:function(calculator)
{var start=calculator.minimumBoundary();var end=calculator.maximumBoundary();this._minimumIndex=Number.constrain(this.times.upperBound(start)-1,0,this.times.length-1);this._maximumIndex=Number.constrain(this.times.lowerBound(end),0,this.times.length-1);this._minTime=start;this._maxTime=end;},_calculateXValues:function(width)
{if(!this.values.length)
return;var xFactor=width/(this._maxTime-this._minTime);this.x=new Array(this.values.length);for(var i=this._minimumIndex+1;i<=this._maximumIndex;i++)
this.x[i]=xFactor*(this.times[i]-this._minTime);}}
WebInspector.CountersGraph.CounterUI=function(memoryCountersPane,title,currentValueLabel,graphColor,counter)
{this._memoryCountersPane=memoryCountersPane;this.counter=counter;var container=memoryCountersPane._infoView.element.createChild("div","memory-counter-sidebar-info");var swatchColor=graphColor;this._swatch=new WebInspector.SwatchCheckbox(WebInspector.UIString(title),swatchColor);this._swatch.addEventListener(WebInspector.SwatchCheckbox.Events.Changed,this._toggleCounterGraph.bind(this));container.appendChild(this._swatch.element);this._range=this._swatch.element.createChild("span");this._value=memoryCountersPane._currentValuesBar.createChild("span","memory-counter-value");this._value.style.color=graphColor;this.graphColor=graphColor;this.limitColor=WebInspector.Color.parse(graphColor).setAlpha(0.3).asString(WebInspector.Color.Format.RGBA);this.graphYValues=[];this._verticalPadding=10;this._currentValueLabel=currentValueLabel;this._marker=memoryCountersPane._canvasContainer.createChild("div","memory-counter-marker");this._marker.style.backgroundColor=graphColor;this._clearCurrentValueAndMarker();}
WebInspector.CountersGraph.CounterUI.prototype={reset:function()
{this._range.textContent="";},setRange:function(minValue,maxValue)
{this._range.textContent=WebInspector.UIString("[%.0f:%.0f]",minValue,maxValue);},_toggleCounterGraph:function(event)
{this._value.classList.toggle("hidden",!this._swatch.checked);this._memoryCountersPane.refresh();},_recordIndexAt:function(x)
{return this.counter.x.upperBound(x*window.devicePixelRatio,null,this.counter._minimumIndex+1,this.counter._maximumIndex+1)-1;},updateCurrentValue:function(x)
{if(!this.visible()||!this.counter.values.length||!this.counter.x)
return;var index=this._recordIndexAt(x);this._value.textContent=WebInspector.UIString(this._currentValueLabel,this.counter.values[index]);var y=this.graphYValues[index]/window.devicePixelRatio;this._marker.style.left=x+"px";this._marker.style.top=y+"px";this._marker.classList.remove("hidden");},_clearCurrentValueAndMarker:function()
{this._value.textContent="";this._marker.classList.add("hidden");},_drawGraph:function(canvas)
{var ctx=canvas.getContext("2d");var width=canvas.width;var height=canvas.height-2*this._verticalPadding;if(height<=0){this.graphYValues=[];return;}
var originY=this._verticalPadding;var counter=this.counter;var values=counter.values;if(!values.length)
return;var bounds=counter._calculateBounds();var minValue=bounds.min;var maxValue=bounds.max;this.setRange(minValue,maxValue);if(!this.visible())
return;var yValues=this.graphYValues;var maxYRange=maxValue-minValue;var yFactor=maxYRange?height/(maxYRange):1;ctx.save();ctx.lineWidth=window.devicePixelRatio;if(ctx.lineWidth%2)
ctx.translate(0.5,0.5);ctx.beginPath();var value=values[counter._minimumIndex];var currentY=Math.round(originY+height-(value-minValue)*yFactor);ctx.moveTo(0,currentY);for(var i=counter._minimumIndex;i<=counter._maximumIndex;i++){var x=Math.round(counter.x[i]);ctx.lineTo(x,currentY);var currentValue=values[i];if(typeof currentValue!=="undefined")
value=currentValue;currentY=Math.round(originY+height-(value-minValue)*yFactor);ctx.lineTo(x,currentY);yValues[i]=currentY;}
yValues.length=i;ctx.lineTo(width,currentY);ctx.strokeStyle=this.graphColor;ctx.stroke();if(counter._limitValue){var limitLineY=Math.round(originY+height-(counter._limitValue-minValue)*yFactor);ctx.moveTo(0,limitLineY);ctx.lineTo(width,limitLineY);ctx.strokeStyle=this.limitColor;ctx.stroke();}
ctx.closePath();ctx.restore();},visible:function()
{return this._swatch.checked;}}
WebInspector.SwatchCheckbox=function(title,color)
{this.element=createElement("div");this._swatch=this.element.createChild("div","swatch");this.element.createChild("span","title").textContent=title;this._color=color;this.checked=true;this.element.addEventListener("click",this._toggleCheckbox.bind(this),true);}
WebInspector.SwatchCheckbox.Events={Changed:"Changed"}
WebInspector.SwatchCheckbox.prototype={get checked()
{return this._checked;},set checked(v)
{this._checked=v;if(this._checked)
this._swatch.style.backgroundColor=this._color;else
this._swatch.style.backgroundColor="";},_toggleCheckbox:function(event)
{this.checked=!this.checked;this.dispatchEventToListeners(WebInspector.SwatchCheckbox.Events.Changed);},__proto__:WebInspector.Object.prototype};WebInspector.LayerDetailsView=function(layerViewHost)
{WebInspector.View.call(this);this.element.classList.add("layer-details-view");this._layerViewHost=layerViewHost;this._layerViewHost.registerView(this);this._emptyView=new WebInspector.EmptyView(WebInspector.UIString("Select a layer to see its details"));this._buildContent();}
WebInspector.LayerDetailsView.Events={PaintProfilerRequested:"PaintProfilerRequested"}
WebInspector.LayerDetailsView.CompositingReasonDetail={"transform3D":WebInspector.UIString("Composition due to association with an element with a CSS 3D transform."),"video":WebInspector.UIString("Composition due to association with a <video> element."),"canvas":WebInspector.UIString("Composition due to the element being a <canvas> element."),"plugin":WebInspector.UIString("Composition due to association with a plugin."),"iFrame":WebInspector.UIString("Composition due to association with an <iframe> element."),"backfaceVisibilityHidden":WebInspector.UIString("Composition due to association with an element with a \"backface-visibility: hidden\" style."),"animation":WebInspector.UIString("Composition due to association with an animated element."),"filters":WebInspector.UIString("Composition due to association with an element with CSS filters applied."),"positionFixed":WebInspector.UIString("Composition due to association with an element with a \"position: fixed\" style."),"positionSticky":WebInspector.UIString("Composition due to association with an element with a \"position: sticky\" style."),"overflowScrollingTouch":WebInspector.UIString("Composition due to association with an element with a \"overflow-scrolling: touch\" style."),"blending":WebInspector.UIString("Composition due to association with an element that has blend mode other than \"normal\"."),"assumedOverlap":WebInspector.UIString("Composition due to association with an element that may overlap other composited elements."),"overlap":WebInspector.UIString("Composition due to association with an element overlapping other composited elements."),"negativeZIndexChildren":WebInspector.UIString("Composition due to association with an element with descendants that have a negative z-index."),"transformWithCompositedDescendants":WebInspector.UIString("Composition due to association with an element with composited descendants."),"opacityWithCompositedDescendants":WebInspector.UIString("Composition due to association with an element with opacity applied and composited descendants."),"maskWithCompositedDescendants":WebInspector.UIString("Composition due to association with a masked element and composited descendants."),"reflectionWithCompositedDescendants":WebInspector.UIString("Composition due to association with an element with a reflection and composited descendants."),"filterWithCompositedDescendants":WebInspector.UIString("Composition due to association with an element with CSS filters applied and composited descendants."),"blendingWithCompositedDescendants":WebInspector.UIString("Composition due to association with an element with CSS blending applied and composited descendants."),"clipsCompositingDescendants":WebInspector.UIString("Composition due to association with an element clipping compositing descendants."),"perspective":WebInspector.UIString("Composition due to association with an element with perspective applied."),"preserve3D":WebInspector.UIString("Composition due to association with an element with a \"transform-style: preserve-3d\" style."),"root":WebInspector.UIString("Root layer."),"layerForClip":WebInspector.UIString("Layer for clip."),"layerForScrollbar":WebInspector.UIString("Layer for scrollbar."),"layerForScrollingContainer":WebInspector.UIString("Layer for scrolling container."),"layerForForeground":WebInspector.UIString("Layer for foreground."),"layerForBackground":WebInspector.UIString("Layer for background."),"layerForMask":WebInspector.UIString("Layer for mask."),"layerForVideoOverlay":WebInspector.UIString("Layer for video overlay."),"scrollBlocksOn":WebInspector.UIString("Composition due to association with an element with a CSS \"scroll-blocks-on\" property applied."),};WebInspector.LayerDetailsView.prototype={hoverObject:function(selection){},selectObject:function(selection)
{this._selection=selection;if(this.isShowing())
this.update();},setLayerTree:function(layerTree){},wasShown:function()
{WebInspector.View.prototype.wasShown.call(this);this.update();},_onScrollRectClicked:function(index,event)
{if(event.which!==1)
return;this._layerViewHost.selectObject(new WebInspector.LayerView.ScrollRectSelection(this._selection.layer(),index));},_onPaintProfilerButtonClicked:function()
{var traceEvent=this._selection.type()===WebInspector.LayerView.Selection.Type.Tile?(this._selection).traceEvent():null;this.dispatchEventToListeners(WebInspector.LayerDetailsView.Events.PaintProfilerRequested,traceEvent);},_createScrollRectElement:function(scrollRect,index)
{if(index)
this._scrollRectsCell.createTextChild(", ");var element=this._scrollRectsCell.createChild("span","scroll-rect");if(this._selection.scrollRectIndex===index)
element.classList.add("active");element.textContent=WebInspector.LayerTreeModel.ScrollRectType[scrollRect.type].description+" ("+scrollRect.rect.x+", "+scrollRect.rect.y+", "+scrollRect.rect.width+", "+scrollRect.rect.height+")";element.addEventListener("click",this._onScrollRectClicked.bind(this,index),false);},update:function()
{var layer=this._selection&&this._selection.layer();if(!layer){this._tableElement.remove();this._paintProfilerButton.remove();this._emptyView.show(this.element);return;}
this._emptyView.detach();this.element.appendChild(this._tableElement);this.element.appendChild(this._paintProfilerButton);this._sizeCell.textContent=WebInspector.UIString("%d × %d (at %d,%d)",layer.width(),layer.height(),layer.offsetX(),layer.offsetY());this._paintCountCell.parentElement.classList.toggle("hidden",!layer.paintCount());this._paintCountCell.textContent=layer.paintCount();this._memoryEstimateCell.textContent=Number.bytesToString(layer.gpuMemoryUsage());layer.requestCompositingReasons(this._updateCompositingReasons.bind(this));this._scrollRectsCell.removeChildren();layer.scrollRects().forEach(this._createScrollRectElement.bind(this));var traceEvent=this._selection.type()===WebInspector.LayerView.Selection.Type.Tile?(this._selection).traceEvent():null;this._paintProfilerButton.classList.toggle("hidden",!traceEvent);},_buildContent:function()
{this._tableElement=this.element.createChild("table");this._tbodyElement=this._tableElement.createChild("tbody");this._sizeCell=this._createRow(WebInspector.UIString("Size"));this._compositingReasonsCell=this._createRow(WebInspector.UIString("Compositing Reasons"));this._memoryEstimateCell=this._createRow(WebInspector.UIString("Memory estimate"));this._paintCountCell=this._createRow(WebInspector.UIString("Paint count"));this._scrollRectsCell=this._createRow(WebInspector.UIString("Slow scroll regions"));this._paintProfilerButton=this.element.createChild("a","hidden link");this._paintProfilerButton.textContent=WebInspector.UIString("Paint Profiler");this._paintProfilerButton.addEventListener("click",this._onPaintProfilerButtonClicked.bind(this));},_createRow:function(title)
{var tr=this._tbodyElement.createChild("tr");var titleCell=tr.createChild("td");titleCell.textContent=title;return tr.createChild("td");},_updateCompositingReasons:function(compositingReasons)
{if(!compositingReasons||!compositingReasons.length){this._compositingReasonsCell.textContent="n/a";return;}
this._compositingReasonsCell.removeChildren();var list=this._compositingReasonsCell.createChild("ul");for(var i=0;i<compositingReasons.length;++i){var text=WebInspector.LayerDetailsView.CompositingReasonDetail[compositingReasons[i]]||compositingReasons[i];if(/\s.*[^.]$/.test(text))
text+=".";list.createChild("li").textContent=text;}},__proto__:WebInspector.View.prototype};WebInspector.LayerTreeOutline=function(layerViewHost)
{WebInspector.Object.call(this);this._layerViewHost=layerViewHost;this._layerViewHost.registerView(this);this._treeOutline=new TreeOutlineInShadow();this._treeOutline.element.classList.add("layer-tree");this._treeOutline.element.addEventListener("mousemove",this._onMouseMove.bind(this),false);this._treeOutline.element.addEventListener("mouseout",this._onMouseMove.bind(this),false);this._treeOutline.element.addEventListener("contextmenu",this._onContextMenu.bind(this),true);this._lastHoveredNode=null;this.element=this._treeOutline.element;this._layerViewHost.showInternalLayersSetting().addChangeListener(this._update,this);}
WebInspector.LayerTreeOutline.prototype={focus:function()
{this._treeOutline.focus();},selectObject:function(selection)
{this.hoverObject(null);var layer=selection&&selection.layer();var node=layer&&layer[WebInspector.LayerTreeElement._symbol];if(node)
node.revealAndSelect(true);else if(this._treeOutline.selectedTreeElement)
this._treeOutline.selectedTreeElement.deselect();},hoverObject:function(selection)
{var layer=selection&&selection.layer();var node=layer&&layer[WebInspector.LayerTreeElement._symbol];if(node===this._lastHoveredNode)
return;if(this._lastHoveredNode)
this._lastHoveredNode.setHovered(false);if(node)
node.setHovered(true);this._lastHoveredNode=node;},setLayerTree:function(layerTree)
{this._layerTree=layerTree;this._update();},_update:function()
{var showInternalLayers=this._layerViewHost.showInternalLayersSetting().get();var seenLayers=new Map();var root=null;if(this._layerTree){if(!showInternalLayers)
root=this._layerTree.contentRoot();if(!root)
root=this._layerTree.root();}
function updateLayer(layer)
{if(!layer.drawsContent()&&!showInternalLayers)
return;if(seenLayers.get(layer))
console.assert(false,"Duplicate layer: "+layer.id());seenLayers.set(layer,true);var node=layer[WebInspector.LayerTreeElement._symbol];var parentLayer=layer.parent();while(parentLayer&&parentLayer!==root&&!parentLayer.drawsContent()&&!showInternalLayers)
parentLayer=parentLayer.parent();var parent=layer===root?this._treeOutline:parentLayer[WebInspector.LayerTreeElement._symbol];if(!parent){console.assert(false,"Parent is not in the tree");return;}
if(!node){node=new WebInspector.LayerTreeElement(this,layer);parent.appendChild(node);if(!layer.drawsContent())
node.expand();}else{if(node.parent!==parent){var oldSelection=this._treeOutline.selectedTreeElement;node.parent.removeChild(node);parent.appendChild(node);if(oldSelection!==this._treeOutline.selectedTreeElement)
oldSelection.select();}
node._update();}}
if(root)
this._layerTree.forEachLayer(updateLayer.bind(this),root);var rootElement=this._treeOutline.rootElement();for(var node=rootElement.firstChild();node&&!node.root;){if(seenLayers.get(node._layer)){node=node.traverseNextTreeElement(false);}else{var nextNode=node.nextSibling||node.parent;node.parent.removeChild(node);if(node===this._lastHoveredNode)
this._lastHoveredNode=null;node=nextNode;}}
if(!this._treeOutline.selectedTreeElement){var elementToSelect=this._layerTree.contentRoot()||this._layerTree.root();elementToSelect[WebInspector.LayerTreeElement._symbol].revealAndSelect(true);}},_onMouseMove:function(event)
{var node=this._treeOutline.treeElementFromEvent(event);if(node===this._lastHoveredNode)
return;this._layerViewHost.hoverObject(this._selectionForNode(node));},_selectedNodeChanged:function(node)
{this._layerViewHost.selectObject(this._selectionForNode(node));},_onContextMenu:function(event)
{var selection=this._selectionForNode(this._treeOutline.treeElementFromEvent(event));var contextMenu=new WebInspector.ContextMenu(event);this._layerViewHost.showContextMenu(contextMenu,selection);},_selectionForNode:function(node)
{return node&&node._layer?new WebInspector.LayerView.LayerSelection(node._layer):null;},__proto__:WebInspector.Object.prototype}
WebInspector.LayerTreeElement=function(tree,layer)
{TreeElement.call(this);this._treeOutline=tree;this._layer=layer;this._layer[WebInspector.LayerTreeElement._symbol]=this;this._update();}
WebInspector.LayerTreeElement._symbol=Symbol("layer");WebInspector.LayerTreeElement.prototype={_update:function()
{var node=this._layer.nodeForSelfOrAncestor();var title=createDocumentFragment();title.createTextChild(node?WebInspector.DOMPresentationUtils.simpleSelector(node):"#"+this._layer.id());var details=title.createChild("span","dimmed");details.textContent=WebInspector.UIString(" (%d × %d)",this._layer.width(),this._layer.height());this.title=title;},onselect:function()
{this._treeOutline._selectedNodeChanged(this);return false;},setHovered:function(hovered)
{this.listItemElement.classList.toggle("hovered",hovered);},__proto__:TreeElement.prototype};WebInspector.LayerView=function()
{}
WebInspector.LayerView.prototype={hoverObject:function(selection){},selectObject:function(selection){},setLayerTree:function(layerTree){}}
WebInspector.LayerView.Selection=function(type,layer)
{this._type=type;this._layer=layer;}
WebInspector.LayerView.Selection.Type={Layer:"Layer",ScrollRect:"ScrollRect",Tile:"Tile",}
WebInspector.LayerView.Selection.prototype={type:function()
{return this._type;},layer:function()
{return this._layer;},isEqual:function(other)
{return false;}}
WebInspector.LayerView.LayerSelection=function(layer)
{console.assert(layer,"LayerSelection with empty layer");WebInspector.LayerView.Selection.call(this,WebInspector.LayerView.Selection.Type.Layer,layer);}
WebInspector.LayerView.LayerSelection.prototype={isEqual:function(other)
{return other._type===WebInspector.LayerView.Selection.Type.Layer&&other.layer().id()===this.layer().id();},__proto__:WebInspector.LayerView.Selection.prototype}
WebInspector.LayerView.ScrollRectSelection=function(layer,scrollRectIndex)
{WebInspector.LayerView.Selection.call(this,WebInspector.LayerView.Selection.Type.ScrollRect,layer);this.scrollRectIndex=scrollRectIndex;}
WebInspector.LayerView.ScrollRectSelection.prototype={isEqual:function(other)
{return other._type===WebInspector.LayerView.Selection.Type.ScrollRect&&this.layer().id()===other.layer().id()&&this.scrollRectIndex===other.scrollRectIndex;},__proto__:WebInspector.LayerView.Selection.prototype}
WebInspector.LayerView.TileSelection=function(layer,traceEvent)
{WebInspector.LayerView.Selection.call(this,WebInspector.LayerView.Selection.Type.Tile,layer);this._traceEvent=traceEvent;}
WebInspector.LayerView.TileSelection.prototype={isEqual:function(other)
{return other._type===WebInspector.LayerView.Selection.Type.Tile&&this.layer().id()===other.layer().id()&&this.traceEvent===other.traceEvent;},traceEvent:function()
{return this._traceEvent;},__proto__:WebInspector.LayerView.Selection.prototype}
WebInspector.LayerViewHost=function()
{this._views=[];this._selectedObject=null;this._hoveredObject=null;this._showInternalLayersSetting=WebInspector.settings.createSetting("layersShowInternalLayers",false);}
WebInspector.LayerViewHost.prototype={registerView:function(layerView)
{this._views.push(layerView);},setLayerTree:function(layerTree)
{this._target=layerTree.target();var selectedLayer=this._selectedObject&&this._selectedObject.layer();if(selectedLayer&&(!layerTree||!layerTree.layerById(selectedLayer.id())))
this.selectObject(null);var hoveredLayer=this._hoveredObject&&this._hoveredObject.layer();if(hoveredLayer&&(!layerTree||!layerTree.layerById(hoveredLayer.id())))
this.hoverObject(null);for(var view of this._views)
view.setLayerTree(layerTree);},hoverObject:function(selection)
{if(this._hoveredObject===selection)
return;this._hoveredObject=selection;var layer=selection&&selection.layer();this._toggleNodeHighlight(layer?layer.nodeForSelfOrAncestor():null);for(var view of this._views)
view.hoverObject(selection);},selectObject:function(selection)
{if(this._selectedObject===selection)
return;this._selectedObject=selection;for(var view of this._views)
view.selectObject(selection);},selection:function()
{return this._selectedObject;},showContextMenu:function(contextMenu,selection)
{contextMenu.appendCheckboxItem(WebInspector.UIString("Show internal layers"),this._toggleShowInternalLayers.bind(this),this._showInternalLayersSetting.get());var node=selection&&selection.layer()&&selection.layer().nodeForSelfOrAncestor();if(node)
contextMenu.appendApplicableItems(node);contextMenu.show();},showInternalLayersSetting:function()
{return this._showInternalLayersSetting;},_toggleShowInternalLayers:function()
{this._showInternalLayersSetting.set(!this._showInternalLayersSetting.get());},_toggleNodeHighlight:function(node)
{if(node){node.highlightForTwoSeconds();return;}
if(this._target)
this._target.domModel.hideDOMNodeHighlight();}};WebInspector.Layers3DView=function(layerViewHost)
{WebInspector.VBox.call(this);this.element.classList.add("layers-3d-view");this._emptyView=new WebInspector.EmptyView(WebInspector.UIString("Layer information is not yet available."));this._layerViewHost=layerViewHost;this._layerViewHost.registerView(this);this._transformController=new WebInspector.TransformController(this.element);this._transformController.addEventListener(WebInspector.TransformController.Events.TransformChanged,this._update,this);this._initStatusBar();this._canvasElement=this.element.createChild("canvas");this._canvasElement.tabIndex=0;this._canvasElement.addEventListener("dblclick",this._onDoubleClick.bind(this),false);this._canvasElement.addEventListener("mousedown",this._onMouseDown.bind(this),false);this._canvasElement.addEventListener("mouseup",this._onMouseUp.bind(this),false);this._canvasElement.addEventListener("mouseleave",this._onMouseMove.bind(this),false);this._canvasElement.addEventListener("mousemove",this._onMouseMove.bind(this),false);this._canvasElement.addEventListener("contextmenu",this._onContextMenu.bind(this),false);this._lastSelection={};this._layerTree=null;this._textureManager=new WebInspector.LayerTextureManager();this._textureManager.addEventListener(WebInspector.LayerTextureManager.Events.TextureUpdated,this._update,this);this._chromeTextures=[];WebInspector.settings.showPaintRects.addChangeListener(this._update,this);this._layerViewHost.showInternalLayersSetting().addChangeListener(this._update,this);}
WebInspector.Layers3DView.LayerStyle;WebInspector.Layers3DView.PaintTile;WebInspector.Layers3DView.OutlineType={Hovered:"hovered",Selected:"selected"}
WebInspector.Layers3DView.Events={LayerSnapshotRequested:"LayerSnapshotRequested",PaintProfilerRequested:"PaintProfilerRequested",}
WebInspector.Layers3DView.ChromeTexture={Left:0,Middle:1,Right:2}
WebInspector.Layers3DView.ScrollRectTitles={RepaintsOnScroll:WebInspector.UIString("repaints on scroll"),TouchEventHandler:WebInspector.UIString("touch event listener"),WheelEventHandler:WebInspector.UIString("mousewheel event listener")}
WebInspector.Layers3DView.FragmentShader=""+"precision mediump float;\n"+"varying vec4 vColor;\n"+"varying vec2 vTextureCoord;\n"+"uniform sampler2D uSampler;\n"+"void main(void)\n"+"{\n"+"    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * vColor;\n"+"}";WebInspector.Layers3DView.VertexShader=""+"attribute vec3 aVertexPosition;\n"+"attribute vec2 aTextureCoord;\n"+"attribute vec4 aVertexColor;\n"+"uniform mat4 uPMatrix;\n"+"varying vec2 vTextureCoord;\n"+"varying vec4 vColor;\n"+"void main(void)\n"+"{\n"+"gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);\n"+"vColor = aVertexColor;\n"+"vTextureCoord = aTextureCoord;\n"+"}";WebInspector.Layers3DView.HoveredBorderColor=[0,0,255,1];WebInspector.Layers3DView.SelectedBorderColor=[0,255,0,1];WebInspector.Layers3DView.BorderColor=[0,0,0,1];WebInspector.Layers3DView.ViewportBorderColor=[160,160,160,1];WebInspector.Layers3DView.ScrollRectBackgroundColor=[178,100,100,0.6];WebInspector.Layers3DView.HoveredImageMaskColor=[200,200,255,1];WebInspector.Layers3DView.BorderWidth=1;WebInspector.Layers3DView.SelectedBorderWidth=2;WebInspector.Layers3DView.ViewportBorderWidth=3;WebInspector.Layers3DView.LayerSpacing=20;WebInspector.Layers3DView.ScrollRectSpacing=4;WebInspector.Layers3DView.prototype={setLayerTree:function(layerTree)
{this._layerTree=layerTree;this._textureManager.reset();this._update();},setTiles:function(tiles)
{this._textureManager.setTiles(tiles);},showImageForLayer:function(layer,imageURL)
{if(imageURL)
this._textureManager.createTexture(onTextureCreated.bind(this),imageURL);else
onTextureCreated.call(this,null);function onTextureCreated(texture)
{this._layerTexture=texture?{layerId:layer.id(),texture:texture}:null;this._update();}},onResize:function()
{this._update();},wasShown:function()
{if(this._needsUpdate)
this._update();},_setOutline:function(type,selection)
{this._lastSelection[type]=selection;this._update();},hoverObject:function(selection)
{this._setOutline(WebInspector.Layers3DView.OutlineType.Hovered,selection);},selectObject:function(selection)
{this._setOutline(WebInspector.Layers3DView.OutlineType.Hovered,null);this._setOutline(WebInspector.Layers3DView.OutlineType.Selected,selection);},_initGL:function(canvas)
{var gl=canvas.getContext("webgl");gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enable(gl.BLEND);gl.clearColor(0.0,0.0,0.0,0.0);gl.enable(gl.DEPTH_TEST);return gl;},_createShader:function(type,script)
{var shader=this._gl.createShader(type);this._gl.shaderSource(shader,script);this._gl.compileShader(shader);this._gl.attachShader(this._shaderProgram,shader);},_initShaders:function()
{this._shaderProgram=this._gl.createProgram();this._createShader(this._gl.FRAGMENT_SHADER,WebInspector.Layers3DView.FragmentShader);this._createShader(this._gl.VERTEX_SHADER,WebInspector.Layers3DView.VertexShader);this._gl.linkProgram(this._shaderProgram);this._gl.useProgram(this._shaderProgram);this._shaderProgram.vertexPositionAttribute=this._gl.getAttribLocation(this._shaderProgram,"aVertexPosition");this._gl.enableVertexAttribArray(this._shaderProgram.vertexPositionAttribute);this._shaderProgram.vertexColorAttribute=this._gl.getAttribLocation(this._shaderProgram,"aVertexColor");this._gl.enableVertexAttribArray(this._shaderProgram.vertexColorAttribute);this._shaderProgram.textureCoordAttribute=this._gl.getAttribLocation(this._shaderProgram,"aTextureCoord");this._gl.enableVertexAttribArray(this._shaderProgram.textureCoordAttribute);this._shaderProgram.pMatrixUniform=this._gl.getUniformLocation(this._shaderProgram,"uPMatrix");this._shaderProgram.samplerUniform=this._gl.getUniformLocation(this._shaderProgram,"uSampler");},_resizeCanvas:function()
{this._canvasElement.width=this._canvasElement.offsetWidth*window.devicePixelRatio;this._canvasElement.height=this._canvasElement.offsetHeight*window.devicePixelRatio;this._gl.viewportWidth=this._canvasElement.width;this._gl.viewportHeight=this._canvasElement.height;},_updateTransformAndConstraints:function()
{var paddingFraction=0.1;var viewport=this._layerTree.viewportSize();var root=this._layerTree.root();var baseWidth=viewport?viewport.width:this._dimensionsForAutoscale.width;var baseHeight=viewport?viewport.height:this._dimensionsForAutoscale.height;var canvasWidth=this._canvasElement.width;var canvasHeight=this._canvasElement.height;var paddingX=canvasWidth*paddingFraction;var paddingY=canvasHeight*paddingFraction;var scaleX=(canvasWidth-2*paddingX)/baseWidth;var scaleY=(canvasHeight-2*paddingY)/baseHeight;var viewScale=Math.min(scaleX,scaleY);var minScaleConstraint=Math.min(baseWidth/this._dimensionsForAutoscale.width,baseHeight/this._dimensionsForAutoscale.width)/2;this._transformController.setScaleConstraints(minScaleConstraint,10/viewScale);var scale=this._transformController.scale();var rotateX=this._transformController.rotateX();var rotateY=this._transformController.rotateY();this._scale=scale*viewScale;var scaleAndRotationMatrix=new WebKitCSSMatrix().scale(scale,scale,scale).translate(canvasWidth/2,canvasHeight/2,0).rotate(rotateX,rotateY,0).scale(viewScale,viewScale,viewScale).translate(-baseWidth/2,-baseHeight/2,0);var bounds;for(var i=0;i<this._rects.length;++i)
bounds=WebInspector.Geometry.boundsForTransformedPoints(scaleAndRotationMatrix,this._rects[i].vertices,bounds);this._transformController.clampOffsets((paddingX-bounds.maxX)/window.devicePixelRatio,(canvasWidth-paddingX-bounds.minX)/window.devicePixelRatio,(paddingY-bounds.maxY)/window.devicePixelRatio,(canvasHeight-paddingY-bounds.minY)/window.devicePixelRatio);var offsetX=this._transformController.offsetX()*window.devicePixelRatio;var offsetY=this._transformController.offsetY()*window.devicePixelRatio;this._projectionMatrix=new WebKitCSSMatrix().translate(offsetX,offsetY,0).multiply(scaleAndRotationMatrix);var glProjectionMatrix=new WebKitCSSMatrix().scale(1,-1,-1).translate(-1,-1,0).scale(2/this._canvasElement.width,2/this._canvasElement.height,1/1000000).multiply(this._projectionMatrix);this._gl.uniformMatrix4fv(this._shaderProgram.pMatrixUniform,false,this._arrayFromMatrix(glProjectionMatrix));},_arrayFromMatrix:function(m)
{return new Float32Array([m.m11,m.m12,m.m13,m.m14,m.m21,m.m22,m.m23,m.m24,m.m31,m.m32,m.m33,m.m34,m.m41,m.m42,m.m43,m.m44]);},_initWhiteTexture:function()
{this._whiteTexture=this._gl.createTexture();this._gl.bindTexture(this._gl.TEXTURE_2D,this._whiteTexture);var whitePixel=new Uint8Array([255,255,255,255]);this._gl.texImage2D(this._gl.TEXTURE_2D,0,this._gl.RGBA,1,1,0,this._gl.RGBA,this._gl.UNSIGNED_BYTE,whitePixel);},_initChromeTextures:function()
{function saveChromeTexture(index,value)
{this._chromeTextures[index]=value||undefined;}
this._textureManager.createTexture(saveChromeTexture.bind(this,WebInspector.Layers3DView.ChromeTexture.Left),"Images/chromeLeft.png");this._textureManager.createTexture(saveChromeTexture.bind(this,WebInspector.Layers3DView.ChromeTexture.Middle),"Images/chromeMiddle.png");this._textureManager.createTexture(saveChromeTexture.bind(this,WebInspector.Layers3DView.ChromeTexture.Right),"Images/chromeRight.png");},_initGLIfNecessary:function()
{if(this._gl)
return this._gl;this._gl=this._initGL(this._canvasElement);this._initShaders();this._initWhiteTexture();this._initChromeTextures();this._textureManager.setContext(this._gl);return this._gl;},_calculateDepthsAndVisibility:function()
{this._depthByLayerId={};var depth=0;var showInternalLayers=this._layerViewHost.showInternalLayersSetting().get();var root=showInternalLayers?this._layerTree.root():(this._layerTree.contentRoot()||this._layerTree.root());var queue=[root];this._depthByLayerId[root.id()]=0;this._visibleLayers={};while(queue.length>0){var layer=queue.shift();this._visibleLayers[layer.id()]=showInternalLayers||layer.drawsContent();var children=layer.children();for(var i=0;i<children.length;++i){this._depthByLayerId[children[i].id()]=++depth;queue.push(children[i]);}}
this._maxDepth=depth;},_isSelectionActive:function(type,selection)
{return this._lastSelection[type]&&this._lastSelection[type].isEqual(selection);},_depthForLayer:function(layer)
{return this._depthByLayerId[layer.id()]*WebInspector.Layers3DView.LayerSpacing;},_calculateScrollRectDepth:function(layer,index)
{return this._depthForLayer(layer)+index*WebInspector.Layers3DView.ScrollRectSpacing+1;},_updateDimensionsForAutoscale:function(layer)
{this._dimensionsForAutoscale.width=Math.max(layer.width(),this._dimensionsForAutoscale.width);this._dimensionsForAutoscale.height=Math.max(layer.height(),this._dimensionsForAutoscale.height);},_calculateLayerRect:function(layer)
{if(!this._visibleLayers[layer.id()])
return;var selection=new WebInspector.LayerView.LayerSelection(layer);var rect=new WebInspector.Layers3DView.Rectangle(selection);rect.setVertices(layer.quad(),this._depthForLayer(layer));this._appendRect(rect);this._updateDimensionsForAutoscale(layer);},_appendRect:function(rect)
{var selection=rect.relatedObject;var isSelected=this._isSelectionActive(WebInspector.Layers3DView.OutlineType.Selected,selection);var isHovered=this._isSelectionActive(WebInspector.Layers3DView.OutlineType.Hovered,selection);if(isSelected){rect.borderColor=WebInspector.Layers3DView.SelectedBorderColor;}else if(isHovered){rect.borderColor=WebInspector.Layers3DView.HoveredBorderColor;var fillColor=rect.fillColor||[255,255,255,1];var maskColor=WebInspector.Layers3DView.HoveredImageMaskColor;rect.fillColor=[fillColor[0]*maskColor[0]/255,fillColor[1]*maskColor[1]/255,fillColor[2]*maskColor[2]/255,fillColor[3]*maskColor[3]];}else{rect.borderColor=WebInspector.Layers3DView.BorderColor;}
rect.lineWidth=isSelected?WebInspector.Layers3DView.SelectedBorderWidth:WebInspector.Layers3DView.BorderWidth;this._rects.push(rect);},_calculateLayerScrollRects:function(layer)
{var scrollRects=layer.scrollRects();for(var i=0;i<scrollRects.length;++i){var selection=new WebInspector.LayerView.ScrollRectSelection(layer,i);var rect=new WebInspector.Layers3DView.Rectangle(selection);rect.calculateVerticesFromRect(layer,scrollRects[i].rect,this._calculateScrollRectDepth(layer,i));rect.fillColor=WebInspector.Layers3DView.ScrollRectBackgroundColor;this._appendRect(rect);}},_calculateLayerImageRect:function(layer)
{var layerTexture=this._layerTexture;if(layer.id()!==layerTexture.layerId)
return;var selection=new WebInspector.LayerView.LayerSelection(layer);var rect=new WebInspector.Layers3DView.Rectangle(selection);rect.setVertices(layer.quad(),this._depthForLayer(layer));rect.texture=layerTexture.texture;this._appendRect(rect);},_calculateLayerTileRects:function(layer)
{var tiles=this._textureManager.tilesForLayer(layer.id());for(var i=0;i<tiles.length;++i){var tile=tiles[i];if(!tile.texture)
continue;var selection=new WebInspector.LayerView.TileSelection(layer,tile.traceEvent);var rect=new WebInspector.Layers3DView.Rectangle(selection);rect.calculateVerticesFromRect(layer,{x:tile.rect[0],y:tile.rect[1],width:tile.rect[2],height:tile.rect[3]},this._depthForLayer(layer)+1);rect.texture=tile.texture;this._appendRect(rect);}},_calculateRects:function()
{this._rects=[];this._dimensionsForAutoscale={width:0,height:0};this._layerTree.forEachLayer(this._calculateLayerRect.bind(this));if(this._showSlowScrollRectsSetting.get())
this._layerTree.forEachLayer(this._calculateLayerScrollRects.bind(this));if(this._showPaintsSetting.get()){if(this._layerTexture)
this._layerTree.forEachLayer(this._calculateLayerImageRect.bind(this));else
this._layerTree.forEachLayer(this._calculateLayerTileRects.bind(this));}},_makeColorsArray:function(color)
{var colors=[];var normalizedColor=[color[0]/255,color[1]/255,color[2]/255,color[3]];for(var i=0;i<4;i++)
colors=colors.concat(normalizedColor);return colors;},_setVertexAttribute:function(attribute,array,length)
{var gl=this._gl;var buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(array),gl.STATIC_DRAW);gl.vertexAttribPointer(attribute,length,gl.FLOAT,false,0,0);},_drawRectangle:function(vertices,mode,color,texture)
{var gl=this._gl;var white=[255,255,255,1];color=color||white;this._setVertexAttribute(this._shaderProgram.vertexPositionAttribute,vertices,3);this._setVertexAttribute(this._shaderProgram.textureCoordAttribute,[0,1,1,1,1,0,0,0],2);this._setVertexAttribute(this._shaderProgram.vertexColorAttribute,this._makeColorsArray(color),color.length);if(texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(this._shaderProgram.samplerUniform,0);}else{gl.bindTexture(gl.TEXTURE_2D,this._whiteTexture);}
var numberOfVertices=vertices.length/3;gl.drawArrays(mode,0,numberOfVertices);},_drawTexture:function(vertices,texture,color)
{this._drawRectangle(vertices,this._gl.TRIANGLE_FAN,color,texture);},_drawViewportAndChrome:function()
{var viewport=this._layerTree.viewportSize();if(!viewport)
return;var drawChrome=!WebInspector.settings.frameViewerHideChromeWindow.get()&&this._chromeTextures.length>=3&&this._chromeTextures.indexOf(undefined)<0;var z=(this._maxDepth+1)*WebInspector.Layers3DView.LayerSpacing;var borderWidth=Math.ceil(WebInspector.Layers3DView.ViewportBorderWidth*this._scale);var vertices=[viewport.width,0,z,viewport.width,viewport.height,z,0,viewport.height,z,0,0,z];this._gl.lineWidth(borderWidth);this._drawRectangle(vertices,drawChrome?this._gl.LINE_STRIP:this._gl.LINE_LOOP,WebInspector.Layers3DView.ViewportBorderColor);if(!drawChrome)
return;var borderAdjustment=WebInspector.Layers3DView.ViewportBorderWidth/2;var viewportWidth=this._layerTree.viewportSize().width+2*borderAdjustment;var chromeHeight=this._chromeTextures[0].image.naturalHeight;var middleFragmentWidth=viewportWidth-this._chromeTextures[0].image.naturalWidth-this._chromeTextures[2].image.naturalWidth;var x=-borderAdjustment;var y=-chromeHeight;for(var i=0;i<this._chromeTextures.length;++i){var width=i===WebInspector.Layers3DView.ChromeTexture.Middle?middleFragmentWidth:this._chromeTextures[i].image.naturalWidth;if(width<0||x+width>viewportWidth)
break;vertices=[x,y,z,x+width,y,z,x+width,y+chromeHeight,z,x,y+chromeHeight,z];this._drawTexture(vertices,(this._chromeTextures[i]));x+=width;}},_drawViewRect:function(rect)
{var vertices=rect.vertices;if(rect.texture)
this._drawTexture(vertices,rect.texture,rect.fillColor||undefined);else if(rect.fillColor)
this._drawRectangle(vertices,this._gl.TRIANGLE_FAN,rect.fillColor);this._gl.lineWidth(rect.lineWidth);if(rect.borderColor)
this._drawRectangle(vertices,this._gl.LINE_LOOP,rect.borderColor);},_update:function()
{if(!this.isShowing()){this._needsUpdate=true;return;}
if(!this._layerTree||!this._layerTree.root()){this._emptyView.show(this.element);return;}
this._emptyView.detach();var gl=this._initGLIfNecessary();this._resizeCanvas();this._calculateDepthsAndVisibility();this._calculateRects();this._updateTransformAndConstraints();this._textureManager.setScale(Number.constrain(0.1,1,this._scale));gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);this._rects.forEach(this._drawViewRect.bind(this));this._drawViewportAndChrome();},_selectionFromEventPoint:function(event)
{if(!this._layerTree)
return null;var closestIntersectionPoint=Infinity;var closestObject=null;var projectionMatrix=new WebKitCSSMatrix().scale(1,-1,-1).translate(-1,-1,0).multiply(this._projectionMatrix);var x0=(event.clientX-this._canvasElement.totalOffsetLeft())*window.devicePixelRatio;var y0=-(event.clientY-this._canvasElement.totalOffsetTop())*window.devicePixelRatio;function checkIntersection(rect)
{if(!rect.relatedObject)
return;var t=rect.intersectWithLine(projectionMatrix,x0,y0);if(t<closestIntersectionPoint){closestIntersectionPoint=t;closestObject=rect.relatedObject;}}
this._rects.forEach(checkIntersection);return closestObject;},_createVisibilitySetting:function(caption,name,value,statusBar)
{var checkbox=new WebInspector.StatusBarCheckbox(WebInspector.UIString(caption));statusBar.appendStatusBarItem(checkbox);var setting=WebInspector.settings.createSetting(name,value);WebInspector.SettingsUI.bindCheckbox(checkbox.inputElement,setting);setting.addChangeListener(this._update,this);return setting;},_initStatusBar:function()
{this._panelStatusBar=this._transformController.statusBar();this.element.appendChild(this._panelStatusBar.element);this._showSlowScrollRectsSetting=this._createVisibilitySetting("Slow scroll rects","frameViewerShowSlowScrollRects",true,this._panelStatusBar);this._showPaintsSetting=this._createVisibilitySetting("Paints","frameViewerShowPaints",true,this._panelStatusBar);WebInspector.settings.frameViewerHideChromeWindow.addChangeListener(this._update,this);},_onContextMenu:function(event)
{var contextMenu=new WebInspector.ContextMenu(event);contextMenu.appendItem(WebInspector.UIString("Reset View"),this._transformController.resetAndNotify.bind(this._transformController),false);var selection=this._selectionFromEventPoint(event);if(selection&&selection.type()===WebInspector.LayerView.Selection.Type.Tile)
contextMenu.appendItem(WebInspector.UIString("Show Paint Profiler"),this.dispatchEventToListeners.bind(this,WebInspector.Layers3DView.Events.PaintProfilerRequested,selection.traceEvent()),false);this._layerViewHost.showContextMenu(contextMenu,selection);},_onMouseMove:function(event)
{if(event.which)
return;this._layerViewHost.hoverObject(this._selectionFromEventPoint(event));},_onMouseDown:function(event)
{this._mouseDownX=event.clientX;this._mouseDownY=event.clientY;},_onMouseUp:function(event)
{const maxDistanceInPixels=6;if(this._mouseDownX&&Math.abs(event.clientX-this._mouseDownX)<maxDistanceInPixels&&Math.abs(event.clientY-this._mouseDownY)<maxDistanceInPixels)
this._layerViewHost.selectObject(this._selectionFromEventPoint(event));delete this._mouseDownX;delete this._mouseDownY;},_onDoubleClick:function(event)
{var selection=this._selectionFromEventPoint(event);if(selection){if(selection.type()==WebInspector.LayerView.Selection.Type.Tile)
this.dispatchEventToListeners(WebInspector.Layers3DView.Events.PaintProfilerRequested,selection.traceEvent());else if(selection.layer())
this.dispatchEventToListeners(WebInspector.Layers3DView.Events.LayerSnapshotRequested,selection.layer());}
event.stopPropagation();},__proto__:WebInspector.VBox.prototype}
WebInspector.LayerTextureManager=function()
{WebInspector.Object.call(this);this.reset();}
WebInspector.LayerTextureManager.Events={TextureUpdated:"TextureUpated"}
WebInspector.LayerTextureManager.prototype={reset:function()
{this._tilesByLayerId={};this._scale=0;},setContext:function(glContext)
{this._gl=glContext;if(this._scale)
this._updateTextures();},setTiles:function(paintTiles)
{this._tilesByLayerId={};if(!paintTiles)
return;for(var i=0;i<paintTiles.length;++i){var layerId=paintTiles[i].layerId;var tilesForLayer=this._tilesByLayerId[layerId];if(!tilesForLayer){tilesForLayer=[];this._tilesByLayerId[layerId]=tilesForLayer;}
var tile=new WebInspector.LayerTextureManager.Tile(paintTiles[i].snapshot,paintTiles[i].rect,paintTiles[i].traceEvent);tilesForLayer.push(tile);if(this._scale&&this._gl)
this._updateTile(tile);}},setScale:function(scale)
{if(this._scale&&this._scale>=scale)
return;this._scale=scale;this._updateTextures();},tilesForLayer:function(layerId)
{return this._tilesByLayerId[layerId]||[];},_updateTextures:function()
{if(!this._gl)
return;if(!this._scale)
return;for(var layerId in this._tilesByLayerId){for(var i=0;i<this._tilesByLayerId[layerId].length;++i){var tile=this._tilesByLayerId[layerId][i];if(!tile.scale||tile.scale<this._scale)
this._updateTile(tile);}}},_updateTile:function(tile)
{console.assert(this._scale&&this._gl);tile.scale=this._scale;tile.snapshot.requestImage(null,null,tile.scale,onGotImage.bind(this));function onGotImage(imageURL)
{if(imageURL)
this.createTexture(onTextureCreated.bind(this),imageURL);}
function onTextureCreated(texture)
{tile.texture=texture;this.dispatchEventToListeners(WebInspector.LayerTextureManager.Events.TextureUpdated);}},createTexture:function(textureCreatedCallback,imageURL)
{var image=new Image();image.addEventListener("load",onImageLoaded.bind(this),false);image.addEventListener("error",onImageError,false);image.src=imageURL;function onImageLoaded()
{textureCreatedCallback(this._createTextureForImage(image));}
function onImageError()
{textureCreatedCallback(null);}},_createTextureForImage:function(image)
{var texture=this._gl.createTexture();texture.image=image;this._gl.bindTexture(this._gl.TEXTURE_2D,texture);this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL,true);this._gl.texImage2D(this._gl.TEXTURE_2D,0,this._gl.RGBA,this._gl.RGBA,this._gl.UNSIGNED_BYTE,texture.image);this._gl.texParameteri(this._gl.TEXTURE_2D,this._gl.TEXTURE_MIN_FILTER,this._gl.LINEAR);this._gl.texParameteri(this._gl.TEXTURE_2D,this._gl.TEXTURE_MAG_FILTER,this._gl.LINEAR);this._gl.texParameteri(this._gl.TEXTURE_2D,this._gl.TEXTURE_WRAP_S,this._gl.CLAMP_TO_EDGE);this._gl.texParameteri(this._gl.TEXTURE_2D,this._gl.TEXTURE_WRAP_T,this._gl.CLAMP_TO_EDGE);this._gl.bindTexture(this._gl.TEXTURE_2D,null);return texture;},__proto__:WebInspector.Object.prototype}
WebInspector.Layers3DView.Rectangle=function(relatedObject)
{this.relatedObject=relatedObject;this.lineWidth=1;this.borderColor=null;this.fillColor=null;this.texture=null;}
WebInspector.Layers3DView.Rectangle.prototype={setVertices:function(quad,z)
{this.vertices=[quad[0],quad[1],z,quad[2],quad[3],z,quad[4],quad[5],z,quad[6],quad[7],z];},_calculatePointOnQuad:function(quad,ratioX,ratioY)
{var x0=quad[0];var y0=quad[1];var x1=quad[2];var y1=quad[3];var x2=quad[4];var y2=quad[5];var x3=quad[6];var y3=quad[7];var firstSidePointX=x0+ratioX*(x1-x0);var firstSidePointY=y0+ratioX*(y1-y0);var thirdSidePointX=x3+ratioX*(x2-x3);var thirdSidePointY=y3+ratioX*(y2-y3);var x=firstSidePointX+ratioY*(thirdSidePointX-firstSidePointX);var y=firstSidePointY+ratioY*(thirdSidePointY-firstSidePointY);return[x,y];},calculateVerticesFromRect:function(layer,rect,z)
{var quad=layer.quad();var rx1=rect.x/layer.width();var rx2=(rect.x+rect.width)/layer.width();var ry1=rect.y/layer.height();var ry2=(rect.y+rect.height)/layer.height();var rectQuad=this._calculatePointOnQuad(quad,rx1,ry1).concat(this._calculatePointOnQuad(quad,rx2,ry1)).concat(this._calculatePointOnQuad(quad,rx2,ry2)).concat(this._calculatePointOnQuad(quad,rx1,ry2));this.setVertices(rectQuad,z);},intersectWithLine:function(matrix,x0,y0)
{var i;var points=[];for(i=0;i<4;++i)
points[i]=WebInspector.Geometry.multiplyVectorByMatrixAndNormalize(new WebInspector.Geometry.Vector(this.vertices[i*3],this.vertices[i*3+1],this.vertices[i*3+2]),matrix);var normal=WebInspector.Geometry.crossProduct(WebInspector.Geometry.subtract(points[1],points[0]),WebInspector.Geometry.subtract(points[2],points[1]));var A=normal.x;var B=normal.y;var C=normal.z;var D=-(A*points[0].x+B*points[0].y+C*points[0].z);var t=-(D+A*x0+B*y0)/C;var pt=new WebInspector.Geometry.Vector(x0,y0,t);var tVects=points.map(WebInspector.Geometry.subtract.bind(null,pt));for(i=0;i<tVects.length;++i){var product=WebInspector.Geometry.scalarProduct(normal,WebInspector.Geometry.crossProduct(tVects[i],tVects[(i+1)%tVects.length]));if(product<0)
return undefined;}
return t;}}
WebInspector.LayerTextureManager.Tile=function(snapshot,rect,traceEvent)
{this.snapshot=snapshot;this.rect=rect;this.traceEvent=traceEvent;this.scale=0;this.texture=null;};WebInspector.MemoryCountersGraph=function(delegate,model)
{WebInspector.CountersGraph.call(this,WebInspector.UIString("MEMORY"),delegate,model);this._countersByName={};this._countersByName["jsHeapSizeUsed"]=this.createCounter(WebInspector.UIString("Used JS Heap"),WebInspector.UIString("JS Heap Size: %d"),"hsl(220, 90%, 43%)");this._countersByName["documents"]=this.createCounter(WebInspector.UIString("Documents"),WebInspector.UIString("Documents: %d"),"hsl(0, 90%, 43%)");this._countersByName["nodes"]=this.createCounter(WebInspector.UIString("Nodes"),WebInspector.UIString("Nodes: %d"),"hsl(120, 90%, 43%)");this._countersByName["jsEventListeners"]=this.createCounter(WebInspector.UIString("Listeners"),WebInspector.UIString("Listeners: %d"),"hsl(38, 90%, 43%)");if(Runtime.experiments.isEnabled("gpuTimeline")){this._gpuMemoryCounter=this.createCounter(WebInspector.UIString("GPU Memory"),WebInspector.UIString("GPU Memory [KB]: %d"),"hsl(300, 90%, 43%)");this._countersByName["gpuMemoryUsedKB"]=this._gpuMemoryCounter;}}
WebInspector.MemoryCountersGraph.prototype={refreshRecords:function(textFilter)
{this.reset();var events=this._model.mainThreadEvents();for(var i=0;i<events.length;++i){var event=events[i];if(event.name!==WebInspector.TimelineModel.RecordType.UpdateCounters)
continue;var counters=event.args.data;if(!counters)
return;for(var name in counters){var counter=this._countersByName[name];if(counter)
counter.appendSample(event.startTime,counters[name]);}
var gpuMemoryLimitCounterName="gpuMemoryLimitKB";if(this._gpuMemoryCounter&&(gpuMemoryLimitCounterName in counters))
this._gpuMemoryCounter.setLimit(counters[gpuMemoryLimitCounterName]);}
this.scheduleRefresh();},__proto__:WebInspector.CountersGraph.prototype};WebInspector.TimelineModel=function(tracingModel,recordFilter)
{WebInspector.Object.call(this);this._filters=[];this._tracingModel=tracingModel;this._recordFilter=recordFilter;this._targets=[];this.reset();WebInspector.targetManager.observeTargets(this);}
WebInspector.TimelineModel.RecordType={Task:"Task",Program:"Program",EventDispatch:"EventDispatch",GPUTask:"GPUTask",Animation:"Animation",RequestMainThreadFrame:"RequestMainThreadFrame",BeginFrame:"BeginFrame",BeginMainThreadFrame:"BeginMainThreadFrame",ActivateLayerTree:"ActivateLayerTree",DrawFrame:"DrawFrame",ScheduleStyleRecalculation:"ScheduleStyleRecalculation",RecalculateStyles:"RecalculateStyles",InvalidateLayout:"InvalidateLayout",Layout:"Layout",UpdateLayer:"UpdateLayer",UpdateLayerTree:"UpdateLayerTree",PaintSetup:"PaintSetup",Paint:"Paint",PaintImage:"PaintImage",Rasterize:"Rasterize",RasterTask:"RasterTask",ScrollLayer:"ScrollLayer",CompositeLayers:"CompositeLayers",ScheduleStyleInvalidationTracking:"ScheduleStyleInvalidationTracking",StyleRecalcInvalidationTracking:"StyleRecalcInvalidationTracking",StyleInvalidatorInvalidationTracking:"StyleInvalidatorInvalidationTracking",LayoutInvalidationTracking:"LayoutInvalidationTracking",LayerInvalidationTracking:"LayerInvalidationTracking",PaintInvalidationTracking:"PaintInvalidationTracking",ScrollInvalidationTracking:"ScrollInvalidationTracking",ParseHTML:"ParseHTML",ParseAuthorStyleSheet:"ParseAuthorStyleSheet",TimerInstall:"TimerInstall",TimerRemove:"TimerRemove",TimerFire:"TimerFire",XHRReadyStateChange:"XHRReadyStateChange",XHRLoad:"XHRLoad",EvaluateScript:"EvaluateScript",CommitLoad:"CommitLoad",MarkLoad:"MarkLoad",MarkDOMContent:"MarkDOMContent",MarkFirstPaint:"MarkFirstPaint",TimeStamp:"TimeStamp",ConsoleTime:"ConsoleTime",ResourceSendRequest:"ResourceSendRequest",ResourceReceiveResponse:"ResourceReceiveResponse",ResourceReceivedData:"ResourceReceivedData",ResourceFinish:"ResourceFinish",FunctionCall:"FunctionCall",GCEvent:"GCEvent",JSFrame:"JSFrame",JSSample:"JSSample",V8Sample:"V8Sample",JitCodeAdded:"JitCodeAdded",JitCodeMoved:"JitCodeMoved",UpdateCounters:"UpdateCounters",RequestAnimationFrame:"RequestAnimationFrame",CancelAnimationFrame:"CancelAnimationFrame",FireAnimationFrame:"FireAnimationFrame",WebSocketCreate:"WebSocketCreate",WebSocketSendHandshakeRequest:"WebSocketSendHandshakeRequest",WebSocketReceiveHandshakeResponse:"WebSocketReceiveHandshakeResponse",WebSocketDestroy:"WebSocketDestroy",EmbedderCallback:"EmbedderCallback",SetLayerTreeId:"SetLayerTreeId",TracingStartedInPage:"TracingStartedInPage",TracingSessionIdForWorker:"TracingSessionIdForWorker",DecodeImage:"Decode Image",ResizeImage:"Resize Image",DrawLazyPixelRef:"Draw LazyPixelRef",DecodeLazyPixelRef:"Decode LazyPixelRef",LazyPixelRef:"LazyPixelRef",LayerTreeHostImplSnapshot:"cc::LayerTreeHostImpl",PictureSnapshot:"cc::Picture",CpuProfile:"CpuProfile"}
WebInspector.TimelineModel.Events={RecordsCleared:"RecordsCleared",RecordingStarted:"RecordingStarted",RecordingStopped:"RecordingStopped",RecordFilterChanged:"RecordFilterChanged",BufferUsage:"BufferUsage",RetrieveEventsProgress:"RetrieveEventsProgress"}
WebInspector.TimelineModel.MainThreadName="main";WebInspector.TimelineModel.forEachEvent=function(events,onStartEvent,onEndEvent,onInstantEvent)
{var stack=[];for(var i=0;i<events.length;++i){var e=events[i];while(stack.length&&stack.peekLast().endTime<=e.startTime)
onEndEvent(stack.pop());if(e.duration){onStartEvent(e);stack.push(e);}else{onInstantEvent&&onInstantEvent(e,stack.peekLast()||null);}}
while(stack.length)
onEndEvent(stack.pop());}
WebInspector.TimelineModel.forAllRecords=function(recordsArray,preOrderCallback,postOrderCallback)
{function processRecords(records,depth)
{for(var i=0;i<records.length;++i){var record=records[i];if(preOrderCallback&&preOrderCallback(record,depth))
return true;if(processRecords(record.children(),depth+1))
return true;if(postOrderCallback&&postOrderCallback(record,depth))
return true;}
return false;}
return processRecords(recordsArray,0);}
WebInspector.TimelineModel.TransferChunkLengthBytes=5000000;WebInspector.TimelineModel.VirtualThread=function(name)
{this.name=name;this.events=[];this.asyncEventsByGroup=new Map();}
WebInspector.TimelineModel.VirtualThread.prototype={isWorker:function()
{return this.name==="WebCore: Worker";}}
WebInspector.TimelineModel.Record=function(model,traceEvent)
{this._model=model;this._event=traceEvent;traceEvent._timelineRecord=this;this._children=[];}
WebInspector.TimelineModel.Record._compareStartTime=function(a,b)
{return a.startTime()<=b.startTime()?-1:1;}
WebInspector.TimelineModel.Record.prototype={callSiteStackTrace:function()
{var initiator=this._event.initiator;return initiator?initiator.stackTrace:null;},initiator:function()
{var initiator=this._event.initiator;return initiator?initiator._timelineRecord:null;},target:function()
{return this._event.thread.target();},selfTime:function()
{return this._event.selfTime;},children:function()
{return this._children;},startTime:function()
{return this._event.startTime;},thread:function()
{if(this._event.thread.name()==="CrRendererMain")
return WebInspector.TimelineModel.MainThreadName;return this._event.thread.name();},endTime:function()
{return this._endTime||this._event.endTime||this._event.startTime;},setEndTime:function(endTime)
{this._endTime=endTime;},data:function()
{return this._event.args["data"];},type:function()
{if(this._event.category===WebInspector.TracingModel.ConsoleEventCategory)
return WebInspector.TimelineModel.RecordType.ConsoleTime;return this._event.name;},frameId:function()
{switch(this._event.name){case WebInspector.TimelineModel.RecordType.RecalculateStyles:case WebInspector.TimelineModel.RecordType.Layout:return this._event.args["beginData"]["frame"];default:var data=this._event.args["data"];return(data&&data["frame"])||"";}},stackTrace:function()
{return this._event.stackTrace;},getUserObject:function(key)
{if(key==="TimelineUIUtils::preview-element")
return this._event.previewElement;throw new Error("Unexpected key: "+key);},setUserObject:function(key,value)
{if(key!=="TimelineUIUtils::preview-element")
throw new Error("Unexpected key: "+key);this._event.previewElement=(value);},warnings:function()
{if(this._event.warning)
return[this._event.warning];return null;},traceEvent:function()
{return this._event;},_addChild:function(child)
{this._children.push(child);child.parent=this;},timelineModel:function()
{return this._model;}}
WebInspector.TimelineModel.prototype={startRecording:function(captureCauses,enableJSSampling,captureMemory,capturePictures)
{function disabledByDefault(category)
{return"disabled-by-default-"+category;}
var categoriesArray=["-*",disabledByDefault("devtools.timeline"),disabledByDefault("devtools.timeline.frame"),WebInspector.TracingModel.ConsoleEventCategory];if(Runtime.experiments.isEnabled("timelineFlowEvents")){categoriesArray.push(disabledByDefault("toplevel.flow"),disabledByDefault("ipc.flow"),disabledByDefault("devtools.timeline.top-level-task"));}
if(Runtime.experiments.isEnabled("timelineTracingJSProfile")&&enableJSSampling)
categoriesArray.push(disabledByDefault("v8.cpu_profile"));if(captureCauses||enableJSSampling)
categoriesArray.push(disabledByDefault("devtools.timeline.stack"));if(captureCauses&&Runtime.experiments.isEnabled("timelineInvalidationTracking"))
categoriesArray.push(disabledByDefault("devtools.timeline.invalidationTracking"));if(capturePictures){categoriesArray.push(disabledByDefault("devtools.timeline.layers"),disabledByDefault("devtools.timeline.picture"),disabledByDefault("blink.graphics_context_annotations"));}
var categories=categoriesArray.join(",");this._startRecordingWithCategories(categories,enableJSSampling);},stopRecording:function()
{this._allProfilesStoppedPromise=this._stopProfilingOnAllTargets();if(this._targets[0])
this._targets[0].tracingManager.stop();},forAllRecords:function(preOrderCallback,postOrderCallback)
{WebInspector.TimelineModel.forAllRecords(this._records,preOrderCallback,postOrderCallback);},addFilter:function(filter)
{this._filters.push(filter);filter._model=this;},forAllFilteredRecords:function(callback)
{function processRecord(record,depth)
{var visible=this.isVisible(record);if(visible){if(callback(record,depth))
return true;}
for(var i=0;i<record.children().length;++i){if(processRecord.call(this,record.children()[i],visible?depth+1:depth))
return true;}
return false;}
for(var i=0;i<this._records.length;++i)
processRecord.call(this,this._records[i],0);},isVisible:function(record)
{for(var i=0;i<this._filters.length;++i){if(!this._filters[i].accept(record))
return false;}
return true;},_filterChanged:function()
{this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordFilterChanged);},records:function()
{return this._records;},target:function()
{return this._targets[0];},setEventsForTest:function(events)
{this._startCollectingTraceEvents(false);this._tracingModel.addEvents(events);this.tracingComplete();},targetAdded:function(target)
{this._targets.push(target);if(this._profiling)
this._startProfilingOnTarget(target);},targetRemoved:function(target)
{this._targets.remove(target,true);},_startProfilingOnTarget:function(target)
{target.profilerAgent().start();},_startProfilingOnAllTargets:function()
{var intervalUs=WebInspector.settings.highResolutionCpuProfiling.get()?100:1000;this._targets[0].profilerAgent().setSamplingInterval(intervalUs);this._profiling=true;for(var target of this._targets)
this._startProfilingOnTarget(target);},_stopProfilingOnTarget:function(target)
{function extractProfile(value)
{return value&&value.profile;}
return target.profilerAgent().stop().then(extractProfile).then(this._addCpuProfile.bind(this,target.id()));},_stopProfilingOnAllTargets:function()
{var targets=this._profiling?this._targets:[];this._profiling=false;return Promise.all(targets.map(this._stopProfilingOnTarget,this));},_startRecordingWithCategories:function(categories,enableJSSampling)
{if(!this._targets.length)
return;if(enableJSSampling&&!Runtime.experiments.isEnabled("timelineTracingJSProfile"))
this._startProfilingOnAllTargets();this._targets[0].tracingManager.start(this,categories,"");},_startCollectingTraceEvents:function(fromFile)
{this._tracingModel.reset();this.reset();this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordingStarted,{fromFile:fromFile});},tracingStarted:function()
{this._startCollectingTraceEvents(false);},traceEventsCollected:function(events)
{this._tracingModel.addEvents(events);},tracingComplete:function()
{if(!this._allProfilesStoppedPromise){this._didStopRecordingTraceEvents();return;}
this._allProfilesStoppedPromise.then(this._didStopRecordingTraceEvents.bind(this));this._allProfilesStoppedPromise=null;},tracingBufferUsage:function(usage)
{this.dispatchEventToListeners(WebInspector.TimelineModel.Events.BufferUsage,usage);},eventsRetrievalProgress:function(progress)
{this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RetrieveEventsProgress,progress);},_addCpuProfile:function(targetId,cpuProfile)
{if(!cpuProfile)
return;if(!this._cpuProfiles)
this._cpuProfiles=new Map();this._cpuProfiles.set(targetId,cpuProfile);},_didStopRecordingTraceEvents:function()
{this._injectCpuProfileEvents();this._tracingModel.tracingComplete();var metaEvents=this._tracingModel.devtoolsPageMetadataEvents();var workerMetadataEvents=this._tracingModel.devtoolsWorkerMetadataEvents();this._resetProcessingState();for(var i=0,length=metaEvents.length;i<length;i++){var metaEvent=metaEvents[i];var process=metaEvent.thread.process();var startTime=metaEvent.startTime;var endTime=Infinity;if(i+1<length)
endTime=metaEvents[i+1].startTime;this._currentPage=metaEvent.args["data"]&&metaEvent.args["data"]["page"];for(var thread of process.sortedThreads()){if(thread.name()==="WebCore: Worker"&&!workerMetadataEvents.some(function(e){return e.args["data"]["workerThreadId"]===thread.id();}))
continue;this._processThreadEvents(startTime,endTime,metaEvent.thread,thread);}}
this._inspectedTargetEvents.sort(WebInspector.TracingModel.Event.compareStartTime);this._cpuProfiles=null;this._buildTimelineRecords();this._buildGPUTasks();this._insertFirstPaintEvent();this._resetProcessingState();this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordingStopped);},_injectCpuProfileEvent:function(pid,tid,cpuProfile)
{if(!cpuProfile)
return;var cpuProfileEvent=({cat:WebInspector.TracingModel.DevToolsMetadataEventCategory,ph:WebInspector.TracingModel.Phase.Instant,ts:this._tracingModel.maximumRecordTime()*1000,pid:pid,tid:tid,name:WebInspector.TimelineModel.RecordType.CpuProfile,args:{data:{cpuProfile:cpuProfile}}});this._tracingModel.addEvents([cpuProfileEvent]);},_injectCpuProfileEvents:function()
{if(!this._cpuProfiles)
return;var mainMetaEvent=this._tracingModel.devtoolsPageMetadataEvents().peekLast();var pid=mainMetaEvent.thread.process().id();var mainTarget=this._targets[0];var mainCpuProfile=this._cpuProfiles.get(mainTarget.id());this._injectCpuProfileEvent(pid,mainMetaEvent.thread.id(),mainCpuProfile);var workerMetadataEvents=this._tracingModel.devtoolsWorkerMetadataEvents();for(var metaEvent of workerMetadataEvents){var workerId=metaEvent.args["data"]["workerId"];var target=mainTarget.workerManager?mainTarget.workerManager.targetByWorkerId(workerId):null;if(!target)
continue;var cpuProfile=this._cpuProfiles.get(target.id());this._injectCpuProfileEvent(pid,metaEvent.args["data"]["workerThreadId"],cpuProfile);}
this._cpuProfiles=null;},_insertFirstPaintEvent:function()
{if(!this._firstCompositeLayers)
return;var recordTypes=WebInspector.TimelineModel.RecordType;var i=insertionIndexForObjectInListSortedByFunction(this._firstCompositeLayers,this._inspectedTargetEvents,WebInspector.TracingModel.Event.compareStartTime);for(;i<this._inspectedTargetEvents.length&&this._inspectedTargetEvents[i].name!==recordTypes.DrawFrame;++i){}
if(i>=this._inspectedTargetEvents.length)
return;var drawFrameEvent=this._inspectedTargetEvents[i];var firstPaintEvent=new WebInspector.TracingModel.Event(drawFrameEvent.category,recordTypes.MarkFirstPaint,WebInspector.TracingModel.Phase.Instant,drawFrameEvent.startTime,drawFrameEvent.thread);this._mainThreadEvents.splice(insertionIndexForObjectInListSortedByFunction(firstPaintEvent,this._mainThreadEvents,WebInspector.TracingModel.Event.compareStartTime),0,firstPaintEvent);var firstPaintRecord=new WebInspector.TimelineModel.Record(this,firstPaintEvent);this._eventDividerRecords.splice(insertionIndexForObjectInListSortedByFunction(firstPaintRecord,this._eventDividerRecords,WebInspector.TimelineModel.Record._compareStartTime),0,firstPaintRecord);},_buildTimelineRecords:function()
{var topLevelRecords=this._buildTimelineRecordsForThread(this.mainThreadEvents());function processVirtualThreadEvents(virtualThread)
{var threadRecords=this._buildTimelineRecordsForThread(virtualThread.events);topLevelRecords=topLevelRecords.mergeOrdered(threadRecords,WebInspector.TimelineModel.Record._compareStartTime);}
this.virtualThreads().forEach(processVirtualThreadEvents.bind(this));for(var i=0;i<topLevelRecords.length;i++){var record=topLevelRecords[i];if(record.type()===WebInspector.TimelineModel.RecordType.Program)
this._mainThreadTasks.push(record);}
this._records=topLevelRecords;},_buildGPUTasks:function()
{var gpuProcess=this._tracingModel.processByName("GPU Process");if(!gpuProcess)
return;var mainThread=gpuProcess.threadByName("CrGpuMain");if(!mainThread)
return;var events=mainThread.events();var recordTypes=WebInspector.TimelineModel.RecordType;for(var i=0;i<events.length;++i){if(events[i].name===recordTypes.GPUTask)
this._gpuTasks.push(new WebInspector.TimelineModel.Record(this,events[i]));}},_buildTimelineRecordsForThread:function(threadEvents)
{var recordStack=[];var topLevelRecords=[];for(var i=0,size=threadEvents.length;i<size;++i){var event=threadEvents[i];for(var top=recordStack.peekLast();top&&top._event.endTime<=event.startTime;top=recordStack.peekLast()){recordStack.pop();if(!recordStack.length)
topLevelRecords.push(top);}
if(event.phase===WebInspector.TracingModel.Phase.AsyncEnd||event.phase===WebInspector.TracingModel.Phase.NestableAsyncEnd)
continue;var parentRecord=recordStack.peekLast();if(WebInspector.TracingModel.isAsyncBeginPhase(event.phase)&&parentRecord&&event.endTime>parentRecord._event.endTime)
continue;var record=new WebInspector.TimelineModel.Record(this,event);if(WebInspector.TimelineUIUtils.isMarkerEvent(event))
this._eventDividerRecords.push(record);if(!this._recordFilter.accept(record))
continue;if(parentRecord)
parentRecord._addChild(record);if(event.endTime)
recordStack.push(record);}
if(recordStack.length)
topLevelRecords.push(recordStack[0]);return topLevelRecords;},_resetProcessingState:function()
{this._sendRequestEvents={};this._timerEvents={};this._requestAnimationFrameEvents={};this._invalidationTracker=new WebInspector.InvalidationTracker();this._layoutInvalidate={};this._lastScheduleStyleRecalculation={};this._webSocketCreateEvents={};this._paintImageEventByPixelRefId={};this._lastPaintForLayer={};this._lastRecalculateStylesEvent=null;this._currentScriptEvent=null;this._eventStack=[];this._hadCommitLoad=false;this._firstCompositeLayers=null;this._currentPage=null;},_processThreadEvents:function(startTime,endTime,mainThread,thread)
{var events=thread.events().stableSort(WebInspector.TracingModel.Event.compareStartTime);var asyncEvents=thread.asyncEvents();var jsSamples;if(Runtime.experiments.isEnabled("timelineTracingJSProfile")){jsSamples=WebInspector.TimelineJSProfileProcessor.processRawV8Samples(events);}else{var cpuProfileEvent=events.peekLast();if(cpuProfileEvent&&cpuProfileEvent.name===WebInspector.TimelineModel.RecordType.CpuProfile){var cpuProfile=cpuProfileEvent.args["data"]["cpuProfile"];if(cpuProfile)
jsSamples=WebInspector.TimelineJSProfileProcessor.generateTracingEventsFromCpuProfile(cpuProfile,thread);}}
if(jsSamples){events=events.mergeOrdered(jsSamples,WebInspector.TracingModel.Event.orderedCompareStartTime);var jsFrameEvents=WebInspector.TimelineJSProfileProcessor.generateJSFrameEvents(events);events=jsFrameEvents.mergeOrdered(events,WebInspector.TracingModel.Event.orderedCompareStartTime);}
var threadEvents;var threadAsyncEventsByGroup;if(thread===mainThread){threadEvents=this._mainThreadEvents;threadAsyncEventsByGroup=this._mainThreadAsyncEventsByGroup;}else{var virtualThread=new WebInspector.TimelineModel.VirtualThread(thread.name());this._virtualThreads.push(virtualThread);threadEvents=virtualThread.events;threadAsyncEventsByGroup=virtualThread.asyncEventsByGroup;}
this._eventStack=[];var i=events.lowerBound(startTime,function(time,event){return time-event.startTime});var length=events.length;for(;i<length;i++){var event=events[i];if(endTime&&event.startTime>=endTime)
break;this._updateEventStack(event);if(!this._processEvent(event))
continue;threadEvents.push(event);this._inspectedTargetEvents.push(event);}
i=asyncEvents.lowerBound(startTime,function(time,asyncEvent){return time-asyncEvent.startTime});for(;i<asyncEvents.length;++i){var asyncEvent=asyncEvents[i];if(endTime&&asyncEvent.startTime>=endTime)
break;var asyncGroup=this._processAsyncEvent(asyncEvent);if(!asyncGroup)
continue;var groupAsyncEvents=threadAsyncEventsByGroup.get(asyncGroup);if(!groupAsyncEvents){groupAsyncEvents=[];threadAsyncEventsByGroup.set(asyncGroup,groupAsyncEvents);}
groupAsyncEvents.push(asyncEvent);}},_updateEventStack:function(event)
{if(WebInspector.TracingModel.isAsyncPhase(event.phase))
return;var eventStack=this._eventStack;while(eventStack.length&&eventStack.peekLast().endTime<event.startTime)
eventStack.pop();var duration=event.duration;if(!duration)
return;if(eventStack.length){var parent=eventStack.peekLast();parent.selfTime-=duration;if(parent.selfTime<0){var epsilon=1e-3;console.assert(parent.selfTime>-epsilon,"Children are longer than parent at "+event.startTime);parent.selfTime=0;}}
event.selfTime=duration;eventStack.push(event);},_processEvent:function(event)
{var recordTypes=WebInspector.TimelineModel.RecordType;if(this._currentScriptEvent&&event.startTime>this._currentScriptEvent.endTime)
this._currentScriptEvent=null;var eventData=event.args["data"]||event.args["beginData"]||{};if(eventData&&eventData["stackTrace"])
event.stackTrace=eventData["stackTrace"];switch(event.name){case recordTypes.ResourceSendRequest:this._sendRequestEvents[event.args["data"]["requestId"]]=event;event.url=event.args["data"]["url"];break;case recordTypes.ResourceReceiveResponse:case recordTypes.ResourceReceivedData:case recordTypes.ResourceFinish:event.initiator=this._sendRequestEvents[event.args["data"]["requestId"]];if(event.initiator)
event.url=event.initiator.url;break;case recordTypes.TimerInstall:this._timerEvents[event.args["data"]["timerId"]]=event;break;case recordTypes.TimerFire:event.initiator=this._timerEvents[event.args["data"]["timerId"]];break;case recordTypes.RequestAnimationFrame:this._requestAnimationFrameEvents[event.args["data"]["id"]]=event;break;case recordTypes.FireAnimationFrame:event.initiator=this._requestAnimationFrameEvents[event.args["data"]["id"]];break;case recordTypes.ScheduleStyleRecalculation:this._lastScheduleStyleRecalculation[event.args["data"]["frame"]]=event;break;case recordTypes.RecalculateStyles:this._invalidationTracker.didRecalcStyle(event);if(event.args["beginData"])
event.initiator=this._lastScheduleStyleRecalculation[event.args["beginData"]["frame"]];this._lastRecalculateStylesEvent=event;break;case recordTypes.ScheduleStyleInvalidationTracking:case recordTypes.StyleRecalcInvalidationTracking:case recordTypes.StyleInvalidatorInvalidationTracking:case recordTypes.LayoutInvalidationTracking:case recordTypes.LayerInvalidationTracking:case recordTypes.PaintInvalidationTracking:case recordTypes.ScrollInvalidationTracking:this._invalidationTracker.addInvalidation(new WebInspector.InvalidationTrackingEvent(event));break;case recordTypes.InvalidateLayout:var layoutInitator=event;var frameId=event.args["data"]["frame"];if(!this._layoutInvalidate[frameId]&&this._lastRecalculateStylesEvent&&this._lastRecalculateStylesEvent.endTime>event.startTime)
layoutInitator=this._lastRecalculateStylesEvent.initiator;this._layoutInvalidate[frameId]=layoutInitator;break;case recordTypes.Layout:this._invalidationTracker.didLayout(event);var frameId=event.args["beginData"]["frame"];event.initiator=this._layoutInvalidate[frameId];if(event.args["endData"]){event.backendNodeId=event.args["endData"]["rootNode"];event.highlightQuad=event.args["endData"]["root"];}
this._layoutInvalidate[frameId]=null;if(this._currentScriptEvent)
event.warning=WebInspector.UIString("Forced synchronous layout is a possible performance bottleneck.");break;case recordTypes.WebSocketCreate:this._webSocketCreateEvents[event.args["data"]["identifier"]]=event;break;case recordTypes.WebSocketSendHandshakeRequest:case recordTypes.WebSocketReceiveHandshakeResponse:case recordTypes.WebSocketDestroy:event.initiator=this._webSocketCreateEvents[event.args["data"]["identifier"]];break;case recordTypes.EvaluateScript:case recordTypes.FunctionCall:if(!this._currentScriptEvent)
this._currentScriptEvent=event;break;case recordTypes.SetLayerTreeId:this._inspectedTargetLayerTreeId=event.args["layerTreeId"]||event.args["data"]["layerTreeId"];break;case recordTypes.Paint:this._invalidationTracker.didPaint(event);event.highlightQuad=event.args["data"]["clip"];event.backendNodeId=event.args["data"]["nodeId"];var layerUpdateEvent=this._findAncestorEvent(recordTypes.UpdateLayer);if(!layerUpdateEvent||layerUpdateEvent.args["layerTreeId"]!==this._inspectedTargetLayerTreeId)
break;if(!event.args["data"]["layerId"])
break;this._lastPaintForLayer[layerUpdateEvent.args["layerId"]]=event;break;case recordTypes.PictureSnapshot:var layerUpdateEvent=this._findAncestorEvent(recordTypes.UpdateLayer);if(!layerUpdateEvent||layerUpdateEvent.args["layerTreeId"]!==this._inspectedTargetLayerTreeId)
break;var paintEvent=this._lastPaintForLayer[layerUpdateEvent.args["layerId"]];if(paintEvent)
paintEvent.picture=event;break;case recordTypes.ScrollLayer:event.backendNodeId=event.args["data"]["nodeId"];break;case recordTypes.PaintImage:event.backendNodeId=event.args["data"]["nodeId"];event.url=event.args["data"]["url"];break;case recordTypes.DecodeImage:case recordTypes.ResizeImage:var paintImageEvent=this._findAncestorEvent(recordTypes.PaintImage);if(!paintImageEvent){var decodeLazyPixelRefEvent=this._findAncestorEvent(recordTypes.DecodeLazyPixelRef);paintImageEvent=decodeLazyPixelRefEvent&&this._paintImageEventByPixelRefId[decodeLazyPixelRefEvent.args["LazyPixelRef"]];}
if(!paintImageEvent)
break;event.backendNodeId=paintImageEvent.backendNodeId;event.url=paintImageEvent.url;break;case recordTypes.DrawLazyPixelRef:var paintImageEvent=this._findAncestorEvent(recordTypes.PaintImage);if(!paintImageEvent)
break;this._paintImageEventByPixelRefId[event.args["LazyPixelRef"]]=paintImageEvent;event.backendNodeId=paintImageEvent.backendNodeId;event.url=paintImageEvent.url;break;case recordTypes.MarkDOMContent:case recordTypes.MarkLoad:var page=eventData["page"];if(page&&page!==this._currentPage)
return false;break;case recordTypes.CommitLoad:var page=eventData["page"];if(page&&page!==this._currentPage)
return false;if(!eventData["isMainFrame"])
break;this._hadCommitLoad=true;this._firstCompositeLayers=null;break;case recordTypes.CompositeLayers:if(!this._firstCompositeLayers&&this._hadCommitLoad)
this._firstCompositeLayers=event;break;case recordTypes.Animation:return false;}
return true;},_processAsyncEvent:function(asyncEvent)
{var groups=WebInspector.TimelineUIUtils.asyncEventGroups();if(asyncEvent.category===WebInspector.TracingModel.ConsoleEventCategory)
return groups.console;return null;},_findAncestorEvent:function(name)
{for(var i=this._eventStack.length-1;i>=0;--i){var event=this._eventStack[i];if(event.name===name)
return event;}
return null;},loadFromFile:function(file,progress)
{var delegate=new WebInspector.TimelineModelLoadFromFileDelegate(this,progress);var fileReader=this._createFileReader(file,delegate);var loader=new WebInspector.TracingModelLoader(this,new WebInspector.ProgressStub(),fileReader.cancel.bind(fileReader));fileReader.start(loader);},loadFromURL:function(url,progress)
{var stream=new WebInspector.TracingModelLoader(this,progress);WebInspector.NetworkManager.loadResourceAsStream(url,null,stream);},_createFileReader:function(file,delegate)
{return new WebInspector.ChunkedFileReader(file,WebInspector.TimelineModel.TransferChunkLengthBytes,delegate);},reset:function()
{this._virtualThreads=[];this._mainThreadEvents=[];this._mainThreadAsyncEventsByGroup=new Map();this._inspectedTargetEvents=[];this._records=[];this._mainThreadTasks=[];this._gpuTasks=[];this._eventDividerRecords=[];this.dispatchEventToListeners(WebInspector.TimelineModel.Events.RecordsCleared);},minimumRecordTime:function()
{return this._tracingModel.minimumRecordTime();},maximumRecordTime:function()
{return this._tracingModel.maximumRecordTime();},inspectedTargetEvents:function()
{return this._inspectedTargetEvents;},mainThreadEvents:function()
{return this._mainThreadEvents;},_setMainThreadEvents:function(events)
{this._mainThreadEvents=events;},mainThreadAsyncEvents:function()
{return this._mainThreadAsyncEventsByGroup;},virtualThreads:function()
{return this._virtualThreads;},isEmpty:function()
{return this.minimumRecordTime()===0&&this.maximumRecordTime()===0;},mainThreadTasks:function()
{return this._mainThreadTasks;},gpuTasks:function()
{return this._gpuTasks;},eventDividerRecords:function()
{return this._eventDividerRecords;},__proto__:WebInspector.Object.prototype}
WebInspector.TimelineModel.Filter=function()
{this._model;}
WebInspector.TimelineModel.Filter.prototype={accept:function(record)
{return true;},notifyFilterChanged:function()
{this._model._filterChanged();}}
WebInspector.TimelineVisibleRecordsFilter=function(visibleTypes)
{WebInspector.TimelineModel.Filter.call(this);this._visibleTypes=visibleTypes.keySet();}
WebInspector.TimelineVisibleRecordsFilter.prototype={accept:function(record)
{return!!this._visibleTypes[record.type()];},__proto__:WebInspector.TimelineModel.Filter.prototype}
WebInspector.TimelineModelLoadFromFileDelegate=function(model,progress)
{this._model=model;this._progress=progress;}
WebInspector.TimelineModelLoadFromFileDelegate.prototype={onTransferStarted:function()
{this._progress.setTitle(WebInspector.UIString("Loading\u2026"));},onChunkTransferred:function(reader)
{if(this._progress.isCanceled()){reader.cancel();this._progress.done();this._model.reset();return;}
var totalSize=reader.fileSize();if(totalSize){this._progress.setTotalWork(totalSize);this._progress.setWorked(reader.loadedSize());}},onTransferFinished:function()
{this._progress.done();},onError:function(reader,event)
{this._progress.done();this._model.reset();switch(event.target.error.code){case FileError.NOT_FOUND_ERR:WebInspector.console.error(WebInspector.UIString("File \"%s\" not found.",reader.fileName()));break;case FileError.NOT_READABLE_ERR:WebInspector.console.error(WebInspector.UIString("File \"%s\" is not readable",reader.fileName()));break;case FileError.ABORT_ERR:break;default:WebInspector.console.error(WebInspector.UIString("An error occurred while reading the file \"%s\"",reader.fileName()));}}}
WebInspector.TraceEventFilter=function(){}
WebInspector.TraceEventFilter.prototype={accept:function(event){}}
WebInspector.TraceEventNameFilter=function(eventNames)
{this._eventNames=eventNames.keySet();}
WebInspector.TraceEventNameFilter.prototype={accept:function(event)
{throw new Error("Not implemented.");}}
WebInspector.InclusiveTraceEventNameFilter=function(includeNames)
{WebInspector.TraceEventNameFilter.call(this,includeNames);}
WebInspector.InclusiveTraceEventNameFilter.prototype={accept:function(event)
{return event.category===WebInspector.TracingModel.ConsoleEventCategory||event.category===WebInspector.TracingModel.TopLevelEventCategory||!!this._eventNames[event.name];},__proto__:WebInspector.TraceEventNameFilter.prototype}
WebInspector.ExclusiveTraceEventNameFilter=function(excludeNames)
{WebInspector.TraceEventNameFilter.call(this,excludeNames);}
WebInspector.ExclusiveTraceEventNameFilter.prototype={accept:function(event)
{return!this._eventNames[event.name];},__proto__:WebInspector.TraceEventNameFilter.prototype}
WebInspector.TracingModelLoader=function(model,progress,canceledCallback)
{this._model=model;this._loader=new WebInspector.TracingModel.Loader(model._tracingModel);this._canceledCallback=canceledCallback;this._progress=progress;this._progress.setTitle(WebInspector.UIString("Loading"));this._progress.setTotalWork(WebInspector.TracingModelLoader._totalProgress);this._firstChunk=true;this._wasCanceledOnce=false;this._loadedBytes=0;this._jsonTokenizer=new WebInspector.TextUtils.BalancedJSONTokenizer(this._writeBalancedJSON.bind(this),true);}
WebInspector.TracingModelLoader._totalProgress=100000;WebInspector.TracingModelLoader.prototype={write:function(chunk)
{this._loadedBytes+=chunk.length;if(this._progress.isCanceled()&&!this._wasCanceledOnce){this._wasCanceled=true;this._reportErrorAndCancelLoading();return;}
this._progress.setWorked(this._loadedBytes%WebInspector.TracingModelLoader._totalProgress,WebInspector.UIString("Loaded %s",Number.bytesToString(this._loadedBytes)));this._jsonTokenizer.write(chunk);},_writeBalancedJSON:function(data)
{var json=data+"]";if(this._firstChunk){this._model._startCollectingTraceEvents(true);}else{var commaIndex=json.indexOf(",");if(commaIndex!==-1)
json=json.slice(commaIndex+1);json="["+json;}
var items;try{items=(JSON.parse(json));}catch(e){this._reportErrorAndCancelLoading(WebInspector.UIString("Malformed timeline data: "+e));return;}
if(this._firstChunk){this._firstChunk=false;if(this._looksLikeAppVersion(items[0])){this._reportErrorAndCancelLoading(WebInspector.UIString("Legacy Timeline format is not supported."));return;}}
try{this._loader.loadNextChunk(items);}catch(e){this._reportErrorAndCancelLoading(WebInspector.UIString("Malformed timeline data: "+e));return;}},_reportErrorAndCancelLoading:function(message)
{if(message)
WebInspector.console.error(message);this._model.tracingComplete();this._model.reset();if(this._canceledCallback)
this._canceledCallback();this._progress.done();},_looksLikeAppVersion:function(item)
{return typeof item==="string"&&item.indexOf("Chrome")!==-1;},close:function()
{this._loader.finish();this._model.tracingComplete();if(this._progress)
this._progress.done();}}
WebInspector.TracingTimelineSaver=function(stream)
{this._stream=stream;}
WebInspector.TracingTimelineSaver.prototype={onTransferStarted:function()
{this._stream.write("[");},onTransferFinished:function()
{this._stream.write("]");},onChunkTransferred:function(reader){},onError:function(reader,event){}}
WebInspector.InvalidationTrackingEvent=function(event)
{this.type=event.name;this.startTime=event.startTime;this._tracingEvent=event;var eventData=event.args["data"];this.frame=eventData["frame"];this.nodeId=eventData["nodeId"];this.nodeName=eventData["nodeName"];this.paintId=eventData["paintId"];this.invalidationSet=eventData["invalidationSet"];this.invalidatedSelectorId=eventData["invalidatedSelectorId"];this.changedId=eventData["changedId"];this.changedClass=eventData["changedClass"];this.changedAttribute=eventData["changedAttribute"];this.changedPseudo=eventData["changedPseudo"];this.selectorPart=eventData["selectorPart"];this.extraData=eventData["extraData"];this.invalidationList=eventData["invalidationList"];this.cause={reason:eventData["reason"],stackTrace:eventData["stackTrace"]};if(!this.cause.reason&&this.cause.stackTrace&&this.type===WebInspector.TimelineModel.RecordType.LayoutInvalidationTracking)
this.cause.reason="Layout forced";}
WebInspector.InvalidationCause;WebInspector.InvalidationTracker=function()
{this._initializePerFrameState();}
WebInspector.InvalidationTracker.prototype={addInvalidation:function(invalidation)
{this._startNewFrameIfNeeded();if(!invalidation.nodeId&&!invalidation.paintId){console.error("Invalidation lacks node information.");console.error(invalidation);return;}
var recordTypes=WebInspector.TimelineModel.RecordType;if(invalidation.type===recordTypes.PaintInvalidationTracking&&invalidation.nodeId){var invalidations=this._invalidationsByNodeId[invalidation.nodeId]||[];for(var i=0;i<invalidations.length;++i)
invalidations[i].paintId=invalidation.paintId;return;}
if(invalidation.type===recordTypes.StyleRecalcInvalidationTracking&&invalidation.cause.reason==="StyleInvalidator")
return;var styleRecalcInvalidation=(invalidation.type===recordTypes.ScheduleStyleInvalidationTracking||invalidation.type===recordTypes.StyleInvalidatorInvalidationTracking||invalidation.type===recordTypes.StyleRecalcInvalidationTracking);if(styleRecalcInvalidation){var duringRecalcStyle=invalidation.startTime&&this._lastRecalcStyle&&invalidation.startTime>=this._lastRecalcStyle.startTime&&invalidation.startTime<=this._lastRecalcStyle.endTime;if(duringRecalcStyle)
this._associateWithLastRecalcStyleEvent(invalidation);}
if(this._invalidations[invalidation.type])
this._invalidations[invalidation.type].push(invalidation);else
this._invalidations[invalidation.type]=[invalidation];if(invalidation.nodeId){if(this._invalidationsByNodeId[invalidation.nodeId])
this._invalidationsByNodeId[invalidation.nodeId].push(invalidation);else
this._invalidationsByNodeId[invalidation.nodeId]=[invalidation];}},didRecalcStyle:function(recalcStyleEvent)
{this._lastRecalcStyle=recalcStyleEvent;var types=[WebInspector.TimelineModel.RecordType.ScheduleStyleInvalidationTracking,WebInspector.TimelineModel.RecordType.StyleInvalidatorInvalidationTracking,WebInspector.TimelineModel.RecordType.StyleRecalcInvalidationTracking];for(var invalidation of this._invalidationsOfTypes(types))
this._associateWithLastRecalcStyleEvent(invalidation);},_associateWithLastRecalcStyleEvent:function(invalidation)
{if(invalidation.linkedRecalcStyleEvent)
return;var recordTypes=WebInspector.TimelineModel.RecordType;var recalcStyleFrameId=this._lastRecalcStyle.args["beginData"]["frame"];if(invalidation.type===recordTypes.StyleInvalidatorInvalidationTracking){this._addSyntheticStyleRecalcInvalidations(this._lastRecalcStyle,recalcStyleFrameId,invalidation);}else if(invalidation.type===recordTypes.ScheduleStyleInvalidationTracking){}else{this._addInvalidationToEvent(this._lastRecalcStyle,recalcStyleFrameId,invalidation);}
invalidation.linkedRecalcStyleEvent=true;},_addSyntheticStyleRecalcInvalidations:function(event,frameId,styleInvalidatorInvalidation)
{if(!styleInvalidatorInvalidation.invalidationList){this._addSyntheticStyleRecalcInvalidation(styleInvalidatorInvalidation._tracingEvent,styleInvalidatorInvalidation);return;}
if(!styleInvalidatorInvalidation.nodeId){console.error("Invalidation lacks node information.");console.error(invalidation);return;}
for(var i=0;i<styleInvalidatorInvalidation.invalidationList.length;i++){var setId=styleInvalidatorInvalidation.invalidationList[i]["id"];var lastScheduleStyleRecalculation;var nodeInvalidations=this._invalidationsByNodeId[styleInvalidatorInvalidation.nodeId]||[];for(var j=0;j<nodeInvalidations.length;j++){var invalidation=nodeInvalidations[j];if(invalidation.frame!==frameId||invalidation.invalidationSet!==setId||invalidation.type!==WebInspector.TimelineModel.RecordType.ScheduleStyleInvalidationTracking)
continue;lastScheduleStyleRecalculation=invalidation;}
if(!lastScheduleStyleRecalculation){console.error("Failed to lookup the event that scheduled a style invalidator invalidation.");continue;}
this._addSyntheticStyleRecalcInvalidation(lastScheduleStyleRecalculation._tracingEvent,styleInvalidatorInvalidation);}},_addSyntheticStyleRecalcInvalidation:function(baseEvent,styleInvalidatorInvalidation)
{var invalidation=new WebInspector.InvalidationTrackingEvent(baseEvent);invalidation.type=WebInspector.TimelineModel.RecordType.StyleRecalcInvalidationTracking;invalidation.synthetic=true;if(styleInvalidatorInvalidation.cause.reason)
invalidation.cause.reason=styleInvalidatorInvalidation.cause.reason;if(styleInvalidatorInvalidation.selectorPart)
invalidation.selectorPart=styleInvalidatorInvalidation.selectorPart;this.addInvalidation(invalidation);if(!invalidation.linkedRecalcStyleEvent)
this._associateWithLastRecalcStyleEvent(invalidation);},didLayout:function(layoutEvent)
{var layoutFrameId=layoutEvent.args["beginData"]["frame"];for(var invalidation of this._invalidationsOfTypes([WebInspector.TimelineModel.RecordType.LayoutInvalidationTracking])){if(invalidation.linkedLayoutEvent)
continue;this._addInvalidationToEvent(layoutEvent,layoutFrameId,invalidation);invalidation.linkedLayoutEvent=true;}},didPaint:function(paintEvent)
{this._didPaint=true;var layerId=paintEvent.args["data"]["layerId"];if(layerId)
this._lastPaintWithLayer=paintEvent;if(!this._lastPaintWithLayer){console.error("Failed to find a paint container for a paint event.");return;}
var effectivePaintId=this._lastPaintWithLayer.args["data"]["nodeId"];var paintFrameId=paintEvent.args["data"]["frame"];var types=[WebInspector.TimelineModel.RecordType.StyleRecalcInvalidationTracking,WebInspector.TimelineModel.RecordType.LayoutInvalidationTracking,WebInspector.TimelineModel.RecordType.PaintInvalidationTracking,WebInspector.TimelineModel.RecordType.ScrollInvalidationTracking];for(var invalidation of this._invalidationsOfTypes(types)){if(invalidation.paintId===effectivePaintId)
this._addInvalidationToEvent(paintEvent,paintFrameId,invalidation);}},_addInvalidationToEvent:function(event,eventFrameId,invalidation)
{if(eventFrameId!==invalidation.frame)
return;if(!event.invalidationTrackingEvents)
event.invalidationTrackingEvents=[invalidation];else
event.invalidationTrackingEvents.push(invalidation);},_invalidationsOfTypes:function(types)
{var invalidations=this._invalidations;if(!types)
types=Object.keys(invalidations);function*generator()
{for(var i=0;i<types.length;++i){var invalidationList=invalidations[types[i]]||[];for(var j=0;j<invalidationList.length;++j)
yield invalidationList[j];}}
return generator();},_startNewFrameIfNeeded:function()
{if(!this._didPaint)
return;this._initializePerFrameState();},_initializePerFrameState:function()
{this._invalidations={};this._invalidationsByNodeId={};this._lastRecalcStyle=undefined;this._lastPaintWithLayer=undefined;this._didPaint=false;}};WebInspector.TimelineJSProfileProcessor={};WebInspector.TimelineJSProfileProcessor.JSFrameCoalesceThresholdMs=1.5;WebInspector.TimelineJSProfileProcessor.generateTracingEventsFromCpuProfile=function(jsProfile,thread)
{if(!jsProfile.samples)
return[];var jsProfileModel=new WebInspector.CPUProfileDataModel(jsProfile);var idleNode=jsProfileModel.idleNode;var programNode=jsProfileModel.programNode;var gcNode=jsProfileModel.gcNode;var samples=jsProfileModel.samples;var timestamps=jsProfileModel.timestamps;var jsEvents=[];for(var i=0;i<samples.length;++i){var node=jsProfileModel.nodeByIndex(i);if(node===programNode||node===gcNode||node===idleNode)
continue;var stackTrace=node._stackTraceArray;if(!stackTrace){stackTrace=(new Array(node.depth+1));node._stackTraceArray=stackTrace;for(var j=0;node.parent;node=node.parent)
stackTrace[j++]=(node);}
var jsEvent=new WebInspector.TracingModel.Event(WebInspector.TracingModel.DevToolsTimelineEventCategory,WebInspector.TimelineModel.RecordType.JSSample,WebInspector.TracingModel.Phase.Instant,timestamps[i],thread);jsEvent.args["data"]={stackTrace:stackTrace};jsEvents.push(jsEvent);}
return jsEvents;}
WebInspector.TimelineJSProfileProcessor.generateJSFrameEvents=function(events)
{function equalFrames(frame1,frame2)
{return frame1.scriptId===frame2.scriptId&&frame1.functionName===frame2.functionName;}
function eventEndTime(e)
{return e.endTime||e.startTime;}
function isJSInvocationEvent(e)
{switch(e.name){case WebInspector.TimelineModel.RecordType.FunctionCall:case WebInspector.TimelineModel.RecordType.EvaluateScript:return true;}
return false;}
var jsFrameEvents=[];var jsFramesStack=[];var coalesceThresholdMs=WebInspector.TimelineJSProfileProcessor.JSFrameCoalesceThresholdMs;function onStartEvent(e)
{extractStackTrace(e);}
function onInstantEvent(e,top)
{if(e.name===WebInspector.TimelineModel.RecordType.JSSample&&top&&!isJSInvocationEvent(top))
return;extractStackTrace(e);}
function onEndEvent(e)
{if(!isJSInvocationEvent(e))
return;var eventData=e.args["data"]||e.args["beginData"];var stackTrace=eventData&&eventData["stackTrace"];var stackLength=stackTrace?stackTrace.length:0;if(stackLength<jsFramesStack.length)
jsFramesStack.length=stackLength;}
function extractStackTrace(e)
{while(jsFramesStack.length&&eventEndTime(jsFramesStack.peekLast())+coalesceThresholdMs<=e.startTime)
jsFramesStack.pop();var eventData=e.args["data"]||e.args["beginData"];var stackTrace=eventData&&eventData["stackTrace"];if(e.name===WebInspector.TimelineModel.RecordType.GCEvent)
stackTrace=jsFramesStack.map(function(frameEvent){return frameEvent.args["data"];}).reverse();if(!stackTrace)
return;var endTime=eventEndTime(e);var numFrames=stackTrace.length;var minFrames=Math.min(numFrames,jsFramesStack.length);var j;for(j=0;j<minFrames;++j){var newFrame=stackTrace[numFrames-1-j];var oldFrame=jsFramesStack[j].args["data"];if(!equalFrames(newFrame,oldFrame))
break;jsFramesStack[j].setEndTime(Math.max(jsFramesStack[j].endTime,endTime));}
jsFramesStack.length=j;for(;j<numFrames;++j){var frame=stackTrace[numFrames-1-j];var jsFrameEvent=new WebInspector.TracingModel.Event(WebInspector.TracingModel.DevToolsTimelineEventCategory,WebInspector.TimelineModel.RecordType.JSFrame,WebInspector.TracingModel.Phase.Complete,e.startTime,e.thread);jsFrameEvent.addArgs({data:frame});jsFrameEvent.setEndTime(endTime);jsFramesStack.push(jsFrameEvent);jsFrameEvents.push(jsFrameEvent);}}
WebInspector.TimelineModel.forEachEvent(events,onStartEvent,onEndEvent,onInstantEvent);return jsFrameEvents;}
WebInspector.TimelineJSProfileProcessor.CodeMap=function()
{this._entries=[];}
WebInspector.TimelineJSProfileProcessor.CodeMap.Entry=function(address,size,callFrame)
{this.address=address;this.size=size;this.callFrame=callFrame;}
WebInspector.TimelineJSProfileProcessor.CodeMap.comparator=function(address,entry)
{return address-entry.address;}
WebInspector.TimelineJSProfileProcessor.CodeMap.prototype={addEntry:function(addressHex,size,callFrame)
{var address=this._addressStringToNumber(addressHex);this._addEntry(new WebInspector.TimelineJSProfileProcessor.CodeMap.Entry(address,size,callFrame));},moveEntry:function(oldAddressHex,newAddressHex,size)
{var oldAddress=this._addressStringToNumber(oldAddressHex);var newAddress=this._addressStringToNumber(newAddressHex);var index=this._entries.lowerBound(oldAddress,WebInspector.TimelineJSProfileProcessor.CodeMap.comparator);var entry=this._entries[index];if(!entry||entry.address!==oldAddress)
return;this._entries.splice(index,1);entry.address=newAddress;entry.size=size;this._addEntry(entry);},lookupEntry:function(addressHex)
{var address=this._addressStringToNumber(addressHex);var index=this._entries.upperBound(address,WebInspector.TimelineJSProfileProcessor.CodeMap.comparator)-1;var entry=this._entries[index];return entry&&address<entry.address+entry.size?entry.callFrame:null;},_addressStringToNumber:function(addressHex)
{return parseInt(addressHex,16);},_addEntry:function(newEntry)
{var endAddress=newEntry.address+newEntry.size;var lastIndex=this._entries.lowerBound(endAddress,WebInspector.TimelineJSProfileProcessor.CodeMap.comparator);var index;for(index=lastIndex-1;index>=0;--index){var entry=this._entries[index];var entryEndAddress=entry.address+entry.size;if(entryEndAddress<=newEntry.address)
break;}
++index;this._entries.splice(index,lastIndex-index,newEntry);}}
WebInspector.TimelineJSProfileProcessor.processRawV8Samples=function(events)
{var unknownFrame={functionName:"(unknown)",url:"",scriptId:"0",lineNumber:0,columnNumber:0};function convertRawFrame(address)
{return codeMap.lookupEntry(address)||unknownFrame;}
var reName=/^(\S*:)?~?(\S*)(?: (\S*))?$/;function buildCallFrame(name,scriptId)
{var parsed=reName.exec(name);if(!parsed)
return unknownFrame;var functionName=parsed[2]||"";var urlData=WebInspector.ParsedURL.splitLineAndColumn(parsed[3]||"");var url=urlData&&urlData.url||"";var line=urlData&&urlData.lineNumber||0;var column=urlData&&urlData.columnNumber||0;var frame={"functionName":functionName,"url":url,"scriptId":String(scriptId),"lineNumber":line,"columnNumber":column};return frame;}
var recordTypes=WebInspector.TimelineModel.RecordType;var samples=[];var codeMap=new WebInspector.TimelineJSProfileProcessor.CodeMap();for(var i=0;i<events.length;++i){var e=events[i];var data=e.args["data"];switch(e.name){case recordTypes.JitCodeAdded:codeMap.addEntry(data["code_start"],data["code_len"],buildCallFrame(data["name"],data["script_id"]));break;case recordTypes.JitCodeMoved:codeMap.moveEntry(data["code_start"],data["new_code_start"],data["code_len"]);break;case recordTypes.V8Sample:var rawStack=data["stack"];if(data["vm_state"]==="js"&&!rawStack.length)
break;var stack=rawStack.map(convertRawFrame);var sampleEvent=new WebInspector.TracingModel.Event(WebInspector.TracingModel.DevToolsTimelineEventCategory,WebInspector.TimelineModel.RecordType.JSSample,WebInspector.TracingModel.Phase.Instant,e.startTime,e.thread);sampleEvent.args={"data":{"stackTrace":stack}};samples.push(sampleEvent);break;}}
return samples;};WebInspector.TimelineOverviewPane=function(model)
{WebInspector.VBox.call(this);this.element.id="timeline-overview-pane";this._model=model;this._overviewCalculator=new WebInspector.TimelineOverviewCalculator();this._overviewGrid=new WebInspector.OverviewGrid("timeline");this.element.appendChild(this._overviewGrid.element);model.addEventListener(WebInspector.TimelineModel.Events.RecordsCleared,this._reset,this);this._overviewGrid.addEventListener(WebInspector.OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);this._overviewControls=[];}
WebInspector.TimelineOverviewPane.Events={WindowChanged:"WindowChanged"};WebInspector.TimelineOverviewPane.prototype={wasShown:function()
{this.update();},onResize:function()
{this.update();},setOverviewControls:function(overviewControls)
{for(var i=0;i<this._overviewControls.length;++i){var overviewControl=this._overviewControls[i];overviewControl.detach();overviewControl.dispose();}
for(var i=0;i<overviewControls.length;++i){overviewControls[i].setOverviewGrid(this._overviewGrid);overviewControls[i].show(this._overviewGrid.element);}
this._overviewControls=overviewControls;this.update();},update:function()
{if(!this.isShowing())
return;if(this._model.isEmpty())
this._overviewCalculator._setWindow(0,1000);else
this._overviewCalculator._setWindow(this._model.minimumRecordTime(),this._model.maximumRecordTime());this._overviewCalculator._setDisplayWindow(0,this._overviewGrid.clientWidth());for(var i=0;i<this._overviewControls.length;++i)
this._overviewControls[i].update();this._overviewGrid.updateDividers(this._overviewCalculator);this._updateEventDividers();this._updateWindow();},_updateEventDividers:function()
{this._overviewGrid.removeEventDividers();var recordTypes=WebInspector.TimelineModel.RecordType;var dividers=new Map();for(var record of this._model.eventDividerRecords()){if(record.type()===recordTypes.TimeStamp||record.type()===recordTypes.ConsoleTime)
continue;var dividerPosition=Math.round(this._overviewCalculator.computePosition(record.startTime()));if(dividers.has(dividerPosition))
continue;dividers.set(dividerPosition,WebInspector.TimelineUIUtils.createDividerForRecord(record,dividerPosition));}
this._overviewGrid.addEventDividers(dividers.valuesArray());},_reset:function()
{this._overviewCalculator.reset();this._overviewGrid.reset();this._overviewGrid.setResizeEnabled(false);this._overviewGrid.updateDividers(this._overviewCalculator);for(var i=0;i<this._overviewControls.length;++i)
this._overviewControls[i].reset();this.update();},_onWindowChanged:function(event)
{if(this._muteOnWindowChanged)
return;if(!this._overviewControls.length)
return;var windowTimes=this._overviewControls[0].windowTimes(this._overviewGrid.windowLeft(),this._overviewGrid.windowRight());this._windowStartTime=windowTimes.startTime;this._windowEndTime=windowTimes.endTime;this.dispatchEventToListeners(WebInspector.TimelineOverviewPane.Events.WindowChanged,windowTimes);},requestWindowTimes:function(startTime,endTime)
{if(startTime===this._windowStartTime&&endTime===this._windowEndTime)
return;this._windowStartTime=startTime;this._windowEndTime=endTime;this._updateWindow();this.dispatchEventToListeners(WebInspector.TimelineOverviewPane.Events.WindowChanged,{startTime:startTime,endTime:endTime});},_updateWindow:function()
{if(!this._overviewControls.length)
return;var windowBoundaries=this._overviewControls[0].windowBoundaries(this._windowStartTime,this._windowEndTime);this._muteOnWindowChanged=true;this._overviewGrid.setWindow(windowBoundaries.left,windowBoundaries.right);this._overviewGrid.setResizeEnabled(!!this._model.records().length);this._muteOnWindowChanged=false;},__proto__:WebInspector.VBox.prototype}
WebInspector.TimelineOverviewCalculator=function()
{}
WebInspector.TimelineOverviewCalculator.prototype={paddingLeft:function()
{return this._paddingLeft;},computePosition:function(time)
{return(time-this._minimumBoundary)/this.boundarySpan()*this._workingArea+this._paddingLeft;},_setWindow:function(minimumRecordTime,maximumRecordTime)
{this._minimumBoundary=minimumRecordTime;this._maximumBoundary=maximumRecordTime;},_setDisplayWindow:function(paddingLeft,clientWidth)
{this._workingArea=clientWidth-paddingLeft;this._paddingLeft=paddingLeft;},reset:function()
{this._setWindow(0,1000);},formatTime:function(value,precision)
{return Number.preciseMillisToString(value-this.zeroTime(),precision);},maximumBoundary:function()
{return this._maximumBoundary;},minimumBoundary:function()
{return this._minimumBoundary;},zeroTime:function()
{return this._minimumBoundary;},boundarySpan:function()
{return this._maximumBoundary-this._minimumBoundary;}}
WebInspector.TimelineOverview=function(model)
{}
WebInspector.TimelineOverview.prototype={show:function(parentElement,insertBefore){},setOverviewGrid:function(grid){},update:function(){},dispose:function(){},reset:function(){},windowTimes:function(windowLeft,windowRight){},windowBoundaries:function(startTime,endTime){},}
WebInspector.TimelineOverviewBase=function(model)
{WebInspector.VBox.call(this);this._model=model;this._canvas=this.element.createChild("canvas","fill");this._context=this._canvas.getContext("2d");}
WebInspector.TimelineOverviewBase.prototype={setOverviewGrid:function(grid)
{},update:function()
{this.resetCanvas();},dispose:function()
{},reset:function()
{},timelineStarted:function()
{},timelineStopped:function()
{},windowTimes:function(windowLeft,windowRight)
{var absoluteMin=this._model.minimumRecordTime();var timeSpan=this._model.maximumRecordTime()-absoluteMin;return{startTime:absoluteMin+timeSpan*windowLeft,endTime:absoluteMin+timeSpan*windowRight};},windowBoundaries:function(startTime,endTime)
{var absoluteMin=this._model.minimumRecordTime();var timeSpan=this._model.maximumRecordTime()-absoluteMin;var haveRecords=absoluteMin>0;return{left:haveRecords&&startTime?Math.min((startTime-absoluteMin)/timeSpan,1):0,right:haveRecords&&endTime<Infinity?(endTime-absoluteMin)/timeSpan:1};},resetCanvas:function()
{this._canvas.width=this.element.clientWidth*window.devicePixelRatio;this._canvas.height=this.element.clientHeight*window.devicePixelRatio;},__proto__:WebInspector.VBox.prototype};WebInspector.TimelinePresentationModel=function(model)
{this._model=model;this._filters=[];this._recordToPresentationRecord=new Map();this.reset();}
WebInspector.TimelinePresentationModel.prototype={setWindowTimes:function(startTime,endTime)
{this._windowStartTime=startTime;this._windowEndTime=endTime;},toPresentationRecord:function(record)
{return record?this._recordToPresentationRecord.get(record)||null:null;},rootRecord:function()
{return this._rootRecord;},reset:function()
{this._recordToPresentationRecord.clear();this._rootRecord=new WebInspector.TimelinePresentationModel.RootRecord();this._coalescingBuckets={};},addRecord:function(record)
{if(record.type()===WebInspector.TimelineModel.RecordType.Program){var records=record.children();for(var i=0;i<records.length;++i)
this._innerAddRecord(this._rootRecord,records[i]);}else{this._innerAddRecord(this._rootRecord,record);}},_innerAddRecord:function(parentRecord,record)
{var coalescingBucket;if(parentRecord===this._rootRecord)
coalescingBucket=record.thread()?record.type():"mainThread";var coalescedRecord=this._findCoalescedParent(record,parentRecord,coalescingBucket);if(coalescedRecord)
parentRecord=coalescedRecord;var formattedRecord=new WebInspector.TimelinePresentationModel.ActualRecord(record,parentRecord);this._recordToPresentationRecord.set(record,formattedRecord);formattedRecord._collapsed=parentRecord===this._rootRecord;if(coalescingBucket)
this._coalescingBuckets[coalescingBucket]=formattedRecord;for(var i=0;record.children()&&i<record.children().length;++i)
this._innerAddRecord(formattedRecord,record.children()[i]);if(parentRecord.coalesced())
this._updateCoalescingParent(formattedRecord);},_findCoalescedParent:function(record,newParent,bucket)
{const coalescingThresholdMillis=5;var lastRecord=bucket?this._coalescingBuckets[bucket]:newParent._presentationChildren.peekLast();if(lastRecord&&lastRecord.coalesced())
lastRecord=lastRecord._presentationChildren.peekLast();var startTime=record.startTime();var endTime=record.endTime();if(!lastRecord)
return null;if(lastRecord.record().type()!==record.type())
return null;if(!WebInspector.TimelineUIUtils.isCoalescable(record.type()))
return null;if(lastRecord.record().endTime()+coalescingThresholdMillis<startTime)
return null;if(endTime+coalescingThresholdMillis<lastRecord.record().startTime())
return null;if(lastRecord.presentationParent().coalesced())
return lastRecord.presentationParent();return this._replaceWithCoalescedRecord(lastRecord);},_replaceWithCoalescedRecord:function(presentationRecord)
{var record=presentationRecord.record();var parent=presentationRecord._presentationParent;var coalescedRecord=new WebInspector.TimelinePresentationModel.CoalescedRecord(record);coalescedRecord._collapsed=true;coalescedRecord._presentationChildren.push(presentationRecord);presentationRecord._presentationParent=coalescedRecord;if(presentationRecord.hasWarnings()||presentationRecord.childHasWarnings())
coalescedRecord._childHasWarnings=true;coalescedRecord._presentationParent=parent;parent._presentationChildren[parent._presentationChildren.indexOf(presentationRecord)]=coalescedRecord;return coalescedRecord;},_updateCoalescingParent:function(presentationRecord)
{var parentRecord=presentationRecord._presentationParent;if(parentRecord.endTime()<presentationRecord.endTime())
parentRecord._endTime=presentationRecord.endTime();},setTextFilter:function(textFilter)
{var records=this._recordToPresentationRecord.valuesArray();for(var i=0;i<records.length;++i)
records[i]._expandedOrCollapsedWhileFiltered=false;this._textFilter=textFilter;},refreshRecords:function()
{this.reset();var modelRecords=this._model.records();for(var i=0;i<modelRecords.length;++i)
this.addRecord(modelRecords[i]);},invalidateFilteredRecords:function()
{delete this._filteredRecords;},filteredRecords:function()
{if(!this._rootRecord.presentationChildren().length)
this.refreshRecords();if(this._filteredRecords)
return this._filteredRecords;var recordsInWindow=[];var stack=[{children:this._rootRecord._presentationChildren,index:0,parentIsCollapsed:false,parentRecord:{}}];var revealedDepth=0;function revealRecordsInStack(){for(var depth=revealedDepth+1;depth<stack.length;++depth){if(stack[depth-1].parentIsCollapsed){stack[depth].parentRecord._presentationParent._expandable=true;return;}
stack[depth-1].parentRecord._collapsed=false;recordsInWindow.push(stack[depth].parentRecord);stack[depth].windowLengthBeforeChildrenTraversal=recordsInWindow.length;stack[depth].parentIsRevealed=true;revealedDepth=depth;}}
while(stack.length){var entry=stack[stack.length-1];var records=entry.children;if(records&&entry.index<records.length){var record=records[entry.index];++entry.index;if(record.startTime()<this._windowEndTime&&record.endTime()>this._windowStartTime){if(this._model.isVisible(record.record())){record._presentationParent._expandable=true;if(this._textFilter)
revealRecordsInStack();if(!entry.parentIsCollapsed){recordsInWindow.push(record);revealedDepth=stack.length;entry.parentRecord._collapsed=false;}}}
record._expandable=false;stack.push({children:record._presentationChildren,index:0,parentIsCollapsed:entry.parentIsCollapsed||(record._collapsed&&(!this._textFilter||record._expandedOrCollapsedWhileFiltered)),parentRecord:record,windowLengthBeforeChildrenTraversal:recordsInWindow.length});}else{stack.pop();revealedDepth=Math.min(revealedDepth,stack.length-1);entry.parentRecord._visibleChildrenCount=recordsInWindow.length-entry.windowLengthBeforeChildrenTraversal;}}
this._filteredRecords=recordsInWindow;return recordsInWindow;},__proto__:WebInspector.Object.prototype}
WebInspector.TimelinePresentationModel.Record=function(parentRecord)
{this._presentationChildren=[];if(parentRecord){this._presentationParent=parentRecord;parentRecord._presentationChildren.push(this);}}
WebInspector.TimelinePresentationModel.Record.prototype={startTime:function()
{throw new Error("Not implemented.");},endTime:function()
{throw new Error("Not implemented.");},selfTime:function()
{throw new Error("Not implemented.");},record:function()
{throw new Error("Not implemented.");},presentationChildren:function()
{return this._presentationChildren;},coalesced:function()
{return false;},collapsed:function()
{return this._collapsed;},setCollapsed:function(collapsed)
{this._collapsed=collapsed;this._expandedOrCollapsedWhileFiltered=true;},presentationParent:function()
{return this._presentationParent||null;},visibleChildrenCount:function()
{return this._visibleChildrenCount||0;},expandable:function()
{return!!this._expandable;},hasWarnings:function()
{return false;},childHasWarnings:function()
{return this._childHasWarnings;},listRow:function()
{return this._listRow;},setListRow:function(listRow)
{this._listRow=listRow;},graphRow:function()
{return this._graphRow;},setGraphRow:function(graphRow)
{this._graphRow=graphRow;}}
WebInspector.TimelinePresentationModel.ActualRecord=function(record,parentRecord)
{WebInspector.TimelinePresentationModel.Record.call(this,parentRecord);this._record=record;if(this.hasWarnings()){for(var parent=this._presentationParent;parent&&!parent._childHasWarnings;parent=parent._presentationParent)
parent._childHasWarnings=true;}}
WebInspector.TimelinePresentationModel.ActualRecord.prototype={startTime:function()
{return this._record.startTime();},endTime:function()
{return this._record.endTime();},selfTime:function()
{return this._record.selfTime();},record:function()
{return this._record;},hasWarnings:function()
{return!!this._record.warnings();},__proto__:WebInspector.TimelinePresentationModel.Record.prototype}
WebInspector.TimelinePresentationModel.CoalescedRecord=function(record)
{WebInspector.TimelinePresentationModel.Record.call(this,null);this._startTime=record.startTime();this._endTime=record.endTime();}
WebInspector.TimelinePresentationModel.CoalescedRecord.prototype={startTime:function()
{return this._startTime;},endTime:function()
{return this._endTime;},selfTime:function()
{return 0;},record:function()
{return this._presentationChildren[0].record();},coalesced:function()
{return true;},hasWarnings:function()
{return false;},__proto__:WebInspector.TimelinePresentationModel.Record.prototype}
WebInspector.TimelinePresentationModel.RootRecord=function()
{WebInspector.TimelinePresentationModel.Record.call(this,null);}
WebInspector.TimelinePresentationModel.RootRecord.prototype={hasWarnings:function()
{return false;},__proto__:WebInspector.TimelinePresentationModel.Record.prototype};WebInspector.TimelineFrameModelBase=function()
{this.reset();}
WebInspector.TimelineFrameModelBase.prototype={setMergeRecords:function(value)
{},frames:function()
{return this._frames;},filteredFrames:function(startTime,endTime)
{function compareStartTime(value,object)
{return value-object.startTime;}
function compareEndTime(value,object)
{return value-object.endTime;}
var frames=this._frames;var firstFrame=insertionIndexForObjectInListSortedByFunction(startTime,frames,compareEndTime);var lastFrame=insertionIndexForObjectInListSortedByFunction(endTime,frames,compareStartTime);return frames.slice(firstFrame,lastFrame);},hasRasterTile:function(rasterTask)
{var data=rasterTask.args["tileData"];if(!data)
return false;var frameId=data["sourceFrameNumber"];var frame=frameId&&this._frameById[frameId];if(!frame||!frame.layerTree)
return false;return true;},requestRasterTile:function(rasterTask,callback)
{var target=this._target;if(!target){callback(null,null);return;}
var data=rasterTask.args["tileData"];var frameId=data["sourceFrameNumber"];var frame=frameId&&this._frameById[frameId];if(!frame||!frame.layerTree){callback(null,null);return;}
var tileId=data["tileId"]&&data["tileId"]["id_ref"];var fragments=[];var tile=null;var x0=Infinity;var y0=Infinity;frame.layerTree.resolve(layerTreeResolved);function layerTreeResolved(layerTree)
{tile=tileId&&((layerTree)).tileById("cc::Tile/"+tileId);if(!tile){console.error("Tile "+tileId+" missing in frame "+frameId);callback(null,null);return;}
var fetchPictureFragmentsBarrier=new CallbackBarrier();for(var paint of frame.paints){if(tile.layer_id===paint.layerId())
paint.loadPicture(fetchPictureFragmentsBarrier.createCallback(pictureLoaded));}
fetchPictureFragmentsBarrier.callWhenDone(allPicturesLoaded);}
function segmentsOverlap(a1,a2,b1,b2)
{console.assert(a1<=a2&&b1<=b2,"segments should be specified as ordered pairs");return a2>b1&&a1<b2;}
function rectsOverlap(a,b)
{return segmentsOverlap(a[0],a[0]+a[2],b[0],b[0]+b[2])&&segmentsOverlap(a[1],a[1]+a[3],b[1],b[1]+b[3]);}
function pictureLoaded(rect,picture)
{if(!rect||!picture)
return;if(!rectsOverlap(rect,tile.content_rect))
return;var x=rect[0];var y=rect[1];x0=Math.min(x0,x);y0=Math.min(y0,y);fragments.push({x:x,y:y,picture:picture});}
function allPicturesLoaded()
{if(!fragments.length){callback(null,null);return;}
var rectArray=tile.content_rect;var rect={x:rectArray[0]-x0,y:rectArray[1]-y0,width:rectArray[2],height:rectArray[3]};WebInspector.PaintProfilerSnapshot.loadFromFragments(target,fragments,callback.bind(null,rect));}},reset:function()
{this._minimumRecordTime=Infinity;this._frames=[];this._frameById={};this._lastFrame=null;this._lastLayerTree=null;this._hasThreadedCompositing=false;this._mainFrameCommitted=false;this._mainFrameRequested=false;this._framePendingCommit=null;},handleBeginFrame:function(startTime)
{if(!this._lastFrame)
this._startBackgroundFrame(startTime);},handleDrawFrame:function(startTime)
{if(!this._lastFrame){this._startBackgroundFrame(startTime);return;}
if(this._mainFrameCommitted||!this._mainFrameRequested)
this._startBackgroundFrame(startTime);this._mainFrameCommitted=false;},handleActivateLayerTree:function()
{if(!this._lastFrame)
return;if(this._framePendingActivation){this._lastFrame._addTimeForCategories(this._framePendingActivation.timeByCategory);this._lastFrame.paints=this._framePendingActivation.paints;this._lastFrame._mainFrameId=this._framePendingActivation.mainFrameId;this._framePendingActivation=null;}},handleRequestMainThreadFrame:function()
{if(!this._lastFrame)
return;this._mainFrameRequested=true;},handleCompositeLayers:function()
{if(!this._hasThreadedCompositing||!this._framePendingCommit)
return;this._framePendingActivation=this._framePendingCommit;this._framePendingCommit=null;this._mainFrameRequested=false;this._mainFrameCommitted=true;},handleLayerTreeSnapshot:function(layerTree)
{this._lastLayerTree=layerTree;},_startBackgroundFrame:function(startTime)
{if(!this._hasThreadedCompositing){this._lastFrame=null;this._hasThreadedCompositing=true;}
if(this._lastFrame)
this._flushFrame(this._lastFrame,startTime);this._lastFrame=new WebInspector.TimelineFrame(startTime,startTime-this._minimumRecordTime);},_startMainThreadFrame:function(startTime,frameId)
{if(this._lastFrame)
this._flushFrame(this._lastFrame,startTime);this._lastFrame=new WebInspector.TimelineFrame(startTime,startTime-this._minimumRecordTime);this._lastFrame._mainFrameId=frameId;},_flushFrame:function(frame,endTime)
{frame._setLayerTree(this._lastLayerTree);frame._setEndTime(endTime);this._frames.push(frame);if(typeof frame._mainFrameId==="number")
this._frameById[frame._mainFrameId]=frame;},_findRecordRecursively:function(types,record)
{if(types.indexOf(record.type())>=0)
return record;if(!record.children())
return null;for(var i=0;i<record.children().length;++i){var result=this._findRecordRecursively(types,record.children()[i]);if(result)
return result;}
return null;}}
WebInspector.TracingTimelineFrameModel=function()
{WebInspector.TimelineFrameModelBase.call(this);}
WebInspector.TracingTimelineFrameModel._mainFrameMarkers=[WebInspector.TimelineModel.RecordType.ScheduleStyleRecalculation,WebInspector.TimelineModel.RecordType.InvalidateLayout,WebInspector.TimelineModel.RecordType.BeginMainThreadFrame,WebInspector.TimelineModel.RecordType.ScrollLayer];WebInspector.TracingTimelineFrameModel.prototype={reset:function()
{WebInspector.TimelineFrameModelBase.prototype.reset.call(this);this._target=null;this._sessionId=null;},addTraceEvents:function(target,events,sessionId)
{this._target=target;this._sessionId=sessionId;if(!events.length)
return;if(events[0].startTime<this._minimumRecordTime)
this._minimumRecordTime=events[0].startTime;for(var i=0;i<events.length;++i)
this._addTraceEvent(events[i]);},_addTraceEvent:function(event)
{var eventNames=WebInspector.TimelineModel.RecordType;if(event.name===eventNames.SetLayerTreeId){var sessionId=event.args["sessionId"]||event.args["data"]["sessionId"];if(this._sessionId===sessionId)
this._layerTreeId=event.args["layerTreeId"]||event.args["data"]["layerTreeId"];}else if(event.name===eventNames.TracingStartedInPage){this._mainThread=event.thread;}else if(event.phase===WebInspector.TracingModel.Phase.SnapshotObject&&event.name===eventNames.LayerTreeHostImplSnapshot&&parseInt(event.id,0)===this._layerTreeId){var snapshot=(event);this.handleLayerTreeSnapshot(new WebInspector.DeferredTracingLayerTree(snapshot,this._target));}else if(event.thread===this._mainThread){this._addMainThreadTraceEvent(event);}else{this._addBackgroundTraceEvent(event);}},_addBackgroundTraceEvent:function(event)
{var eventNames=WebInspector.TimelineModel.RecordType;if(this._lastFrame&&event.selfTime)
this._lastFrame._addTimeForCategory(WebInspector.TimelineUIUtils.eventStyle(event).category.name,event.selfTime);if(event.args["layerTreeId"]!==this._layerTreeId)
return;var timestamp=event.startTime;if(event.name===eventNames.BeginFrame)
this.handleBeginFrame(timestamp);else if(event.name===eventNames.DrawFrame)
this.handleDrawFrame(timestamp);else if(event.name===eventNames.ActivateLayerTree)
this.handleActivateLayerTree();else if(event.name===eventNames.RequestMainThreadFrame)
this.handleRequestMainThreadFrame();},_addMainThreadTraceEvent:function(event)
{var eventNames=WebInspector.TimelineModel.RecordType;var timestamp=event.startTime;var selfTime=event.selfTime||0;if(!this._hasThreadedCompositing){if(event.name===eventNames.BeginMainThreadFrame)
this._startMainThreadFrame(timestamp,event.args["data"]&&event.args["data"]["frameId"]);if(!this._lastFrame)
return;if(!selfTime)
return;var categoryName=WebInspector.TimelineUIUtils.eventStyle(event).category.name;this._lastFrame._addTimeForCategory(categoryName,selfTime);return;}
if(!this._framePendingCommit&&WebInspector.TracingTimelineFrameModel._mainFrameMarkers.indexOf(event.name)>=0)
this._framePendingCommit=new WebInspector.PendingFrame();if(!this._framePendingCommit)
return;if(event.name===eventNames.BeginMainThreadFrame&&event.args["data"]&&event.args["data"]["frameId"])
this._framePendingCommit.mainFrameId=event.args["data"]["frameId"];if(event.name===eventNames.Paint&&event.args["data"]["layerId"]&&event.picture&&this._target)
this._framePendingCommit.paints.push(new WebInspector.LayerPaintEvent(event,this._target));if(selfTime){var categoryName=WebInspector.TimelineUIUtils.eventStyle(event).category.name;this._framePendingCommit.timeByCategory[categoryName]=(this._framePendingCommit.timeByCategory[categoryName]||0)+selfTime;}
if(event.name===eventNames.CompositeLayers&&event.args["layerTreeId"]===this._layerTreeId)
this.handleCompositeLayers();},__proto__:WebInspector.TimelineFrameModelBase.prototype}
WebInspector.DeferredTracingLayerTree=function(snapshot,target)
{WebInspector.DeferredLayerTree.call(this,target);this._snapshot=snapshot;}
WebInspector.DeferredTracingLayerTree.prototype={resolve:function(callback)
{this._snapshot.requestObject(onGotObject.bind(this));function onGotObject(result)
{if(!result)
return;var viewport=result["device_viewport_size"];var tiles=result["active_tiles"];var rootLayer=result["active_tree"]["root_layer"];var layerTree=new WebInspector.TracingLayerTree(this._target);layerTree.setViewportSize(viewport);layerTree.setTiles(tiles);layerTree.setLayers(rootLayer,callback.bind(null,layerTree));}},__proto__:WebInspector.DeferredLayerTree.prototype};WebInspector.TimelineFrame=function(startTime,startTimeOffset)
{this.startTime=startTime;this.startTimeOffset=startTimeOffset;this.endTime=this.startTime;this.duration=0;this.timeByCategory={};this.cpuTime=0;this.layerTree=null;this._mainFrameId=undefined;}
WebInspector.TimelineFrame.prototype={_setEndTime:function(endTime)
{this.endTime=endTime;this.duration=this.endTime-this.startTime;},_setLayerTree:function(layerTree)
{this.layerTree=layerTree;},_addTimeForCategories:function(timeByCategory)
{for(var category in timeByCategory)
this._addTimeForCategory(category,timeByCategory[category]);},_addTimeForCategory:function(category,time)
{this.timeByCategory[category]=(this.timeByCategory[category]||0)+time;this.cpuTime+=time;},}
WebInspector.LayerPaintEvent=function(event,target)
{this._event=event;this._target=target;}
WebInspector.LayerPaintEvent.prototype={layerId:function()
{return this._event.args["data"]["layerId"];},event:function()
{return this._event;},loadPicture:function(callback)
{this._event.picture.requestObject(onGotObject);function onGotObject(result)
{if(!result||!result["skp64"]){callback(null,null);return;}
var rect=result["params"]&&result["params"]["layer_rect"];callback(rect,result["skp64"]);}},loadSnapshot:function(callback)
{this.loadPicture(onGotPicture.bind(this));function onGotPicture(rect,picture)
{if(!rect||!picture||!this._target){callback(null,null);return;}
WebInspector.PaintProfilerSnapshot.load(this._target,picture,callback.bind(null,rect));}}};WebInspector.PendingFrame=function()
{this.timeByCategory={};this.paints=[];this.mainFrameId=undefined;};WebInspector.TimelineEventOverview=function(model)
{WebInspector.TimelineOverviewBase.call(this,model);this.element.id="timeline-overview-events";this._fillStyles={};var categories=WebInspector.TimelineUIUtils.categories();for(var category in categories){this._fillStyles[category]=categories[category].fillColorStop1;categories[category].addEventListener(WebInspector.TimelineCategory.Events.VisibilityChanged,this._onCategoryVisibilityChanged,this);}
this._disabledCategoryFillStyle="hsl(0, 0%, 67%)";}
WebInspector.TimelineEventOverview._mainStripHeight=16;WebInspector.TimelineEventOverview._smallStripHeight=8;WebInspector.TimelineEventOverview._maxNetworkStripHeight=32;WebInspector.TimelineEventOverview.prototype={dispose:function()
{var categories=WebInspector.TimelineUIUtils.categories();for(var category in categories)
categories[category].removeEventListener(WebInspector.TimelineCategory.Events.VisibilityChanged,this._onCategoryVisibilityChanged,this);},update:function()
{var padding=2;this.resetCanvas();var threads=this._model.virtualThreads();var mainThreadEvents=this._model.mainThreadEvents();var estimatedHeight=padding+WebInspector.TimelineEventOverview._smallStripHeight;estimatedHeight+=padding+WebInspector.TimelineEventOverview._mainStripHeight+2*WebInspector.TimelineEventOverview._smallStripHeight;estimatedHeight+=padding+WebInspector.TimelineEventOverview._maxNetworkStripHeight;this._canvas.height=estimatedHeight*window.devicePixelRatio;this._canvas.style.height=estimatedHeight+"px";var position=padding;if(Runtime.experiments.isEnabled("inputEventsOnTimelineOverview")){position+=this._drawInputEvents(mainThreadEvents,position);position+=padding;}
position+=this._drawNetwork(mainThreadEvents,position);position+=padding;this._drawEvents(mainThreadEvents,position,WebInspector.TimelineEventOverview._mainStripHeight);position+=WebInspector.TimelineEventOverview._mainStripHeight;for(var thread of threads.filter(function(thread){return!thread.isWorker();}))
this._drawEvents(thread.events,position,WebInspector.TimelineEventOverview._smallStripHeight);position+=WebInspector.TimelineEventOverview._smallStripHeight;var workersHeight=0;for(var thread of threads.filter(function(thread){return thread.isWorker();}))
workersHeight=Math.max(workersHeight,this._drawEvents(thread.events,position,WebInspector.TimelineEventOverview._smallStripHeight));position+=workersHeight;console.assert(position<=estimatedHeight);this.element.style.flexBasis=position+"px";},_drawInputEvents:function(events,position)
{var descriptors=WebInspector.TimelineUIUtils.eventDispatchDesciptors();var descriptorsByType=new Map();var maxPriority=-1;for(var descriptor of descriptors){for(var type of descriptor.eventTypes)
descriptorsByType.set(type,descriptor);maxPriority=Math.max(maxPriority,descriptor.priority);}
var minWidth=2*window.devicePixelRatio;var stripHeight=WebInspector.TimelineEventOverview._smallStripHeight;var timeOffset=this._model.minimumRecordTime();var timeSpan=this._model.maximumRecordTime()-timeOffset;var canvasWidth=this._canvas.width;var scale=canvasWidth/timeSpan;var drawn=false;for(var priority=0;priority<=maxPriority;++priority){for(var i=0;i<events.length;++i){var event=events[i];if(event.name!==WebInspector.TimelineModel.RecordType.EventDispatch)
continue;var descriptor=descriptorsByType.get(event.args["data"]["type"]);if(!descriptor||descriptor.priority!==priority)
continue;var start=Number.constrain(Math.floor((event.startTime-timeOffset)*scale),0,canvasWidth);var end=Number.constrain(Math.ceil((event.endTime-timeOffset)*scale),0,canvasWidth);var width=Math.max(end-start,minWidth);this._renderBar(start,start+width,position,stripHeight,descriptor.color);drawn=true;}}
return drawn?stripHeight:0;},_drawNetwork:function(events,position)
{var maxBandHeight=4;var bandsCount=WebInspector.TimelineUIUtils.calculateNetworkBandsCount(events);var bandInterval=Math.min(maxBandHeight,WebInspector.TimelineEventOverview._maxNetworkStripHeight/(bandsCount||1));var bandHeight=Math.ceil(bandInterval);var timeOffset=this._model.minimumRecordTime();var timeSpan=this._model.maximumRecordTime()-timeOffset;var canvasWidth=this._canvas.width;var scale=canvasWidth/timeSpan;var loadingCategory=WebInspector.TimelineUIUtils.categories()["loading"];var waitingColor=loadingCategory.backgroundColor;var processingColor=loadingCategory.fillColorStop1;function drawBar(band,startTime,endTime,event)
{var start=Number.constrain((startTime-timeOffset)*scale,0,canvasWidth);var end=Number.constrain((endTime-timeOffset)*scale,0,canvasWidth);var color=!event||event.name===WebInspector.TimelineModel.RecordType.ResourceReceiveResponse||event.name===WebInspector.TimelineModel.RecordType.ResourceSendRequest?waitingColor:processingColor;this._renderBar(Math.floor(start),Math.ceil(end),Math.floor(position+band*bandInterval),bandHeight,color);}
WebInspector.TimelineUIUtils.iterateNetworkRequestsInRoundRobin(events,bandsCount,drawBar.bind(this));return Math.ceil(bandInterval*bandsCount);},_drawEvents:function(events,position,stripHeight)
{var padding=1;var visualHeight=stripHeight-padding;var timeOffset=this._model.minimumRecordTime();var timeSpan=this._model.maximumRecordTime()-timeOffset;var scale=this._canvas.width/timeSpan;var ditherer=new WebInspector.Dithering();var categoryStack=[];var lastX=0;var drawn=false;function categoryColor(category)
{return category.hidden?this._disabledCategoryFillStyle:this._fillStyles[category.name];}
function onEventStart(e)
{var pos=(e.startTime-timeOffset)*scale;if(categoryStack.length){var category=categoryStack.peekLast();var bar=ditherer.appendInterval(category,lastX,pos);if(bar){this._renderBar(bar.start,bar.end,position,visualHeight,categoryColor.call(this,category));drawn=true;}}
categoryStack.push(WebInspector.TimelineUIUtils.eventStyle(e).category);lastX=pos;}
function onEventEnd(e)
{var category=categoryStack.pop();var pos=(e.endTime-timeOffset)*scale;var bar=ditherer.appendInterval(category,lastX,pos);if(bar){this._renderBar(bar.start,bar.end,position,visualHeight,categoryColor.call(this,category));drawn=true;}
lastX=pos;}
WebInspector.TimelineModel.forEachEvent(events,onEventStart.bind(this),onEventEnd.bind(this));return drawn?stripHeight:0;},_onCategoryVisibilityChanged:function()
{this.update();},_renderBar:function(begin,end,position,height,color)
{var x=begin;var y=position*window.devicePixelRatio;var width=end-begin;this._context.fillStyle=color;this._context.fillRect(x,y,width,height*window.devicePixelRatio);},__proto__:WebInspector.TimelineOverviewBase.prototype}
WebInspector.Dithering=function()
{this._groupError=new Map();this._position=0;this._lastReportedPosition=0;}
WebInspector.Dithering.prototype={appendInterval:function(group,start,end)
{this._innerAppend(null,start);return this._innerAppend(group,end);},_innerAppend:function(group,position)
{if(position<this._position)
return null;var result=null;var length=position-this._position;length+=this._groupError.get(group)||0;if(length>=1){if(!group)
length-=this._distributeExtraAmount(length-1);var newReportedPosition=this._lastReportedPosition+Math.floor(length);result={start:this._lastReportedPosition,end:newReportedPosition};this._lastReportedPosition=newReportedPosition;length%=1;}
this._groupError.set(group,length);this._position=position;return result;},_distributeExtraAmount:function(amount)
{var canConsume=0;for(var g of this._groupError.keys()){if(g)
canConsume+=1-this._groupError.get(g);}
var toDistribute=Math.min(amount,canConsume);if(toDistribute<=0)
return 0;var ratio=toDistribute/canConsume;for(var g of this._groupError.keys()){if(!g)
continue;var value=this._groupError.get(g);value+=(1-value)*ratio;this._groupError.set(g,value);}
return toDistribute;}};WebInspector.TimelineFrameOverview=function(model,frameModel)
{WebInspector.TimelineOverviewBase.call(this,model);this.element.id="timeline-overview-frames";this._frameModel=frameModel;this.reset();this._outerPadding=4*window.devicePixelRatio;this._maxInnerBarWidth=10*window.devicePixelRatio;this._topPadding=6*window.devicePixelRatio;this._actualPadding=5*window.devicePixelRatio;this._actualOuterBarWidth=this._maxInnerBarWidth+this._actualPadding;this._fillStyles={};var categories=WebInspector.TimelineUIUtils.categories();for(var category in categories)
this._fillStyles[category]=WebInspector.TimelineUIUtils.createFillStyleForCategory(this._context,this._maxInnerBarWidth,0,categories[category]);this._frameTopShadeGradient=this._context.createLinearGradient(0,0,0,this._topPadding);this._frameTopShadeGradient.addColorStop(0,"rgba(255, 255, 255, 0.9)");this._frameTopShadeGradient.addColorStop(1,"rgba(255, 255, 255, 0.2)");}
WebInspector.TimelineFrameOverview.prototype={setOverviewGrid:function(grid)
{this._overviewGrid=grid;this._overviewGrid.element.classList.add("timeline-overview-frames-mode");},dispose:function()
{this._overviewGrid.element.classList.remove("timeline-overview-frames-mode");},reset:function()
{this._barTimes=[];},update:function()
{this.resetCanvas();this._barTimes=[];const minBarWidth=4*window.devicePixelRatio;var frames=this._frameModel.frames();var framesPerBar=Math.max(1,frames.length*minBarWidth/this._canvas.width);var visibleFrames=this._aggregateFrames(frames,framesPerBar);this._context.save();var scale=(this._canvas.height-this._topPadding)/this._computeTargetFrameLength(visibleFrames);this._renderBars(visibleFrames,scale,this._canvas.height);this._context.fillStyle=this._frameTopShadeGradient;this._context.fillRect(0,0,this._canvas.width,this._topPadding);this._drawFPSMarks(scale,this._canvas.height);this._context.restore();},_aggregateFrames:function(frames,framesPerBar)
{var visibleFrames=[];for(var barNumber=0,currentFrame=0;currentFrame<frames.length;++barNumber){var barStartTime=frames[currentFrame].startTime;var longestFrame=null;var longestDuration=0;for(var lastFrame=Math.min(Math.floor((barNumber+1)*framesPerBar),frames.length);currentFrame<lastFrame;++currentFrame){var duration=frames[currentFrame].duration;if(!longestFrame||longestDuration<duration){longestFrame=frames[currentFrame];longestDuration=duration;}}
var barEndTime=frames[currentFrame-1].endTime;if(longestFrame){visibleFrames.push(longestFrame);this._barTimes.push({startTime:barStartTime,endTime:barEndTime});}}
return visibleFrames;},_computeTargetFrameLength:function(frames)
{const targetFPS=20;var result=1000.0/targetFPS;if(!frames.length)
return result;var durations=[];for(var i=0;i<frames.length;++i){if(frames[i])
durations.push(frames[i].duration);}
var medianFrameLength=durations.qselect(Math.floor(durations.length/2));if(result>=medianFrameLength)
return result;var maxFrameLength=Math.max.apply(Math,durations);return Math.min(medianFrameLength*2,maxFrameLength);},_renderBars:function(frames,scale,windowHeight)
{const maxPadding=5*window.devicePixelRatio;this._actualOuterBarWidth=Math.min((this._canvas.width-2*this._outerPadding)/frames.length,this._maxInnerBarWidth+maxPadding);this._actualPadding=Math.min(Math.floor(this._actualOuterBarWidth/3),maxPadding);var barWidth=this._actualOuterBarWidth-this._actualPadding;for(var i=0;i<frames.length;++i){if(frames[i])
this._renderBar(this._barNumberToScreenPosition(i),barWidth,windowHeight,frames[i],scale);}},_barNumberToScreenPosition:function(n)
{return this._outerPadding+this._actualOuterBarWidth*n;},_drawFPSMarks:function(scale,height)
{const fpsMarks=[30,60];this._context.save();this._context.beginPath();this._context.font=(10*window.devicePixelRatio)+"px "+window.getComputedStyle(this.element,null).getPropertyValue("font-family");this._context.textAlign="right";this._context.textBaseline="alphabetic";const labelPadding=4*window.devicePixelRatio;const baselineHeight=3*window.devicePixelRatio;var lineHeight=12*window.devicePixelRatio;var labelTopMargin=0;var labelOffsetY=0;for(var i=0;i<fpsMarks.length;++i){var fps=fpsMarks[i];var y=height-Math.floor(1000.0/fps*scale)-0.5;var label=WebInspector.UIString("%d\u2009fps",fps);var labelWidth=this._context.measureText(label).width+2*labelPadding;var labelX=this._canvas.width;if(!i&&labelTopMargin<y-lineHeight)
labelOffsetY=-lineHeight;var labelY=y+labelOffsetY;if(labelY<labelTopMargin||labelY+lineHeight>height)
break;this._context.moveTo(0,y);this._context.lineTo(this._canvas.width,y);this._context.fillStyle="rgba(255, 255, 255, 0.5)";this._context.fillRect(labelX-labelWidth,labelY,labelWidth,lineHeight);this._context.fillStyle="black";this._context.fillText(label,labelX-labelPadding,labelY+lineHeight-baselineHeight);labelTopMargin=labelY+lineHeight;}
this._context.strokeStyle="rgba(60, 60, 60, 0.4)";this._context.stroke();this._context.restore();},_renderBar:function(left,width,windowHeight,frame,scale)
{var categories=Object.keys(WebInspector.TimelineUIUtils.categories());var x=Math.floor(left)+0.5;width=Math.floor(width);var totalCPUTime=frame.cpuTime;var normalizedScale=scale;if(totalCPUTime>frame.duration)
normalizedScale*=frame.duration/totalCPUTime;for(var i=0,bottomOffset=windowHeight;i<categories.length;++i){var category=categories[i];var duration=frame.timeByCategory[category];if(!duration)
continue;var height=Math.round(duration*normalizedScale);var y=Math.floor(bottomOffset-height)+0.5;this._context.save();this._context.translate(x,0);this._context.scale(width/this._maxInnerBarWidth,1);this._context.fillStyle=this._fillStyles[category];this._context.fillRect(0,y,this._maxInnerBarWidth,Math.floor(height));this._context.strokeStyle=WebInspector.TimelineUIUtils.categories()[category].borderColor;this._context.beginPath();this._context.moveTo(0,y);this._context.lineTo(this._maxInnerBarWidth,y);this._context.stroke();this._context.restore();bottomOffset-=height;}
var y0=Math.floor(windowHeight-frame.duration*scale)+0.5;var y1=windowHeight+0.5;this._context.strokeStyle="rgba(90, 90, 90, 0.2)";this._context.beginPath();this._context.moveTo(x,y1);this._context.lineTo(x,y0);this._context.lineTo(x+width,y0);this._context.lineTo(x+width,y1);this._context.stroke();},windowTimes:function(windowLeft,windowRight)
{if(!this._barTimes.length)
return WebInspector.TimelineOverviewBase.prototype.windowTimes.call(this,windowLeft,windowRight);var windowSpan=this._canvas.width;var leftOffset=windowLeft*windowSpan;var rightOffset=windowRight*windowSpan;var firstBar=Math.floor(Math.max(leftOffset-this._outerPadding+this._actualPadding,0)/this._actualOuterBarWidth);var lastBar=Math.min(Math.floor(Math.max(rightOffset-this._outerPadding,0)/this._actualOuterBarWidth),this._barTimes.length-1);if(firstBar>=this._barTimes.length)
return{startTime:Infinity,endTime:Infinity};const snapTolerancePixels=3;return{startTime:leftOffset>snapTolerancePixels?this._barTimes[firstBar].startTime:this._model.minimumRecordTime(),endTime:(rightOffset+snapTolerancePixels>windowSpan)||(lastBar>=this._barTimes.length)?this._model.maximumRecordTime():this._barTimes[lastBar].endTime};},windowBoundaries:function(startTime,endTime)
{if(this._barTimes.length===0)
return{left:0,right:1};function barStartComparator(time,barTime)
{return time-barTime.startTime;}
function barEndComparator(time,barTime)
{if(time===barTime.endTime)
return 1;return time-barTime.endTime;}
return{left:this._windowBoundaryFromTime(startTime,barEndComparator),right:this._windowBoundaryFromTime(endTime,barStartComparator)};},_windowBoundaryFromTime:function(time,comparator)
{if(time===Infinity)
return 1;var index=this._firstBarAfter(time,comparator);if(!index)
return 0;return(this._barNumberToScreenPosition(index)-this._actualPadding/2)/this._canvas.width;},_firstBarAfter:function(time,comparator)
{return insertionIndexForObjectInListSortedByFunction(time,this._barTimes,comparator);},__proto__:WebInspector.TimelineOverviewBase.prototype};WebInspector.TimelineMemoryOverview=function(model)
{WebInspector.TimelineOverviewBase.call(this,model);this.element.id="timeline-overview-memory";this._heapSizeLabel=this.element.createChild("div","memory-graph-label");}
WebInspector.TimelineMemoryOverview.prototype={resetHeapSizeLabels:function()
{this._heapSizeLabel.textContent="";},update:function()
{this.resetCanvas();var ratio=window.devicePixelRatio;var events=this._model.mainThreadEvents();if(!events.length){this.resetHeapSizeLabels();return;}
var lowerOffset=3*ratio;var maxUsedHeapSize=0;var minUsedHeapSize=100000000000;var minTime=this._model.minimumRecordTime();var maxTime=this._model.maximumRecordTime();function isUpdateCountersEvent(event)
{return event.name===WebInspector.TimelineModel.RecordType.UpdateCounters;}
events=events.filter(isUpdateCountersEvent);function calculateMinMaxSizes(event)
{var counters=event.args.data;if(!counters||!counters.jsHeapSizeUsed)
return;maxUsedHeapSize=Math.max(maxUsedHeapSize,counters.jsHeapSizeUsed);minUsedHeapSize=Math.min(minUsedHeapSize,counters.jsHeapSizeUsed);}
events.forEach(calculateMinMaxSizes);minUsedHeapSize=Math.min(minUsedHeapSize,maxUsedHeapSize);var lineWidth=1;var width=this._canvas.width;var height=this._canvas.height-lowerOffset;var xFactor=width/(maxTime-minTime);var yFactor=(height-lineWidth)/Math.max(maxUsedHeapSize-minUsedHeapSize,1);var histogram=new Array(width);function buildHistogram(event)
{var counters=event.args.data;if(!counters||!counters.jsHeapSizeUsed)
return;var x=Math.round((event.startTime-minTime)*xFactor);var y=Math.round((counters.jsHeapSizeUsed-minUsedHeapSize)*yFactor);histogram[x]=Math.max(histogram[x]||0,y);}
events.forEach(buildHistogram);var ctx=this._context;var heightBeyondView=height+lowerOffset+lineWidth;ctx.translate(0.5,0.5);ctx.beginPath();ctx.moveTo(-lineWidth,heightBeyondView);var y=0;var isFirstPoint=true;var lastX=0;for(var x=0;x<histogram.length;x++){if(typeof histogram[x]==="undefined")
continue;if(isFirstPoint){isFirstPoint=false;y=histogram[x];ctx.lineTo(-lineWidth,height-y);}
var nextY=histogram[x];if(Math.abs(nextY-y)>2&&Math.abs(x-lastX)>1)
ctx.lineTo(x,height-y);y=nextY;ctx.lineTo(x,height-y);lastX=x;}
ctx.lineTo(width+lineWidth,height-y);ctx.lineTo(width+lineWidth,heightBeyondView);ctx.closePath();ctx.fillStyle="hsla(220, 90%, 70%, 0.2)";ctx.fill();ctx.lineWidth=lineWidth;ctx.strokeStyle="hsl(220, 90%, 70%)";ctx.stroke();this._heapSizeLabel.textContent=WebInspector.UIString("%s \u2013 %s",Number.bytesToString(minUsedHeapSize),Number.bytesToString(maxUsedHeapSize));},__proto__:WebInspector.TimelineOverviewBase.prototype};WebInspector.TimelineFlameChartDataProviderBase=function(model)
{WebInspector.FlameChartDataProvider.call(this);this.reset();this._model=model;this._timelineData;this._font="11px "+WebInspector.fontFamily();this._filters=[];this.addFilter(WebInspector.TimelineUIUtils.hiddenEventsFilter());this.addFilter(new WebInspector.ExclusiveTraceEventNameFilter([WebInspector.TimelineModel.RecordType.Program]));this._jsFramesColorGenerator=new WebInspector.FlameChart.ColorGenerator({min:180,max:310,count:7},{min:50,max:80,count:5},85);}
WebInspector.TimelineFlameChartDataProviderBase.prototype={barHeight:function()
{return 17;},textBaseline:function()
{return 5;},textPadding:function()
{return 4;},entryFont:function(entryIndex)
{return this._font;},entryTitle:function(entryIndex)
{return null;},reset:function()
{this._timelineData=null;},addFilter:function(filter)
{this._filters.push(filter);},minimumBoundary:function()
{return this._minimumBoundary;},totalTime:function()
{return this._timeSpan;},maxStackDepth:function()
{return this._currentLevel;},prepareHighlightedEntryInfo:function(entryIndex)
{return null;},canJumpToEntry:function(entryIndex)
{return false;},entryColor:function(entryIndex)
{return"red";},forceDecoration:function(index)
{return false;},decorateEntry:function(entryIndex,context,text,barX,barY,barWidth,barHeight)
{return false;},dividerOffsets:function(startTime,endTime)
{return null;},paddingLeft:function()
{return 0;},textColor:function(entryIndex)
{return"#333";},highlightTimeRange:function(entryIndex)
{var startTime=this._timelineData.entryStartTimes[entryIndex];return{startTime:startTime,endTime:startTime+this._timelineData.entryTotalTimes[entryIndex]};},createSelection:function(entryIndex)
{return null;},timelineData:function()
{throw new Error("Not implemented");},_isVisible:function(event)
{return this._filters.every(function(filter){return filter.accept(event);});}}
WebInspector.TimelineFlameChartDataProvider=function(model,frameModel)
{WebInspector.TimelineFlameChartDataProviderBase.call(this,model);this._frameModel=frameModel;this._consoleColorGenerator=new WebInspector.FlameChart.ColorGenerator({min:30,max:55,count:5},{min:70,max:100,count:6},50,0.7);}
WebInspector.TimelineFlameChartDataProvider.InstantEventVisibleDurationMs=0.001;WebInspector.TimelineFlameChartDataProvider.prototype={entryTitle:function(entryIndex)
{var event=this._entryEvents[entryIndex];if(event){if(event.phase===WebInspector.TracingModel.Phase.AsyncStepInto||event.phase===WebInspector.TracingModel.Phase.AsyncStepPast)
return event.name+":"+event.args["step"];if(event._blackboxRoot)
return WebInspector.UIString("Blackboxed");var name=WebInspector.TimelineUIUtils.eventStyle(event).title;var detailsText=WebInspector.TimelineUIUtils.buildDetailsTextForTraceEvent(event,this._model.target());if(event.name===WebInspector.TimelineModel.RecordType.JSFrame&&detailsText)
return detailsText;return detailsText?WebInspector.UIString("%s (%s)",name,detailsText):name;}
var title=this._entryIndexToTitle[entryIndex];if(!title){title=WebInspector.UIString("Unexpected entryIndex %d",entryIndex);console.error(title);}
return title;},textColor:function(index)
{var event=this._entryEvents[index];if(event&&event._blackboxRoot)
return"#888";else
return WebInspector.TimelineFlameChartDataProviderBase.prototype.textColor.call(this,index);},reset:function()
{WebInspector.TimelineFlameChartDataProviderBase.prototype.reset.call(this);this._entryEvents=[];this._entryIndexToTitle={};this._markers=[];this._entryIndexToFrame={};this._asyncColorByCategory={};this._blackboxingURLCache=new Map();},timelineData:function()
{if(this._timelineData)
return this._timelineData;this._timelineData=new WebInspector.FlameChart.TimelineData([],[],[]);this._flowEventIndexById={};this._minimumBoundary=this._model.minimumRecordTime();this._timeSpan=this._model.isEmpty()?1000:this._model.maximumRecordTime()-this._minimumBoundary;this._currentLevel=0;if(this._frameModel)
this._appendFrameBars(this._frameModel.frames());this._appendThreadTimelineData(WebInspector.UIString("Main Thread"),this._model.mainThreadEvents(),this._model.mainThreadAsyncEvents());if(Runtime.experiments.isEnabled("gpuTimeline"))
this._appendGPUEvents();var threads=this._model.virtualThreads();for(var i=0;i<threads.length;i++)
this._appendThreadTimelineData(threads[i].name,threads[i].events,threads[i].asyncEventsByGroup);function compareStartTime(a,b)
{return a.startTime()-b.startTime();}
this._markers.sort(compareStartTime);this._timelineData.markers=this._markers;this._flowEventIndexById={};return this._timelineData;},_appendThreadTimelineData:function(threadTitle,syncEvents,asyncEvents)
{var firstLevel=this._currentLevel;this._appendSyncEvents(threadTitle,syncEvents);this._appendAsyncEvents(this._currentLevel!==firstLevel?null:threadTitle,asyncEvents);if(this._currentLevel!==firstLevel)
++this._currentLevel;},_appendSyncEvents:function(headerName,events)
{var openEvents=[];var flowEventsEnabled=Runtime.experiments.isEnabled("timelineFlowEvents");var blackboxingEnabled=Runtime.experiments.isEnabled("blackboxJSFramesOnTimeline");function isFlowEvent(event)
{return e.phase===WebInspector.TracingModel.Phase.FlowBegin||e.phase===WebInspector.TracingModel.Phase.FlowStep||e.phase===WebInspector.TracingModel.Phase.FlowEnd;}
var maxStackDepth=0;for(var i=0;i<events.length;++i){var e=events[i];if(WebInspector.TimelineUIUtils.isMarkerEvent(e))
this._markers.push(new WebInspector.TimelineFlameChartMarker(e.startTime,e.startTime-this._model.minimumRecordTime(),WebInspector.TimelineUIUtils.markerStyleForEvent(e)));if(!isFlowEvent(e)){if(!e.endTime&&e.phase!==WebInspector.TracingModel.Phase.Instant)
continue;if(WebInspector.TracingModel.isAsyncPhase(e.phase))
continue;if(!this._isVisible(e))
continue;}
while(openEvents.length&&openEvents.peekLast().endTime<=e.startTime)
openEvents.pop();e._blackboxRoot=false;if(blackboxingEnabled&&this._isBlackboxedEvent(e)){var parent=openEvents.peekLast();if(parent&&parent._blackboxRoot)
continue;e._blackboxRoot=true;}
if(headerName){this._appendHeaderRecord(headerName,this._currentLevel++);headerName=null;}
var level=this._currentLevel+openEvents.length;this._appendEvent(e,level);if(flowEventsEnabled)
this._appendFlowEvent(e,level);maxStackDepth=Math.max(maxStackDepth,openEvents.length+1);if(e.endTime)
openEvents.push(e);}
this._currentLevel+=maxStackDepth;},_isBlackboxedEvent:function(event)
{if(event.name!==WebInspector.TimelineModel.RecordType.JSFrame)
return false;var url=event.args["data"]["url"];return url&&this._isBlackboxedURL(url);},_isBlackboxedURL:function(url)
{if(this._blackboxingURLCache.has(url))
return(this._blackboxingURLCache.get(url));var result=WebInspector.BlackboxSupport.isBlackboxedURL(url);this._blackboxingURLCache.set(url,result);return result;},_appendAsyncEvents:function(header,asyncEvents)
{var groups=Object.values(WebInspector.TimelineUIUtils.asyncEventGroups());for(var groupIndex=0;groupIndex<groups.length;++groupIndex){var lastUsedTimeByLevel=[];var group=groups[groupIndex];var events=asyncEvents.get(group);if(!events)
continue;var groupHeaderAppended=false;for(var i=0;i<events.length;++i){var asyncEvent=events[i];if(!this._isVisible(asyncEvent))
continue;if(header){this._appendHeaderRecord(header,this._currentLevel++);header=null;}
if(!groupHeaderAppended){this._appendHeaderRecord(group.title,this._currentLevel++);groupHeaderAppended=true;}
var startTime=asyncEvent.startTime;var level;for(level=0;level<lastUsedTimeByLevel.length&&lastUsedTimeByLevel[level]>startTime;++level){}
this._appendAsyncEvent(asyncEvent,this._currentLevel+level);lastUsedTimeByLevel[level]=asyncEvent.endTime;}
this._currentLevel+=lastUsedTimeByLevel.length;}},_appendGPUEvents:function()
{function recordToEvent(record)
{return record.traceEvent();}
if(this._appendSyncEvents(WebInspector.UIString("GPU"),this._model.gpuTasks().map(recordToEvent)))
++this._currentLevel;},_appendFrameBars:function(frames)
{var style=WebInspector.TimelineUIUtils.markerStyleForFrame();this._frameBarsLevel=this._currentLevel++;for(var i=0;i<frames.length;++i){this._markers.push(new WebInspector.TimelineFlameChartMarker(frames[i].startTime,frames[i].startTime-this._model.minimumRecordTime(),style));this._appendFrame(frames[i]);}},entryColor:function(entryIndex)
{var event=this._entryEvents[entryIndex];if(!event)
return this._entryIndexToFrame[entryIndex]?"white":"#aaa";if(event.name===WebInspector.TimelineModel.RecordType.JSFrame){var colorId=event.args["data"]["url"];return this._jsFramesColorGenerator.colorForID(colorId);}
var category=WebInspector.TimelineUIUtils.eventStyle(event).category;if(WebInspector.TracingModel.isAsyncPhase(event.phase)){if(event.category===WebInspector.TracingModel.ConsoleEventCategory)
return this._consoleColorGenerator.colorForID(event.name);var color=this._asyncColorByCategory[category.name];if(color)
return color;var parsedColor=WebInspector.Color.parse(category.fillColorStop1);color=parsedColor.setAlpha(0.7).asString(WebInspector.Color.Format.RGBA)||"";this._asyncColorByCategory[category.name]=color;return color;}
return category.fillColorStop1;},decorateEntry:function(entryIndex,context,text,barX,barY,barWidth,barHeight)
{var frame=this._entryIndexToFrame[entryIndex];if(frame){var vPadding=1;var hPadding=2;barX+=hPadding;barWidth-=2*hPadding;barY+=vPadding;barHeight-=2*vPadding+1;context.fillStyle="#ccc";context.fillRect(barX,barY,barWidth,barHeight);context.fillStyle="white";for(var i=1;i<barWidth;i+=4){context.fillRect(barX+i,barY+1,2,2);context.fillRect(barX+i,barY+barHeight-3,2,2);}
var frameDurationText=Number.preciseMillisToString(frame.duration,1);var textWidth=context.measureText(frameDurationText).width;if(barWidth>textWidth){context.fillStyle=this.textColor(entryIndex);context.fillText(frameDurationText,barX+((barWidth-textWidth)>>1),barY+barHeight-3);}
return true;}
if(barWidth<5)
return false;if(text){context.save();context.fillStyle=this.textColor(entryIndex);context.font=this._font;context.fillText(text,barX+this.textPadding(),barY+barHeight-this.textBaseline());context.restore();}
var event=this._entryEvents[entryIndex];if(event&&event.warning){context.save();context.rect(barX,barY,barWidth,this.barHeight());context.clip();context.beginPath();var triangleSize=10;context.fillStyle="red";context.moveTo(barX+barWidth-triangleSize,barY+1);context.lineTo(barX+barWidth-1,barY+1);context.lineTo(barX+barWidth-1,barY+triangleSize);context.fill();context.restore();}
return true;},forceDecoration:function(entryIndex)
{var event=this._entryEvents[entryIndex];if(!event)
return!!this._entryIndexToFrame[entryIndex];return!!event.warning;},_appendHeaderRecord:function(title,level)
{var index=this._entryEvents.length;this._entryIndexToTitle[index]=title;this._entryEvents.push(null);this._timelineData.entryLevels[index]=level;this._timelineData.entryTotalTimes[index]=this._timeSpan;this._timelineData.entryStartTimes[index]=this._minimumBoundary;},_appendEvent:function(event,level)
{var index=this._entryEvents.length;this._entryEvents.push(event);this._timelineData.entryLevels[index]=level;this._timelineData.entryTotalTimes[index]=event.duration||WebInspector.TimelineFlameChartDataProvider.InstantEventVisibleDurationMs;this._timelineData.entryStartTimes[index]=event.startTime;},_appendFlowEvent:function(event,level)
{var timelineData=this._timelineData;function pushStartFlow(event)
{var flowIndex=timelineData.flowStartTimes.length;timelineData.flowStartTimes.push(event.startTime);timelineData.flowStartLevels.push(level);return flowIndex;}
function pushEndFlow(event,flowIndex)
{timelineData.flowEndTimes[flowIndex]=event.startTime;timelineData.flowEndLevels[flowIndex]=level;}
switch(event.phase){case WebInspector.TracingModel.Phase.FlowBegin:this._flowEventIndexById[event.id]=pushStartFlow(event);break;case WebInspector.TracingModel.Phase.FlowStep:pushEndFlow(event,this._flowEventIndexById[event.id]);this._flowEventIndexById[event.id]=pushStartFlow(event);break;case WebInspector.TracingModel.Phase.FlowEnd:pushEndFlow(event,this._flowEventIndexById[event.id]);delete this._flowEventIndexById[event.id];break;}},_appendAsyncEvent:function(asyncEvent,level)
{if(WebInspector.TracingModel.isNestableAsyncPhase(asyncEvent.phase)){this._appendEvent(asyncEvent,level);return;}
var steps=asyncEvent.steps;var eventOffset=steps.length>1&&steps[1].phase===WebInspector.TracingModel.Phase.AsyncStepPast?1:0;for(var i=0;i<steps.length-1;++i){var index=this._entryEvents.length;this._entryEvents.push(steps[i+eventOffset]);var startTime=steps[i].startTime;this._timelineData.entryLevels[index]=level;this._timelineData.entryTotalTimes[index]=steps[i+1].startTime-startTime;this._timelineData.entryStartTimes[index]=startTime;}},_appendFrame:function(frame)
{var index=this._entryEvents.length;this._entryEvents.push(null);this._entryIndexToFrame[index]=frame;this._entryIndexToTitle[index]=Number.millisToString(frame.duration,true);this._timelineData.entryLevels[index]=this._frameBarsLevel;this._timelineData.entryTotalTimes[index]=frame.duration;this._timelineData.entryStartTimes[index]=frame.startTime;},createSelection:function(entryIndex)
{var event=this._entryEvents[entryIndex];if(event){this._lastSelection=new WebInspector.TimelineFlameChartView.Selection(WebInspector.TimelineSelection.fromTraceEvent(event),entryIndex);return this._lastSelection.timelineSelection;}
var frame=this._entryIndexToFrame[entryIndex];if(frame){this._lastSelection=new WebInspector.TimelineFlameChartView.Selection(WebInspector.TimelineSelection.fromFrame(frame),entryIndex);return this._lastSelection.timelineSelection;}
return null;},entryIndexForSelection:function(selection)
{if(!selection)
return-1;if(this._lastSelection&&this._lastSelection.timelineSelection.object()===selection.object())
return this._lastSelection.entryIndex;switch(selection.type()){case WebInspector.TimelineSelection.Type.TraceEvent:var event=(selection.object());var entryIndex=this._entryEvents.indexOf(event);if(entryIndex!==-1)
this._lastSelection=new WebInspector.TimelineFlameChartView.Selection(WebInspector.TimelineSelection.fromTraceEvent(event),entryIndex);return entryIndex;case WebInspector.TimelineSelection.Type.Frame:var frame=(selection.object());for(var frameIndex in this._entryIndexToFrame){if(this._entryIndexToFrame[frameIndex]===frame){this._lastSelection=new WebInspector.TimelineFlameChartView.Selection(WebInspector.TimelineSelection.fromFrame(frame),Number(frameIndex));return Number(frameIndex);}}
break;}
return-1;},__proto__:WebInspector.TimelineFlameChartDataProviderBase.prototype}
WebInspector.TimelineFlameChartNetworkDataProvider=function(model)
{WebInspector.TimelineFlameChartDataProviderBase.call(this,model);var loadingCategory=WebInspector.TimelineUIUtils.categories()["loading"];this._waitingColor=loadingCategory.backgroundColor;this._processingColor=loadingCategory.fillColorStop1;}
WebInspector.TimelineFlameChartNetworkDataProvider.prototype={timelineData:function()
{if(this._timelineData)
return this._timelineData;this._entries=[];this._timelineData=new WebInspector.FlameChart.TimelineData([],[],[]);this._appendTimelineData(this._model.mainThreadEvents());return this._timelineData;},reset:function()
{WebInspector.TimelineFlameChartDataProviderBase.prototype.reset.call(this);this._entries=[];},setWindowTimes:function(startTime,endTime)
{this._startTime=startTime;this._endTime=endTime;this.reset();},createSelection:function(entryIndex)
{var event=this._entries[entryIndex];if(!event)
return null;this._lastSelection=new WebInspector.TimelineFlameChartView.Selection(WebInspector.TimelineSelection.fromTraceEvent(event),entryIndex);return this._lastSelection.timelineSelection;},entryIndexForSelection:function(selection)
{if(!selection)
return-1;if(this._lastSelection&&this._lastSelection.timelineSelection.object()===selection.object())
return this._lastSelection.entryIndex;switch(selection.type()){case WebInspector.TimelineSelection.Type.TraceEvent:var event=(selection.object());var index=this._entries.indexOf(event);if(index!==-1)
this._lastSelection=new WebInspector.TimelineFlameChartView.Selection(WebInspector.TimelineSelection.fromTraceEvent(event),index);return index;}
return-1;},entryTitle:function(index)
{var event=this._entries[index];return event&&event.url||"";},entryColor:function(index)
{var event=this._entries[index];if(!event)
return this._waitingColor;switch(event.name){case WebInspector.TimelineModel.RecordType.ResourceSendRequest:case WebInspector.TimelineModel.RecordType.ResourceReceiveResponse:return this._waitingColor;case WebInspector.TimelineModel.RecordType.ResourceReceivedData:case WebInspector.TimelineModel.RecordType.ResourceFinish:return this._processingColor;}
console.assert(false);return"#aaa";},_appendTimelineData:function(events)
{var bandsCount=WebInspector.TimelineUIUtils.calculateNetworkBandsCount(events);this._minimumBoundary=this._model.minimumRecordTime();this._maximumBoundary=this._model.maximumRecordTime();this._timeSpan=this._model.isEmpty()?1000:this._model.maximumRecordTime()-this._minimumBoundary;this._currentLevel=bandsCount;WebInspector.TimelineUIUtils.iterateNetworkRequestsInRoundRobin(events,bandsCount,this._appendEvent.bind(this));},_appendEvent:function(band,startTime,endTime,event)
{endTime=isFinite(endTime)?endTime:this._maximumBoundary;startTime=startTime||this._minimumBoundary;this._entries.push(event);this._timelineData.entryStartTimes.push(startTime);this._timelineData.entryTotalTimes.push(endTime-startTime);this._timelineData.entryLevels.push(band);},__proto__:WebInspector.TimelineFlameChartDataProviderBase.prototype}
WebInspector.TimelineFlameChartBottomUpDataProvider=function(model)
{WebInspector.TimelineFlameChartDataProviderBase.call(this,model);}
WebInspector.TimelineFlameChartBottomUpDataProvider.TreeNode=function()
{this.totalTime;this.selfTime;this.name;this.color;this.id;this.event;this.children;this.parent;}
WebInspector.TimelineFlameChartBottomUpDataProvider.prototype={timelineData:function()
{if(this._timelineData)
return this._timelineData;this._entries=[];this._timelineData=new WebInspector.FlameChart.TimelineData([],[],[]);this._appendTimelineData(this._model.mainThreadEvents());return this._timelineData;},reset:function()
{WebInspector.TimelineFlameChartDataProviderBase.prototype.reset.call(this);this._entries=[];},setWindowTimes:function(startTime,endTime)
{this._startTime=startTime;this._endTime=endTime;this.reset();},entryTitle:function(index)
{return this._entries[index].name;},entryColor:function(entryIndex)
{var entry=this._entries[entryIndex];if(entry.color)
return entry.color;var event=entry.event;if(!event)
return"#aaa";if(event.name===WebInspector.TimelineModel.RecordType.JSFrame){var colorId=event.args["data"]["url"];return this._jsFramesColorGenerator.colorForID(colorId);}
return WebInspector.TimelineUIUtils.eventStyle(event).category.fillColorStop1;},_appendTimelineData:function(events)
{var topDownTree=this._buildTopDownTree(events);var bottomUpTree=this._buildBottomUpTree(topDownTree);this._flowEventIndexById={};this._minimumBoundary=0;this._currentLevel=0;this._timeSpan=appendTree.call(this,0,0,bottomUpTree);function appendTree(level,position,node)
{function sortFunction(a,b)
{return b.totalTime-a.totalTime;}
this._currentLevel=Math.max(this._currentLevel,level);this._appendNode(node,level,position);if(node.children)
Object.values(node.children).sort(sortFunction).reduce(appendTree.bind(this,level+1),position);return position+node.totalTime;}},_appendNode:function(node,level,position)
{var index=this._entries.length;this._entries.push(node);this._timelineData.entryLevels[index]=level;this._timelineData.entryTotalTimes[index]=node.totalTime;this._timelineData.entryStartTimes[index]=position;},_buildTopDownTree:function(events)
{var initialTime=1e7;var root=new WebInspector.TimelineFlameChartBottomUpDataProvider.TreeNode();root.totalTime=initialTime;root.selfTime=initialTime;root.name=WebInspector.UIString("Top-Down Chart");var parent=root;function filter(e)
{if(!e.endTime&&e.phase!==WebInspector.TracingModel.Phase.Instant)
return false;if(WebInspector.TracingModel.isAsyncPhase(e.phase))
return false;if(!this._isVisible(e))
return false;if(e.endTime<=this._startTime)
return false;if(e.startTime>=this._endTime)
return false;return true;}
var boundFilter=filter.bind(this);function onStartEvent(e)
{if(!boundFilter(e))
return;var time=Math.min(this._endTime,e.endTime)-Math.max(this._startTime,e.startTime);var id=eventId(e);if(!parent.children)
parent.children={};var node=parent.children[id];if(node){node.selfTime+=time;node.totalTime+=time;}else{node=new WebInspector.TimelineFlameChartBottomUpDataProvider.TreeNode();node.totalTime=time;node.selfTime=time;node.parent=parent;node.name=eventName(e);node.id=id;node.event=e;parent.children[id]=node;}
parent.selfTime-=time;if(parent.selfTime<0){console.log("Error: Negative self of "+parent.selfTime,e);parent.selfTime=0;}
parent=node;}
function onEndEvent(e)
{if(!boundFilter(e))
return;parent=parent.parent;}
function eventId(e)
{if(e.name==="JSFrame")
return"f:"+e.args.data.callUID;return e.name;}
function eventName(e)
{if(e.name==="JSFrame")
return WebInspector.beautifyFunctionName(e.args.data.functionName);if(e.name==="EventDispatch")
return WebInspector.UIString("Event%s",e.args.data?" ("+e.args.data.type+")":"");return e.name;}
WebInspector.TimelineModel.forEachEvent(events,onStartEvent.bind(this),onEndEvent);root.totalTime-=root.selfTime;root.selfTime=0;return root;},_buildBottomUpTree:function(topDownTree)
{var buRoot=new WebInspector.TimelineFlameChartBottomUpDataProvider.TreeNode();buRoot.totalTime=0;buRoot.name=WebInspector.UIString("Bottom-Up Chart");buRoot.children={};var categories=WebInspector.TimelineUIUtils.categories();for(var categoryName in categories){var category=categories[categoryName];var node=new WebInspector.TimelineFlameChartBottomUpDataProvider.TreeNode();node.totalTime=0;node.name=category.title;node.color=category.fillColorStop1;buRoot.children[categoryName]=node;}
for(var id in topDownTree.children)
processNode(topDownTree.children[id]);for(var id in buRoot.children){var buNode=buRoot.children[id];buRoot.totalTime+=buNode.totalTime;}
function processNode(tdNode)
{if(tdNode.selfTime>0){var category=WebInspector.TimelineUIUtils.eventStyle(tdNode.event).category;var buNode=buRoot.children[category.name]||buRoot;var time=tdNode.selfTime;buNode.totalTime+=time;appendNode(tdNode,buNode,time);}
for(var id in tdNode.children)
processNode(tdNode.children[id]);}
function appendNode(tdNode,buParent,time)
{while(tdNode.parent){if(!buParent.children)
buParent.children={};var id=tdNode.id;var buNode=buParent.children[id];if(!buNode){buNode=new WebInspector.TimelineFlameChartBottomUpDataProvider.TreeNode();buNode.totalTime=time;buNode.name=tdNode.name;buNode.event=tdNode.event;buNode.id=id;buParent.children[id]=buNode;}else{buNode.totalTime+=time;}
tdNode=tdNode.parent;buParent=buNode;}}
return buRoot;},__proto__:WebInspector.TimelineFlameChartDataProviderBase.prototype}
WebInspector.TimelineFlameChartMarker=function(startTime,startOffset,style)
{this._startTime=startTime;this._startOffset=startOffset;this._style=style;}
WebInspector.TimelineFlameChartMarker.prototype={startTime:function()
{return this._startTime;},color:function()
{return this._style.color;},title:function()
{var startTime=Number.millisToString(this._startOffset);return WebInspector.UIString("%s at %s",this._style.title,startTime);},draw:function(context,x,height,pixelsPerMillisecond)
{var lowPriorityVisibilityThresholdInPixelsPerMs=4;if(this._style.lowPriority&&pixelsPerMillisecond<lowPriorityVisibilityThresholdInPixelsPerMs)
return;context.save();if(!this._style.lowPriority){context.strokeStyle=this._style.color;context.lineWidth=2;context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke();}
if(this._style.tall){context.strokeStyle=this._style.color;context.lineWidth=this._style.lineWidth;context.translate(this._style.lineWidth<1||(this._style.lineWidth&1)?0.5:0,0.5);context.beginPath();context.moveTo(x,height);context.setLineDash(this._style.dashStyle);context.lineTo(x,context.canvas.height);context.stroke();}
context.restore();}}
WebInspector.TimelineFlameChartView=function(delegate,timelineModel,frameModel)
{WebInspector.VBox.call(this);this.element.classList.add("timeline-flamechart");this._delegate=delegate;this._model=timelineModel;this._splitView=new WebInspector.SplitView(false,false,"timelineFlamechartMainView",150);this._dataProvider=new WebInspector.TimelineFlameChartDataProvider(this._model,frameModel);this._mainView=new WebInspector.FlameChart(this._dataProvider,this,true);this._networkDataProvider=new WebInspector.TimelineFlameChartNetworkDataProvider(this._model);this._networkView=new WebInspector.FlameChart(this._networkDataProvider,this,true);if(Runtime.experiments.isEnabled("networkRequestsOnTimeline")){this._splitView.setMainView(this._mainView);this._splitView.setSidebarView(this._networkView);this._splitView.show(this.element);}else{this._mainView.show(this.element);}
this._onMainEntrySelected=this._onEntrySelected.bind(this,this._dataProvider);this._onNetworkEntrySelected=this._onEntrySelected.bind(this,this._networkDataProvider);this._model.addEventListener(WebInspector.TimelineModel.Events.RecordingStarted,this._onRecordingStarted,this);this._mainView.addEventListener(WebInspector.FlameChart.Events.EntrySelected,this._onMainEntrySelected,this);this._networkView.addEventListener(WebInspector.FlameChart.Events.EntrySelected,this._onNetworkEntrySelected,this);WebInspector.BlackboxSupport.addChangeListener(this._refresh,this);}
WebInspector.TimelineFlameChartView.prototype={dispose:function()
{this._model.removeEventListener(WebInspector.TimelineModel.Events.RecordingStarted,this._onRecordingStarted,this);this._mainView.removeEventListener(WebInspector.FlameChart.Events.EntrySelected,this._onMainEntrySelected,this);this._networkView.removeEventListener(WebInspector.FlameChart.Events.EntrySelected,this._onNetworkEntrySelected,this);WebInspector.BlackboxSupport.removeChangeListener(this._refresh,this);},requestWindowTimes:function(windowStartTime,windowEndTime)
{this._delegate.requestWindowTimes(windowStartTime,windowEndTime);},updateBoxSelection:function(startTime,endTime)
{this._delegate.select(WebInspector.TimelineSelection.fromRange(startTime,endTime));},refreshRecords:function(textFilter)
{this._refresh();},wasShown:function()
{this._mainView.scheduleUpdate();this._networkView.scheduleUpdate();},view:function()
{return this;},reset:function()
{this._automaticallySizeWindow=true;this._dataProvider.reset();this._mainView.reset();this._mainView.setWindowTimes(0,Infinity);this._networkDataProvider.reset();this._networkView.reset();this._networkView.setWindowTimes(0,Infinity);},_onRecordingStarted:function()
{this._automaticallySizeWindow=true;this._mainView.reset();this._networkView.reset();},setWindowTimes:function(startTime,endTime)
{this._mainView.setWindowTimes(startTime,endTime);this._networkView.setWindowTimes(startTime,endTime);this._delegate.select(null);},setSidebarSize:function(width)
{},highlightSearchResult:function(record,regex,selectRecord)
{if(!record){this._delegate.select(null);return;}
var traceEvent=record.traceEvent();var entryIndex=this._dataProvider._entryEvents.indexOf(traceEvent);var timelineSelection=this._dataProvider.createSelection(entryIndex);if(timelineSelection)
this._delegate.select(timelineSelection);},setSelection:function(selection)
{var index=this._dataProvider.entryIndexForSelection(selection);this._mainView.setSelectedEntry(index);index=this._networkDataProvider.entryIndexForSelection(selection);this._networkView.setSelectedEntry(index);},_onEntrySelected:function(dataProvider,event)
{var entryIndex=(event.data);var timelineSelection=dataProvider.createSelection(entryIndex);if(timelineSelection)
this._delegate.select(timelineSelection);},enableNetworkPane:function(enable,animate)
{if(enable)
this._splitView.showBoth(animate);else
this._splitView.hideSidebar(animate);},_refresh:function()
{this._dataProvider.reset();this._mainView.scheduleUpdate();this._networkDataProvider.reset();this._networkView.scheduleUpdate();},__proto__:WebInspector.VBox.prototype}
WebInspector.TimelineFlameChartView.Selection=function(selection,entryIndex)
{this.timelineSelection=selection;this.entryIndex=entryIndex;};WebInspector.TimelineUIUtils=function(){}
WebInspector.TimelineRecordStyle=function(title,category,hidden)
{this.title=title;this.category=category;this.hidden=!!hidden;}
WebInspector.TimelineUIUtils._initEventStyles=function()
{if(WebInspector.TimelineUIUtils._eventStylesMap)
return WebInspector.TimelineUIUtils._eventStylesMap;var recordTypes=WebInspector.TimelineModel.RecordType;var categories=WebInspector.TimelineUIUtils.categories();var eventStyles={};eventStyles[recordTypes.Task]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Task"),categories["other"]);eventStyles[recordTypes.Program]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Other"),categories["other"]);eventStyles[recordTypes.Animation]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Animation"),categories["rendering"]);eventStyles[recordTypes.EventDispatch]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Event"),categories["scripting"]);eventStyles[recordTypes.RequestMainThreadFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Request Main Thread Frame"),categories["rendering"],true);eventStyles[recordTypes.BeginFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Frame Start"),categories["rendering"],true);eventStyles[recordTypes.BeginMainThreadFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Frame Start (main thread)"),categories["rendering"],true);eventStyles[recordTypes.DrawFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Draw Frame"),categories["rendering"],true);eventStyles[recordTypes.ScheduleStyleRecalculation]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Schedule Style Recalculation"),categories["rendering"],true);eventStyles[recordTypes.RecalculateStyles]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Recalculate Style"),categories["rendering"]);eventStyles[recordTypes.InvalidateLayout]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Invalidate Layout"),categories["rendering"],true);eventStyles[recordTypes.Layout]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Layout"),categories["rendering"]);eventStyles[recordTypes.PaintSetup]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Paint Setup"),categories["painting"]);eventStyles[recordTypes.PaintImage]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Paint Image"),categories["painting"],true);eventStyles[recordTypes.UpdateLayer]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Update Layer"),categories["painting"],true);eventStyles[recordTypes.UpdateLayerTree]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Update Layer Tree"),categories["rendering"]);eventStyles[recordTypes.Paint]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Paint"),categories["painting"]);eventStyles[recordTypes.RasterTask]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Rasterize Paint"),categories["painting"]);eventStyles[recordTypes.ScrollLayer]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Scroll"),categories["rendering"]);eventStyles[recordTypes.CompositeLayers]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Composite Layers"),categories["painting"]);eventStyles[recordTypes.ParseHTML]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Parse HTML"),categories["loading"]);eventStyles[recordTypes.ParseAuthorStyleSheet]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Parse Author Style Sheet"),categories["loading"]);eventStyles[recordTypes.TimerInstall]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Install Timer"),categories["scripting"]);eventStyles[recordTypes.TimerRemove]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Remove Timer"),categories["scripting"]);eventStyles[recordTypes.TimerFire]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Timer Fired"),categories["scripting"]);eventStyles[recordTypes.XHRReadyStateChange]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("XHR Ready State Change"),categories["scripting"]);eventStyles[recordTypes.XHRLoad]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("XHR Load"),categories["scripting"]);eventStyles[recordTypes.EvaluateScript]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Evaluate Script"),categories["scripting"]);eventStyles[recordTypes.MarkLoad]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Load event"),categories["scripting"],true);eventStyles[recordTypes.MarkDOMContent]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("DOMContentLoaded event"),categories["scripting"],true);eventStyles[recordTypes.MarkFirstPaint]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("First paint"),categories["painting"],true);eventStyles[recordTypes.TimeStamp]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Timestamp"),categories["scripting"]);eventStyles[recordTypes.ConsoleTime]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Console Time"),categories["scripting"]);eventStyles[recordTypes.ResourceSendRequest]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Send Request"),categories["loading"]);eventStyles[recordTypes.ResourceReceiveResponse]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Receive Response"),categories["loading"]);eventStyles[recordTypes.ResourceFinish]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Finish Loading"),categories["loading"]);eventStyles[recordTypes.ResourceReceivedData]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Receive Data"),categories["loading"]);eventStyles[recordTypes.FunctionCall]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Function Call"),categories["scripting"]);eventStyles[recordTypes.GCEvent]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("GC Event"),categories["scripting"]);eventStyles[recordTypes.JSFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("JS Frame"),categories["scripting"]);eventStyles[recordTypes.RequestAnimationFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Request Animation Frame"),categories["scripting"]);eventStyles[recordTypes.CancelAnimationFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Cancel Animation Frame"),categories["scripting"]);eventStyles[recordTypes.FireAnimationFrame]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Animation Frame Fired"),categories["scripting"]);eventStyles[recordTypes.WebSocketCreate]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Create WebSocket"),categories["scripting"]);eventStyles[recordTypes.WebSocketSendHandshakeRequest]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Send WebSocket Handshake"),categories["scripting"]);eventStyles[recordTypes.WebSocketReceiveHandshakeResponse]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Receive WebSocket Handshake"),categories["scripting"]);eventStyles[recordTypes.WebSocketDestroy]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Destroy WebSocket"),categories["scripting"]);eventStyles[recordTypes.EmbedderCallback]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Embedder Callback"),categories["scripting"]);eventStyles[recordTypes.DecodeImage]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Image Decode"),categories["painting"]);eventStyles[recordTypes.ResizeImage]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Image Resize"),categories["painting"]);eventStyles[recordTypes.GPUTask]=new WebInspector.TimelineRecordStyle(WebInspector.UIString("GPU"),categories["gpu"]);WebInspector.TimelineUIUtils._eventStylesMap=eventStyles;return eventStyles;}
WebInspector.TimelineUIUtils._coalescableRecordTypes={};WebInspector.TimelineUIUtils._coalescableRecordTypes[WebInspector.TimelineModel.RecordType.Layout]=1;WebInspector.TimelineUIUtils._coalescableRecordTypes[WebInspector.TimelineModel.RecordType.Paint]=1;WebInspector.TimelineUIUtils._coalescableRecordTypes[WebInspector.TimelineModel.RecordType.RasterTask]=1;WebInspector.TimelineUIUtils._coalescableRecordTypes[WebInspector.TimelineModel.RecordType.DecodeImage]=1;WebInspector.TimelineUIUtils._coalescableRecordTypes[WebInspector.TimelineModel.RecordType.ResizeImage]=1;WebInspector.TimelineUIUtils.isCoalescable=function(recordType)
{return!!WebInspector.TimelineUIUtils._coalescableRecordTypes[recordType];}
WebInspector.TimelineUIUtils.testContentMatching=function(record,regExp)
{var traceEvent=record.traceEvent();var title=WebInspector.TimelineUIUtils.eventStyle(traceEvent).title;var tokens=[title];if(traceEvent.url)
tokens.push(traceEvent.url);for(var argName in traceEvent.args){var argValue=traceEvent.args[argName];for(var key in argValue)
tokens.push(argValue[key]);}
return regExp.test(tokens.join("|"));}
WebInspector.TimelineUIUtils.categoryForRecord=function(record)
{return WebInspector.TimelineUIUtils.eventStyle(record.traceEvent()).category;}
WebInspector.TimelineUIUtils.eventStyle=function(event)
{var eventStyles=WebInspector.TimelineUIUtils._initEventStyles();if(event.category===WebInspector.TracingModel.ConsoleEventCategory)
return{title:event.name,category:WebInspector.TimelineUIUtils.categories()["scripting"]};var result=eventStyles[event.name];if(!result){result=new WebInspector.TimelineRecordStyle(WebInspector.UIString("Unknown: %s",event.name),WebInspector.TimelineUIUtils.categories()["other"],true);eventStyles[event.name]=result;}
return result;}
WebInspector.TimelineUIUtils.eventTitle=function(event)
{var title=WebInspector.TimelineUIUtils.eventStyle(event).title;if(event.category===WebInspector.TracingModel.ConsoleEventCategory)
return title;if(event.name===WebInspector.TimelineModel.RecordType.TimeStamp)
return WebInspector.UIString("%s: %s",title,event.args["data"]["message"]);if(event.name===WebInspector.TimelineModel.RecordType.Animation&&event.args["data"]&&event.args["data"]["name"])
return WebInspector.UIString("%s: %s",title,event.args["data"]["name"]);return title;}
WebInspector.TimelineUIUtils.isMarkerEvent=function(event)
{var recordTypes=WebInspector.TimelineModel.RecordType;switch(event.name){case recordTypes.TimeStamp:case recordTypes.MarkFirstPaint:return true;case recordTypes.MarkDOMContent:case recordTypes.MarkLoad:return event.args["data"]["isMainFrame"];default:return false;}}
WebInspector.TimelineUIUtils.buildDetailsTextForTraceEvent=function(event,target)
{var recordType=WebInspector.TimelineModel.RecordType;var detailsText;var eventData=event.args["data"];switch(event.name){case recordType.GCEvent:var delta=event.args["usedHeapSizeBefore"]-event.args["usedHeapSizeAfter"];detailsText=WebInspector.UIString("%s collected",Number.bytesToString(delta));break;case recordType.TimerFire:detailsText=eventData["timerId"];break;case recordType.FunctionCall:detailsText=linkifyLocationAsText(eventData["scriptId"],eventData["scriptLine"],0);break;case recordType.JSFrame:detailsText=WebInspector.beautifyFunctionName(eventData["functionName"]);break;case recordType.FireAnimationFrame:detailsText=eventData["id"];break;case recordType.EventDispatch:detailsText=eventData?eventData["type"]:null;break;case recordType.Paint:var width=WebInspector.TimelineUIUtils.quadWidth(eventData.clip);var height=WebInspector.TimelineUIUtils.quadHeight(eventData.clip);if(width&&height)
detailsText=WebInspector.UIString("%d\u2009\u00d7\u2009%d",width,height);break;case recordType.TimerInstall:case recordType.TimerRemove:detailsText=linkifyTopCallFrameAsText()||eventData["timerId"];break;case recordType.RequestAnimationFrame:case recordType.CancelAnimationFrame:detailsText=linkifyTopCallFrameAsText()||eventData["id"];break;case recordType.ParseHTML:case recordType.RecalculateStyles:detailsText=linkifyTopCallFrameAsText();break;case recordType.EvaluateScript:var url=eventData["url"];if(url)
detailsText=url+":"+eventData["lineNumber"];break;case recordType.XHRReadyStateChange:case recordType.XHRLoad:case recordType.ResourceSendRequest:var url=eventData["url"];if(url)
detailsText=WebInspector.displayNameForURL(url);break;case recordType.ResourceReceivedData:case recordType.ResourceReceiveResponse:case recordType.ResourceFinish:var initiator=event.initiator;if(initiator){var url=initiator.args["data"]["url"];if(url)
detailsText=WebInspector.displayNameForURL(url);}
break;case recordType.EmbedderCallback:detailsText=eventData["callbackName"];break;case recordType.PaintImage:case recordType.DecodeImage:case recordType.ResizeImage:case recordType.DecodeLazyPixelRef:var url=event.url;if(url)
detailsText=WebInspector.displayNameForURL(url);break;case recordType.Animation:detailsText=eventData&&eventData["name"];break;default:if(event.category===WebInspector.TracingModel.ConsoleEventCategory)
detailsText=null;else
detailsText=linkifyTopCallFrameAsText();break;}
return detailsText;function linkifyLocationAsText(scriptId,lineNumber,columnNumber)
{var rawLocation=target&&!target.isDetached()&&scriptId?target.debuggerModel.createRawLocationByScriptId(scriptId,lineNumber-1,(columnNumber||1)-1):null;if(!rawLocation)
return null;var uiLocation=WebInspector.debuggerWorkspaceBinding.rawLocationToUILocation(rawLocation);return uiLocation.toUIString();}
function linkifyTopCallFrameAsText()
{var stackTrace=event.stackTrace;if(!stackTrace){var initiator=event.initiator;if(initiator)
stackTrace=initiator.stackTrace;}
if(!stackTrace||!stackTrace.length)
return null;var callFrame=stackTrace[0];return linkifyLocationAsText(callFrame.scriptId,callFrame.lineNumber,callFrame.columnNumber);}}
WebInspector.TimelineUIUtils.buildDetailsNodeForTraceEvent=function(event,target,linkifier)
{var recordType=WebInspector.TimelineModel.RecordType;var details;var detailsText;var eventData=event.args["data"];switch(event.name){case recordType.GCEvent:case recordType.TimerFire:case recordType.FireAnimationFrame:case recordType.EventDispatch:case recordType.Paint:case recordType.PaintImage:case recordType.DecodeImage:case recordType.ResizeImage:case recordType.DecodeLazyPixelRef:case recordType.Animation:case recordType.XHRReadyStateChange:case recordType.XHRLoad:case recordType.ResourceSendRequest:case recordType.ResourceReceivedData:case recordType.ResourceReceiveResponse:case recordType.ResourceFinish:case recordType.EmbedderCallback:detailsText=WebInspector.TimelineUIUtils.buildDetailsTextForTraceEvent(event,target);break;case recordType.FunctionCall:details=linkifyLocation(eventData["scriptId"],eventData["scriptName"],eventData["scriptLine"],0);break;case recordType.JSFrame:details=createElement("span");details.createTextChild(WebInspector.beautifyFunctionName(eventData["functionName"]));var location=linkifyLocation(eventData["scriptId"],eventData["url"],eventData["lineNumber"],eventData["columnNumber"]);if(location){details.createTextChild(" @ ");details.appendChild(location);}
break;case recordType.TimerInstall:case recordType.TimerRemove:details=linkifyTopCallFrame();detailsText=eventData["timerId"];break;case recordType.RequestAnimationFrame:case recordType.CancelAnimationFrame:details=linkifyTopCallFrame();detailsText=eventData["id"];break;case recordType.ParseHTML:case recordType.RecalculateStyles:details=linkifyTopCallFrame();break;case recordType.EvaluateScript:var url=eventData["url"];if(url)
details=linkifyLocation("",url,eventData["lineNumber"],0);break;default:if(event.category===WebInspector.TracingModel.ConsoleEventCategory)
detailsText=null;else
details=linkifyTopCallFrame();break;}
if(!details&&detailsText)
details=createTextNode(detailsText);return details;function linkifyLocation(scriptId,url,lineNumber,columnNumber)
{if(!url)
return null;return linkifier.linkifyScriptLocation(target,scriptId,url,lineNumber-1,(columnNumber||1)-1,"timeline-details");}
function linkifyTopCallFrame()
{var stackTrace=event.stackTrace;if(!stackTrace){var initiator=event.initiator;if(initiator)
stackTrace=initiator.stackTrace;}
if(!stackTrace||!stackTrace.length)
return null;return linkifier.linkifyConsoleCallFrame(target,stackTrace[0],"timeline-details");}}
WebInspector.TimelineUIUtils.buildTraceEventDetails=function(event,model,linkifier,callback)
{var target=model.target();if(!target){callbackWrapper();return;}
var relatedNodes=null;var barrier=new CallbackBarrier();if(!event.previewElement){if(event.url)
WebInspector.DOMPresentationUtils.buildImagePreviewContents(target,event.url,false,barrier.createCallback(saveImage));else if(event.picture)
WebInspector.TimelineUIUtils.buildPicturePreviewContent(event,target,barrier.createCallback(saveImage));}
var nodeIdsToResolve=new Set();if(event.backendNodeId)
nodeIdsToResolve.add(event.backendNodeId);if(event.invalidationTrackingEvents)
WebInspector.TimelineUIUtils._collectInvalidationNodeIds(nodeIdsToResolve,event.invalidationTrackingEvents);if(nodeIdsToResolve.size)
target.domModel.pushNodesByBackendIdsToFrontend(nodeIdsToResolve,barrier.createCallback(setRelatedNodeMap));barrier.callWhenDone(callbackWrapper);function saveImage(element)
{event.previewElement=element||null;}
function setRelatedNodeMap(nodeMap)
{relatedNodes=nodeMap;}
function callbackWrapper()
{callback(WebInspector.TimelineUIUtils._buildTraceEventDetailsSynchronously(event,model,linkifier,relatedNodes));}}
WebInspector.TimelineUIUtils._buildTraceEventDetailsSynchronously=function(event,model,linkifier,relatedNodesMap)
{var fragment=createDocumentFragment();var stats={};var recordTypes=WebInspector.TimelineModel.RecordType;var relatedNodeLabel;var contentHelper=new WebInspector.TimelineDetailsContentHelper(model.target(),linkifier,relatedNodesMap,true);contentHelper.appendTextRow(WebInspector.UIString("Type"),WebInspector.TimelineUIUtils.eventTitle(event));contentHelper.appendTextRow(WebInspector.UIString("Total Time"),Number.millisToString(event.duration||0,true));contentHelper.appendTextRow(WebInspector.UIString("Self Time"),Number.millisToString(event.selfTime,true));if(event.previewElement)
contentHelper.appendElementRow(WebInspector.UIString("Preview"),event.previewElement);var eventData=event.args["data"];var initiator=event.initiator;switch(event.name){case recordTypes.GCEvent:var delta=event.args["usedHeapSizeBefore"]-event.args["usedHeapSizeAfter"];contentHelper.appendTextRow(WebInspector.UIString("Collected"),Number.bytesToString(delta));break;case recordTypes.TimerFire:case recordTypes.TimerInstall:case recordTypes.TimerRemove:contentHelper.appendTextRow(WebInspector.UIString("Timer ID"),eventData["timerId"]);if(event.name===recordTypes.TimerInstall){contentHelper.appendTextRow(WebInspector.UIString("Timeout"),Number.millisToString(eventData["timeout"]));contentHelper.appendTextRow(WebInspector.UIString("Repeats"),!eventData["singleShot"]);}
break;case recordTypes.FireAnimationFrame:contentHelper.appendTextRow(WebInspector.UIString("Callback ID"),eventData["id"]);break;case recordTypes.FunctionCall:if(eventData["scriptName"])
contentHelper.appendLocationRow(WebInspector.UIString("Location"),eventData["scriptName"],eventData["scriptLine"]);break;case recordTypes.ResourceSendRequest:case recordTypes.ResourceReceiveResponse:case recordTypes.ResourceReceivedData:case recordTypes.ResourceFinish:var url=(event.name===recordTypes.ResourceSendRequest)?eventData["url"]:initiator&&initiator.args["data"]["url"];if(url)
contentHelper.appendElementRow(WebInspector.UIString("Resource"),WebInspector.linkifyResourceAsNode(url));if(eventData["requestMethod"])
contentHelper.appendTextRow(WebInspector.UIString("Request Method"),eventData["requestMethod"]);if(typeof eventData["statusCode"]==="number")
contentHelper.appendTextRow(WebInspector.UIString("Status Code"),eventData["statusCode"]);if(eventData["mimeType"])
contentHelper.appendTextRow(WebInspector.UIString("MIME Type"),eventData["mimeType"]);if(eventData["encodedDataLength"])
contentHelper.appendTextRow(WebInspector.UIString("Encoded Data Length"),WebInspector.UIString("%d Bytes",eventData["encodedDataLength"]));break;case recordTypes.EvaluateScript:var url=eventData["url"];if(url)
contentHelper.appendLocationRow(WebInspector.UIString("Script"),url,eventData["lineNumber"]);break;case recordTypes.Paint:var clip=eventData["clip"];contentHelper.appendTextRow(WebInspector.UIString("Location"),WebInspector.UIString("(%d, %d)",clip[0],clip[1]));var clipWidth=WebInspector.TimelineUIUtils.quadWidth(clip);var clipHeight=WebInspector.TimelineUIUtils.quadHeight(clip);contentHelper.appendTextRow(WebInspector.UIString("Dimensions"),WebInspector.UIString("%d × %d",clipWidth,clipHeight));case recordTypes.PaintSetup:case recordTypes.Rasterize:case recordTypes.ScrollLayer:relatedNodeLabel=WebInspector.UIString("Layer root");break;case recordTypes.PaintImage:case recordTypes.DecodeLazyPixelRef:case recordTypes.DecodeImage:case recordTypes.ResizeImage:case recordTypes.DrawLazyPixelRef:relatedNodeLabel=WebInspector.UIString("Owner element");if(event.url)
contentHelper.appendElementRow(WebInspector.UIString("Image URL"),WebInspector.linkifyResourceAsNode(event.url));break;case recordTypes.ParseAuthorStyleSheet:var url=eventData["styleSheetUrl"];if(url)
contentHelper.appendElementRow(WebInspector.UIString("Stylesheet URL"),WebInspector.linkifyResourceAsNode(url));break;case recordTypes.RecalculateStyles:contentHelper.appendTextRow(WebInspector.UIString("Elements affected"),event.args["elementCount"]);break;case recordTypes.Layout:var beginData=event.args["beginData"];contentHelper.appendTextRow(WebInspector.UIString("Nodes that need layout"),beginData["dirtyObjects"]);contentHelper.appendTextRow(WebInspector.UIString("Layout tree size"),beginData["totalObjects"]);contentHelper.appendTextRow(WebInspector.UIString("Layout scope"),beginData["partialLayout"]?WebInspector.UIString("Partial"):WebInspector.UIString("Whole document"));relatedNodeLabel=WebInspector.UIString("Layout root");break;case recordTypes.ConsoleTime:contentHelper.appendTextRow(WebInspector.UIString("Message"),event.name);break;case recordTypes.WebSocketCreate:case recordTypes.WebSocketSendHandshakeRequest:case recordTypes.WebSocketReceiveHandshakeResponse:case recordTypes.WebSocketDestroy:var initiatorData=initiator?initiator.args["data"]:eventData;if(typeof initiatorData["webSocketURL"]!=="undefined")
contentHelper.appendTextRow(WebInspector.UIString("URL"),initiatorData["webSocketURL"]);if(typeof initiatorData["webSocketProtocol"]!=="undefined")
contentHelper.appendTextRow(WebInspector.UIString("WebSocket Protocol"),initiatorData["webSocketProtocol"]);if(typeof eventData["message"]!=="undefined")
contentHelper.appendTextRow(WebInspector.UIString("Message"),eventData["message"]);break;case recordTypes.EmbedderCallback:contentHelper.appendTextRow(WebInspector.UIString("Callback Function"),eventData["callbackName"]);break;case recordTypes.Animation:if(event.phase===WebInspector.TracingModel.Phase.NestableAsyncInstant)
contentHelper.appendTextRow(WebInspector.UIString("State"),eventData["state"]);break;default:var detailsNode=WebInspector.TimelineUIUtils.buildDetailsNodeForTraceEvent(event,model.target(),linkifier);if(detailsNode)
contentHelper.appendElementRow(WebInspector.UIString("Details"),detailsNode);break;}
var relatedNode=contentHelper.nodeForBackendId(event.backendNodeId);if(relatedNode)
contentHelper.appendElementRow(relatedNodeLabel||WebInspector.UIString("Related node"),WebInspector.DOMPresentationUtils.linkifyNodeReference(relatedNode));if(eventData&&eventData["scriptName"]&&event.name!==recordTypes.FunctionCall)
contentHelper.appendLocationRow(WebInspector.UIString("Function Call"),eventData["scriptName"],eventData["scriptLine"]);var warning=event.warning;if(warning){var div=createElement("div");div.textContent=warning;contentHelper.appendElementRow(WebInspector.UIString("Warning"),div);}
var hasChildren=WebInspector.TimelineUIUtils._aggregatedStatsForTraceEvent(stats,model,event);if(hasChildren){var pieChart=WebInspector.TimelineUIUtils.generatePieChart(stats,WebInspector.TimelineUIUtils.eventStyle(event).category,event.selfTime);contentHelper.appendElementRow(WebInspector.UIString("Aggregated Time"),pieChart);}
if(event.stackTrace||(event.initiator&&event.initiator.stackTrace)||event.invalidationTrackingEvents)
WebInspector.TimelineUIUtils._generateCauses(event,model.target(),contentHelper);fragment.appendChild(contentHelper.element);return fragment;}
WebInspector.TimelineUIUtils._generateCauses=function(event,target,contentHelper)
{var recordTypes=WebInspector.TimelineModel.RecordType;var callSiteStackLabel;var stackLabel;var initiator=event.initiator;switch(event.name){case recordTypes.TimerFire:callSiteStackLabel=WebInspector.UIString("Timer installed");break;case recordTypes.FireAnimationFrame:callSiteStackLabel=WebInspector.UIString("Animation frame requested");break;case recordTypes.RecalculateStyles:stackLabel=WebInspector.UIString("Recalculation was forced");break;case recordTypes.Layout:callSiteStackLabel=WebInspector.UIString("First layout invalidation");stackLabel=WebInspector.UIString("Layout forced");break;}
if(event.stackTrace)
contentHelper.appendStackTrace(stackLabel||WebInspector.UIString("Stack trace"),event.stackTrace);if(event.invalidationTrackingEvents){WebInspector.TimelineUIUtils._generateInvalidations(event,target,contentHelper);}else if(initiator&&initiator.stackTrace){contentHelper.appendStackTrace(callSiteStackLabel||WebInspector.UIString("First invalidated"),initiator.stackTrace);}}
WebInspector.TimelineUIUtils._generateInvalidations=function(event,target,contentHelper)
{if(!event.invalidationTrackingEvents)
return;var invalidations={};event.invalidationTrackingEvents.forEach(function(invalidation){if(!invalidations[invalidation.type])
invalidations[invalidation.type]=[invalidation];else
invalidations[invalidation.type].push(invalidation);});Object.keys(invalidations).forEach(function(type){WebInspector.TimelineUIUtils._generateInvalidationsForType(type,target,invalidations[type],contentHelper);});}
WebInspector.TimelineUIUtils._generateInvalidationsForType=function(type,target,invalidations,contentHelper)
{var title;switch(type){case WebInspector.TimelineModel.RecordType.StyleRecalcInvalidationTracking:title=WebInspector.UIString("Style invalidations");break;case WebInspector.TimelineModel.RecordType.LayoutInvalidationTracking:title=WebInspector.UIString("Layout invalidations");break;default:title=WebInspector.UIString("Other invalidations");break;}
var detailsNode=createElementWithClass("div","timeline-details-view-row");var titleElement=detailsNode.createChild("span","timeline-details-view-row-title");titleElement.textContent=WebInspector.UIString("%s: ",title);var eventsList=detailsNode.createChild("div","timeline-details-view-row-value");var invalidationGroups=groupInvalidationsByCause(invalidations);invalidationGroups.forEach(function(group){appendInvalidationGroup(eventsList,group);});contentHelper.element.appendChild(detailsNode);function groupInvalidationsByCause(invalidations)
{var causeToInvalidationMap={};for(var index=0;index<invalidations.length;index++){var invalidation=invalidations[index];var causeKey="";if(invalidation.cause.reason)
causeKey+=invalidation.cause.reason+".";if(invalidation.cause.stackTrace){invalidation.cause.stackTrace.forEach(function(stackFrame){causeKey+=stackFrame["functionName"]+".";causeKey+=stackFrame["scriptId"]+".";causeKey+=stackFrame["url"]+".";causeKey+=stackFrame["lineNumber"]+".";causeKey+=stackFrame["columnNumber"]+".";});}
if(causeToInvalidationMap[causeKey])
causeToInvalidationMap[causeKey].push(invalidation);else
causeToInvalidationMap[causeKey]=[invalidation];}
return Object.values(causeToInvalidationMap);}
function appendInvalidationGroup(parentElement,invalidations)
{if(!target)
return;var row=parentElement.createChild("div","invalidations-group section");var header=row.createChild("div","header");header.addEventListener("click",function(){toggleDetails(header,invalidations);});var first=invalidations[0];var reason=first.cause.reason;var topFrame=first.cause.stackTrace&&first.cause.stackTrace[0];if(reason)
header.createTextChild(WebInspector.UIString("%s for ",reason));else
header.createTextChild(WebInspector.UIString("Unknown cause for "));appendTruncatedNodeList(header,invalidations);if(topFrame&&contentHelper.linkifier()){header.createTextChild(WebInspector.UIString(". "));var stack=header.createChild("span","monospace");stack.createChild("span").textContent=WebInspector.beautifyFunctionName(topFrame.functionName);stack.createChild("span").textContent=" @ ";stack.createChild("span").appendChild(contentHelper.linkifier().linkifyConsoleCallFrame(target,topFrame));}}
function createInvalidationNode(invalidation,showUnknownNodes)
{var node=contentHelper.nodeForBackendId(invalidation.nodeId);if(node)
return WebInspector.DOMPresentationUtils.linkifyNodeReference(node);if(invalidation.nodeName){var nodeSpan=createElement("span");nodeSpan.textContent=WebInspector.UIString("[ %s ]",invalidation.nodeName);return nodeSpan;}
if(showUnknownNodes){var nodeSpan=createElement("span");return nodeSpan.createTextChild(WebInspector.UIString("[ unknown node ]"));}}
function appendTruncatedNodeList(parentElement,invalidations)
{var invalidationNodes=[];var invalidationNodeIdMap={};for(var i=0;i<invalidations.length;i++){var invalidation=invalidations[i];var invalidationNode=createInvalidationNode(invalidation,false);if(invalidationNode&&!invalidationNodeIdMap[invalidation.nodeId]){invalidationNodes.push(invalidationNode);invalidationNodeIdMap[invalidation.nodeId]=true;}}
if(invalidationNodes.length===1){parentElement.appendChild(invalidationNodes[0]);}else if(invalidationNodes.length===2){parentElement.appendChild(invalidationNodes[0]);parentElement.createTextChild(WebInspector.UIString(" and "));parentElement.appendChild(invalidationNodes[1]);}else if(invalidationNodes.length>=3){parentElement.appendChild(invalidationNodes[0]);parentElement.createTextChild(WebInspector.UIString(", "));parentElement.appendChild(invalidationNodes[1]);parentElement.createTextChild(WebInspector.UIString(", and %s others",invalidationNodes.length-2));}}
function toggleDetails(header,invalidations)
{var wasExpanded=header.classList.contains("expanded");header.classList.toggle("expanded",!wasExpanded);header.parentElement.classList.toggle("expanded",!wasExpanded);if(wasExpanded){var content=header.nextElementSibling;if(content)
content.remove();}else{createInvalidationGroupDetails(header.parentElement,invalidations);}}
function createInvalidationGroupDetails(parentElement,invalidations)
{var content=parentElement.createChild("div","content");var first=invalidations[0];if(first.cause.stackTrace){var stack=content.createChild("div");stack.createTextChild(WebInspector.UIString("Stack trace:"));contentHelper.createChildStackTraceElement(stack,first.cause.stackTrace);}
content.createTextChild(invalidations.length>1?WebInspector.UIString("Nodes:"):WebInspector.UIString("Node:"));var nodeList=content.createChild("div","node-list timeline-details-view-row-stack-trace");appendDetailedNodeList(nodeList,invalidations);}
function appendDetailedNodeList(parentElement,invalidations)
{var firstNode=true;for(var i=0;i<invalidations.length;i++){var invalidation=invalidations[i];var invalidationNode=createInvalidationNode(invalidation,true);if(invalidationNode){if(!firstNode)
parentElement.createTextChild(WebInspector.UIString(", "));firstNode=false;parentElement.appendChild(invalidationNode);var extraData=invalidation.extraData?", "+invalidation.extraData:"";if(invalidation.changedId){parentElement.createTextChild(WebInspector.UIString("(changed id to \"%s\"%s)",invalidation.changedId,extraData));}else if(invalidation.changedClass){parentElement.createTextChild(WebInspector.UIString("(changed class to \"%s\"%s)",invalidation.changedClass,extraData));}else if(invalidation.changedAttribute){parentElement.createTextChild(WebInspector.UIString("(changed attribute to \"%s\"%s)",invalidation.changedAttribute,extraData));}else if(invalidation.changedPseudo){parentElement.createTextChild(WebInspector.UIString("(changed pesudo to \"%s\"%s)",invalidation.changedPseudo,extraData));}else if(invalidation.selectorPart){parentElement.createTextChild(WebInspector.UIString("(changed \"%s\"%s)",invalidation.selectorPart,extraData));}}}}}
WebInspector.TimelineUIUtils._collectInvalidationNodeIds=function(nodeIds,invalidations)
{for(var i=0;i<invalidations.length;++i){if(invalidations[i].nodeId)
nodeIds.add(invalidations[i].nodeId);}}
WebInspector.TimelineUIUtils.aggregateTimeForRecord=function(total,record)
{var traceEvent=record.traceEvent();var model=record.timelineModel();WebInspector.TimelineUIUtils._aggregatedStatsForTraceEvent(total,model,traceEvent);}
WebInspector.TimelineUIUtils._aggregatedStatsForTraceEvent=function(total,model,event)
{var events=model.inspectedTargetEvents();function eventComparator(startTime,e)
{return startTime-e.startTime;}
var index=events.binaryIndexOf(event.startTime,eventComparator);if(index<0)
return false;var hasChildren=false;var endTime=event.endTime;if(endTime){for(var i=index;i<events.length;i++){var nextEvent=events[i];if(nextEvent.startTime>=endTime)
break;if(!nextEvent.selfTime)
continue;if(nextEvent.thread!==event.thread)
continue;if(i>index)
hasChildren=true;var categoryName=WebInspector.TimelineUIUtils.eventStyle(nextEvent).category.name;total[categoryName]=(total[categoryName]||0)+nextEvent.selfTime;}}
if(WebInspector.TracingModel.isAsyncPhase(event.phase)){if(event.endTime){var aggregatedTotal=0;for(var categoryName in total)
aggregatedTotal+=total[categoryName];total["idle"]=Math.max(0,event.endTime-event.startTime-aggregatedTotal);}
return false;}
return hasChildren;}
WebInspector.TimelineUIUtils.buildPicturePreviewContent=function(event,target,callback)
{new WebInspector.LayerPaintEvent(event,target).loadSnapshot(onSnapshotLoaded);function onSnapshotLoaded(rect,snapshot)
{if(!snapshot){callback();return;}
snapshot.requestImage(null,null,1,onGotImage);snapshot.dispose();}
function onGotImage(imageURL)
{if(!imageURL){callback();return;}
var container=createElement("div");container.classList.add("image-preview-container","vbox","link");var img=container.createChild("img");img.src=imageURL;var paintProfilerButton=container.createChild("a");paintProfilerButton.textContent=WebInspector.UIString("Paint Profiler");container.addEventListener("click",showPaintProfiler,false);callback(container);}
function showPaintProfiler()
{WebInspector.TimelinePanel.instance().select(WebInspector.TimelineSelection.fromTraceEvent(event),WebInspector.TimelinePanel.DetailsTab.PaintProfiler);}}
WebInspector.TimelineUIUtils.createEventDivider=function(recordType,title,position)
{var eventDivider=createElement("div");eventDivider.className="resources-event-divider";var recordTypes=WebInspector.TimelineModel.RecordType;if(recordType===recordTypes.MarkDOMContent)
eventDivider.className+=" resources-blue-divider";else if(recordType===recordTypes.MarkLoad)
eventDivider.className+=" resources-red-divider";else if(recordType===recordTypes.MarkFirstPaint)
eventDivider.className+=" resources-green-divider";else if(recordType===recordTypes.TimeStamp||recordType===recordTypes.ConsoleTime)
eventDivider.className+=" resources-orange-divider";else if(recordType===recordTypes.BeginFrame)
eventDivider.className+=" timeline-frame-divider";if(title)
eventDivider.title=title;eventDivider.style.left=position+"px";return eventDivider;}
WebInspector.TimelineUIUtils.createDividerForRecord=function(record,position)
{var startTime=Number.millisToString(record.startTime()-record.timelineModel().minimumRecordTime());var title=WebInspector.UIString("%s at %s",WebInspector.TimelineUIUtils.eventTitle(record.traceEvent()),startTime);return WebInspector.TimelineUIUtils.createEventDivider(record.type(),title,position);}
WebInspector.TimelineUIUtils._visibleTypes=function()
{var eventStyles=WebInspector.TimelineUIUtils._initEventStyles();var result=[];for(var name in eventStyles){if(!eventStyles[name].hidden)
result.push(name);}
return result;}
WebInspector.TimelineUIUtils.visibleRecordsFilter=function()
{return new WebInspector.TimelineVisibleRecordsFilter(WebInspector.TimelineUIUtils._visibleTypes());}
WebInspector.TimelineUIUtils.hiddenEventsFilter=function()
{return new WebInspector.InclusiveTraceEventNameFilter(WebInspector.TimelineUIUtils._visibleTypes());}
WebInspector.TimelineUIUtils.categories=function()
{if(WebInspector.TimelineUIUtils._categories)
return WebInspector.TimelineUIUtils._categories;WebInspector.TimelineUIUtils._categories={loading:new WebInspector.TimelineCategory("loading",WebInspector.UIString("Loading"),true,"hsl(214, 53%, 58%)","hsl(214, 67%, 90%)","hsl(214, 67%, 74%)","hsl(214, 67%, 66%)"),scripting:new WebInspector.TimelineCategory("scripting",WebInspector.UIString("Scripting"),true,"hsl(43, 90%, 45%)","hsl(43, 83%, 90%)","hsl(43, 83%, 72%)","hsl(43, 83%, 64%) "),rendering:new WebInspector.TimelineCategory("rendering",WebInspector.UIString("Rendering"),true,"hsl(256, 50%, 60%)","hsl(256, 67%, 90%)","hsl(256, 67%, 76%)","hsl(256, 67%, 70%)"),painting:new WebInspector.TimelineCategory("painting",WebInspector.UIString("Painting"),true,"hsl(109, 33%, 47%)","hsl(109, 33%, 90%)","hsl(109, 33%, 64%)","hsl(109, 33%, 55%)"),gpu:new WebInspector.TimelineCategory("gpu",WebInspector.UIString("GPU"),false,"hsl(240, 24%, 45%)","hsl(240, 24%, 90%)","hsl(240, 24%, 73%)","hsl(240, 24%, 66%)"),other:new WebInspector.TimelineCategory("other",WebInspector.UIString("Other"),false,"hsl(0, 0%, 73%)","hsl(0, 0%, 90%)","hsl(0, 0%, 87%)","hsl(0, 0%, 79%)"),idle:new WebInspector.TimelineCategory("idle",WebInspector.UIString("Idle"),false,"hsl(0, 0%, 87%)","hsl(0, 100%, 100%)","hsl(0, 100%, 100%)","hsl(0, 100%, 100%)")};return WebInspector.TimelineUIUtils._categories;};WebInspector.AsyncEventGroup=function(title)
{this.title=title;}
WebInspector.TimelineUIUtils.asyncEventGroups=function()
{if(WebInspector.TimelineUIUtils._asyncEventGroups)
return WebInspector.TimelineUIUtils._asyncEventGroups;WebInspector.TimelineUIUtils._asyncEventGroups={console:new WebInspector.AsyncEventGroup(WebInspector.UIString("Console"))};return WebInspector.TimelineUIUtils._asyncEventGroups;}
WebInspector.TimelineUIUtils.generateMainThreadBarPopupContent=function(model,info)
{var firstTaskIndex=info.firstTaskIndex;var lastTaskIndex=info.lastTaskIndex;var tasks=info.tasks;var messageCount=lastTaskIndex-firstTaskIndex+1;var cpuTime=0;for(var i=firstTaskIndex;i<=lastTaskIndex;++i){var task=tasks[i];cpuTime+=task.endTime()-task.startTime();}
var startTime=tasks[firstTaskIndex].startTime();var endTime=tasks[lastTaskIndex].endTime();var duration=endTime-startTime;var contentHelper=new WebInspector.TimelinePopupContentHelper(info.name);var durationText=WebInspector.UIString("%s (at %s)",Number.millisToString(duration,true),Number.millisToString(startTime-model.minimumRecordTime(),true));contentHelper.appendTextRow(WebInspector.UIString("Duration"),durationText);contentHelper.appendTextRow(WebInspector.UIString("CPU time"),Number.millisToString(cpuTime,true));contentHelper.appendTextRow(WebInspector.UIString("Message Count"),messageCount);return contentHelper.contentTable();}
WebInspector.TimelineUIUtils.generatePieChart=function(aggregatedStats,selfCategory,selfTime)
{var element=createElementWithClass("div","timeline-details-view-pie-chart-wrapper hbox");var total=0;for(var categoryName in aggregatedStats)
total+=aggregatedStats[categoryName];function formatter(value)
{return Number.millisToString(value,true);}
var pieChart=new WebInspector.PieChart(100,formatter);pieChart.element.classList.add("timeline-details-view-pie-chart");pieChart.setTotal(total);element.appendChild(pieChart.element);var footerElement=element.createChild("div","timeline-aggregated-info timeline-aggregated-info-legend");var rowElement=footerElement.createChild("div");rowElement.createTextChild(formatter(total));if(selfCategory){if(selfTime){pieChart.addSlice(selfTime,selfCategory.fillColorStop1);rowElement=footerElement.createChild("div");rowElement.createChild("div","timeline-aggregated-category timeline-"+selfCategory.name);rowElement.createTextChild(WebInspector.UIString("%s %s (Self)",formatter(selfTime),selfCategory.title));}
var categoryTime=aggregatedStats[selfCategory.name];var value=categoryTime-selfTime;if(value>0){pieChart.addSlice(value,selfCategory.fillColorStop0);rowElement=footerElement.createChild("div");rowElement.createChild("div","timeline-aggregated-category timeline-"+selfCategory.name);rowElement.createTextChild(WebInspector.UIString("%s %s (Children)",formatter(value),selfCategory.title));}}
for(var categoryName in WebInspector.TimelineUIUtils.categories()){var category=WebInspector.TimelineUIUtils.categories()[categoryName];if(category===selfCategory)
continue;var value=aggregatedStats[category.name];if(!value)
continue;pieChart.addSlice(value,category.fillColorStop0);rowElement=footerElement.createChild("div");rowElement.createChild("div","timeline-aggregated-category timeline-"+category.name);rowElement.createTextChild(WebInspector.UIString("%s %s",formatter(value),category.title));}
return element;}
WebInspector.TimelineUIUtils.generateDetailsContentForFrame=function(frameModel,frame)
{var durationInMillis=frame.endTime-frame.startTime;var durationText=WebInspector.UIString("%s (at %s)",Number.millisToString(frame.endTime-frame.startTime,true),Number.millisToString(frame.startTimeOffset,true));var pieChart=WebInspector.TimelineUIUtils.generatePieChart(frame.timeByCategory);var contentHelper=new WebInspector.TimelineDetailsContentHelper(null,null,null,true);contentHelper.appendTextRow(WebInspector.UIString("Duration"),durationText);contentHelper.appendTextRow(WebInspector.UIString("FPS"),Math.floor(1000/durationInMillis));contentHelper.appendTextRow(WebInspector.UIString("CPU time"),Number.millisToString(frame.cpuTime,true));contentHelper.appendElementRow(WebInspector.UIString("Aggregated Time"),pieChart);if(Runtime.experiments.isEnabled("layersPanel")&&frame.layerTree){contentHelper.appendElementRow(WebInspector.UIString("Layer tree"),WebInspector.Linkifier.linkifyUsingRevealer(frame.layerTree,WebInspector.UIString("show")));}
return contentHelper.element;}
WebInspector.TimelineUIUtils.createFillStyle=function(context,width,height,color0,color1,color2)
{var gradient=context.createLinearGradient(0,0,width,height);gradient.addColorStop(0,color0);gradient.addColorStop(0.25,color1);gradient.addColorStop(0.75,color1);gradient.addColorStop(1,color2);return gradient;}
WebInspector.TimelineUIUtils.createFillStyleForCategory=function(context,width,height,category)
{return WebInspector.TimelineUIUtils.createFillStyle(context,width,height,category.fillColorStop0,category.fillColorStop1,category.borderColor);}
WebInspector.TimelineUIUtils.createStyleRuleForCategory=function(category)
{var selector=".timeline-category-"+category.name+" .timeline-graph-bar, "+".panel.timeline .timeline-filters-header .filter-checkbox-filter.filter-checkbox-filter-"+category.name+" .checkbox-filter-checkbox, "+".timeline-details-view .timeline-"+category.name+", "+".timeline-category-"+category.name+" .timeline-tree-icon";return selector+" { background-image: linear-gradient("+
category.fillColorStop0+", "+category.fillColorStop1+" 25%, "+category.fillColorStop1+" 25%, "+category.fillColorStop1+");"+" border-color: "+category.borderColor+"}";}
WebInspector.TimelineUIUtils.quadWidth=function(quad)
{return Math.round(Math.sqrt(Math.pow(quad[0]-quad[2],2)+Math.pow(quad[1]-quad[3],2)));}
WebInspector.TimelineUIUtils.quadHeight=function(quad)
{return Math.round(Math.sqrt(Math.pow(quad[0]-quad[6],2)+Math.pow(quad[1]-quad[7],2)));}
WebInspector.TimelineUIUtils.calculateNetworkBandsCount=function(events)
{var openBands=new Set();var maxBands=0;for(var i=0;i<events.length;++i){var e=events[i];switch(e.name){case WebInspector.TimelineModel.RecordType.ResourceSendRequest:var reqId=e.args["data"]["requestId"];openBands.add(reqId);maxBands=Math.max(maxBands,openBands.size);break;case WebInspector.TimelineModel.RecordType.ResourceReceiveResponse:case WebInspector.TimelineModel.RecordType.ResourceReceivedData:case WebInspector.TimelineModel.RecordType.ResourceFinish:var reqId=e.args["data"]["requestId"];if(!openBands.has(reqId)){openBands.add(reqId);++maxBands;}
if(e.name===WebInspector.TimelineModel.RecordType.ResourceFinish)
openBands.delete(reqId);break;}}
return maxBands;}
WebInspector.TimelineUIUtils.iterateNetworkRequestsInRoundRobin=function(events,bandsCount,callback)
{var bandsInUse=new Array(bandsCount);var requestsInFlight=new Map();var lastBand=-1;var requestsWithSend=new Set();for(var i=0;i<events.length;++i){var event=events[i];switch(event.name){case WebInspector.TimelineModel.RecordType.ResourceSendRequest:var reqId=event.args["data"]["requestId"];requestsWithSend.add(reqId);break;case WebInspector.TimelineModel.RecordType.ResourceReceivedData:case WebInspector.TimelineModel.RecordType.ResourceReceiveResponse:case WebInspector.TimelineModel.RecordType.ResourceFinish:var reqId=event.args["data"]["requestId"];if(!requestsWithSend.has(reqId)){requestsWithSend.add(reqId);var reqInfo=new RequestInfo(seizeBand(),0);requestsInFlight.set(reqId,reqInfo);callback(reqInfo.band,0,0,null);}
if(event.name===WebInspector.TimelineModel.RecordType.ResourceFinish)
requestsWithSend.delete(reqId);break;}}
requestsWithSend=null;function RequestInfo(band,time)
{this.band=band;this.time=time;}
function seizeBand()
{var i=0;do{lastBand=(lastBand+1)%bandsInUse.length;console.assert(i++<bandsInUse.length);}while(bandsInUse[lastBand]);bandsInUse[lastBand]=true;return lastBand;}
function releaseBand(band)
{bandsInUse[band]=false;}
function getOrCreateRequestInfo(reqId,event,first)
{var reqInfo=requestsInFlight.get(reqId);if(!reqInfo){reqInfo=new RequestInfo(seizeBand(),event.startTime);requestsInFlight.set(reqId,reqInfo);if(!first)
callback(reqInfo.band,0,event.startTime,event);}
return reqInfo;}
for(var i=0;i<events.length;++i){var event=events[i];switch(event.name){case WebInspector.TimelineModel.RecordType.ResourceSendRequest:var reqId=event.args["data"]["requestId"];var reqInfo=getOrCreateRequestInfo(reqId,event,true);callback(reqInfo.band,reqInfo.time,event.startTime,event);break;case WebInspector.TimelineModel.RecordType.ResourceReceivedData:case WebInspector.TimelineModel.RecordType.ResourceReceiveResponse:case WebInspector.TimelineModel.RecordType.ResourceFinish:var reqId=event.args["data"]["requestId"];var reqInfo=getOrCreateRequestInfo(reqId,event,false);callback(reqInfo.band,reqInfo.time,event.startTime,event);if(event.name===WebInspector.TimelineModel.RecordType.ResourceFinish){releaseBand(reqInfo.band);requestsInFlight.delete(reqId);}else{reqInfo.time=event.startTime;}
break;}}
for(var reqInfo of requestsInFlight.values())
callback(reqInfo.band,reqInfo.time,Infinity,null);}
WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor=function(priority,color,eventTypes)
{this.priority=priority;this.color=color;this.eventTypes=eventTypes;}
WebInspector.TimelineUIUtils.eventDispatchDesciptors=function()
{if(WebInspector.TimelineUIUtils._eventDispatchDesciptors)
return WebInspector.TimelineUIUtils._eventDispatchDesciptors;var lightOrange="hsl(40,100%,80%)";var orange="hsl(40,100%,50%)";var green="hsl(90,100%,40%)";var purple="hsl(256,100%,75%)";WebInspector.TimelineUIUtils._eventDispatchDesciptors=[new WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor(1,lightOrange,["mousemove","mouseenter","mouseleave","mouseout","mouseover"]),new WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor(2,green,["wheel"]),new WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor(3,orange,["click","mousedown","mouseup"]),new WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor(3,orange,["touchstart","touchend","touchmove","touchcancel"]),new WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor(3,purple,["keydown","keyup","keypress"])];return WebInspector.TimelineUIUtils._eventDispatchDesciptors;}
WebInspector.TimelineCategory=function(name,title,visible,borderColor,backgroundColor,fillColorStop0,fillColorStop1)
{this.name=name;this.title=title;this.visible=visible;this.borderColor=borderColor;this.backgroundColor=backgroundColor;this.fillColorStop0=fillColorStop0;this.fillColorStop1=fillColorStop1;this.hidden=false;}
WebInspector.TimelineCategory.Events={VisibilityChanged:"VisibilityChanged"};WebInspector.TimelineCategory.prototype={get hidden()
{return this._hidden;},set hidden(hidden)
{this._hidden=hidden;this.dispatchEventToListeners(WebInspector.TimelineCategory.Events.VisibilityChanged,this);},__proto__:WebInspector.Object.prototype}
WebInspector.TimelineMarkerStyle;WebInspector.TimelineUIUtils.markerStyleForEvent=function(event)
{var red="rgb(255, 0, 0)";var blue="rgb(0, 0, 255)";var orange="rgb(255, 178, 23)";var green="rgb(0, 130, 0)";var tallMarkerDashStyle=[10,5];var title=WebInspector.TimelineUIUtils.eventTitle(event)
if(event.category===WebInspector.TracingModel.ConsoleEventCategory){return{title:title,dashStyle:tallMarkerDashStyle,lineWidth:0.5,color:orange,tall:false,lowPriority:false,};}
var recordTypes=WebInspector.TimelineModel.RecordType;var tall=false;var color=green;switch(event.name){case recordTypes.MarkDOMContent:color=blue;tall=true;break;case recordTypes.MarkLoad:color=red;tall=true;break;case recordTypes.MarkFirstPaint:color=green;tall=true;break;case recordTypes.TimeStamp:color=orange;break;}
return{title:title,dashStyle:tallMarkerDashStyle,lineWidth:0.5,color:color,tall:tall,lowPriority:false,};}
WebInspector.TimelineUIUtils.markerStyleForFrame=function()
{return{title:WebInspector.UIString("Frame"),color:"rgba(100, 100, 100, 0.4)",lineWidth:3,dashStyle:[3],tall:true,lowPriority:true};}
WebInspector.TimelinePopupContentHelper=function(title)
{this._contentTable=createElement("table");var titleCell=this._createCell(WebInspector.UIString("%s - Details",title),"timeline-details-title");titleCell.colSpan=2;var titleRow=createElement("tr");titleRow.appendChild(titleCell);this._contentTable.appendChild(titleRow);}
WebInspector.TimelinePopupContentHelper.prototype={contentTable:function()
{return this._contentTable;},_createCell:function(content,styleName)
{var text=createElement("label");text.createTextChild(String(content));var cell=createElement("td");cell.className="timeline-details";if(styleName)
cell.className+=" "+styleName;cell.textContent=content;return cell;},appendTextRow:function(title,content)
{var row=createElement("tr");row.appendChild(this._createCell(title,"timeline-details-row-title"));row.appendChild(this._createCell(content,"timeline-details-row-data"));this._contentTable.appendChild(row);},appendElementRow:function(title,content)
{var row=createElement("tr");var titleCell=this._createCell(title,"timeline-details-row-title");row.appendChild(titleCell);var cell=createElement("td");cell.className="details";if(content instanceof Node)
cell.appendChild(content);else
cell.createTextChild(content||"");row.appendChild(cell);this._contentTable.appendChild(row);}}
WebInspector.TimelineDetailsContentHelper=function(target,linkifier,relatedNodesMap,monospaceValues)
{this._linkifier=linkifier;this._target=target;this._relatedNodesMap=relatedNodesMap;this.element=createElement("div");this.element.className="timeline-details-view-block";this._monospaceValues=monospaceValues;}
WebInspector.TimelineDetailsContentHelper.prototype={linkifier:function()
{return this._linkifier;},nodeForBackendId:function(backendNodeId)
{if(!backendNodeId||!this._relatedNodesMap)
return null;return this._relatedNodesMap.get(backendNodeId)||null;},appendTextRow:function(title,value)
{var rowElement=this.element.createChild("div","timeline-details-view-row");rowElement.createChild("div","timeline-details-view-row-title").textContent=title;rowElement.createChild("div","timeline-details-view-row-value"+(this._monospaceValues?" monospace":"")).textContent=value;},appendElementRow:function(title,content)
{var rowElement=this.element.createChild("div","timeline-details-view-row");rowElement.createChild("div","timeline-details-view-row-title").textContent=title;var valueElement=rowElement.createChild("div","timeline-details-view-row-value timeline-details-view-row-details"+(this._monospaceValues?" monospace":""));if(content instanceof Node)
valueElement.appendChild(content);else
valueElement.createTextChild(content||"");},appendLocationRow:function(title,url,line)
{if(!this._linkifier||!this._target)
return;this.appendElementRow(title,this._linkifier.linkifyScriptLocation(this._target,null,url,line-1)||"");},appendStackTrace:function(title,stackTrace)
{if(!this._linkifier||!this._target)
return;var rowElement=this.element.createChild("div","timeline-details-view-row");rowElement.createChild("div","timeline-details-view-row-title").textContent=title;this.createChildStackTraceElement(rowElement,stackTrace);},createChildStackTraceElement:function(parentElement,stackTrace)
{if(!this._linkifier||!this._target)
return;var stackTraceElement=parentElement.createChild("div","timeline-details-view-row-value timeline-details-view-row-stack-trace monospace");var callFrameElem=WebInspector.DOMPresentationUtils.buildStackTracePreviewContents(this._target,this._linkifier,stackTrace);stackTraceElement.appendChild(callFrameElem);}};WebInspector.TimelineView=function(delegate,model)
{WebInspector.VBox.call(this);this.element.classList.add("timeline-view");this._delegate=delegate;this._model=model;this._presentationModel=new WebInspector.TimelinePresentationModel(model);this._calculator=new WebInspector.TimelineCalculator(model);this._linkifier=new WebInspector.Linkifier();this._frameStripByFrame=new Map();this._boundariesAreValid=true;this._scrollTop=0;this._recordsView=this._createRecordsView();this._recordsView.addEventListener(WebInspector.SplitView.Events.SidebarSizeChanged,this._sidebarResized,this);this._topGapElement=this.element.createChild("div","timeline-gap");this._recordsView.show(this.element);this._bottomGapElement=this.element.createChild("div","timeline-gap");this._headerElement=this.element.createChild("div","fill");this._headerElement.id="timeline-graph-records-header";this._cpuBarsElement=this._headerElement.createChild("div","timeline-utilization-strip");if(Runtime.experiments.isEnabled("gpuTimeline"))
this._gpuBarsElement=this._headerElement.createChild("div","timeline-utilization-strip gpu");this._popoverHelper=new WebInspector.PopoverHelper(this.element,this._getPopoverAnchor.bind(this),this._showPopover.bind(this));this.element.addEventListener("mousemove",this._mouseMove.bind(this),false);this.element.addEventListener("mouseleave",this._mouseLeave.bind(this),false);this.element.addEventListener("keydown",this._keyDown.bind(this),false);this._expandOffset=15;}
WebInspector.TimelineView.prototype={setFrameModel:function(frameModel)
{this._frameModel=frameModel;},_createRecordsView:function()
{this._containerElement=this.element;this._containerElement.tabIndex=0;this._containerElement.id="timeline-container";this._containerElement.addEventListener("scroll",this._onScroll.bind(this),false);var recordsView=new WebInspector.SplitView(true,false,"timelinePanelRecorsSplitViewState");recordsView.element.style.flex="1 0 auto";var sidebarView=new WebInspector.VBox();sidebarView.element.createChild("div","timeline-records-title").textContent=WebInspector.UIString("RECORDS");recordsView.setSidebarView(sidebarView);this._sidebarListElement=sidebarView.element.createChild("div","timeline-records-list");this._gridContainer=new WebInspector.VBoxWithResizeCallback(this._onViewportResize.bind(this));this._gridContainer.element.id="resources-container-content";recordsView.setMainView(this._gridContainer);this._timelineGrid=new WebInspector.TimelineGrid();this._gridContainer.element.appendChild(this._timelineGrid.element);this._itemsGraphsElement=this._gridContainer.element.createChild("div");this._itemsGraphsElement.id="timeline-graphs";this._graphRowsElement=this._itemsGraphsElement.createChild("div");this._expandElements=this._itemsGraphsElement.createChild("div");this._expandElements.id="orphan-expand-elements";return recordsView;},_rootRecord:function()
{return this._presentationModel.rootRecord();},_updateEventDividers:function()
{this._timelineGrid.removeEventDividers();var clientWidth=this._graphRowsElementWidth;var dividers=new Map();var eventDividerRecords=this._model.eventDividerRecords();for(var i=0;i<eventDividerRecords.length;++i){var record=eventDividerRecords[i];var position=this._calculator.computePosition(record.startTime());var dividerPosition=Math.round(position);if(dividerPosition<0||dividerPosition>=clientWidth||dividers.has(dividerPosition))
continue;dividers.set(dividerPosition,WebInspector.TimelineUIUtils.createDividerForRecord(record,dividerPosition));}
this._timelineGrid.addEventDividers(dividers.valuesArray());},_updateFrameBars:function(frames)
{if(this._frameContainer){this._frameContainer.removeChildren();}else{const frameContainerBorderWidth=1;this._frameContainer=createElementWithClass("div","fill timeline-frame-container");this._frameContainer.style.height=WebInspector.TimelinePanel.rowHeight+frameContainerBorderWidth+"px";this._frameContainer.addEventListener("dblclick",this._onFrameDoubleClicked.bind(this),false);this._frameContainer.addEventListener("click",this._onFrameClicked.bind(this),false);}
this._frameStripByFrame.clear();var dividers=[];for(var i=0;i<frames.length;++i){var frame=frames[i];var frameStart=this._calculator.computePosition(frame.startTime);var frameEnd=this._calculator.computePosition(frame.endTime);var frameStrip=createElementWithClass("div","timeline-frame-strip");var actualStart=Math.max(frameStart,0);var width=frameEnd-actualStart;frameStrip.style.left=actualStart+"px";frameStrip.style.width=width+"px";frameStrip._frame=frame;this._frameStripByFrame.set(frame,frameStrip);const minWidthForFrameInfo=60;if(width>minWidthForFrameInfo)
frameStrip.textContent=Number.millisToString(frame.endTime-frame.startTime,true);this._frameContainer.appendChild(frameStrip);if(actualStart>0)
dividers.push(WebInspector.TimelineUIUtils.createEventDivider(WebInspector.TimelineModel.RecordType.BeginFrame,WebInspector.UIString("Frame"),frameStart));}
this._timelineGrid.addEventDividers(dividers);this._headerElement.appendChild(this._frameContainer);},_onFrameDoubleClicked:function(event)
{var frameBar=event.target.enclosingNodeOrSelfWithClass("timeline-frame-strip");if(!frameBar)
return;this._delegate.requestWindowTimes(frameBar._frame.startTime,frameBar._frame.endTime);},_onFrameClicked:function(event)
{var frameBar=event.target.enclosingNodeOrSelfWithClass("timeline-frame-strip");if(!frameBar)
return;this._delegate.select(WebInspector.TimelineSelection.fromFrame(frameBar._frame));},setSidebarSize:function(width)
{this._recordsView.setSidebarSize(width);},_sidebarResized:function(event)
{this.dispatchEventToListeners(WebInspector.SplitView.Events.SidebarSizeChanged,event.data);},_onViewportResize:function()
{this._resize(this._recordsView.sidebarSize());},_resize:function(sidebarWidth)
{this._closeRecordDetails();this._graphRowsElementWidth=this._graphRowsElement.offsetWidth;this._headerElement.style.left=sidebarWidth+"px";this._headerElement.style.width=this._itemsGraphsElement.offsetWidth+"px";this._scheduleRefresh(false,true);},_resetView:function()
{this._windowStartTime=0;this._windowEndTime=0;this._boundariesAreValid=false;this._adjustScrollPosition(0);this._linkifier.reset();this._closeRecordDetails();this._automaticallySizeWindow=true;this._presentationModel.reset();},view:function()
{return this;},dispose:function()
{},reset:function()
{this._resetView();this._invalidateAndScheduleRefresh(true,true);},elementsToRestoreScrollPositionsFor:function()
{return[this._containerElement];},refreshRecords:function(textFilter)
{this._automaticallySizeWindow=false;this._presentationModel.setTextFilter(textFilter);this._invalidateAndScheduleRefresh(false,true);},willHide:function()
{this._closeRecordDetails();WebInspector.View.prototype.willHide.call(this);},_onScroll:function(event)
{this._closeRecordDetails();this._scrollTop=this._containerElement.scrollTop;this._headerElement.style.top=this._scrollTop+"px";this._scheduleRefresh(true,true);},_invalidateAndScheduleRefresh:function(preserveBoundaries,userGesture)
{this._presentationModel.invalidateFilteredRecords();this._scheduleRefresh(preserveBoundaries,userGesture);},_clearSelection:function()
{this._delegate.select(null);},_selectRecord:function(presentationRecord)
{if(presentationRecord.coalesced()){this._innerSetSelectedRecord(presentationRecord);var aggregatedStats={};var presentationChildren=presentationRecord.presentationChildren();for(var i=0;i<presentationChildren.length;++i)
WebInspector.TimelineUIUtils.aggregateTimeForRecord(aggregatedStats,presentationChildren[i].record());var idle=presentationRecord.endTime()-presentationRecord.startTime();for(var category in aggregatedStats)
idle-=aggregatedStats[category];aggregatedStats["idle"]=idle;var contentHelper=new WebInspector.TimelineDetailsContentHelper(null,null,null,true);var pieChart=WebInspector.TimelineUIUtils.generatePieChart(aggregatedStats);var title=WebInspector.TimelineUIUtils.eventTitle(presentationRecord.record().traceEvent());contentHelper.appendTextRow(WebInspector.UIString("Type"),title);contentHelper.appendElementRow(WebInspector.UIString("Aggregated Time"),pieChart);this._delegate.showInDetails(contentHelper.element);return;}
this._delegate.select(WebInspector.TimelineSelection.fromRecord(presentationRecord.record()));},setSelection:function(selection)
{if(!selection){this._innerSetSelectedRecord(null);this._setSelectedFrame(null);return;}
if(selection.type()===WebInspector.TimelineSelection.Type.Record){var record=(selection.object());this._innerSetSelectedRecord(this._presentationModel.toPresentationRecord(record));this._setSelectedFrame(null);}else if(selection.type()===WebInspector.TimelineSelection.Type.Frame){var frame=(selection.object());this._innerSetSelectedRecord(null);this._setSelectedFrame(frame);}},_innerSetSelectedRecord:function(presentationRecord)
{if(presentationRecord===this._lastSelectedRecord)
return;if(this._lastSelectedRecord){if(this._lastSelectedRecord.listRow())
this._lastSelectedRecord.listRow().renderAsSelected(false);if(this._lastSelectedRecord.graphRow())
this._lastSelectedRecord.graphRow().renderAsSelected(false);}
this._lastSelectedRecord=presentationRecord;if(!presentationRecord)
return;this._innerRevealRecord(presentationRecord);if(presentationRecord.listRow())
presentationRecord.listRow().renderAsSelected(true);if(presentationRecord.graphRow())
presentationRecord.graphRow().renderAsSelected(true);},_setSelectedFrame:function(frame)
{if(this._lastSelectedFrame===frame)
return;var oldStripElement=this._lastSelectedFrame&&this._frameStripByFrame.get(this._lastSelectedFrame);if(oldStripElement)
oldStripElement.classList.remove("selected");var newStripElement=frame&&this._frameStripByFrame.get(frame);if(newStripElement)
newStripElement.classList.add("selected");this._lastSelectedFrame=frame;},setWindowTimes:function(startTime,endTime)
{this._windowStartTime=startTime;this._windowEndTime=endTime;this._presentationModel.setWindowTimes(startTime,endTime);this._automaticallySizeWindow=false;this._invalidateAndScheduleRefresh(false,true);this._clearSelection();},_scheduleRefresh:function(preserveBoundaries,userGesture)
{this._closeRecordDetails();this._boundariesAreValid&=preserveBoundaries;if(!this.isShowing())
return;if(preserveBoundaries||userGesture)
this._refresh();else{if(!this._refreshTimeout)
this._refreshTimeout=setTimeout(this._refresh.bind(this),300);}},_refresh:function()
{if(this._refreshTimeout){clearTimeout(this._refreshTimeout);delete this._refreshTimeout;}
var windowStartTime=this._windowStartTime||this._model.minimumRecordTime();var windowEndTime=this._windowEndTime||this._model.maximumRecordTime();this._timelinePaddingLeft=this._expandOffset;this._calculator.setWindow(windowStartTime,windowEndTime);this._calculator.setDisplayWindow(this._timelinePaddingLeft,this._graphRowsElementWidth);this._refreshRecords();if(!this._boundariesAreValid){this._updateEventDividers();if(this._frameContainer)
this._frameContainer.remove();if(this._frameModel){var frames=this._frameModel.filteredFrames(windowStartTime,windowEndTime);const maxFramesForFrameBars=30;if(frames.length&&frames.length<maxFramesForFrameBars){this._timelineGrid.removeDividers();this._updateFrameBars(frames);}else{this._timelineGrid.updateDividers(this._calculator);}}else
this._timelineGrid.updateDividers(this._calculator);this._refreshAllUtilizationBars();}
this._boundariesAreValid=true;},_innerRevealRecord:function(recordToReveal)
{var needRefresh=false;for(var parent=recordToReveal.presentationParent();parent!==this._rootRecord();parent=parent.presentationParent()){if(!parent.collapsed())
continue;this._presentationModel.invalidateFilteredRecords();parent.setCollapsed(false);needRefresh=true;}
var recordsInWindow=this._presentationModel.filteredRecords();var index=recordsInWindow.indexOf(recordToReveal);console.assert(index>=0,"Failed to find record in window");var itemOffset=index*WebInspector.TimelinePanel.rowHeight;var visibleTop=this._scrollTop-WebInspector.TimelinePanel.headerHeight;var visibleBottom=visibleTop+this._containerElementHeight-WebInspector.TimelinePanel.rowHeight;if(itemOffset<visibleTop)
this._containerElement.scrollTop=itemOffset;else if(itemOffset>visibleBottom)
this._containerElement.scrollTop=itemOffset-this._containerElementHeight+WebInspector.TimelinePanel.headerHeight+WebInspector.TimelinePanel.rowHeight;else if(needRefresh)
this._refreshRecords();},_refreshRecords:function()
{this._containerElementHeight=this._containerElement.clientHeight;var recordsInWindow=this._presentationModel.filteredRecords();var visibleTop=this._scrollTop;var visibleBottom=visibleTop+this._containerElementHeight;var rowHeight=WebInspector.TimelinePanel.rowHeight;var headerHeight=WebInspector.TimelinePanel.headerHeight;var startIndex=Math.max(0,Math.min(Math.floor((visibleTop-headerHeight)/rowHeight),recordsInWindow.length-1));var endIndex=Math.min(recordsInWindow.length,Math.ceil(visibleBottom/rowHeight));var lastVisibleLine=Math.max(0,Math.floor((visibleBottom-headerHeight)/rowHeight));if(this._automaticallySizeWindow&&recordsInWindow.length>lastVisibleLine){this._automaticallySizeWindow=false;this._clearSelection();var windowStartTime=startIndex?recordsInWindow[startIndex].startTime():this._model.minimumRecordTime();var windowEndTime=recordsInWindow[Math.max(0,lastVisibleLine-1)].endTime();this._delegate.requestWindowTimes(windowStartTime,windowEndTime);recordsInWindow=this._presentationModel.filteredRecords();endIndex=Math.min(recordsInWindow.length,lastVisibleLine);}
var topGapSize=startIndex*rowHeight;this._topGapElement.style.height=topGapSize+"px";this._bottomGapElement.style.height=(recordsInWindow.length-endIndex)*rowHeight+"px";this._recordsView.element.style.height=Math.max(this._containerElementHeight,(endIndex-startIndex)*rowHeight)+"px";this._timelineGrid.setScrollTop(this._scrollTop-topGapSize);this._recordsView.onResize();var listRowElement=this._sidebarListElement.firstChild;this._itemsGraphsElement.removeChild(this._graphRowsElement);var graphRowElement=this._graphRowsElement.firstChild;var scheduleRefreshCallback=this._invalidateAndScheduleRefresh.bind(this,true,true);var selectRecordCallback=this._selectRecord.bind(this);this._itemsGraphsElement.removeChild(this._expandElements);this._expandElements.removeChildren();for(var i=0;i<endIndex;++i){var record=recordsInWindow[i];if(i<startIndex){var lastChildIndex=i+record.visibleChildrenCount();if(lastChildIndex>=startIndex&&lastChildIndex<endIndex){var expandElement=new WebInspector.TimelineExpandableElement(this._expandElements);var positions=this._calculator.computeBarGraphWindowPosition(record);expandElement._update(record,i,topGapSize,positions.left-this._expandOffset,positions.width);}}else{if(!listRowElement){listRowElement=new WebInspector.TimelineRecordListRow(this._linkifier,this._model.target(),selectRecordCallback,scheduleRefreshCallback).element;this._sidebarListElement.appendChild(listRowElement);}
if(!graphRowElement){graphRowElement=new WebInspector.TimelineRecordGraphRow(this._itemsGraphsElement,selectRecordCallback,scheduleRefreshCallback).element;this._graphRowsElement.appendChild(graphRowElement);}
listRowElement.row.update(record,visibleTop);graphRowElement.row.update(record,this._calculator,this._expandOffset,i,topGapSize);if(this._lastSelectedRecord===record){listRowElement.row.renderAsSelected(true);graphRowElement.row.renderAsSelected(true);}
listRowElement=listRowElement.nextSibling;graphRowElement=graphRowElement.nextSibling;}}
while(listRowElement){var nextElement=listRowElement.nextSibling;listRowElement.row.dispose();listRowElement=nextElement;}
while(graphRowElement){var nextElement=graphRowElement.nextSibling;graphRowElement.row.dispose();graphRowElement=nextElement;}
this._itemsGraphsElement.appendChild(this._graphRowsElement);this._itemsGraphsElement.appendChild(this._expandElements);this._adjustScrollPosition(recordsInWindow.length*rowHeight+headerHeight);return recordsInWindow.length;},_refreshAllUtilizationBars:function()
{this._refreshUtilizationBars(WebInspector.UIString("CPU"),this._model.mainThreadTasks(),this._cpuBarsElement);if(Runtime.experiments.isEnabled("gpuTimeline"))
this._refreshUtilizationBars(WebInspector.UIString("GPU"),this._model.gpuTasks(),this._gpuBarsElement);},_refreshUtilizationBars:function(name,tasks,container)
{if(!container)
return;const barOffset=3;const minGap=3;var minWidth=WebInspector.TimelineCalculator._minWidth;var widthAdjustment=minWidth/2;var width=this._graphRowsElementWidth;var boundarySpan=this._windowEndTime-this._windowStartTime;var scale=boundarySpan/(width-minWidth-this._timelinePaddingLeft);var startTime=(this._windowStartTime-this._timelinePaddingLeft*scale);var endTime=startTime+width*scale;function compareEndTime(value,task)
{return value<task.endTime()?-1:1;}
var taskIndex=insertionIndexForObjectInListSortedByFunction(startTime,tasks,compareEndTime);var foreignStyle="gpu-task-foreign";var element=(container.firstChild);var lastElement;var lastLeft;var lastRight;for(;taskIndex<tasks.length;++taskIndex){var task=tasks[taskIndex];if(task.startTime()>endTime)
break;var left=Math.max(0,this._calculator.computePosition(task.startTime())+barOffset-widthAdjustment);var right=Math.min(width,this._calculator.computePosition(task.endTime()||0)+barOffset+widthAdjustment);if(lastElement){var gap=Math.floor(left)-Math.ceil(lastRight);if(gap<minGap){if(!task.data["foreign"])
lastElement.classList.remove(foreignStyle);lastRight=right;lastElement._tasksInfo.lastTaskIndex=taskIndex;continue;}
lastElement.style.width=(lastRight-lastLeft)+"px";}
if(!element)
element=container.createChild("div","timeline-graph-bar");element.style.left=left+"px";element._tasksInfo={name:name,tasks:tasks,firstTaskIndex:taskIndex,lastTaskIndex:taskIndex};if(task.data["foreign"])
element.classList.add(foreignStyle);lastLeft=left;lastRight=right;lastElement=element;element=(element.nextSibling);}
if(lastElement)
lastElement.style.width=(lastRight-lastLeft)+"px";while(element){var nextElement=element.nextSibling;element._tasksInfo=null;container.removeChild(element);element=nextElement;}},_adjustScrollPosition:function(totalHeight)
{if((this._scrollTop+this._containerElementHeight)>totalHeight+1)
this._containerElement.scrollTop=(totalHeight-this._containerElement.offsetHeight);},_getPopoverAnchor:function(element,event)
{var anchor=element.enclosingNodeOrSelfWithClass("timeline-graph-bar");if(anchor&&anchor._tasksInfo)
return anchor;},_mouseLeave:function()
{this._hideQuadHighlight();},_mouseMove:function(e)
{var rowElement=e.target.enclosingNodeOrSelfWithClass("timeline-tree-item");if(!this._highlightQuad(rowElement))
this._hideQuadHighlight();var taskBarElement=e.target.enclosingNodeOrSelfWithClass("timeline-graph-bar");if(taskBarElement&&taskBarElement._tasksInfo){var offset=taskBarElement.offsetLeft;this._timelineGrid.showCurtains(offset>=0?offset:0,taskBarElement.offsetWidth);}else
this._timelineGrid.hideCurtains();},_keyDown:function(event)
{if(!this._lastSelectedRecord||event.shiftKey||event.metaKey||event.ctrlKey)
return;var record=this._lastSelectedRecord;var recordsInWindow=this._presentationModel.filteredRecords();var index=recordsInWindow.indexOf(record);var recordsInPage=Math.floor(this._containerElementHeight/WebInspector.TimelinePanel.rowHeight);var rowHeight=WebInspector.TimelinePanel.rowHeight;if(index===-1)
index=0;switch(event.keyIdentifier){case"Left":if(record.presentationParent()){if((!record.expandable()||record.collapsed())&&record.presentationParent()!==this._presentationModel.rootRecord()){this._selectRecord(record.presentationParent());}else{record.setCollapsed(true);this._invalidateAndScheduleRefresh(true,true);}}
event.consume(true);break;case"Up":if(--index<0)
break;this._selectRecord(recordsInWindow[index]);event.consume(true);break;case"Right":if(record.expandable()&&record.collapsed()){record.setCollapsed(false);this._invalidateAndScheduleRefresh(true,true);}else{if(++index>=recordsInWindow.length)
break;this._selectRecord(recordsInWindow[index]);}
event.consume(true);break;case"Down":if(++index>=recordsInWindow.length)
break;this._selectRecord(recordsInWindow[index]);event.consume(true);break;case"PageUp":index=Math.max(0,index-recordsInPage);this._scrollTop=Math.max(0,this._scrollTop-recordsInPage*rowHeight);this._containerElement.scrollTop=this._scrollTop;this._selectRecord(recordsInWindow[index]);event.consume(true);break;case"PageDown":index=Math.min(recordsInWindow.length-1,index+recordsInPage);this._scrollTop=Math.min(this._containerElement.scrollHeight-this._containerElementHeight,this._scrollTop+recordsInPage*rowHeight);this._containerElement.scrollTop=this._scrollTop;this._selectRecord(recordsInWindow[index]);event.consume(true);break;case"Home":index=0;this._selectRecord(recordsInWindow[index]);event.consume(true);break;case"End":index=recordsInWindow.length-1;this._selectRecord(recordsInWindow[index]);event.consume(true);break;}},_highlightQuad:function(rowElement)
{if(!rowElement||!rowElement.row)
return false;var presentationRecord=rowElement.row._record;if(presentationRecord.coalesced())
return false;var record=presentationRecord.record();if(this._highlightedQuadRecord===record)
return true;var quad=record.traceEvent().highlightQuad;var target=record.target();if(!quad||!target)
return false;this._highlightedQuadRecord=record;target.domAgent().highlightQuad(quad,WebInspector.Color.PageHighlight.Content.toProtocolRGBA(),WebInspector.Color.PageHighlight.ContentOutline.toProtocolRGBA());return true;},_hideQuadHighlight:function()
{var target=this._highlightedQuadRecord?this._highlightedQuadRecord.target():null;if(target)
target.domAgent().hideHighlight();if(this._highlightedQuadRecord)
delete this._highlightedQuadRecord;},_showPopover:function(anchor,popover)
{if(!anchor._tasksInfo)
return;popover.showForAnchor(WebInspector.TimelineUIUtils.generateMainThreadBarPopupContent(this._model,anchor._tasksInfo),anchor);},_closeRecordDetails:function()
{this._popoverHelper.hidePopover();},highlightSearchResult:function(record,regex,selectRecord)
{if(this._highlightDomChanges)
WebInspector.revertDomChanges(this._highlightDomChanges);this._highlightDomChanges=[];var presentationRecord=this._presentationModel.toPresentationRecord(record);if(!presentationRecord)
return;if(selectRecord)
this._selectRecord(presentationRecord);for(var element=this._sidebarListElement.firstChild;element;element=element.nextSibling){if(element.row._record===presentationRecord){element.row.highlight(regex,this._highlightDomChanges);break;}}},__proto__:WebInspector.VBox.prototype}
WebInspector.TimelineCalculator=function(model)
{this._model=model;}
WebInspector.TimelineCalculator._minWidth=5;WebInspector.TimelineCalculator.prototype={paddingLeft:function()
{return this._paddingLeft;},computePosition:function(time)
{return(time-this._minimumBoundary)/this.boundarySpan()*this._workingArea+this._paddingLeft;},computeBarGraphPercentages:function(record)
{var start=(record.startTime()-this._minimumBoundary)/this.boundarySpan()*100;var end=(record.startTime()+record.selfTime()-this._minimumBoundary)/this.boundarySpan()*100;var cpuWidth=(record.endTime()-record.startTime())/this.boundarySpan()*100;return{start:start,end:end,cpuWidth:cpuWidth};},computeBarGraphWindowPosition:function(record)
{var percentages=this.computeBarGraphPercentages(record);var widthAdjustment=0;var left=this.computePosition(record.startTime());var width=(percentages.end-percentages.start)/100*this._workingArea;if(width<WebInspector.TimelineCalculator._minWidth){widthAdjustment=WebInspector.TimelineCalculator._minWidth-width;width=WebInspector.TimelineCalculator._minWidth;}
var cpuWidth=percentages.cpuWidth/100*this._workingArea+widthAdjustment;return{left:left,width:width,cpuWidth:cpuWidth};},setWindow:function(minimumBoundary,maximumBoundary)
{this._minimumBoundary=minimumBoundary;this._maximumBoundary=maximumBoundary;},setDisplayWindow:function(paddingLeft,clientWidth)
{this._workingArea=clientWidth-WebInspector.TimelineCalculator._minWidth-paddingLeft;this._paddingLeft=paddingLeft;},formatTime:function(value,precision)
{return Number.preciseMillisToString(value-this.zeroTime(),precision);},maximumBoundary:function()
{return this._maximumBoundary;},minimumBoundary:function()
{return this._minimumBoundary;},zeroTime:function()
{return this._model.minimumRecordTime();},boundarySpan:function()
{return this._maximumBoundary-this._minimumBoundary;}}
WebInspector.TimelineRecordListRow=function(linkifier,target,selectRecord,scheduleRefresh)
{this.element=createElement("div");this.element.row=this;this.element.style.cursor="pointer";this.element.addEventListener("click",this._onClick.bind(this),false);this.element.addEventListener("mouseover",this._onMouseOver.bind(this),false);this.element.addEventListener("mouseleave",this._onMouseLeave.bind(this),false);this._linkifier=linkifier;this._warningElement=this.element.createChild("div","timeline-tree-item-warning hidden");this._expandArrowElement=this.element.createChild("div","timeline-tree-item-expand-arrow");this._expandArrowElement.addEventListener("click",this._onExpandClick.bind(this),false);this.element.createChild("span","timeline-tree-icon");this._typeElement=this.element.createChild("span","type");this._dataElement=this.element.createChild("span","data dimmed");this._scheduleRefresh=scheduleRefresh;this._selectRecord=selectRecord;this._target=target;}
WebInspector.TimelineRecordListRow.prototype={update:function(presentationRecord,offset)
{this._record=presentationRecord;var record=presentationRecord.record();this._offset=offset;this.element.className="timeline-tree-item timeline-category-"+WebInspector.TimelineUIUtils.categoryForRecord(record).name;var paddingLeft=5;var step=-3;for(var currentRecord=presentationRecord.presentationParent()?presentationRecord.presentationParent().presentationParent():null;currentRecord;currentRecord=currentRecord.presentationParent())
paddingLeft+=12/(Math.max(1,step++));this.element.style.paddingLeft=paddingLeft+"px";if(record.thread()!==WebInspector.TimelineModel.MainThreadName)
this.element.classList.add("background");this._typeElement.textContent=WebInspector.TimelineUIUtils.eventTitle(record.traceEvent());if(this._dataElement.firstChild)
this._dataElement.removeChildren();this._warningElement.classList.toggle("hidden",!presentationRecord.hasWarnings()&&!presentationRecord.childHasWarnings());this._warningElement.classList.toggle("timeline-tree-item-child-warning",presentationRecord.childHasWarnings()&&!presentationRecord.hasWarnings());if(presentationRecord.coalesced()){this._dataElement.createTextChild(WebInspector.UIString("× %d",presentationRecord.presentationChildren().length));}else{var detailsNode=WebInspector.TimelineUIUtils.buildDetailsNodeForTraceEvent(record.traceEvent(),this._target,this._linkifier);if(detailsNode){this._dataElement.createTextChild("(");this._dataElement.appendChild(detailsNode);this._dataElement.createTextChild(")");}}
this._expandArrowElement.classList.toggle("parent",presentationRecord.expandable());this._expandArrowElement.classList.toggle("expanded",!!presentationRecord.visibleChildrenCount());this._record.setListRow(this);},highlight:function(regExp,domChanges)
{var matchInfo=this.element.textContent.match(regExp);if(matchInfo)
WebInspector.highlightSearchResult(this.element,matchInfo.index,matchInfo[0].length,domChanges);},dispose:function()
{this.element.remove();},_onExpandClick:function(event)
{this._record.setCollapsed(!this._record.collapsed());this._scheduleRefresh();event.consume(true);},_onClick:function(event)
{this._selectRecord(this._record);},renderAsSelected:function(selected)
{this.element.classList.toggle("selected",selected);},_onMouseOver:function(event)
{this.element.classList.add("hovered");if(this._record.graphRow())
this._record.graphRow().element.classList.add("hovered");},_onMouseLeave:function(event)
{this.element.classList.remove("hovered");if(this._record.graphRow())
this._record.graphRow().element.classList.remove("hovered");}}
WebInspector.TimelineRecordGraphRow=function(graphContainer,selectRecord,scheduleRefresh)
{this.element=createElement("div");this.element.row=this;this.element.addEventListener("mouseover",this._onMouseOver.bind(this),false);this.element.addEventListener("mouseleave",this._onMouseLeave.bind(this),false);this.element.addEventListener("click",this._onClick.bind(this),false);this._barAreaElement=this.element.createChild("div","timeline-graph-bar-area");this._barCpuElement=this._barAreaElement.createChild("div","timeline-graph-bar cpu");this._barCpuElement.row=this;this._barElement=this._barAreaElement.createChild("div","timeline-graph-bar");this._barElement.row=this;this._expandElement=new WebInspector.TimelineExpandableElement(graphContainer);this._selectRecord=selectRecord;this._scheduleRefresh=scheduleRefresh;}
WebInspector.TimelineRecordGraphRow.prototype={update:function(presentationRecord,calculator,expandOffset,index,topGapSize)
{this._record=presentationRecord;var record=presentationRecord.record();this.element.className="timeline-graph-side timeline-category-"+WebInspector.TimelineUIUtils.categoryForRecord(record).name;if(record.thread()!==WebInspector.TimelineModel.MainThreadName)
this.element.classList.add("background");var barPosition=calculator.computeBarGraphWindowPosition(presentationRecord);this._barElement.style.left=barPosition.left+"px";this._barElement.style.width=barPosition.width+"px";this._barCpuElement.style.left=barPosition.left+"px";this._barCpuElement.style.width=barPosition.cpuWidth+"px";this._expandElement._update(presentationRecord,index,topGapSize,barPosition.left-expandOffset,barPosition.width);this._record.setGraphRow(this);},_onClick:function(event)
{if(this._expandElement._arrow.containsEventPoint(event))
this._expand();this._selectRecord(this._record);},renderAsSelected:function(selected)
{this.element.classList.toggle("selected",selected);},_expand:function()
{this._record.setCollapsed(!this._record.collapsed());this._scheduleRefresh();},_onMouseOver:function(event)
{this.element.classList.add("hovered");if(this._record.listRow())
this._record.listRow().element.classList.add("hovered");},_onMouseLeave:function(event)
{this.element.classList.remove("hovered");if(this._record.listRow())
this._record.listRow().element.classList.remove("hovered");},dispose:function()
{this.element.remove();this._expandElement._dispose();}}
WebInspector.TimelineExpandableElement=function(container)
{this._element=container.createChild("div","timeline-expandable");this._element.createChild("div","timeline-expandable-left");this._arrow=this._element.createChild("div","timeline-expandable-arrow");}
WebInspector.TimelineExpandableElement.prototype={_update:function(record,index,topGapSize,left,width)
{const rowHeight=WebInspector.TimelinePanel.rowHeight;if(record.visibleChildrenCount()||record.expandable()){this._element.style.top=(index*rowHeight-topGapSize)+"px";this._element.style.left=left+"px";this._element.style.width=Math.max(12,width+25)+"px";if(!record.collapsed()){this._element.style.height=(record.visibleChildrenCount()+1)*rowHeight+"px";this._element.classList.add("timeline-expandable-expanded");this._element.classList.remove("timeline-expandable-collapsed");}else{this._element.style.height=rowHeight+"px";this._element.classList.add("timeline-expandable-collapsed");this._element.classList.remove("timeline-expandable-expanded");}
this._element.classList.remove("hidden");}else{this._element.classList.add("hidden");}},_dispose:function()
{this._element.remove();}};WebInspector.TimelineLayersView=function()
{WebInspector.SplitView.call(this,true,false,"timelineLayersView");this.element.classList.add("timeline-layers-view");this._rightSplitView=new WebInspector.SplitView(true,true,"timelineLayersViewDetails");this._rightSplitView.element.classList.add("timeline-layers-view-properties");this.setMainView(this._rightSplitView);this._paintTiles=[];var vbox=new WebInspector.VBox();this.setSidebarView(vbox);this._layerViewHost=new WebInspector.LayerViewHost();var layerTreeOutline=new WebInspector.LayerTreeOutline(this._layerViewHost);vbox.element.appendChild(layerTreeOutline.element);this._layers3DView=new WebInspector.Layers3DView(this._layerViewHost);this._layers3DView.addEventListener(WebInspector.Layers3DView.Events.PaintProfilerRequested,this._jumpToPaintEvent,this);this._rightSplitView.setMainView(this._layers3DView);var layerDetailsView=new WebInspector.LayerDetailsView(this._layerViewHost);this._rightSplitView.setSidebarView(layerDetailsView);layerDetailsView.addEventListener(WebInspector.LayerDetailsView.Events.PaintProfilerRequested,this._jumpToPaintEvent,this);}
WebInspector.TimelineLayersView.prototype={showLayerTree:function(deferredLayerTree,paints)
{this._disposeTiles();this._deferredLayerTree=deferredLayerTree;this._paints=paints;if(this.isShowing())
this._update();else
this._updateWhenVisible=true;},wasShown:function()
{if(this._updateWhenVisible){this._updateWhenVisible=false;this._update();}},setTimelineModelAndDelegate:function(model,delegate)
{this._model=model;this._delegate=delegate;},_jumpToPaintEvent:function(event)
{var traceEvent=event.data;var eventRecord;function findRecordWithEvent(record)
{if(record.traceEvent()===traceEvent){eventRecord=record;return true;}
return false;}
this._model.forAllRecords(findRecordWithEvent);if(eventRecord)
this._delegate.showNestedRecordDetails(eventRecord);},_update:function()
{var layerTree;this._target=this._deferredLayerTree.target();var originalTiles=this._paintTiles;var tilesReadyBarrier=new CallbackBarrier();this._deferredLayerTree.resolve(tilesReadyBarrier.createCallback(onLayersReady));for(var i=0;this._paints&&i<this._paints.length;++i)
this._paints[i].loadSnapshot(tilesReadyBarrier.createCallback(onSnapshotLoaded.bind(this,this._paints[i])));tilesReadyBarrier.callWhenDone(onLayersAndTilesReady.bind(this));function onLayersReady(resolvedLayerTree)
{layerTree=resolvedLayerTree;}
function onSnapshotLoaded(paintEvent,rect,snapshot)
{if(!rect||!snapshot)
return;if(originalTiles!==this._paintTiles){snapshot.dispose();return;}
this._paintTiles.push({layerId:paintEvent.layerId(),rect:rect,snapshot:snapshot,traceEvent:paintEvent.event()});}
function onLayersAndTilesReady()
{this._layerViewHost.setLayerTree(layerTree);this._layers3DView.setTiles(this._paintTiles);}},_disposeTiles:function()
{for(var i=0;i<this._paintTiles.length;++i)
this._paintTiles[i].snapshot.dispose();this._paintTiles=[];},__proto__:WebInspector.SplitView.prototype};WebInspector.TimelinePaintProfilerView=function(frameModel)
{WebInspector.SplitView.call(this,false,false);this.element.classList.add("timeline-paint-profiler-view");this.setSidebarSize(60);this.setResizable(false);this._frameModel=frameModel;this._logAndImageSplitView=new WebInspector.SplitView(true,false);this._logAndImageSplitView.element.classList.add("timeline-paint-profiler-log-split");this.setMainView(this._logAndImageSplitView);this._imageView=new WebInspector.TimelinePaintImageView();this._logAndImageSplitView.setMainView(this._imageView);this._paintProfilerView=new WebInspector.PaintProfilerView(this._imageView.showImage.bind(this._imageView));this._paintProfilerView.addEventListener(WebInspector.PaintProfilerView.Events.WindowChanged,this._onWindowChanged,this);this.setSidebarView(this._paintProfilerView);this._logTreeView=new WebInspector.PaintProfilerCommandLogView();this._logAndImageSplitView.setSidebarView(this._logTreeView);}
WebInspector.TimelinePaintProfilerView.prototype={wasShown:function()
{if(this._updateWhenVisible){this._updateWhenVisible=false;this._update();}},setEvent:function(target,event)
{this._disposeSnapshot();this._target=target;this._event=event;this._updateWhenVisible=true;if(this._event.name===WebInspector.TimelineModel.RecordType.Paint)
return!!event.picture;if(this._event.name===WebInspector.TimelineModel.RecordType.RasterTask)
return this._frameModel.hasRasterTile(this._event);return false;},_update:function()
{this._logTreeView.setCommandLog(null,[]);this._paintProfilerView.setSnapshotAndLog(null,[],null);if(this._event.name===WebInspector.TimelineModel.RecordType.Paint)
this._event.picture.requestObject(onDataAvailable.bind(this));else if(this._event.name===WebInspector.TimelineModel.RecordType.RasterTask)
this._frameModel.requestRasterTile(this._event,onSnapshotLoaded.bind(this))
else
console.assert(false,"Unexpected event type: "+this._event.name);function onDataAvailable(data)
{if(data)
WebInspector.PaintProfilerSnapshot.load(this._target,data["skp64"],onSnapshotLoaded.bind(this,null));}
function onSnapshotLoaded(tileRect,snapshot)
{this._disposeSnapshot();this._lastLoadedSnapshot=snapshot;this._imageView.setMask(tileRect);if(!snapshot)
return;snapshot.commandLog(onCommandLogDone.bind(this,snapshot,tileRect));}
function onCommandLogDone(snapshot,clipRect,log)
{this._logTreeView.setCommandLog(snapshot.target(),log);this._paintProfilerView.setSnapshotAndLog(snapshot,log||[],clipRect);}},_disposeSnapshot:function()
{if(!this._lastLoadedSnapshot)
return;this._lastLoadedSnapshot.dispose();this._lastLoadedSnapshot=null;},_onWindowChanged:function()
{var window=this._paintProfilerView.windowBoundaries();this._logTreeView.updateWindow(window.left,window.right);},__proto__:WebInspector.SplitView.prototype};WebInspector.TimelinePaintImageView=function()
{WebInspector.View.call(this);this.element.classList.add("fill","paint-profiler-image-view");this._imageContainer=this.element.createChild("div","paint-profiler-image-container");this._imageElement=this._imageContainer.createChild("img");this._maskElement=this._imageContainer.createChild("div");this._imageElement.addEventListener("load",this._updateImagePosition.bind(this),false);this._transformController=new WebInspector.TransformController(this.element,true);this._transformController.addEventListener(WebInspector.TransformController.Events.TransformChanged,this._updateImagePosition,this);}
WebInspector.TimelinePaintImageView.prototype={onResize:function()
{if(this._imageElement.src)
this._updateImagePosition();},_updateImagePosition:function()
{var width=this._imageElement.naturalWidth;var height=this._imageElement.naturalHeight;var clientWidth=this.element.clientWidth;var clientHeight=this.element.clientHeight;var paddingFraction=0.1;var paddingX=clientWidth*paddingFraction;var paddingY=clientHeight*paddingFraction;var scaleX=(clientWidth-paddingX)/width;var scaleY=(clientHeight-paddingY)/height;var scale=Math.min(scaleX,scaleY);if(this._maskRectangle){var style=this._maskElement.style;style.width=width+"px";style.height=height+"px";style.borderLeftWidth=this._maskRectangle.x+"px";style.borderTopWidth=this._maskRectangle.y+"px";style.borderRightWidth=(width-this._maskRectangle.x-this._maskRectangle.width)+"px";style.borderBottomWidth=(height-this._maskRectangle.y-this._maskRectangle.height)+"px";}
this._transformController.setScaleConstraints(0.5,10/scale);var matrix=new WebKitCSSMatrix().scale(this._transformController.scale(),this._transformController.scale()).translate(clientWidth/2,clientHeight/2).scale(scale,scale).translate(-width/2,-height/2);var bounds=WebInspector.Geometry.boundsForTransformedPoints(matrix,[0,0,0,width,height,0]);this._transformController.clampOffsets(paddingX-bounds.maxX,clientWidth-paddingX-bounds.minX,paddingY-bounds.maxY,clientHeight-paddingY-bounds.minY);matrix=new WebKitCSSMatrix().translate(this._transformController.offsetX(),this._transformController.offsetY()).multiply(matrix);this._imageContainer.style.webkitTransform=matrix.toString();},showImage:function(imageURL)
{this._imageContainer.classList.toggle("hidden",!imageURL);this._imageElement.src=imageURL;},setMask:function(maskRectangle)
{this._maskRectangle=maskRectangle;this._maskElement.classList.toggle("hidden",!maskRectangle);},__proto__:WebInspector.View.prototype};;WebInspector.TransformController=function(element,disableRotate)
{this._shortcuts={};this.element=element;if(this.element.tabIndex<0)
this.element.tabIndex=0;this._registerShortcuts();WebInspector.installDragHandle(element,this._onDragStart.bind(this),this._onDrag.bind(this),this._onDragEnd.bind(this),"move",null);element.addEventListener("keydown",this._onKeyDown.bind(this),false);element.addEventListener("keyup",this._onKeyUp.bind(this),false);element.addEventListener("mousewheel",this._onMouseWheel.bind(this),false);this._minScale=0;this._maxScale=Infinity;this._controlPanelStatusBar=new WebInspector.StatusBar();this._controlPanelStatusBar.element.classList.add("transform-control-panel");this._modeButtons={};if(!disableRotate){var panModeButton=new WebInspector.StatusBarButton(WebInspector.UIString("Pan mode (X)"),"pan-status-bar-item");panModeButton.addEventListener("click",this._setMode.bind(this,WebInspector.TransformController.Modes.Pan));this._modeButtons[WebInspector.TransformController.Modes.Pan]=panModeButton;this._controlPanelStatusBar.appendStatusBarItem(panModeButton);var rotateModeButton=new WebInspector.StatusBarButton(WebInspector.UIString("Rotate mode (V)"),"rotate-status-bar-item");rotateModeButton.addEventListener("click",this._setMode.bind(this,WebInspector.TransformController.Modes.Rotate));this._modeButtons[WebInspector.TransformController.Modes.Rotate]=rotateModeButton;this._controlPanelStatusBar.appendStatusBarItem(rotateModeButton);}
this._setMode(WebInspector.TransformController.Modes.Pan);var resetButton=new WebInspector.StatusBarButton(WebInspector.UIString("Reset transform (0)"),"center-status-bar-item");resetButton.addEventListener("click",this.resetAndNotify.bind(this,undefined));this._controlPanelStatusBar.appendStatusBarItem(resetButton);this._reset();}
WebInspector.TransformController.Events={TransformChanged:"TransformChanged"}
WebInspector.TransformController.Modes={Pan:"Pan",Rotate:"Rotate",}
WebInspector.TransformController.prototype={statusBar:function()
{return this._controlPanelStatusBar;},_onKeyDown:function(event)
{if(event.keyCode===WebInspector.KeyboardShortcut.Keys.Shift.code){this._toggleMode();return;}
var shortcutKey=WebInspector.KeyboardShortcut.makeKeyFromEventIgnoringModifiers(event);var handler=this._shortcuts[shortcutKey];if(handler&&handler(event))
event.consume();},_onKeyUp:function(event)
{if(event.keyCode===WebInspector.KeyboardShortcut.Keys.Shift.code)
this._toggleMode();},_addShortcuts:function(keys,handler)
{for(var i=0;i<keys.length;++i)
this._shortcuts[keys[i].key]=handler;},_registerShortcuts:function()
{this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.ResetView,this.resetAndNotify.bind(this));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.PanMode,this._setMode.bind(this,WebInspector.TransformController.Modes.Pan));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.RotateMode,this._setMode.bind(this,WebInspector.TransformController.Modes.Rotate));var zoomFactor=1.1;this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.ZoomIn,this._onKeyboardZoom.bind(this,zoomFactor));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.ZoomOut,this._onKeyboardZoom.bind(this,1/zoomFactor));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.Up,this._onKeyboardPanOrRotate.bind(this,0,-1));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.Down,this._onKeyboardPanOrRotate.bind(this,0,1));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.Left,this._onKeyboardPanOrRotate.bind(this,-1,0));this._addShortcuts(WebInspector.ShortcutsScreen.LayersPanelShortcuts.Right,this._onKeyboardPanOrRotate.bind(this,1,0));},_postChangeEvent:function()
{this.dispatchEventToListeners(WebInspector.TransformController.Events.TransformChanged);},_reset:function()
{this._scale=1;this._offsetX=0;this._offsetY=0;this._rotateX=0;this._rotateY=0;},_toggleMode:function()
{this._setMode(this._mode===WebInspector.TransformController.Modes.Pan?WebInspector.TransformController.Modes.Rotate:WebInspector.TransformController.Modes.Pan);},_setMode:function(mode)
{if(this._mode===mode)
return;this._mode=mode;this._updateModeButtons();this.element.focus();},_updateModeButtons:function()
{for(var mode in this._modeButtons)
this._modeButtons[mode].setToggled(mode===this._mode);},resetAndNotify:function(event)
{this._reset();this._postChangeEvent();if(event)
event.preventDefault();this.element.focus();},setScaleConstraints:function(minScale,maxScale)
{this._minScale=minScale;this._maxScale=maxScale;this._scale=Number.constrain(this._scale,minScale,maxScale);},clampOffsets:function(minX,maxX,minY,maxY)
{this._offsetX=Number.constrain(this._offsetX,minX,maxX);this._offsetY=Number.constrain(this._offsetY,minY,maxY);},scale:function()
{return this._scale;},offsetX:function()
{return this._offsetX;},offsetY:function()
{return this._offsetY;},rotateX:function()
{return this._rotateX;},rotateY:function()
{return this._rotateY;},_onScale:function(scaleFactor,x,y)
{scaleFactor=Number.constrain(this._scale*scaleFactor,this._minScale,this._maxScale)/this._scale;this._scale*=scaleFactor;this._offsetX-=(x-this._offsetX)*(scaleFactor-1);this._offsetY-=(y-this._offsetY)*(scaleFactor-1);this._postChangeEvent();},_onPan:function(offsetX,offsetY)
{this._offsetX+=offsetX;this._offsetY+=offsetY;this._postChangeEvent();},_onRotate:function(rotateX,rotateY)
{this._rotateX=rotateX;this._rotateY=rotateY;this._postChangeEvent();},_onKeyboardZoom:function(zoomFactor)
{this._onScale(zoomFactor,this.element.clientWidth/2,this.element.clientHeight/2);},_onKeyboardPanOrRotate:function(xMultiplier,yMultiplier)
{var panStepInPixels=6;var rotateStepInDegrees=5;if(this._mode===WebInspector.TransformController.Modes.Rotate){this._onRotate(this._rotateX+yMultiplier*rotateStepInDegrees,this._rotateY+xMultiplier*rotateStepInDegrees);}else{this._onPan(xMultiplier*panStepInPixels,yMultiplier*panStepInPixels);}},_onMouseWheel:function(event)
{var zoomFactor=1.1;var mouseWheelZoomSpeed=1/120;var scaleFactor=Math.pow(zoomFactor,event.wheelDeltaY*mouseWheelZoomSpeed);this._onScale(scaleFactor,event.clientX-this.element.totalOffsetLeft(),event.clientY-this.element.totalOffsetTop());},_onDrag:function(event)
{if(this._mode===WebInspector.TransformController.Modes.Rotate){this._onRotate(this._oldRotateX+(this._originY-event.clientY)/this.element.clientHeight*180,this._oldRotateY-(this._originX-event.clientX)/this.element.clientWidth*180);}else{this._onPan(event.clientX-this._originX,event.clientY-this._originY);this._originX=event.clientX;this._originY=event.clientY;}},_onDragStart:function(event)
{this.element.focus();this._originX=event.clientX;this._originY=event.clientY;this._oldRotateX=this._rotateX;this._oldRotateY=this._rotateY;return true;},_onDragEnd:function()
{delete this._originX;delete this._originY;delete this._oldRotateX;delete this._oldRotateY;},__proto__:WebInspector.Object.prototype};WebInspector.PaintProfilerView=function(showImageCallback)
{WebInspector.HBox.call(this);this.element.classList.add("paint-profiler-overview","hbox");this._canvasContainer=this.element.createChild("div","paint-profiler-canvas-container");this._progressBanner=this.element.createChild("div","fill progress-banner hidden");this._progressBanner.textContent=WebInspector.UIString("Profiling\u2026");this._pieChart=new WebInspector.PieChart(55,this._formatPieChartTime.bind(this),true);this._pieChart.element.classList.add("paint-profiler-pie-chart");this.element.appendChild(this._pieChart.element);this._showImageCallback=showImageCallback;this._canvas=this._canvasContainer.createChild("canvas","fill");this._context=this._canvas.getContext("2d");this._selectionWindow=new WebInspector.OverviewGrid.Window(this._canvasContainer);this._selectionWindow.addEventListener(WebInspector.OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);this._innerBarWidth=4*window.devicePixelRatio;this._minBarHeight=window.devicePixelRatio;this._barPaddingWidth=2*window.devicePixelRatio;this._outerBarWidth=this._innerBarWidth+this._barPaddingWidth;this._reset();}
WebInspector.PaintProfilerView.Events={WindowChanged:"WindowChanged"};WebInspector.PaintProfilerView.prototype={onResize:function()
{this._update();},setSnapshotAndLog:function(snapshot,log,clipRect)
{this._reset();this._snapshot=snapshot;this._log=log;this._logCategories=this._log.map(WebInspector.PaintProfilerView._categoryForLogItem);if(!this._snapshot){this._update();this._pieChart.setTotal(0);return;}
this._progressBanner.classList.remove("hidden");snapshot.requestImage(null,null,1,this._showImageCallback);snapshot.profile(clipRect,onProfileDone.bind(this));function onProfileDone(profiles)
{this._progressBanner.classList.add("hidden");this._profiles=profiles;this._update();this._updatePieChart();}},_update:function()
{this._canvas.width=this._canvasContainer.clientWidth*window.devicePixelRatio;this._canvas.height=this._canvasContainer.clientHeight*window.devicePixelRatio;this._samplesPerBar=0;if(!this._profiles||!this._profiles.length)
return;var maxBars=Math.floor((this._canvas.width-2*this._barPaddingWidth)/this._outerBarWidth);var sampleCount=this._log.length;this._samplesPerBar=Math.ceil(sampleCount/maxBars);var maxBarTime=0;var barTimes=[];var barHeightByCategory=[];var heightByCategory={};for(var i=0,lastBarIndex=0,lastBarTime=0;i<sampleCount;){var categoryName=(this._logCategories[i]&&this._logCategories[i].name)||"misc";var sampleIndex=this._log[i].commandIndex;for(var row=0;row<this._profiles.length;row++){var sample=this._profiles[row][sampleIndex];lastBarTime+=sample;heightByCategory[categoryName]=(heightByCategory[categoryName]||0)+sample;}
++i;if(i-lastBarIndex==this._samplesPerBar||i==sampleCount){var factor=this._profiles.length*(i-lastBarIndex);lastBarTime/=factor;for(categoryName in heightByCategory)
heightByCategory[categoryName]/=factor;barTimes.push(lastBarTime);barHeightByCategory.push(heightByCategory);if(lastBarTime>maxBarTime)
maxBarTime=lastBarTime;lastBarTime=0;heightByCategory={};lastBarIndex=i;}}
const paddingHeight=4*window.devicePixelRatio;var scale=(this._canvas.height-paddingHeight-this._minBarHeight)/maxBarTime;for(var i=0;i<barTimes.length;++i){for(var categoryName in barHeightByCategory[i])
barHeightByCategory[i][categoryName]*=(barTimes[i]*scale+this._minBarHeight)/barTimes[i];this._renderBar(i,barHeightByCategory[i]);}},_renderBar:function(index,heightByCategory)
{var categories=WebInspector.PaintProfilerView.categories();var currentHeight=0;var x=this._barPaddingWidth+index*this._outerBarWidth;for(var categoryName in categories){if(!heightByCategory[categoryName])
continue;currentHeight+=heightByCategory[categoryName];var y=this._canvas.height-currentHeight;this._context.fillStyle=categories[categoryName].color;this._context.fillRect(x,y,this._innerBarWidth,heightByCategory[categoryName]);}},_onWindowChanged:function()
{this.dispatchEventToListeners(WebInspector.PaintProfilerView.Events.WindowChanged);this._updatePieChart();if(this._updateImageTimer)
return;this._updateImageTimer=setTimeout(this._updateImage.bind(this),100);},_updatePieChart:function()
{if(!this._profiles||!this._profiles.length)
return;var window=this.windowBoundaries();var totalTime=0;var timeByCategory={};for(var i=window.left;i<window.right;++i){var logEntry=this._log[i];var category=WebInspector.PaintProfilerView._categoryForLogItem(logEntry);timeByCategory[category.color]=timeByCategory[category.color]||0;for(var j=0;j<this._profiles.length;++j){var time=this._profiles[j][logEntry.commandIndex];totalTime+=time;timeByCategory[category.color]+=time;}}
this._pieChart.setTotal(totalTime/this._profiles.length);for(var color in timeByCategory)
this._pieChart.addSlice(timeByCategory[color]/this._profiles.length,color);},_formatPieChartTime:function(value)
{return Number.millisToString(value*1000,true);},windowBoundaries:function()
{var screenLeft=this._selectionWindow.windowLeft*this._canvas.width;var screenRight=this._selectionWindow.windowRight*this._canvas.width;var barLeft=Math.floor(screenLeft/this._outerBarWidth);var barRight=Math.floor((screenRight+this._innerBarWidth-this._barPaddingWidth/2)/this._outerBarWidth);var stepLeft=Number.constrain(barLeft*this._samplesPerBar,0,this._log.length-1);var stepRight=Number.constrain(barRight*this._samplesPerBar,0,this._log.length);return{left:stepLeft,right:stepRight};},_updateImage:function()
{delete this._updateImageTimer;if(!this._profiles||!this._profiles.length)
return;var window=this.windowBoundaries();this._snapshot.requestImage(this._log[window.left].commandIndex,this._log[window.right-1].commandIndex,1,this._showImageCallback);},_reset:function()
{this._snapshot=null;this._profiles=null;this._selectionWindow.reset();},__proto__:WebInspector.HBox.prototype};WebInspector.PaintProfilerCommandLogView=function()
{WebInspector.VBox.call(this);this.setMinimumSize(100,25);this.element.classList.add("profiler-log-view");this._treeOutline=new TreeOutlineInShadow();this.element.appendChild(this._treeOutline.element);this._treeOutline.element.addEventListener("mousemove",this._onMouseMove.bind(this),false);this._treeOutline.element.addEventListener("mouseout",this._onMouseMove.bind(this),false);this._treeOutline.element.addEventListener("contextmenu",this._onContextMenu.bind(this),true);this._reset();}
WebInspector.PaintProfilerCommandLogView.prototype={setCommandLog:function(target,log)
{this._target=target;this._log=log;this.updateWindow();},_appendLogItem:function(treeOutline,logItem)
{var treeElement=new WebInspector.LogTreeElement(this,logItem);treeOutline.appendChild(treeElement);},updateWindow:function(stepLeft,stepRight)
{this._treeOutline.removeChildren();if(!this._log)
return;stepLeft=stepLeft||0;stepRight=stepRight||this._log.length;for(var i=stepLeft;i<stepRight;++i)
this._appendLogItem(this._treeOutline,this._log[i]);},_reset:function()
{this._log=[];},_onMouseMove:function(event)
{var node=this._treeOutline.treeElementFromEvent(event);if(node===this._lastHoveredNode||!(node instanceof WebInspector.LogTreeElement))
return;if(this._lastHoveredNode)
this._lastHoveredNode.setHovered(false);this._lastHoveredNode=node;if(this._lastHoveredNode)
this._lastHoveredNode.setHovered(true);},_onContextMenu:function(event)
{if(!this._target)
return;var node=this._treeOutline.treeElementFromEvent(event);if(!node||!(node instanceof WebInspector.LogTreeElement))
return;var logItem=(node)._logItem;if(!logItem.nodeId())
return;var contextMenu=new WebInspector.ContextMenu(event);var domNode=new WebInspector.DeferredDOMNode(this._target,logItem.nodeId());contextMenu.appendApplicableItems(domNode);contextMenu.show();},__proto__:WebInspector.VBox.prototype};WebInspector.LogTreeElement=function(ownerView,logItem)
{TreeElement.call(this,"",!!logItem.params);this._logItem=logItem;this._ownerView=ownerView;this._filled=false;}
WebInspector.LogTreeElement.prototype={onattach:function()
{this._update();},onpopulate:function()
{for(var param in this._logItem.params)
WebInspector.LogPropertyTreeElement._appendLogPropertyItem(this,param,this._logItem.params[param]);},_paramToString:function(param,name)
{if(typeof param!=="object")
return typeof param==="string"&&param.length>100?name:JSON.stringify(param);var str="";var keyCount=0;for(var key in param){if(++keyCount>4||typeof param[key]==="object"||(typeof param[key]==="string"&&param[key].length>100))
return name;if(str)
str+=", ";str+=param[key];}
return str;},_paramsToString:function(params)
{var str="";for(var key in params){if(str)
str+=", ";str+=this._paramToString(params[key],key);}
return str;},_update:function()
{var title=createDocumentFragment();title.createTextChild(this._logItem.method+"("+this._paramsToString(this._logItem.params)+")");this.title=title;},setHovered:function(hovered)
{this.listItemElement.classList.toggle("hovered",hovered);var target=this._ownerView._target;if(!target)
return;if(!hovered){target.domModel.hideDOMNodeHighlight();return;}
var logItem=(this._logItem);if(!logItem)
return;var backendNodeId=logItem.nodeId();if(!backendNodeId)
return;new WebInspector.DeferredDOMNode(target,backendNodeId).resolve(highlightNode);function highlightNode(node)
{if(node)
node.highlight();}},__proto__:TreeElement.prototype};WebInspector.LogPropertyTreeElement=function(property)
{TreeElement.call(this);this._property=property;};WebInspector.LogPropertyTreeElement._appendLogPropertyItem=function(element,name,value)
{var treeElement=new WebInspector.LogPropertyTreeElement({name:name,value:value});element.appendChild(treeElement);if(value&&typeof value==="object"){for(var property in value)
WebInspector.LogPropertyTreeElement._appendLogPropertyItem(treeElement,property,value[property]);}};WebInspector.LogPropertyTreeElement.prototype={onattach:function()
{var title=createDocumentFragment();var nameElement=title.createChild("span","name");nameElement.textContent=this._property.name;var separatorElement=title.createChild("span","separator");separatorElement.textContent=": ";if(this._property.value===null||typeof this._property.value!=="object"){var valueElement=title.createChild("span","value");valueElement.textContent=JSON.stringify(this._property.value);valueElement.classList.add("cm-js-"+(this._property.value===null?"null":typeof this._property.value));}
this.title=title;},__proto__:TreeElement.prototype}
WebInspector.PaintProfilerView.categories=function()
{if(WebInspector.PaintProfilerView._categories)
return WebInspector.PaintProfilerView._categories;WebInspector.PaintProfilerView._categories={shapes:new WebInspector.PaintProfilerCategory("shapes",WebInspector.UIString("Shapes"),"rgb(255, 161, 129)"),bitmap:new WebInspector.PaintProfilerCategory("bitmap",WebInspector.UIString("Bitmap"),"rgb(136, 196, 255)"),text:new WebInspector.PaintProfilerCategory("text",WebInspector.UIString("Text"),"rgb(180, 255, 137)"),misc:new WebInspector.PaintProfilerCategory("misc",WebInspector.UIString("Misc"),"rgb(206, 160, 255)")};return WebInspector.PaintProfilerView._categories;};WebInspector.PaintProfilerCategory=function(name,title,color)
{this.name=name;this.title=title;this.color=color;}
WebInspector.PaintProfilerView._initLogItemCategories=function()
{if(WebInspector.PaintProfilerView._logItemCategoriesMap)
return WebInspector.PaintProfilerView._logItemCategoriesMap;var categories=WebInspector.PaintProfilerView.categories();var logItemCategories={};logItemCategories["Clear"]=categories["misc"];logItemCategories["DrawPaint"]=categories["misc"];logItemCategories["DrawData"]=categories["misc"];logItemCategories["SetMatrix"]=categories["misc"];logItemCategories["PushCull"]=categories["misc"];logItemCategories["PopCull"]=categories["misc"];logItemCategories["Translate"]=categories["misc"];logItemCategories["Scale"]=categories["misc"];logItemCategories["Concat"]=categories["misc"];logItemCategories["Restore"]=categories["misc"];logItemCategories["SaveLayer"]=categories["misc"];logItemCategories["Save"]=categories["misc"];logItemCategories["BeginCommentGroup"]=categories["misc"];logItemCategories["AddComment"]=categories["misc"];logItemCategories["EndCommentGroup"]=categories["misc"];logItemCategories["ClipRect"]=categories["misc"];logItemCategories["ClipRRect"]=categories["misc"];logItemCategories["ClipPath"]=categories["misc"];logItemCategories["ClipRegion"]=categories["misc"];logItemCategories["DrawPoints"]=categories["shapes"];logItemCategories["DrawRect"]=categories["shapes"];logItemCategories["DrawOval"]=categories["shapes"];logItemCategories["DrawRRect"]=categories["shapes"];logItemCategories["DrawPath"]=categories["shapes"];logItemCategories["DrawVertices"]=categories["shapes"];logItemCategories["DrawDRRect"]=categories["shapes"];logItemCategories["DrawBitmap"]=categories["bitmap"];logItemCategories["DrawBitmapRectToRect"]=categories["bitmap"];logItemCategories["DrawBitmapMatrix"]=categories["bitmap"];logItemCategories["DrawBitmapNine"]=categories["bitmap"];logItemCategories["DrawSprite"]=categories["bitmap"];logItemCategories["DrawPicture"]=categories["bitmap"];logItemCategories["DrawText"]=categories["text"];logItemCategories["DrawPosText"]=categories["text"];logItemCategories["DrawPosTextH"]=categories["text"];logItemCategories["DrawTextOnPath"]=categories["text"];WebInspector.PaintProfilerView._logItemCategoriesMap=logItemCategories;return logItemCategories;}
WebInspector.PaintProfilerView._categoryForLogItem=function(logItem)
{var method=logItem.method.toTitleCase();var logItemCategories=WebInspector.PaintProfilerView._initLogItemCategories();var result=logItemCategories[method];if(!result){result=WebInspector.PaintProfilerView.categories()["misc"];logItemCategories[method]=result;}
return result;};WebInspector.TimelinePanel=function()
{WebInspector.Panel.call(this,"timeline");this.registerRequiredCSS("timeline/timelinePanel.css");this.registerRequiredCSS("ui/filter.css");this.element.addEventListener("contextmenu",this._contextMenu.bind(this),false);this._dropTarget=new WebInspector.DropTarget(this.element,[WebInspector.DropTarget.Types.Files,WebInspector.DropTarget.Types.URIList],WebInspector.UIString("Drop timeline file or URL here"),this._handleDrop.bind(this));this._detailsLinkifier=new WebInspector.Linkifier();this._windowStartTime=0;this._windowEndTime=Infinity;this._millisecondsToRecordAfterLoadEvent=3000;this._tracingModelBackingStorage=new WebInspector.TempFileBackingStorage("tracing");this._tracingModel=new WebInspector.TracingModel(this._tracingModelBackingStorage);this._model=new WebInspector.TimelineModel(this._tracingModel,WebInspector.TimelineUIUtils.visibleRecordsFilter());this._model.addEventListener(WebInspector.TimelineModel.Events.RecordingStarted,this._onRecordingStarted,this);this._model.addEventListener(WebInspector.TimelineModel.Events.RecordingStopped,this._onRecordingStopped,this);this._model.addEventListener(WebInspector.TimelineModel.Events.RecordsCleared,this._onRecordsCleared,this);this._model.addEventListener(WebInspector.TimelineModel.Events.RecordFilterChanged,this._refreshViews,this);this._model.addEventListener(WebInspector.TimelineModel.Events.BufferUsage,this._onTracingBufferUsage,this);this._model.addEventListener(WebInspector.TimelineModel.Events.RetrieveEventsProgress,this._onRetrieveEventsProgress,this);this._categoryFilter=new WebInspector.TimelineCategoryFilter();this._durationFilter=new WebInspector.TimelineIsLongFilter();this._textFilter=new WebInspector.TimelineTextFilter();this._model.addFilter(this._categoryFilter);this._model.addFilter(this._durationFilter);this._model.addFilter(this._textFilter);this._model.addFilter(new WebInspector.TimelineStaticFilter());this._currentViews=[];this._overviewModeSetting=WebInspector.settings.createSetting("timelineOverviewMode",WebInspector.TimelinePanel.OverviewMode.Frames);this._flameChartEnabledSetting=WebInspector.settings.createSetting("timelineFlameChartEnabled",true);this._createStatusBarItems();var topPaneElement=this.element.createChild("div","hbox");topPaneElement.id="timeline-overview-panel";this._overviewPane=new WebInspector.TimelineOverviewPane(this._model);this._overviewPane.addEventListener(WebInspector.TimelineOverviewPane.Events.WindowChanged,this._onWindowChanged.bind(this));this._overviewPane.show(topPaneElement);this._createFileSelector();this._registerShortcuts();WebInspector.targetManager.addEventListener(WebInspector.TargetManager.Events.WillReloadPage,this._willReloadPage,this);WebInspector.targetManager.addEventListener(WebInspector.TargetManager.Events.Load,this._loadEventFired,this);this._detailsSplitView=new WebInspector.SplitView(false,true,"timelinePanelDetailsSplitViewState");this._detailsSplitView.element.classList.add("timeline-details-split");this._detailsView=new WebInspector.TimelineDetailsView(this._model);this._detailsSplitView.installResizer(this._detailsView.headerElement());this._detailsSplitView.setSidebarView(this._detailsView);this._searchableView=new WebInspector.SearchableView(this);this._searchableView.setMinimumSize(0,25);this._searchableView.element.classList.add("searchable-view");this._detailsSplitView.setMainView(this._searchableView);this._stackView=new WebInspector.StackView(false);this._stackView.show(this._searchableView.element);this._stackView.element.classList.add("timeline-view-stack");this._onModeChanged();this._detailsSplitView.show(this.element);WebInspector.targetManager.addEventListener(WebInspector.TargetManager.Events.SuspendStateChanged,this._onSuspendStateChanged,this);}
WebInspector.TimelinePanel.OverviewMode={Events:"Events",Frames:"Frames"};WebInspector.TimelinePanel.DetailsTab={Details:"Details",BottomUpChart:"BottomUpChart",PaintProfiler:"PaintProfiler",LayerViewer:"LayerViewer"};WebInspector.TimelinePanel.rowHeight=18;WebInspector.TimelinePanel.headerHeight=20;WebInspector.TimelinePanel._aggregatedStatsKey=Symbol("aggregatedStats");WebInspector.TimelinePanel.durationFilterPresetsMs=[0,1,15];WebInspector.TimelinePanel.prototype={searchableView:function()
{return this._searchableView;},wasShown:function()
{if(!WebInspector.TimelinePanel._categoryStylesInitialized){WebInspector.TimelinePanel._categoryStylesInitialized=true;var style=createElement("style");var categories=WebInspector.TimelineUIUtils.categories();style.textContent=Object.values(categories).map(WebInspector.TimelineUIUtils.createStyleRuleForCategory).join("\n");this.element.ownerDocument.head.appendChild(style);}},windowStartTime:function()
{if(this._windowStartTime)
return this._windowStartTime;return this._model.minimumRecordTime();},windowEndTime:function()
{if(this._windowEndTime<Infinity)
return this._windowEndTime;return this._model.maximumRecordTime()||Infinity;},_sidebarResized:function(event)
{var width=(event.data);for(var i=0;i<this._currentViews.length;++i)
this._currentViews[i].setSidebarSize(width);},_onWindowChanged:function(event)
{this._windowStartTime=event.data.startTime;this._windowEndTime=event.data.endTime;for(var i=0;i<this._currentViews.length;++i)
this._currentViews[i].setWindowTimes(this._windowStartTime,this._windowEndTime);},requestWindowTimes:function(windowStartTime,windowEndTime)
{this._overviewPane.requestWindowTimes(windowStartTime,windowEndTime);},_frameModel:function()
{if(!this._lazyFrameModel){var tracingFrameModel=new WebInspector.TracingTimelineFrameModel();tracingFrameModel.addTraceEvents(this._model.target(),this._model.inspectedTargetEvents(),this._tracingModel.sessionId()||"");this._lazyFrameModel=tracingFrameModel;}
return this._lazyFrameModel;},_layersView:function()
{if(this._lazyLayersView)
return this._lazyLayersView;this._lazyLayersView=new WebInspector.TimelineLayersView();this._lazyLayersView.setTimelineModelAndDelegate(this._model,this);return this._lazyLayersView;},_paintProfilerView:function()
{if(this._lazyPaintProfilerView)
return this._lazyPaintProfilerView;this._lazyPaintProfilerView=new WebInspector.TimelinePaintProfilerView((this._frameModel()));return this._lazyPaintProfilerView;},_addModeView:function(modeView)
{modeView.setWindowTimes(this.windowStartTime(),this.windowEndTime());modeView.refreshRecords(this._textFilter._regex);this._stackView.appendView(modeView.view(),"timelinePanelTimelineStackSplitViewState");modeView.view().addEventListener(WebInspector.SplitView.Events.SidebarSizeChanged,this._sidebarResized,this);this._currentViews.push(modeView);},_removeAllModeViews:function()
{for(var i=0;i<this._currentViews.length;++i){this._currentViews[i].removeEventListener(WebInspector.SplitView.Events.SidebarSizeChanged,this._sidebarResized,this);this._currentViews[i].dispose();}
this._currentViews=[];this._stackView.detachChildViews();},_createSettingCheckbox:function(name,setting,tooltip)
{if(!this._recordingOptionUIControls)
this._recordingOptionUIControls=[];var checkboxItem=new WebInspector.StatusBarCheckbox(name,tooltip,setting);this._recordingOptionUIControls.push(checkboxItem);return checkboxItem;},_createStatusBarItems:function()
{this._panelToolbar=new WebInspector.StatusBar(this.element);this.toggleTimelineButton=new WebInspector.StatusBarButton("Record timeline","record-status-bar-item");this.toggleTimelineButton.addEventListener("click",this._toggleTimelineButtonClicked,this);this._panelToolbar.appendStatusBarItem(this.toggleTimelineButton);this._updateToggleTimelineButton(false);var clearButton=new WebInspector.StatusBarButton(WebInspector.UIString("Clear recording"),"clear-status-bar-item");clearButton.addEventListener("click",this._onClearButtonClick,this);this._panelToolbar.appendStatusBarItem(clearButton);this._filterBar=this._createFilterBar();this._panelToolbar.appendStatusBarItem(this._filterBar.filterButton());var garbageCollectButton=new WebInspector.StatusBarButton(WebInspector.UIString("Collect garbage"),"garbage-collect-status-bar-item");garbageCollectButton.addEventListener("click",this._garbageCollectButtonClicked,this);this._panelToolbar.appendStatusBarItem(garbageCollectButton);var viewModeLabel=new WebInspector.StatusBarText(WebInspector.UIString("View:"),"status-bar-group-label");this._panelToolbar.appendStatusBarItem(viewModeLabel);var framesToggleButton=new WebInspector.StatusBarButton(WebInspector.UIString("Frames view. (Activity split into frames)"),"histogram-status-bar-item");framesToggleButton.setToggled(this._overviewModeSetting.get()===WebInspector.TimelinePanel.OverviewMode.Frames);framesToggleButton.addEventListener("click",this._overviewModeChanged.bind(this,framesToggleButton));this._panelToolbar.appendStatusBarItem(framesToggleButton);this._flameChartToggleButton=new WebInspector.StatusBarButton(WebInspector.UIString("Flame chart view. (Use WASD or time selection to navigate)"),"flame-chart-status-bar-item");this._flameChartToggleButton.setToggled(this._flameChartEnabledSetting.get());this._flameChartToggleButton.addEventListener("click",this._flameChartEnabledChanged.bind(this));this._panelToolbar.appendStatusBarItem(this._flameChartToggleButton);var captureSettingsLabel=new WebInspector.StatusBarText(WebInspector.UIString("Capture:"),"status-bar-group-label");this._panelToolbar.appendStatusBarItem(captureSettingsLabel);this._captureNetworkSetting=WebInspector.settings.createSetting("timelineCaptureNetwork",false);this._captureNetworkSetting.addChangeListener(this._onNetworkChanged,this);if(Runtime.experiments.isEnabled("networkRequestsOnTimeline")){this._panelToolbar.appendStatusBarItem(this._createSettingCheckbox(WebInspector.UIString("Network"),this._captureNetworkSetting,WebInspector.UIString("Capture network requests information")));}
this._captureCausesSetting=WebInspector.settings.createSetting("timelineCaptureCauses",true);this._captureCausesSetting.addChangeListener(this._refreshViews,this);this._panelToolbar.appendStatusBarItem(this._createSettingCheckbox(WebInspector.UIString("Causes"),this._captureCausesSetting,WebInspector.UIString("Capture causes (e.g., stack traces) for timeline events. (Has performance overhead)")));this._enableJSSamplingSettingSetting=WebInspector.settings.createSetting("timelineEnableJSSampling",false);this._panelToolbar.appendStatusBarItem(this._createSettingCheckbox(WebInspector.UIString("JS Stacks"),this._enableJSSamplingSettingSetting,WebInspector.UIString("Capture JavaScript stacks with sampling profiler. (Has performance overhead)")));this._captureMemorySetting=WebInspector.settings.createSetting("timelineCaptureMemory",false);this._panelToolbar.appendStatusBarItem(this._createSettingCheckbox(WebInspector.UIString("Memory"),this._captureMemorySetting,WebInspector.UIString("Capture memory information on every timeline event.")));this._captureMemorySetting.addChangeListener(this._onModeChanged,this);this._captureLayersAndPicturesSetting=WebInspector.settings.createSetting("timelineCaptureLayersAndPictures",false);this._panelToolbar.appendStatusBarItem(this._createSettingCheckbox(WebInspector.UIString("Paint"),this._captureLayersAndPicturesSetting,WebInspector.UIString("Capture graphics layer positions and painted pictures.  (Has performance overhead)")));this._progressStatusBarItem=new WebInspector.StatusBarItem(createElement("div"));this._progressStatusBarItem.setVisible(false);this._panelToolbar.appendStatusBarItem(this._progressStatusBarItem);this._filtersContainer=this.element.createChild("div","timeline-filters-header hidden");this._filtersContainer.appendChild(this._filterBar.filtersElement());this._filterBar.addEventListener(WebInspector.FilterBar.Events.FiltersToggled,this._onFiltersToggled,this);this._filterBar.setName("timelinePanel");},_createFilterBar:function()
{this._filterBar=new WebInspector.FilterBar();this._filters={};this._filters._textFilterUI=new WebInspector.TextFilterUI();this._filters._textFilterUI.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._textFilterChanged,this);this._filterBar.addFilter(this._filters._textFilterUI);var durationOptions=[];for(var presetIndex=0;presetIndex<WebInspector.TimelinePanel.durationFilterPresetsMs.length;++presetIndex){var durationMs=WebInspector.TimelinePanel.durationFilterPresetsMs[presetIndex];var durationOption={};if(!durationMs){durationOption.label=WebInspector.UIString("All");durationOption.title=WebInspector.UIString("Show all records");}else{durationOption.label=WebInspector.UIString("\u2265 %dms",durationMs);durationOption.title=WebInspector.UIString("Hide records shorter than %dms",durationMs);}
durationOption.value=durationMs;durationOptions.push(durationOption);}
this._filters._durationFilterUI=new WebInspector.ComboBoxFilterUI(durationOptions);this._filters._durationFilterUI.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._durationFilterChanged,this);this._filterBar.addFilter(this._filters._durationFilterUI);this._filters._categoryFiltersUI={};var categories=WebInspector.TimelineUIUtils.categories();for(var categoryName in categories){var category=categories[categoryName];if(!category.visible)
continue;var filter=new WebInspector.CheckboxFilterUI(category.name,category.title);this._filters._categoryFiltersUI[category.name]=filter;filter.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._categoriesFilterChanged.bind(this,categoryName),this);this._filterBar.addFilter(filter);}
return this._filterBar;},_textFilterChanged:function(event)
{var searchQuery=this._filters._textFilterUI.value();this.searchCanceled();this._textFilter.setRegex(searchQuery?createPlainTextSearchRegex(searchQuery,"i"):null);},_durationFilterChanged:function()
{var duration=this._filters._durationFilterUI.value();var minimumRecordDuration=parseInt(duration,10);this._durationFilter.setMinimumRecordDuration(minimumRecordDuration);},_categoriesFilterChanged:function(name,event)
{var categories=WebInspector.TimelineUIUtils.categories();categories[name].hidden=!this._filters._categoryFiltersUI[name].checked();this._categoryFilter.notifyFilterChanged();},_onFiltersToggled:function(event)
{var toggled=(event.data);this._filtersContainer.classList.toggle("hidden",!toggled);this.doResize();},_prepareToLoadTimeline:function()
{if(this._recordingInProgress()){this._updateToggleTimelineButton(false);this._stopRecording();}
function finishLoading()
{this._setOperationInProgress(null);this._updateToggleTimelineButton(false);this._hideProgressPane();}
var progressIndicator=new WebInspector.ProgressIndicator();progressIndicator.addEventListener(WebInspector.Progress.Events.Done,finishLoading.bind(this));this._setOperationInProgress(progressIndicator);return progressIndicator;},_setOperationInProgress:function(indicator)
{this._operationInProgress=!!indicator;this._panelToolbar.setEnabled(!this._operationInProgress);this._dropTarget.setEnabled(!this._operationInProgress);this._progressStatusBarItem.setVisible(this._operationInProgress);this._progressStatusBarItem.element.removeChildren();if(indicator)
this._progressStatusBarItem.element.appendChild(indicator.element);},_registerShortcuts:function()
{this.registerShortcuts(WebInspector.ShortcutsScreen.TimelinePanelShortcuts.StartStopRecording,this._toggleTimelineButtonClicked.bind(this));this.registerShortcuts(WebInspector.ShortcutsScreen.TimelinePanelShortcuts.SaveToFile,this._saveToFile.bind(this));this.registerShortcuts(WebInspector.ShortcutsScreen.TimelinePanelShortcuts.LoadFromFile,this._selectFileToLoad.bind(this));this.registerShortcuts(WebInspector.ShortcutsScreen.TimelinePanelShortcuts.JumpToPreviousFrame,this._jumpToFrame.bind(this,-1));this.registerShortcuts(WebInspector.ShortcutsScreen.TimelinePanelShortcuts.JumpToNextFrame,this._jumpToFrame.bind(this,1));},_createFileSelector:function()
{if(this._fileSelectorElement)
this._fileSelectorElement.remove();this._fileSelectorElement=WebInspector.createFileSelectorElement(this._loadFromFile.bind(this));this.element.appendChild(this._fileSelectorElement);},_contextMenu:function(event)
{var contextMenu=new WebInspector.ContextMenu(event);contextMenu.appendItem(WebInspector.UIString.capitalize("Save Timeline ^data\u2026"),this._saveToFile.bind(this),this._operationInProgress);contextMenu.appendItem(WebInspector.UIString.capitalize("Load Timeline ^data\u2026"),this._selectFileToLoad.bind(this),this._operationInProgress);contextMenu.show();},_saveToFile:function()
{if(this._operationInProgress)
return true;var now=new Date();var fileName="TimelineRawData-"+now.toISO8601Compact()+".json";var stream=new WebInspector.FileOutputStream();function callback(accepted)
{if(!accepted)
return;var saver=new WebInspector.TracingTimelineSaver(stream);this._tracingModelBackingStorage.writeToStream(stream,saver);}
stream.open(fileName,callback.bind(this));return true;},_selectFileToLoad:function(){this._fileSelectorElement.click();return true;},_loadFromFile:function(file)
{if(this._operationInProgress)
return;this._model.loadFromFile(file,this._prepareToLoadTimeline());this._createFileSelector();},_loadFromURL:function(url)
{console.assert(!this._operationInProgress);this._model.loadFromURL(url,this._prepareToLoadTimeline());},_refreshViews:function()
{for(var i=0;i<this._currentViews.length;++i){var view=this._currentViews[i];view.refreshRecords(this._textFilter._regex);}
this._updateSelectionDetails();},_overviewModeChanged:function(button)
{var oldMode=this._overviewModeSetting.get();if(oldMode===WebInspector.TimelinePanel.OverviewMode.Events){this._overviewModeSetting.set(WebInspector.TimelinePanel.OverviewMode.Frames);button.setToggled(true);}else{this._overviewModeSetting.set(WebInspector.TimelinePanel.OverviewMode.Events);button.setToggled(false);}
this._onModeChanged();},_flameChartEnabledChanged:function()
{var oldValue=this._flameChartEnabledSetting.get();var newValue=!oldValue;this._flameChartEnabledSetting.set(newValue);this._flameChartToggleButton.setToggled(newValue);this._onModeChanged();},_onModeChanged:function()
{this._stackView.detach();var isFrameMode=this._overviewModeSetting.get()===WebInspector.TimelinePanel.OverviewMode.Frames;this._removeAllModeViews();this._overviewControls=[];if(isFrameMode)
this._overviewControls.push(new WebInspector.TimelineFrameOverview(this._model,this._frameModel()));else
this._overviewControls.push(new WebInspector.TimelineEventOverview(this._model));if(this._flameChartEnabledSetting.get()){this._filterBar.filterButton().setEnabled(false);this._filtersContainer.classList.toggle("hidden",true);this._flameChart=new WebInspector.TimelineFlameChartView(this,this._model,this._frameModel());this._flameChart.enableNetworkPane(this._captureNetworkSetting.get());this._addModeView(this._flameChart);}else{this._flameChart=null;this._filterBar.filterButton().setEnabled(true);this._filtersContainer.classList.toggle("hidden",!this._filterBar.filtersToggled());var timelineView=new WebInspector.TimelineView(this,this._model)
this._addModeView(timelineView);timelineView.setFrameModel(isFrameMode?this._frameModel():null);}
if(this._captureMemorySetting.get()){if(!isFrameMode)
this._overviewControls.push(new WebInspector.TimelineMemoryOverview(this._model));this._addModeView(new WebInspector.MemoryCountersGraph(this,this._model));}
var mainTarget=WebInspector.targetManager.mainTarget();this._overviewPane.setOverviewControls(this._overviewControls);this.doResize();this._selection=null;this._updateSelectionDetails();this._stackView.show(this._searchableView.element);},_onNetworkChanged:function()
{if(this._flameChart)
this._flameChart.enableNetworkPane(this._captureNetworkSetting.get(),true);},_setUIControlsEnabled:function(enabled){function handler(statusBarItem)
{statusBarItem.setEnabled(enabled);}
this._recordingOptionUIControls.forEach(handler);},_startRecording:function(userInitiated)
{this._autoRecordGeneration=userInitiated?null:{};var enableJSSampling=this._enableJSSamplingSettingSetting&&this._enableJSSamplingSettingSetting.get();this._model.startRecording(this._captureCausesSetting.get(),enableJSSampling,this._captureMemorySetting.get(),this._captureLayersAndPicturesSetting&&this._captureLayersAndPicturesSetting.get());if(this._lazyFrameModel)
this._lazyFrameModel.setMergeRecords(false);for(var i=0;i<this._overviewControls.length;++i)
this._overviewControls[i].timelineStarted();if(userInitiated)
WebInspector.userMetrics.TimelineStarted.record();this._setUIControlsEnabled(false);},_stopRecording:function()
{this._stopPending=true;this._updateToggleTimelineButton(false);this._autoRecordGeneration=null;this._model.stopRecording();if(this._progressElement)
this._updateProgress(WebInspector.UIString("Retrieving events\u2026"));for(var i=0;i<this._overviewControls.length;++i)
this._overviewControls[i].timelineStopped();this._setUIControlsEnabled(true);},_onSuspendStateChanged:function()
{this._updateToggleTimelineButton(this.toggleTimelineButton.toggled());},_updateToggleTimelineButton:function(toggled)
{this.toggleTimelineButton.setToggled(toggled);if(toggled){this.toggleTimelineButton.setTitle(WebInspector.UIString("Stop"));this.toggleTimelineButton.setEnabled(true);}else if(this._stopPending){this.toggleTimelineButton.setTitle(WebInspector.UIString("Stop pending"));this.toggleTimelineButton.setEnabled(false);}else if(WebInspector.targetManager.allTargetsSuspended()){this.toggleTimelineButton.setTitle(WebInspector.anotherProfilerActiveLabel());this.toggleTimelineButton.setEnabled(false);}else{this.toggleTimelineButton.setTitle(WebInspector.UIString("Record"));this.toggleTimelineButton.setEnabled(true);}},_toggleTimelineButtonClicked:function()
{if(!this.toggleTimelineButton.enabled())
return true;if(this._operationInProgress)
return true;if(this._recordingInProgress())
this._stopRecording();else
this._startRecording(true);return true;},_garbageCollectButtonClicked:function()
{var targets=WebInspector.targetManager.targets();for(var i=0;i<targets.length;++i)
targets[i].heapProfilerAgent().collectGarbage();},_onClearButtonClick:function()
{this._tracingModel.reset();this._model.reset();},_onRecordsCleared:function()
{this.requestWindowTimes(0,Infinity);delete this._selection;if(this._lazyFrameModel)
this._lazyFrameModel.reset();for(var i=0;i<this._currentViews.length;++i)
this._currentViews[i].reset();for(var i=0;i<this._overviewControls.length;++i)
this._overviewControls[i].reset();this._selection=null;this._updateSelectionDetails();},_onRecordingStarted:function(event)
{this._updateToggleTimelineButton(true);if(event.data&&event.data.fromFile)
this._updateProgress(WebInspector.UIString("Loading..."));else
this._updateProgress(WebInspector.UIString("%d events collected",0));},_recordingInProgress:function()
{return this.toggleTimelineButton.toggled();},_onTracingBufferUsage:function(event)
{var usage=(event.data);this._updateProgress(WebInspector.UIString("Buffer usage %d%%",Math.round(usage*100)));},_onRetrieveEventsProgress:function(event)
{var progress=(event.data);this._updateProgress(WebInspector.UIString("Retrieving events\u2026 %d%%",Math.round(progress*100)));},_updateProgress:function(progressMessage)
{if(!this._progressElement)
this._showProgressPane();this._progressElement.textContent=progressMessage;},_showProgressPane:function()
{this._hideProgressPane();this._progressElement=this._searchableView.element.createChild("div","timeline-progress-pane fill");},_hideProgressPane:function()
{if(this._progressElement)
this._progressElement.remove();delete this._progressElement;},_onRecordingStopped:function()
{this._stopPending=false;this._updateToggleTimelineButton(false);if(this._lazyFrameModel){this._lazyFrameModel.reset();this._lazyFrameModel.addTraceEvents(this._model.target(),this._model.inspectedTargetEvents(),this._tracingModel.sessionId());}
this.requestWindowTimes(this._model.minimumRecordTime(),this._model.maximumRecordTime());this._refreshViews();this._hideProgressPane();this._overviewPane.update();this._updateSearchHighlight(false,true);},_willReloadPage:function(event)
{if(this._operationInProgress||this._recordingInProgress()||!this.isShowing())
return;this._startRecording(false);},_loadEventFired:function(event)
{if(!this._recordingInProgress()||!this._autoRecordGeneration)
return;setTimeout(stopRecordingOnReload.bind(this,this._autoRecordGeneration),this._millisecondsToRecordAfterLoadEvent);function stopRecordingOnReload(recordGeneration)
{if(this._autoRecordGeneration!==recordGeneration)
return;this._stopRecording();}},jumpToNextSearchResult:function()
{if(!this._searchResults||!this._searchResults.length)
return;var index=this._selectedSearchResult?this._searchResults.indexOf(this._selectedSearchResult):-1;this._jumpToSearchResult(index+1);},jumpToPreviousSearchResult:function()
{if(!this._searchResults||!this._searchResults.length)
return;var index=this._selectedSearchResult?this._searchResults.indexOf(this._selectedSearchResult):0;this._jumpToSearchResult(index-1);},supportsCaseSensitiveSearch:function()
{return false;},supportsRegexSearch:function()
{return false;},_jumpToSearchResult:function(index)
{this._selectSearchResult((index+this._searchResults.length)%this._searchResults.length);this._currentViews[0].highlightSearchResult(this._selectedSearchResult,this._searchRegex,true);},_selectSearchResult:function(index)
{this._selectedSearchResult=this._searchResults[index];this._searchableView.updateCurrentMatchIndex(index);},_clearHighlight:function()
{this._currentViews[0].highlightSearchResult(null);},_updateSearchHighlight:function(revealRecord,shouldJump,jumpBackwards)
{if(!this._textFilter.isEmpty()||!this._searchRegex){this._clearHighlight();return;}
if(!this._searchResults)
this._updateSearchResults(shouldJump,jumpBackwards);this._currentViews[0].highlightSearchResult(this._selectedSearchResult,this._searchRegex,revealRecord);},_updateSearchResults:function(shouldJump,jumpBackwards)
{var searchRegExp=this._searchRegex;if(!searchRegExp)
return;var matches=[];function processRecord(record)
{if(record.endTime()<this._windowStartTime||record.startTime()>this._windowEndTime)
return;if(WebInspector.TimelineUIUtils.testContentMatching(record,searchRegExp))
matches.push(record);}
this._model.forAllFilteredRecords(processRecord.bind(this));var matchesCount=matches.length;if(matchesCount){this._searchResults=matches;this._searchableView.updateSearchMatchesCount(matchesCount);var selectedIndex=matches.indexOf(this._selectedSearchResult);if(shouldJump&&selectedIndex===-1)
selectedIndex=jumpBackwards?this._searchResults.length-1:0;this._selectSearchResult(selectedIndex);}else{this._searchableView.updateSearchMatchesCount(0);delete this._selectedSearchResult;}},searchCanceled:function()
{this._clearHighlight();delete this._searchResults;delete this._selectedSearchResult;delete this._searchRegex;},performSearch:function(searchConfig,shouldJump,jumpBackwards)
{var query=searchConfig.query;this._searchRegex=createPlainTextSearchRegex(query,"i");delete this._searchResults;this._updateSearchHighlight(true,shouldJump,jumpBackwards);},_updateSelectionDetails:function()
{if(!this._selection)
this._selection=WebInspector.TimelineSelection.fromRange(this._windowStartTime,this._windowEndTime);switch(this._selection.type()){case WebInspector.TimelineSelection.Type.Record:var record=(this._selection.object());var event=record.traceEvent();WebInspector.TimelineUIUtils.buildTraceEventDetails(event,this._model,this._detailsLinkifier,this._appendDetailsTabsForTraceEventAndShowDetails.bind(this,event));break;case WebInspector.TimelineSelection.Type.TraceEvent:var event=(this._selection.object());WebInspector.TimelineUIUtils.buildTraceEventDetails(event,this._model,this._detailsLinkifier,this._appendDetailsTabsForTraceEventAndShowDetails.bind(this,event));break;case WebInspector.TimelineSelection.Type.Frame:var frame=(this._selection.object());this.showInDetails(WebInspector.TimelineUIUtils.generateDetailsContentForFrame(this._lazyFrameModel,frame));if(frame.layerTree){var layersView=this._layersView();layersView.showLayerTree(frame.layerTree,frame.paints);if(!this._detailsView.hasTab(WebInspector.TimelinePanel.DetailsTab.LayerViewer))
this._detailsView.appendTab(WebInspector.TimelinePanel.DetailsTab.LayerViewer,WebInspector.UIString("Layers"),layersView);}
break;case WebInspector.TimelineSelection.Type.Range:this._updateSelectedRangeStats(this._selection._startTime,this._selection._endTime);break;}
this._detailsView.updateContents(this._selection);},_frameForSelection:function(selection)
{switch(selection.type()){case WebInspector.TimelineSelection.Type.Frame:return(selection.object());case WebInspector.TimelineSelection.Type.Range:return null;case WebInspector.TimelineSelection.Type.Record:case WebInspector.TimelineSelection.Type.TraceEvent:return this._frameModel().filteredFrames(selection._endTime,selection._endTime)[0];default:console.assert(false,"Should never be reached");return null;}},_jumpToFrame:function(offset)
{var currentFrame=this._frameForSelection(this._selection);if(!currentFrame)
return;var frames=this._frameModel().frames();var index=frames.indexOf(currentFrame);console.assert(index>=0,"Can't find current frame in the frame list");index=Number.constrain(index+offset,0,frames.length-1);var newFrame=frames[index];var timeShift=0;if(this._windowEndTime<newFrame.endTime)
timeShift=newFrame.endTime-this._windowEndTime;else if(this._windowStartTime>newFrame.startTime)
timeShift=newFrame.startTime-this._windowStartTime;if(timeShift)
this.requestWindowTimes(this._windowStartTime+timeShift,this._windowEndTime+timeShift);this.select(WebInspector.TimelineSelection.fromFrame(newFrame));return true;},_appendDetailsTabsForTraceEventAndShowDetails:function(event,content)
{this.showInDetails(content);if(event.name===WebInspector.TimelineModel.RecordType.Paint||event.name===WebInspector.TimelineModel.RecordType.RasterTask)
this._showEventInPaintProfiler(event);},_showEventInPaintProfiler:function(event,isCloseable)
{var target=this._model.target();if(!target)
return;var paintProfilerView=this._paintProfilerView();var hasProfileData=paintProfilerView.setEvent(target,event);if(!hasProfileData)
return;if(!this._detailsView.hasTab(WebInspector.TimelinePanel.DetailsTab.PaintProfiler))
this._detailsView.appendTab(WebInspector.TimelinePanel.DetailsTab.PaintProfiler,WebInspector.UIString("Paint Profiler"),paintProfilerView,undefined,undefined,isCloseable);},_collectAggregatedStatsForRecord:function(record,startTime,endTime,aggregatedStats)
{var records=[];if(!record.endTime()||record.endTime()<startTime||record.startTime()>endTime)
return;var childrenTime=0;var children=record.children()||[];for(var i=0;i<children.length;++i){var child=children[i];if(!child.endTime()||child.endTime()<startTime||child.startTime()>endTime)
continue;childrenTime+=Math.min(endTime,child.endTime())-Math.max(startTime,child.startTime());this._collectAggregatedStatsForRecord(child,startTime,endTime,aggregatedStats);}
var categoryName=WebInspector.TimelineUIUtils.categoryForRecord(record).name;var ownTime=Math.min(endTime,record.endTime())-Math.max(startTime,record.startTime())-childrenTime;aggregatedStats[categoryName]=(aggregatedStats[categoryName]||0)+ownTime;},_updateSelectedRangeStats:function(startTime,endTime)
{if(startTime<0)
return;var aggregatedStats={};function compareEndTime(value,task)
{return value<task.endTime()?-1:1;}
var mainThreadTasks=this._model.mainThreadTasks();var taskIndex=insertionIndexForObjectInListSortedByFunction(startTime,mainThreadTasks,compareEndTime);for(;taskIndex<mainThreadTasks.length;++taskIndex){var task=mainThreadTasks[taskIndex];if(task.startTime()>endTime)
break;if(task.startTime()>startTime&&task.endTime()<endTime){var taskStats=task[WebInspector.TimelinePanel._aggregatedStatsKey];if(!taskStats){taskStats={};this._collectAggregatedStatsForRecord(task,startTime,endTime,taskStats);task[WebInspector.TimelinePanel._aggregatedStatsKey]=taskStats;}
for(var key in taskStats)
aggregatedStats[key]=(aggregatedStats[key]||0)+taskStats[key];continue;}
this._collectAggregatedStatsForRecord(task,startTime,endTime,aggregatedStats);}
var aggregatedTotal=0;for(var categoryName in aggregatedStats)
aggregatedTotal+=aggregatedStats[categoryName];aggregatedStats["idle"]=Math.max(0,endTime-startTime-aggregatedTotal);var contentHelper=new WebInspector.TimelineDetailsContentHelper(null,null,null,true);var pieChart=WebInspector.TimelineUIUtils.generatePieChart(aggregatedStats);var startOffset=startTime-this._model.minimumRecordTime();var endOffset=endTime-this._model.minimumRecordTime();contentHelper.appendTextRow(WebInspector.UIString("Range"),WebInspector.UIString("%s \u2013 %s",Number.millisToString(startOffset),Number.millisToString(endOffset)));contentHelper.appendElementRow(WebInspector.UIString("Aggregated Time"),pieChart);this.showInDetails(contentHelper.element);},select:function(selection,preferredTab)
{this._detailsLinkifier.reset();this._selection=selection;if(preferredTab)
this._detailsView.setPreferredTab(preferredTab);for(var i=0;i<this._currentViews.length;++i){var view=this._currentViews[i];view.setSelection(selection);}
this._updateSelectionDetails();},showNestedRecordDetails:function(record)
{var event=record.traceEvent();this._showEventInPaintProfiler(event,true);this._detailsView.selectTab(WebInspector.TimelinePanel.DetailsTab.PaintProfiler,true);},showInDetails:function(node)
{this._detailsView.setContent(node);},_handleDrop:function(dataTransfer)
{var items=dataTransfer.items;if(!items.length)
return;var item=items[0];if(item.kind==="string"){var url=dataTransfer.getData("text/uri-list");if(new WebInspector.ParsedURL(url).isValid)
this._loadFromURL(url);}else if(item.kind==="file"){var entry=items[0].webkitGetAsEntry();if(!entry.isFile)
return;entry.file(this._loadFromFile.bind(this));}},__proto__:WebInspector.Panel.prototype}
WebInspector.TimelineDetailsView=function(timelineModel)
{WebInspector.TabbedPane.call(this);this.element.classList.add("timeline-details");this._defaultDetailsView=new WebInspector.VBox();this._defaultDetailsView.element.classList.add("timeline-details-view");this._defaultDetailsContentElement=this._defaultDetailsView.element.createChild("div","timeline-details-view-body vbox");this.appendTab(WebInspector.TimelinePanel.DetailsTab.Details,WebInspector.UIString("Summary"),this._defaultDetailsView);this.setPreferredTab(WebInspector.TimelinePanel.DetailsTab.Details);if(Runtime.experiments.isEnabled("timelineDetailsChart")){this._heavyChartView=new WebInspector.TimelineDetailsView.BottomUpChartView(timelineModel);this.appendTab(WebInspector.TimelinePanel.DetailsTab.BottomUpChart,WebInspector.UIString("Costly Functions"),this._heavyChartView);}
this._staticTabs=[WebInspector.TimelinePanel.DetailsTab.Details,WebInspector.TimelinePanel.DetailsTab.BottomUpChart];this.addEventListener(WebInspector.TabbedPane.EventTypes.TabSelected,this._tabSelected,this);}
WebInspector.TimelineDetailsView.prototype={setContent:function(node)
{var allTabs=this.allTabs();for(var i=0;i<allTabs.length;++i){var tabId=allTabs[i].id;if(this._staticTabs.indexOf(tabId)!==-1)
this.closeTab(tabId);}
this._defaultDetailsContentElement.removeChildren();this._defaultDetailsContentElement.appendChild(node);},updateContents:function(selection)
{this._selection=selection;if(this.selectedTabId===WebInspector.TimelinePanel.DetailsTab.BottomUpChart&&this._heavyChartView)
this._heavyChartView.updateContents(selection);},appendTab:function(id,tabTitle,view,tabTooltip,userGesture,isCloseable)
{WebInspector.TabbedPane.prototype.appendTab.call(this,id,tabTitle,view,tabTooltip,userGesture,isCloseable);if(this._preferredTabId!==this.selectedTabId)
this.selectTab(id);},setPreferredTab:function(tabId)
{this._preferredTabId=tabId;},_tabSelected:function(event)
{if(!event.data.isUserGesture)
return;this.setPreferredTab(event.data.tabId);this.updateContents(this._selection);},__proto__:WebInspector.TabbedPane.prototype}
WebInspector.TimelineDetailsView.BottomUpChartView=function(model){WebInspector.VBox.call(this);this._model=model;}
WebInspector.TimelineDetailsView.BottomUpChartView.prototype={_init:function()
{if(this._heavyChart)
return;this._dataProvider=new WebInspector.TimelineFlameChartBottomUpDataProvider(this._model);this._heavyChart=new WebInspector.FlameChart(this._dataProvider,this,true);this._heavyChart.show(this.element);},updateContents:function(selection)
{this._init();this._heavyChart.reset();this._dataProvider.setWindowTimes(selection._startTime,selection._endTime);this._dataProvider.timelineData();this._heavyChart.setWindowTimes(0,this._dataProvider.totalTime());},requestWindowTimes:function(startTime,endTime)
{this._heavyChart.setWindowTimes(startTime,endTime);},select:function(selection,preferredTab){},showNestedRecordDetails:function(record){},showInDetails:function(node){},updateBoxSelection:function(startTime,endTime)
{},__proto__:WebInspector.VBox.prototype}
WebInspector.TimelineSelection=function()
{}
WebInspector.TimelineSelection.Type={Record:"Record",Frame:"Frame",TraceEvent:"TraceEvent",Range:"Range"};WebInspector.TimelineSelection.fromRecord=function(record)
{var selection=new WebInspector.TimelineSelection();selection._type=WebInspector.TimelineSelection.Type.Record;selection._object=record;return selection;}
WebInspector.TimelineSelection.fromFrame=function(frame)
{var selection=new WebInspector.TimelineSelection();selection._type=WebInspector.TimelineSelection.Type.Frame;selection._object=frame;selection._startTime=frame.startTime;selection._endTime=frame.endTime;return selection;}
WebInspector.TimelineSelection.fromTraceEvent=function(event)
{var selection=new WebInspector.TimelineSelection();selection._type=WebInspector.TimelineSelection.Type.TraceEvent;selection._object=event;selection._startTime=event.startTime;selection._endTime=event.endTime||(event.startTime+1);return selection;}
WebInspector.TimelineSelection.fromRange=function(startTime,endTime)
{var selection=new WebInspector.TimelineSelection();selection._type=WebInspector.TimelineSelection.Type.Range;selection._startTime=startTime;selection._endTime=endTime;return selection;}
WebInspector.TimelineSelection.prototype={type:function()
{return this._type;},object:function()
{return this._object;}};WebInspector.TimelineModeView=function()
{}
WebInspector.TimelineModeView.prototype={view:function(){},dispose:function(){},reset:function(){},refreshRecords:function(textFilter){},highlightSearchResult:function(record,regex,selectRecord){},setWindowTimes:function(startTime,endTime){},setSidebarSize:function(width){},setSelection:function(selection){},}
WebInspector.TimelineModeViewDelegate=function(){}
WebInspector.TimelineModeViewDelegate.prototype={requestWindowTimes:function(startTime,endTime){},select:function(selection,preferredTab){},showNestedRecordDetails:function(record){},showInDetails:function(node){},}
WebInspector.TimelineCategoryFilter=function()
{WebInspector.TimelineModel.Filter.call(this);}
WebInspector.TimelineCategoryFilter.prototype={accept:function(record)
{return!WebInspector.TimelineUIUtils.categoryForRecord(record).hidden;},__proto__:WebInspector.TimelineModel.Filter.prototype}
WebInspector.TimelineIsLongFilter=function()
{WebInspector.TimelineModel.Filter.call(this);this._minimumRecordDuration=0;}
WebInspector.TimelineIsLongFilter.prototype={setMinimumRecordDuration:function(value)
{this._minimumRecordDuration=value;this.notifyFilterChanged();},accept:function(record)
{return this._minimumRecordDuration?((record.endTime()-record.startTime())>=this._minimumRecordDuration):true;},__proto__:WebInspector.TimelineModel.Filter.prototype}
WebInspector.TimelineTextFilter=function()
{WebInspector.TimelineModel.Filter.call(this);}
WebInspector.TimelineTextFilter.prototype={isEmpty:function()
{return!this._regex;},setRegex:function(regex)
{this._regex=regex;this.notifyFilterChanged();},accept:function(record)
{return!this._regex||WebInspector.TimelineUIUtils.testContentMatching(record,this._regex);},__proto__:WebInspector.TimelineModel.Filter.prototype}
WebInspector.TimelineStaticFilter=function()
{WebInspector.TimelineModel.Filter.call(this);}
WebInspector.TimelineStaticFilter.prototype={accept:function(record)
{switch(record.type()){case WebInspector.TimelineModel.RecordType.EventDispatch:return record.children().length!==0;case WebInspector.TimelineModel.RecordType.JSFrame:return false;default:return true;}},__proto__:WebInspector.TimelineModel.Filter.prototype}
WebInspector.TimelinePanel.show=function()
{WebInspector.inspectorView.setCurrentPanel(WebInspector.TimelinePanel.instance());}
WebInspector.TimelinePanel.instance=function()
{if(!WebInspector.TimelinePanel._instanceObject)
WebInspector.TimelinePanel._instanceObject=new WebInspector.TimelinePanel();return WebInspector.TimelinePanel._instanceObject;}
WebInspector.TimelinePanelFactory=function()
{}
WebInspector.TimelinePanelFactory.prototype={createPanel:function()
{return WebInspector.TimelinePanel.instance();}}
WebInspector.LoadTimelineHandler=function()
{}
WebInspector.LoadTimelineHandler.prototype={handleQueryParam:function(value)
{WebInspector.TimelinePanel.show();WebInspector.TimelinePanel.instance()._loadFromURL(value);}};Runtime.cachedResources["timeline/timelinePanel.css"]="/*\n * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.\n * Copyright (C) 2009 Anthony Ricaud <rik@webkit.org>\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n * 1.  Redistributions of source code must retain the above copyright\n *     notice, this list of conditions and the following disclaimer.\n * 2.  Redistributions in binary form must reproduce the above copyright\n *     notice, this list of conditions and the following disclaimer in the\n *     documentation and/or other materials provided with the distribution.\n * 3.  Neither the name of Apple Computer, Inc. (\"Apple\") nor the names of\n *     its contributors may be used to endorse or promote products derived\n *     from this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY\n * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\n * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\n * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\n * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n#timeline-overview-panel {\n    flex: none;\n    position: relative;\n    border-bottom: 1px solid rgb(140, 140, 140);\n}\n\n#timeline-overview-panel .timeline-graph-bar {\n    pointer-events: none;\n}\n\n.timeline-records-title, .timeline-records-list {\n    background-color: #eee;\n}\n\n.timeline-records-title {\n    padding: 3px 3px 3px 5px;\n    flex: 0 0 19px;\n    color: rgb(92, 110, 129); text-shadow: rgba(255, 255, 255, 0.75) 0 1px 0;\n}\n\n.timeline-records-list {\n    flex: auto;\n}\n\n#timeline-overview-grid {\n    background-color: rgb(255, 255, 255);\n}\n\n.timeline-overview-frames-mode #timeline-overview-grid {\n    display: none;\n}\n\n#timeline-overview-grid .resources-dividers-label-bar {\n    pointer-events: auto;\n}\n\n.timeline-overview-frames-mode .overview-grid-window,\n.timeline-overview-frames-mode .overview-grid-dividers-background {\n    height: 100%;\n}\n\n#timeline-container {\n    border-right: 0 none transparent;\n    overflow-y: scroll;\n    overflow-x: hidden;\n}\n\n.timeline-details-split {\n    flex: auto;\n}\n\n.timeline-view {\n    flex: auto;\n    overflow: auto;\n}\n\n.timeline-view-stack {\n    flex: auto;\n    display: flex;\n}\n\n#timeline-container .webkit-html-external-link,\n#timeline-container .webkit-html-resource-link {\n    color: inherit;\n}\n\n.timeline-tree-item {\n    height: 18px;\n    line-height: 15px;\n    padding-right: 5px;\n    padding-left: 5px;\n    padding-top: 2px;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    overflow: hidden;\n}\n\n.timeline-tree-item.selected {\n    background-color: rgb(56, 121, 217) !important;\n    color: white;\n}\n\n.timeline-tree-item.hovered:not(.selected),\n.timeline-graph-side.hovered {\n    background-color: rgba(0, 0, 0, 0.05) !important;\n}\n\n.timeline-expandable {\n    position: absolute;\n    border-left: 1px solid rgb(163, 163, 163);\n    pointer-events: none;\n}\n\n.timeline-expandable-left {\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    left: 0;\n    width: 3px;\n    border-top: 1px solid rgb(163, 163, 163);\n    border-bottom: 1px solid rgb(163, 163, 163);\n}\n\n.timeline-tree-item-expand-arrow {\n    display: inline-block;\n    -webkit-user-select: none;\n    -webkit-mask-image: url(Images/statusbarButtonGlyphs.png);\n    -webkit-mask-size: 320px 144px;\n    width: 10px;\n    height: 10px;\n    content: \"\";\n    background-color: rgb(110, 110, 110);\n    position: relative;\n    top: -1px;\n    left: -1px;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.timeline-tree-item-expand-arrow {\n    -webkit-mask-image: url(Images/statusbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.timeline-tree-item-expand-arrow.parent {\n    -webkit-mask-position: -4px -96px;\n}\n\n.timeline-tree-item-expand-arrow.parent.expanded {\n    -webkit-mask-position: -20px -96px;\n}\n\n.timeline-expandable-arrow {\n    background-image: url(Images/statusbarButtonGlyphs.png);\n    background-size: 320px 144px;\n    opacity: 0.5;\n    width: 10px;\n    height: 10px;\n    position: relative;\n    top: 3px;\n    left: 2px;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.timeline-expandable-arrow {\n    background-image: url(Images/statusbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.timeline-expandable-collapsed .timeline-expandable-arrow {\n    background-position: -4px -96px;\n}\n\n.timeline-expandable-expanded .timeline-expandable-arrow {\n    background-position: -20px -96px;\n}\n\n.timeline-tree-item .type {\n    padding-left: 5px;\n}\n\n.timeline-tree-item .count {\n    font-weight: bold;\n}\n\n.timeline-tree-item .timeline-tree-icon {\n    position: relative;\n    top: -1px;\n    left: 1px;\n    width: 7px;\n    height: 7px;\n    border-radius: 1px;\n    border-style: solid;\n    border-width: 1px;\n    display: inline-block;\n}\n\n.timeline-tree-item.background .timeline-tree-icon {\n    background: none !important;\n}\n\n.timeline-tree-item-warning {\n    display: block;\n    background-image: url(Images/statusbarButtonGlyphs.png);\n    background-size: 320px 144px;\n    width: 10px;\n    height: 10px;\n    float: right;\n    background-position: -202px -107px;\n    position: relative;\n    top: 2px;\n}\n\n.timeline-tree-item-child-warning {\n    opacity: 0.6;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.timeline-tree-item-warning {\n    background-image: url(Images/statusbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.timeline-tree-item .data.dimmed {\n    color: rgba(0, 0, 0, 0.7);\n    pointer-events: none;\n    padding-left: 4px;\n}\n\n.timeline-tree-item.selected .data.dimmed {\n    color: rgba(255, 255, 255, 0.8);\n    pointer-events: auto;\n}\n\n.timeline-tree-item.selected .timeline-tree-item-expand-arrow {\n    background-color: white;\n}\n\n#timeline-overview-events,\n#timeline-overview-memory,\n#timeline-overview-power {\n    flex: 0 0 60px;\n    z-index: 160;\n    width: 100%;\n}\n\n#timeline-overview-memory {\n    flex-basis: 20px;\n}\n\n#timeline-overview-frames {\n    flex-basis: 79px;\n}\n\n#timeline-overview-pane {\n    flex: auto;\n    position: relative;\n    overflow: hidden;\n}\n\n#timeline-overview-container {\n    display: flex;\n    flex-direction: column;\n    flex: none;\n    position: relative;\n    overflow: hidden;\n}\n\n#timeline-overview-container canvas {\n    width: 100%;\n    height: 100%;\n}\n\n#timeline-overview-frames canvas {\n    z-index: 200;\n    background-color: rgba(255, 255, 255, 0.8);\n}\n\n#timeline-graphs {\n    position: absolute;\n    left: 0;\n    right: 0;\n    max-height: 100%;\n    top: 20px;\n}\n\n.timeline-graph-side {\n    position: relative;\n    height: 18px;\n    padding: 0 5px;\n    white-space: nowrap;\n    margin-top: 0;\n    border-top: 1px solid transparent;\n    overflow: hidden;\n}\n\n.timeline-graph-side.selected {\n    background-color: rgba(56, 121, 217, 0.1) !important;\n}\n\n.timeline-graph-bar-area {\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    right: 0;\n    left: 3px;\n    pointer-events: none;\n}\n\n.timeline-graph-bar {\n    position: absolute;\n    top: -1px;\n    bottom: 0;\n    margin: auto -2px;\n    height: 10px;\n    min-width: 5px;\n    z-index: 180;\n    pointer-events: visibleFill;\n    border-radius: 1px;\n    border: 1px solid;\n}\n\n.timeline-graph-bar.cpu {\n    opacity: 0.7;\n}\n\n.timeline-graph-side.background .timeline-graph-bar {\n    background: transparent !important;\n    border-width: 2px;\n}\n\n.timeline-aggregated-category {\n    display: inline-block;\n    height: 11px;\n    margin-right: 5px;\n    position: relative;\n    top: 2px;\n    width: 10px;\n    border: solid 1px;\n}\n\n.popover ul {\n    margin: 0;\n    padding: 0;\n    list-style-type: none;\n}\n\n#resources-container-content {\n    overflow: hidden;\n    min-height: 100%;\n}\n\n.memory-graph-label {\n    position: absolute;\n    left: 5px;\n    font-size: 9px;\n    color: rgb(50%, 50%, 50%);\n    white-space: nowrap;\n}\n\n#memory-graphs-canvas-container {\n    overflow: hidden;\n    flex: auto;\n    position: relative;\n}\n\n#memory-counters-graph {\n    flex: auto;\n}\n\n#memory-graphs-canvas-container .memory-counter-marker {\n    position: absolute;\n    border-radius: 3px;\n    width: 5px;\n    height: 5px;\n    margin-left: -3px;\n    margin-top: -2px;\n}\n\n#memory-graphs-container > div:last-child {\n    background-color: #eee;\n    overflow-y: hidden;\n}\n\n#memory-graphs-container .sidebar-tree-section {\n    flex: 0 0 24px;\n    padding: 5px 0 0 5px;\n}\n\n.memory-counter-sidebar-info {\n    flex: 0 0 18px;\n    margin-left: 5px;\n    white-space: nowrap;\n}\n\n.memory-counter-sidebar-info .swatch {\n    margin-left: 1px;\n    margin-right: 2px;\n    width: 10px;\n    height: 10px;\n    position: relative;\n    top: 1px;\n    display: inline-block;\n    line-height: 1px;\n    background-image: none;\n    border: 1px solid rgba(0,0,0,0.3);\n    opacity: 0.5;\n    -webkit-user-select: none;\n}\n\n.memory-counter-sidebar-info .title {\n    margin: 4px;\n}\n\n.memory-counter-value {\n    margin: 4px;\n}\n\n#counter-values-bar {\n    flex: 0 0 18px;\n    border-bottom: solid 1px lightgray;\n    width: 100%;\n    overflow: hidden;\n    line-height: 18px;\n}\n\n.timeline .resources-event-divider {\n    height: 19px;\n    width: 6px;\n    pointer-events: auto;\n    margin-left: -2px;\n}\n\n.timeline .resources-event-divider::before {\n    height: 19px;\n    width: 2px;\n    margin: 0 2px;\n    background-color: rgb(163, 109, 0);\n    bottom: auto;\n    content: \"\";\n    display: block;\n}\n\n.timeline .resources-event-divider:hover::before {\n    width: 4px;\n    margin: 0 1px;\n}\n\n.timeline .resources-event-divider.timeline-frame-divider::before {\n    display: none;\n}\n\n.timeline .resources-event-divider.resources-red-divider::before {\n    background-color: rgb(255, 0, 0);\n}\n\n.timeline .resources-event-divider.resources-blue-divider::before {\n    background-color: rgb(0, 0, 255);\n}\n\n.timeline .resources-event-divider.resources-orange-divider::before {\n    background-color: rgb(255, 178, 23);\n}\n\n.timeline .resources-event-divider.resources-green-divider::before {\n    background-color: rgb(0, 130, 0);\n}\n\n.resources-divider:last-child {\n    border-color: transparent;\n}\n\n.timeline .resources-event-divider.timeline-frame-divider {\n    background-color: rgba(180, 180, 180, 0.8);\n    border-style: none;\n    width: 1px;\n    height: 100%;\n    pointer-events: none;\n}\n\n.timeline-frame-container {\n    height: 19px;\n    overflow: hidden;\n    background-color: rgb(220, 220, 220);\n    opacity: 0.8;\n    color: black;\n    text-align: center;\n    z-index: 220;\n    pointer-events: auto;\n}\n\n.timeline-frame-strip {\n    position: absolute;\n    height: 19px;\n    padding-top: 3px;\n}\n\n.timeline-frame-strip.selected {\n    background-color: rgb(56, 121, 217);\n    color: white;\n}\n\n#timeline-grid-header {\n    pointer-events: none;\n    height: 19px;\n}\n\n#timeline-graph-records-header {\n    pointer-events: none;\n    height: 19px;\n    padding: 1px 0;\n    justify-content: center;\n}\n\n.timeline-utilization-strip {\n    z-index: 250;\n    overflow: hidden;\n    flex: 0 1 12px;\n    position: relative;\n    height: 9px;\n}\n\n.timeline-utilization-strip .timeline-graph-bar {\n    border-color: rgb(192, 192, 192);\n    background-color: rgba(0, 0, 0, 0.1);\n    margin: 1.5px auto;\n    height: auto;\n}\n\n.timeline-utilization-strip.gpu .timeline-graph-bar {\n    background-color: #00a;\n    border: none;\n    opacity: 0.3;\n    min-width: 0;\n}\n\n.timeline-utilization-strip.gpu .timeline-graph-bar.gpu-task-foreign {\n    background-color: #aaa;\n}\n\n.timeline-cpu-curtain-left, .timeline-cpu-curtain-right {\n    background-color: rgba(210, 210, 210, 0.5);\n    position: absolute;\n    top: 0;\n    height: 100%;\n    z-index: 300;\n}\n\n.timeline-cpu-curtain-left {\n    left: 0;\n}\n\n.timeline-cpu-curtain-right {\n    right: 0;\n}\n\n.image-preview-container {\n    background: transparent;\n    text-align: left;\n    border-spacing: 0;\n}\n\n.image-preview-container img {\n    max-width: 100px;\n    max-height: 100px;\n    background-image: url(Images/checker.png);\n    -webkit-user-select: text;\n    -webkit-user-drag: auto;\n}\n\n.image-container {\n    padding: 0;\n}\n\n.timeline-filters-header {\n    flex: 0 0 23px;\n    overflow: hidden;\n}\n\n.timeline-details {\n    vertical-align: top;\n}\n\n.timeline-details-title {\n    border-bottom: 1px solid #B8B8B8;\n    font-weight: bold;\n    padding-bottom: 5px;\n    padding-top: 0;\n    white-space: nowrap;\n}\n\n.timeline-details-row-title {\n    font-weight: bold;\n    text-align: right;\n    white-space: nowrap;\n}\n\n.timeline-details-row-data {\n    white-space: nowrap;\n}\n\n.timeline-details-view {\n    color: #333;\n    overflow: hidden;\n}\n\n.timeline-details-view-body {\n    flex: auto;\n    overflow: auto;\n    position: relative;\n    background-color: #eee;\n}\n\n.timeline-details-view-block {\n    flex: none;\n    display: flex;\n    flex-direction: column;\n}\n\n.timeline-details-view-row {\n    display: flex;\n    border-bottom: 1px solid #e1e1e1;\n}\n\n.timeline-details-view-row-title {\n    font-weight: bold;\n    color: rgb(48, 57, 66);\n    width: 170px;\n    line-height: 24px;\n    padding-left: 10px;\n    flex: none;\n}\n\n.timeline-details-view-row-value {\n    padding-left: 10px;\n    border-left: 1px solid #e1e1e1;\n    min-height: 24px;\n    line-height: 24px;\n    -webkit-user-select: text;\n}\n\n.timeline-details-view-row-value .stack-preview-container {\n    line-height: 11px;\n}\n\n.timeline-details-view-row-details {\n    padding-left: 10px;\n}\n\n.timeline-details-view-pie-chart-wrapper {\n    margin: 8px 10px 8px 0;\n}\n\n.timeline-details-view-pie-chart {\n    margin-right: 8px;\n}\n\n.timeline-details-view-row-details .image-preview-container {\n    padding: 10px;\n}\n\n.timeline-details-view-row-details table {\n    padding-left: 10px;\n}\n\n.timeline-details-view-row-details table td {\n    text-align: left;\n    vertical-align: top;\n}\n\n.timeline-details-view-row-details table td .section {\n    margin-top: -1px;\n}\n\n.timeline-details-view-row-details table td .section  > .header .title {\n    white-space: nowrap;\n}\n\n.timeline-details-view-row-stack-trace {\n    padding: 4px 0 4px 20px;\n}\n\n.timeline-details-view-row-stack-trace div {\n    white-space: nowrap;\n    text-overflow: ellipsis;\n    line-height: 12px;\n}\n\n.timeline-aggregated-info {\n    flex: none;\n    position: relative;\n    margin-left:  5px;\n}\n\n.timeline-aggregated-info-legend > div {\n    overflow: hidden;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n}\n\n.timeline-flamechart {\n    overflow: hidden;\n}\n\n.timeline-progress-pane {\n    color: #777;\n    background-color: rgba(255, 255, 255, 0.8);\n    font-size: 30px;\n    z-index: 500;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n}\n\n\n.layer-tree,\n.profiler-log-view {\n    overflow: auto;\n}\n\n.layer-tree::shadow .dimmed {\n    opacity: 0.6;\n    padding-left: 5px;\n}\n\n.layers-3d-view {\n    overflow: hidden;\n    -webkit-user-select: none;\n}\n\n.layers-3d-view canvas {\n    flex: 1 1;\n}\n\n.transform-control-panel {\n    white-space: nowrap;\n    flex: none;\n}\n\n.layer-details-view .empty-view {\n    font-size: 16px;\n}\n\n.layer-details-view table td {\n    padding-left: 8px;\n}\n\n.layer-details-view table td:first-child {\n    font-weight: bold;\n}\n\n.layer-details-view .scroll-rect.active {\n    background-color: rgba(100, 100, 100, 0.2);\n}\n\n.paint-profiler-overview .progress-banner {\n    color: #777;\n    background-color: rgba(255, 255, 255, 0.8);\n    font-size: 20px;\n    z-index: 500;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n}\n\n.paint-profiler-canvas-container {\n    flex: auto;\n    position: relative;\n}\n\n.paint-profiler-overview {\n    background-color: #eee;\n}\n\n.paint-profiler-pie-chart {\n    width: 60px !important;\n    height: 60px !important;\n    padding: 2px;\n    overflow: hidden;\n    font-size: 10px;\n}\n\n.paint-profiler-canvas-container canvas {\n    z-index: 200;\n    background-color: white;\n    opacity: 0.95;\n    height: 100%;\n    width: 100%;\n}\n\n.paint-profiler-canvas-container .overview-grid-dividers-background,\n.paint-profiler-canvas-container .overview-grid-window {\n    bottom: 0;\n    height: auto;\n}\n\n.paint-profiler-canvas-container .overview-grid-window-resizer {\n    z-index: 2000;\n}\n\n.paint-profiler-image-view {\n    overflow: hidden;\n}\n\n.paint-profiler-image-view .paint-profiler-image-container {\n    -webkit-transform-origin: 0 0;\n}\n\n.paint-profiler-image-view .paint-profiler-image-container div {\n    border-color: rgba(100, 100, 100, 0.4);\n    border-style: solid;\n    z-index: 100;\n    position: absolute;\n    top: 0;\n    left: 0;\n}\n\n.paint-profiler-image-view img {\n    border: solid 1px black;\n}\n\n.layer-details-view ul {\n    list-style: none;\n    -webkit-padding-start: 0;\n    -webkit-margin-before: 0;\n    -webkit-margin-after: 0;\n}\n\n.layer-details-view a {\n    padding: 8px;\n    display: block;\n}\n\n.timeline-layers-view > div:last-child,\n.timeline-layers-view-properties > div:last-child {\n    background-color: #eee;\n}\n\n.timeline-layers-view-properties table {\n    width: 100%;\n    border-collapse: collapse;\n}\n\n.timeline-layers-view-properties td {\n    border: 1px solid #e1e1e1;\n    line-height: 22px;\n}\n\n.timeline-paint-profiler-log-split > div:last-child {\n    background-color: #eee;\n    z-index: 0;\n}\n\n.timeline-gap {\n    flex: none;\n}\n\n.invalidations-group {\n    margin-top: 4px;\n    line-height: normal;\n}\n\n.invalidations-group > .header {\n    padding-left: 0;\n}\n\n.invalidations-group > .content {\n    margin-left: 25px;\n}\n\n.invalidations-group > .content > .node-list {\n    border-left: 1px solid #e1e1e1;\n}\n\n/*# sourceURL=timeline/timelinePanel.css */";