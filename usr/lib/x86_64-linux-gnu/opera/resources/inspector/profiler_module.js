WebInspector.ProfileType=function(id,name)
{WebInspector.Object.call(this);this._id=id;this._name=name;this._profiles=[];this._profileBeingRecorded=null;this._nextProfileUid=1;if(!window.opener)
window.addEventListener("unload",this._clearTempStorage.bind(this),false);}
WebInspector.ProfileType.Events={AddProfileHeader:"add-profile-header",ProfileComplete:"profile-complete",RemoveProfileHeader:"remove-profile-header",ViewUpdated:"view-updated"}
WebInspector.ProfileType.prototype={nextProfileUid:function()
{return this._nextProfileUid;},hasTemporaryView:function()
{return false;},fileExtension:function()
{return null;},statusBarItems:function()
{return[];},get buttonTooltip()
{return"";},get id()
{return this._id;},get treeItemTitle()
{return this._name;},get name()
{return this._name;},buttonClicked:function()
{return false;},get description()
{return"";},isInstantProfile:function()
{return false;},isEnabled:function()
{return true;},getProfiles:function()
{function isFinished(profile)
{return this._profileBeingRecorded!==profile;}
return this._profiles.filter(isFinished.bind(this));},decorationElement:function()
{return null;},getProfile:function(uid)
{for(var i=0;i<this._profiles.length;++i){if(this._profiles[i].uid===uid)
return this._profiles[i];}
return null;},loadFromFile:function(file)
{var name=file.name;if(name.endsWith(this.fileExtension()))
name=name.substr(0,name.length-this.fileExtension().length);var profile=this.createProfileLoadedFromFile(name);profile.setFromFile();this.setProfileBeingRecorded(profile);this.addProfile(profile);profile.loadFromFile(file);},createProfileLoadedFromFile:function(title)
{throw new Error("Needs implemented.");},addProfile:function(profile)
{this._profiles.push(profile);this.dispatchEventToListeners(WebInspector.ProfileType.Events.AddProfileHeader,profile);},removeProfile:function(profile)
{var index=this._profiles.indexOf(profile);if(index===-1)
return;this._profiles.splice(index,1);this._disposeProfile(profile);},_clearTempStorage:function()
{for(var i=0;i<this._profiles.length;++i)
this._profiles[i].removeTempFile();},profileBeingRecorded:function()
{return this._profileBeingRecorded;},setProfileBeingRecorded:function(profile)
{if(this._profileBeingRecorded&&this._profileBeingRecorded.target())
WebInspector.targetManager.resumeAllTargets();if(profile&&profile.target())
WebInspector.targetManager.suspendAllTargets();this._profileBeingRecorded=profile;},profileBeingRecordedRemoved:function()
{},_reset:function()
{var profiles=this._profiles.slice(0);for(var i=0;i<profiles.length;++i)
this._disposeProfile(profiles[i]);this._profiles=[];this._nextProfileUid=1;},_disposeProfile:function(profile)
{this.dispatchEventToListeners(WebInspector.ProfileType.Events.RemoveProfileHeader,profile);profile.dispose();if(this._profileBeingRecorded===profile){this.profileBeingRecordedRemoved();this.setProfileBeingRecorded(null);}},__proto__:WebInspector.Object.prototype}
WebInspector.ProfileType.DataDisplayDelegate=function()
{}
WebInspector.ProfileType.DataDisplayDelegate.prototype={showProfile:function(profile){},showObject:function(snapshotObjectId,perspectiveName){}}
WebInspector.ProfileHeader=function(target,profileType,title)
{this._target=target;this._profileType=profileType;this.title=title;this.uid=profileType._nextProfileUid++;this._fromFile=false;}
WebInspector.ProfileHeader.StatusUpdate=function(subtitle,wait)
{this.subtitle=subtitle;this.wait=wait;}
WebInspector.ProfileHeader.Events={UpdateStatus:"UpdateStatus",ProfileReceived:"ProfileReceived"}
WebInspector.ProfileHeader.prototype={target:function()
{return this._target;},profileType:function()
{return this._profileType;},updateStatus:function(subtitle,wait)
{this.dispatchEventToListeners(WebInspector.ProfileHeader.Events.UpdateStatus,new WebInspector.ProfileHeader.StatusUpdate(subtitle,wait));},createSidebarTreeElement:function(dataDisplayDelegate)
{throw new Error("Needs implemented.");},createView:function(dataDisplayDelegate)
{throw new Error("Not implemented.");},removeTempFile:function()
{if(this._tempFile)
this._tempFile.remove();},dispose:function()
{},canSaveToFile:function()
{return false;},saveToFile:function()
{throw new Error("Needs implemented");},loadFromFile:function(file)
{throw new Error("Needs implemented");},fromFile:function()
{return this._fromFile;},setFromFile:function()
{this._fromFile=true;},__proto__:WebInspector.Object.prototype}
WebInspector.ProfilesPanel=function()
{WebInspector.PanelWithSidebar.call(this,"profiles");this.registerRequiredCSS("ui/panelEnablerView.css");this.registerRequiredCSS("profiler/heapProfiler.css");this.registerRequiredCSS("profiler/profilesPanel.css");this.registerRequiredCSS("components/objectValue.css");var mainView=new WebInspector.VBox();this.splitView().setMainView(mainView);this.profilesItemTreeElement=new WebInspector.ProfilesSidebarTreeElement(this);this._sidebarTree=new TreeOutline();this._sidebarTree.element.classList.add("sidebar-tree");this.panelSidebarElement().appendChild(this._sidebarTree.element);this.setDefaultFocusedElement(this._sidebarTree.element);this._sidebarTree.appendChild(this.profilesItemTreeElement);this.profileViews=createElement("div");this.profileViews.id="profile-views";this.profileViews.classList.add("vbox");mainView.element.appendChild(this.profileViews);this._statusBarElement=createElementWithClass("div","profiles-status-bar");mainView.element.insertBefore(this._statusBarElement,mainView.element.firstChild);this.panelSidebarElement().classList.add("profiles-sidebar-tree-box");var statusBarContainerLeft=createElementWithClass("div","profiles-status-bar");this.panelSidebarElement().insertBefore(statusBarContainerLeft,this.panelSidebarElement().firstChild);var statusBar=new WebInspector.StatusBar(statusBarContainerLeft);this.recordButton=new WebInspector.StatusBarButton("","record-status-bar-item");this.recordButton.addEventListener("click",this.toggleRecordButton,this);statusBar.appendStatusBarItem(this.recordButton);this.clearResultsButton=new WebInspector.StatusBarButton(WebInspector.UIString("Clear all profiles."),"clear-status-bar-item");this.clearResultsButton.addEventListener("click",this._reset,this);statusBar.appendStatusBarItem(this.clearResultsButton);this._profileTypeStatusBar=new WebInspector.StatusBar(this._statusBarElement);this._profileViewStatusBar=new WebInspector.StatusBar(this._statusBarElement);this._profileGroups={};this._launcherView=new WebInspector.MultiProfileLauncherView(this);this._launcherView.addEventListener(WebInspector.MultiProfileLauncherView.EventTypes.ProfileTypeSelected,this._onProfileTypeSelected,this);this._profileToView=[];this._typeIdToSidebarSection={};var types=WebInspector.ProfileTypeRegistry.instance.profileTypes();for(var i=0;i<types.length;i++)
this._registerProfileType(types[i]);this._launcherView.restoreSelectedProfileType();this.profilesItemTreeElement.select();this._showLauncherView();this._createFileSelectorElement();this.element.addEventListener("contextmenu",this._handleContextMenuEvent.bind(this),true);this._registerShortcuts();WebInspector.targetManager.addEventListener(WebInspector.TargetManager.Events.SuspendStateChanged,this._onSuspendStateChanged,this);}
WebInspector.ProfilesPanel.prototype={searchableView:function()
{return this.visibleView&&this.visibleView.searchableView?this.visibleView.searchableView():null;},_createFileSelectorElement:function()
{if(this._fileSelectorElement)
this.element.removeChild(this._fileSelectorElement);this._fileSelectorElement=WebInspector.createFileSelectorElement(this._loadFromFile.bind(this));this.element.appendChild(this._fileSelectorElement);},_findProfileTypeByExtension:function(fileName)
{var types=WebInspector.ProfileTypeRegistry.instance.profileTypes();for(var i=0;i<types.length;i++){var type=types[i];var extension=type.fileExtension();if(!extension)
continue;if(fileName.endsWith(type.fileExtension()))
return type;}
return null;},_registerShortcuts:function()
{this.registerShortcuts(WebInspector.ShortcutsScreen.ProfilesPanelShortcuts.StartStopRecording,this.toggleRecordButton.bind(this));},_loadFromFile:function(file)
{this._createFileSelectorElement();var profileType=this._findProfileTypeByExtension(file.name);if(!profileType){var extensions=[];var types=WebInspector.ProfileTypeRegistry.instance.profileTypes();for(var i=0;i<types.length;i++){var extension=types[i].fileExtension();if(!extension||extensions.indexOf(extension)!==-1)
continue;extensions.push(extension);}
WebInspector.console.error(WebInspector.UIString("Can't load file. Only files with extensions '%s' can be loaded.",extensions.join("', '")));return;}
if(!!profileType.profileBeingRecorded()){WebInspector.console.error(WebInspector.UIString("Can't load profile while another profile is recording."));return;}
profileType.loadFromFile(file);},toggleRecordButton:function()
{if(!this.recordButton.enabled())
return true;var type=this._selectedProfileType;var isProfiling=type.buttonClicked();this._updateRecordButton(isProfiling);if(isProfiling){this._launcherView.profileStarted();if(type.hasTemporaryView())
this.showProfile(type.profileBeingRecorded());}else{this._launcherView.profileFinished();}
return true;},_onSuspendStateChanged:function()
{this._updateRecordButton(this.recordButton.toggled());},_updateRecordButton:function(toggled)
{var enable=toggled||!WebInspector.targetManager.allTargetsSuspended();this.recordButton.setEnabled(enable);this.recordButton.setToggled(toggled);if(enable)
this.recordButton.setTitle(this._selectedProfileType?this._selectedProfileType.buttonTooltip:"");else
this.recordButton.setTitle(WebInspector.anotherProfilerActiveLabel());if(this._selectedProfileType)
this._launcherView.updateProfileType(this._selectedProfileType,enable);},_profileBeingRecordedRemoved:function()
{this._updateRecordButton(false);this._launcherView.profileFinished();},_onProfileTypeSelected:function(event)
{this._selectedProfileType=(event.data);this._updateProfileTypeSpecificUI();},_updateProfileTypeSpecificUI:function()
{this._updateRecordButton(this.recordButton.toggled());this._profileTypeStatusBar.removeStatusBarItems();var statusBarItems=this._selectedProfileType.statusBarItems();for(var i=0;i<statusBarItems.length;++i)
this._profileTypeStatusBar.appendStatusBarItem(statusBarItems[i]);},_reset:function()
{WebInspector.Panel.prototype.reset.call(this);var types=WebInspector.ProfileTypeRegistry.instance.profileTypes();for(var i=0;i<types.length;i++)
types[i]._reset();delete this.visibleView;this._profileGroups={};this._updateRecordButton(false);this._launcherView.profileFinished();this._sidebarTree.element.classList.remove("some-expandable");this._launcherView.detach();this.profileViews.removeChildren();this._profileViewStatusBar.removeStatusBarItems();this.removeAllListeners();this.recordButton.setVisible(true);this._profileViewStatusBar.element.classList.remove("hidden");this.clearResultsButton.element.classList.remove("hidden");this.profilesItemTreeElement.select();this._showLauncherView();},_showLauncherView:function()
{this.closeVisibleView();this._profileViewStatusBar.removeStatusBarItems();this._launcherView.show(this.profileViews);this.visibleView=this._launcherView;},_registerProfileType:function(profileType)
{this._launcherView.addProfileType(profileType);var profileTypeSection=new WebInspector.ProfileTypeSidebarSection(this,profileType);this._typeIdToSidebarSection[profileType.id]=profileTypeSection;this._sidebarTree.appendChild(profileTypeSection);profileTypeSection.childrenListElement.addEventListener("contextmenu",this._handleContextMenuEvent.bind(this),true);function onAddProfileHeader(event)
{this._addProfileHeader((event.data));}
function onRemoveProfileHeader(event)
{this._removeProfileHeader((event.data));}
function profileComplete(event)
{this.showProfile((event.data));}
profileType.addEventListener(WebInspector.ProfileType.Events.ViewUpdated,this._updateProfileTypeSpecificUI,this);profileType.addEventListener(WebInspector.ProfileType.Events.AddProfileHeader,onAddProfileHeader,this);profileType.addEventListener(WebInspector.ProfileType.Events.RemoveProfileHeader,onRemoveProfileHeader,this);profileType.addEventListener(WebInspector.ProfileType.Events.ProfileComplete,profileComplete,this);var profiles=profileType.getProfiles();for(var i=0;i<profiles.length;i++)
this._addProfileHeader(profiles[i]);},_handleContextMenuEvent:function(event)
{var element=event.srcElement;while(element&&!element.treeElement&&element!==this.element)
element=element.parentElement;if(!element)
return;if(element.treeElement&&element.treeElement.handleContextMenuEvent){element.treeElement.handleContextMenuEvent(event,this);return;}
var contextMenu=new WebInspector.ContextMenu(event);if(this.visibleView instanceof WebInspector.HeapSnapshotView){this.visibleView.populateContextMenu(contextMenu,event);}
if(element!==this.element||event.srcElement===this.panelSidebarElement()){contextMenu.appendItem(WebInspector.UIString("Load\u2026"),this._fileSelectorElement.click.bind(this._fileSelectorElement));}
contextMenu.show();},showLoadFromFileDialog:function()
{this._fileSelectorElement.click();},_addProfileHeader:function(profile)
{var profileType=profile.profileType();var typeId=profileType.id;this._typeIdToSidebarSection[typeId].addProfileHeader(profile);if(!this.visibleView||this.visibleView===this._launcherView)
this.showProfile(profile);},_removeProfileHeader:function(profile)
{if(profile.profileType()._profileBeingRecorded===profile)
this._profileBeingRecordedRemoved();var i=this._indexOfViewForProfile(profile);if(i!==-1)
this._profileToView.splice(i,1);var profileType=profile.profileType();var typeId=profileType.id;var sectionIsEmpty=this._typeIdToSidebarSection[typeId].removeProfileHeader(profile);if(sectionIsEmpty){this.profilesItemTreeElement.select();this._showLauncherView();}},showProfile:function(profile)
{if(!profile||(profile.profileType().profileBeingRecorded()===profile)&&!profile.profileType().hasTemporaryView())
return null;var view=this._viewForProfile(profile);if(view===this.visibleView)
return view;this.closeVisibleView();view.show(this.profileViews);view.focus();this.visibleView=view;var profileTypeSection=this._typeIdToSidebarSection[profile.profileType().id];var sidebarElement=profileTypeSection.sidebarElementForProfile(profile);sidebarElement.revealAndSelect();this._profileViewStatusBar.removeStatusBarItems();var statusBarItems=view.statusBarItems();for(var i=0;i<statusBarItems.length;++i)
this._profileViewStatusBar.appendStatusBarItem(statusBarItems[i]);return view;},showObject:function(snapshotObjectId,perspectiveName)
{var heapProfiles=WebInspector.ProfileTypeRegistry.instance.heapSnapshotProfileType.getProfiles();for(var i=0;i<heapProfiles.length;i++){var profile=heapProfiles[i];if(profile.maxJSObjectId>=snapshotObjectId){this.showProfile(profile);var view=this._viewForProfile(profile);view.selectLiveObject(perspectiveName,snapshotObjectId);break;}}},_viewForProfile:function(profile)
{var index=this._indexOfViewForProfile(profile);if(index!==-1)
return this._profileToView[index].view;var view=profile.createView(this);view.element.classList.add("profile-view");this._profileToView.push({profile:profile,view:view});return view;},_indexOfViewForProfile:function(profile)
{for(var i=0;i<this._profileToView.length;i++){if(this._profileToView[i].profile===profile)
return i;}
return-1;},closeVisibleView:function()
{if(this.visibleView)
this.visibleView.detach();delete this.visibleView;},appendApplicableItems:function(event,contextMenu,target)
{if(!(target instanceof WebInspector.RemoteObject))
return;if(WebInspector.inspectorView.currentPanel()!==this)
return;var object=(target);var objectId=object.objectId;if(!objectId)
return;var heapProfiles=WebInspector.ProfileTypeRegistry.instance.heapSnapshotProfileType.getProfiles();if(!heapProfiles.length)
return;function revealInView(viewName)
{object.target().heapProfilerAgent().getHeapObjectId(objectId,didReceiveHeapObjectId.bind(this,viewName));}
function didReceiveHeapObjectId(viewName,error,result)
{if(WebInspector.inspectorView.currentPanel()!==this)
return;if(!error)
this.showObject(result,viewName);}
contextMenu.appendItem(WebInspector.UIString.capitalize("Reveal in Summary ^view"),revealInView.bind(this,"Summary"));},__proto__:WebInspector.PanelWithSidebar.prototype}
WebInspector.ProfileTypeSidebarSection=function(dataDisplayDelegate,profileType)
{WebInspector.SidebarSectionTreeElement.call(this,profileType.treeItemTitle);this._dataDisplayDelegate=dataDisplayDelegate;this._profileTreeElements=[];this._profileGroups={};this.hidden=true;}
WebInspector.ProfileTypeSidebarSection.ProfileGroup=function()
{this.profileSidebarTreeElements=[];this.sidebarTreeElement=null;}
WebInspector.ProfileTypeSidebarSection.prototype={addProfileHeader:function(profile)
{this.hidden=false;var profileType=profile.profileType();var sidebarParent=this;var profileTreeElement=profile.createSidebarTreeElement(this._dataDisplayDelegate);this._profileTreeElements.push(profileTreeElement);if(!profile.fromFile()&&profileType.profileBeingRecorded()!==profile){var profileTitle=profile.title;var group=this._profileGroups[profileTitle];if(!group){group=new WebInspector.ProfileTypeSidebarSection.ProfileGroup();this._profileGroups[profileTitle]=group;}
group.profileSidebarTreeElements.push(profileTreeElement);var groupSize=group.profileSidebarTreeElements.length;if(groupSize===2){group.sidebarTreeElement=new WebInspector.ProfileGroupSidebarTreeElement(this._dataDisplayDelegate,profile.title);var firstProfileTreeElement=group.profileSidebarTreeElements[0];var index=this.children().indexOf(firstProfileTreeElement);this.insertChild(group.sidebarTreeElement,index);var selected=firstProfileTreeElement.selected;this.removeChild(firstProfileTreeElement);group.sidebarTreeElement.appendChild(firstProfileTreeElement);if(selected)
firstProfileTreeElement.revealAndSelect();firstProfileTreeElement.small=true;firstProfileTreeElement.mainTitle=WebInspector.UIString("Run %d",1);this.treeOutline.element.classList.add("some-expandable");}
if(groupSize>=2){sidebarParent=group.sidebarTreeElement;profileTreeElement.small=true;profileTreeElement.mainTitle=WebInspector.UIString("Run %d",groupSize);}}
sidebarParent.appendChild(profileTreeElement);},removeProfileHeader:function(profile)
{var index=this._sidebarElementIndex(profile);if(index===-1)
return false;var profileTreeElement=this._profileTreeElements[index];this._profileTreeElements.splice(index,1);var sidebarParent=this;var group=this._profileGroups[profile.title];if(group){var groupElements=group.profileSidebarTreeElements;groupElements.splice(groupElements.indexOf(profileTreeElement),1);if(groupElements.length===1){var pos=sidebarParent.children().indexOf(group.sidebarTreeElement);group.sidebarTreeElement.removeChild(groupElements[0]);this.insertChild(groupElements[0],pos);groupElements[0].small=false;groupElements[0].mainTitle=group.sidebarTreeElement.title;this.removeChild(group.sidebarTreeElement);}
if(groupElements.length!==0)
sidebarParent=group.sidebarTreeElement;}
sidebarParent.removeChild(profileTreeElement);profileTreeElement.dispose();if(this.childCount())
return false;this.hidden=true;return true;},sidebarElementForProfile:function(profile)
{var index=this._sidebarElementIndex(profile);return index===-1?null:this._profileTreeElements[index];},_sidebarElementIndex:function(profile)
{var elements=this._profileTreeElements;for(var i=0;i<elements.length;i++){if(elements[i].profile===profile)
return i;}
return-1;},__proto__:WebInspector.SidebarSectionTreeElement.prototype}
WebInspector.ProfilesPanel.ContextMenuProvider=function()
{}
WebInspector.ProfilesPanel.ContextMenuProvider.prototype={appendApplicableItems:function(event,contextMenu,target)
{WebInspector.ProfilesPanel._instance().appendApplicableItems(event,contextMenu,target);}}
WebInspector.ProfileSidebarTreeElement=function(dataDisplayDelegate,profile,className)
{this._dataDisplayDelegate=dataDisplayDelegate;this.profile=profile;WebInspector.SidebarTreeElement.call(this,className,profile.title);this.refreshTitles();profile.addEventListener(WebInspector.ProfileHeader.Events.UpdateStatus,this._updateStatus,this);if(profile.canSaveToFile())
this._createSaveLink();else
profile.addEventListener(WebInspector.ProfileHeader.Events.ProfileReceived,this._onProfileReceived,this);}
WebInspector.ProfileSidebarTreeElement.prototype={_createSaveLink:function()
{this._saveLinkElement=this.titleContainer.createChild("span","save-link");this._saveLinkElement.textContent=WebInspector.UIString("Save");this._saveLinkElement.addEventListener("click",this._saveProfile.bind(this),false);},_onProfileReceived:function(event)
{this._createSaveLink();},_updateStatus:function(event)
{var statusUpdate=event.data;if(statusUpdate.subtitle!==null)
this.subtitle=statusUpdate.subtitle;if(typeof statusUpdate.wait==="boolean")
this.wait=statusUpdate.wait;this.refreshTitles();},dispose:function()
{this.profile.removeEventListener(WebInspector.ProfileHeader.Events.UpdateStatus,this._updateStatus,this);this.profile.removeEventListener(WebInspector.ProfileHeader.Events.ProfileReceived,this._onProfileReceived,this);},onselect:function()
{this._dataDisplayDelegate.showProfile(this.profile);return true;},ondelete:function()
{this.profile.profileType().removeProfile(this.profile);return true;},handleContextMenuEvent:function(event,panel)
{var profile=this.profile;var contextMenu=new WebInspector.ContextMenu(event);contextMenu.appendItem(WebInspector.UIString("Load\u2026"),panel._fileSelectorElement.click.bind(panel._fileSelectorElement));if(profile.canSaveToFile())
contextMenu.appendItem(WebInspector.UIString("Save\u2026"),profile.saveToFile.bind(profile));contextMenu.appendItem(WebInspector.UIString("Delete"),this.ondelete.bind(this));contextMenu.show();},_saveProfile:function(event)
{this.profile.saveToFile();},__proto__:WebInspector.SidebarTreeElement.prototype}
WebInspector.ProfileGroupSidebarTreeElement=function(dataDisplayDelegate,title,subtitle)
{WebInspector.SidebarTreeElement.call(this,"profile-group-sidebar-tree-item",title,subtitle,true);this._dataDisplayDelegate=dataDisplayDelegate;}
WebInspector.ProfileGroupSidebarTreeElement.prototype={onselect:function()
{var hasChildren=this.childCount()>0;if(hasChildren)
this._dataDisplayDelegate.showProfile(this.lastChild().profile);return hasChildren;},__proto__:WebInspector.SidebarTreeElement.prototype}
WebInspector.ProfilesSidebarTreeElement=function(panel)
{this._panel=panel;this.small=false;WebInspector.SidebarTreeElement.call(this,"profile-launcher-view-tree-item",WebInspector.UIString("Profiles"));}
WebInspector.ProfilesSidebarTreeElement.prototype={onselect:function()
{this._panel._showLauncherView();return true;},get selectable()
{return true;},__proto__:WebInspector.SidebarTreeElement.prototype}
WebInspector.ProfilesPanel.show=function()
{WebInspector.inspectorView.setCurrentPanel(WebInspector.ProfilesPanel._instance());}
WebInspector.ProfilesPanel._instance=function()
{if(!WebInspector.ProfilesPanel._instanceObject)
WebInspector.ProfilesPanel._instanceObject=new WebInspector.ProfilesPanel();return WebInspector.ProfilesPanel._instanceObject;}
WebInspector.ProfilesPanelFactory=function()
{}
WebInspector.ProfilesPanelFactory.prototype={createPanel:function()
{return WebInspector.ProfilesPanel._instance();}};WebInspector.ProfileDataGridNode=function(profileNode,owningTree,hasChildren)
{this.profileNode=profileNode;WebInspector.DataGridNode.call(this,null,hasChildren);this.tree=owningTree;this.childrenByCallUID={};this.lastComparator=null;this.callUID=profileNode.callUID;this.selfTime=profileNode.selfTime;this.totalTime=profileNode.totalTime;this.functionName=WebInspector.beautifyFunctionName(profileNode.functionName);this._deoptReason=(!profileNode.deoptReason||profileNode.deoptReason==="no reason")?"":profileNode.deoptReason;this.url=profileNode.url;}
WebInspector.ProfileDataGridNode.prototype={createCell:function(columnIdentifier)
{var cell=this._createValueCell(columnIdentifier)||WebInspector.DataGridNode.prototype.createCell.call(this,columnIdentifier);if(columnIdentifier==="self"&&this._searchMatchedSelfColumn)
cell.classList.add("highlight");else if(columnIdentifier==="total"&&this._searchMatchedTotalColumn)
cell.classList.add("highlight");if(columnIdentifier!=="function")
return cell;if(this._deoptReason)
cell.classList.add("not-optimized");if(this._searchMatchedFunctionColumn)
cell.classList.add("highlight");if(this.profileNode.scriptId!=="0"){var lineNumber=this.profileNode.lineNumber?this.profileNode.lineNumber-1:0;var columnNumber=this.profileNode.columnNumber?this.profileNode.columnNumber-1:0;var target=this.tree.profileView.target();var urlElement=this.tree.profileView._linkifier.linkifyScriptLocation(target,this.profileNode.scriptId,this.profileNode.url,lineNumber,columnNumber,"profile-node-file");urlElement.style.maxWidth="75%";cell.insertBefore(urlElement,cell.firstChild);}
return cell;},_createValueCell:function(columnIdentifier)
{if(columnIdentifier!=="self"&&columnIdentifier!=="total")
return null;var cell=createElement("td");cell.className="numeric-column";var div=createElement("div");var valueSpan=createElement("span");valueSpan.textContent=this.data[columnIdentifier];div.appendChild(valueSpan);var percentColumn=columnIdentifier+"-percent";if(percentColumn in this.data){var percentSpan=createElement("span");percentSpan.className="percent-column";percentSpan.textContent=this.data[percentColumn];div.appendChild(percentSpan);div.classList.add("profile-multiple-values");}
cell.appendChild(div);return cell;},buildData:function()
{function formatMilliseconds(time)
{return WebInspector.UIString("%.1f\u2009ms",time);}
function formatPercent(value)
{return WebInspector.UIString("%.2f\u2009%%",value);}
var functionName;if(this._deoptReason){var content=createDocumentFragment();var marker=content.createChild("span","profile-warn-marker");marker.title=WebInspector.UIString("Not optimized: %s",this._deoptReason);content.createTextChild(this.functionName);functionName=content;}else{functionName=this.functionName;}
this.data={"function":functionName,"self-percent":formatPercent(this.selfPercent),"self":formatMilliseconds(this.selfTime),"total-percent":formatPercent(this.totalPercent),"total":formatMilliseconds(this.totalTime),};if(this.profileNode===this.tree.profileView.profile.idleNode){this.data['self-percent']=undefined;this.data['total-percent']=undefined}},select:function(supressSelectedEvent)
{WebInspector.DataGridNode.prototype.select.call(this,supressSelectedEvent);this.tree.profileView._dataGridNodeSelected(this);},deselect:function(supressDeselectedEvent)
{WebInspector.DataGridNode.prototype.deselect.call(this,supressDeselectedEvent);this.tree.profileView._dataGridNodeDeselected(this);},sort:function(comparator,force)
{var gridNodeGroups=[[this]];for(var gridNodeGroupIndex=0;gridNodeGroupIndex<gridNodeGroups.length;++gridNodeGroupIndex){var gridNodes=gridNodeGroups[gridNodeGroupIndex];var count=gridNodes.length;for(var index=0;index<count;++index){var gridNode=gridNodes[index];if(!force&&(!gridNode.expanded||gridNode.lastComparator===comparator)){if(gridNode.children.length)
gridNode.shouldRefreshChildren=true;continue;}
gridNode.lastComparator=comparator;var children=gridNode.children;var childCount=children.length;if(childCount){children.sort(comparator);for(var childIndex=0;childIndex<childCount;++childIndex)
children[childIndex].recalculateSiblings(childIndex);gridNodeGroups.push(children);}}}},insertChild:function(profileDataGridNode,index)
{WebInspector.DataGridNode.prototype.insertChild.call(this,profileDataGridNode,index);this.childrenByCallUID[profileDataGridNode.callUID]=(profileDataGridNode);},removeChild:function(profileDataGridNode)
{WebInspector.DataGridNode.prototype.removeChild.call(this,profileDataGridNode);delete this.childrenByCallUID[(profileDataGridNode).callUID];},removeChildren:function()
{WebInspector.DataGridNode.prototype.removeChildren.call(this);this.childrenByCallUID={};},findChild:function(node)
{if(!node)
return null;return this.childrenByCallUID[node.callUID];},get selfPercent()
{return this.selfTime/this.tree.totalTime*100.0;},get totalPercent()
{return this.totalTime/this.tree.totalTime*100.0;},populate:function()
{WebInspector.ProfileDataGridNode.populate(this);},populateChildren:function()
{},save:function()
{if(this._savedChildren)
return;this._savedSelfTime=this.selfTime;this._savedTotalTime=this.totalTime;this._savedChildren=this.children.slice();},restore:function()
{if(!this._savedChildren)
return;this.selfTime=this._savedSelfTime;this.totalTime=this._savedTotalTime;this.removeChildren();var children=this._savedChildren;var count=children.length;for(var index=0;index<count;++index){children[index].restore();this.appendChild(children[index]);}},merge:function(child,shouldAbsorb)
{WebInspector.ProfileDataGridNode.merge(this,child,shouldAbsorb);},__proto__:WebInspector.DataGridNode.prototype}
WebInspector.ProfileDataGridNode.merge=function(container,child,shouldAbsorb)
{container.selfTime+=child.selfTime;if(!shouldAbsorb)
container.totalTime+=child.totalTime;var children=container.children.slice();container.removeChildren();var count=children.length;for(var index=0;index<count;++index){if(!shouldAbsorb||children[index]!==child)
container.appendChild(children[index]);}
children=child.children.slice();count=children.length;for(var index=0;index<count;++index){var orphanedChild=children[index];var existingChild=container.childrenByCallUID[orphanedChild.callUID];if(existingChild)
existingChild.merge(orphanedChild,false);else
container.appendChild(orphanedChild);}}
WebInspector.ProfileDataGridNode.populate=function(container)
{if(container._populated)
return;container._populated=true;container.populateChildren();var currentComparator=container.tree.lastComparator;if(currentComparator)
container.sort(currentComparator,true);}
WebInspector.ProfileDataGridTree=function(profileView,rootProfileNode)
{this.tree=this;this.children=[];this.profileView=profileView;var idleNode=profileView.profile.idleNode;this.totalTime=rootProfileNode.totalTime-(idleNode?idleNode.totalTime:0);this.lastComparator=null;this.childrenByCallUID={};}
WebInspector.ProfileDataGridTree.prototype={get expanded()
{return true;},appendChild:function(child)
{this.insertChild(child,this.children.length);},insertChild:function(child,index)
{this.children.splice(index,0,child);this.childrenByCallUID[child.callUID]=child;},removeChildren:function()
{this.children=[];this.childrenByCallUID={};},populateChildren:function()
{},findChild:WebInspector.ProfileDataGridNode.prototype.findChild,sort:WebInspector.ProfileDataGridNode.prototype.sort,save:function()
{if(this._savedChildren)
return;this._savedTotalTime=this.totalTime;this._savedChildren=this.children.slice();},restore:function()
{if(!this._savedChildren)
return;this.children=this._savedChildren;this.totalTime=this._savedTotalTime;var children=this.children;var count=children.length;for(var index=0;index<count;++index)
children[index].restore();this._savedChildren=null;},performSearch:function(searchConfig,shouldJump,jumpBackwards)
{this.searchCanceled();var query=searchConfig.query.trim();if(!query.length)
return 0;var greaterThan=(query.startsWith(">"));var lessThan=(query.startsWith("<"));var equalTo=(query.startsWith("=")||((greaterThan||lessThan)&&query.indexOf("=")===1));var percentUnits=(query.endsWith("%"));var millisecondsUnits=(query.length>2&&query.endsWith("ms"));var secondsUnits=(!millisecondsUnits&&query.endsWith("s"));var queryNumber=parseFloat(query);if(greaterThan||lessThan||equalTo){if(equalTo&&(greaterThan||lessThan))
queryNumber=parseFloat(query.substring(2));else
queryNumber=parseFloat(query.substring(1));}
var queryNumberMilliseconds=(secondsUnits?(queryNumber*1000):queryNumber);if(!isNaN(queryNumber)&&!(greaterThan||lessThan))
equalTo=true;var matcher=createPlainTextSearchRegex(query,"i");function matchesQuery(profileDataGridNode)
{delete profileDataGridNode._searchMatchedSelfColumn;delete profileDataGridNode._searchMatchedTotalColumn;delete profileDataGridNode._searchMatchedFunctionColumn;if(percentUnits){if(lessThan){if(profileDataGridNode.selfPercent<queryNumber)
profileDataGridNode._searchMatchedSelfColumn=true;if(profileDataGridNode.totalPercent<queryNumber)
profileDataGridNode._searchMatchedTotalColumn=true;}else if(greaterThan){if(profileDataGridNode.selfPercent>queryNumber)
profileDataGridNode._searchMatchedSelfColumn=true;if(profileDataGridNode.totalPercent>queryNumber)
profileDataGridNode._searchMatchedTotalColumn=true;}
if(equalTo){if(profileDataGridNode.selfPercent==queryNumber)
profileDataGridNode._searchMatchedSelfColumn=true;if(profileDataGridNode.totalPercent==queryNumber)
profileDataGridNode._searchMatchedTotalColumn=true;}}else if(millisecondsUnits||secondsUnits){if(lessThan){if(profileDataGridNode.selfTime<queryNumberMilliseconds)
profileDataGridNode._searchMatchedSelfColumn=true;if(profileDataGridNode.totalTime<queryNumberMilliseconds)
profileDataGridNode._searchMatchedTotalColumn=true;}else if(greaterThan){if(profileDataGridNode.selfTime>queryNumberMilliseconds)
profileDataGridNode._searchMatchedSelfColumn=true;if(profileDataGridNode.totalTime>queryNumberMilliseconds)
profileDataGridNode._searchMatchedTotalColumn=true;}
if(equalTo){if(profileDataGridNode.selfTime==queryNumberMilliseconds)
profileDataGridNode._searchMatchedSelfColumn=true;if(profileDataGridNode.totalTime==queryNumberMilliseconds)
profileDataGridNode._searchMatchedTotalColumn=true;}}
if(profileDataGridNode.functionName.match(matcher)||(profileDataGridNode.url&&profileDataGridNode.url.match(matcher)))
profileDataGridNode._searchMatchedFunctionColumn=true;if(profileDataGridNode._searchMatchedSelfColumn||profileDataGridNode._searchMatchedTotalColumn||profileDataGridNode._searchMatchedFunctionColumn){profileDataGridNode.refresh();return true;}
return false;}
var current=this.children[0];this._searchResults=[];while(current){if(matchesQuery(current))
this._searchResults.push({profileNode:current});current=current.traverseNextNode(false,null,false);}
this._searchResultIndex=jumpBackwards?0:this._searchResults.length-1;return this._searchResults.length;},searchCanceled:function()
{if(this._searchResults){for(var i=0;i<this._searchResults.length;++i){var profileNode=this._searchResults[i].profileNode;delete profileNode._searchMatchedSelfColumn;delete profileNode._searchMatchedTotalColumn;delete profileNode._searchMatchedFunctionColumn;profileNode.refresh();}}
this._searchResults=[];this._searchResultIndex=-1;},jumpToNextSearchResult:function()
{if(!this._searchResults||!this._searchResults.length)
return;this._searchResultIndex=(this._searchResultIndex+1)%this._searchResults.length;this._jumpToSearchResult(this._searchResultIndex);},jumpToPreviousSearchResult:function()
{if(!this._searchResults||!this._searchResults.length)
return;this._searchResultIndex=(this._searchResultIndex-1+this._searchResults.length)%this._searchResults.length;this._jumpToSearchResult(this._searchResultIndex);},currentSearchResultIndex:function()
{return this._searchResultIndex;},_jumpToSearchResult:function(index)
{var searchResult=this._searchResults[index];if(!searchResult)
return;var profileNode=searchResult.profileNode;profileNode.revealAndSelect();}}
WebInspector.ProfileDataGridTree.propertyComparators=[{},{}];WebInspector.ProfileDataGridTree.propertyComparator=function(property,isAscending)
{var comparator=WebInspector.ProfileDataGridTree.propertyComparators[(isAscending?1:0)][property];if(!comparator){if(isAscending){comparator=function(lhs,rhs)
{if(lhs[property]<rhs[property])
return-1;if(lhs[property]>rhs[property])
return 1;return 0;};}else{comparator=function(lhs,rhs)
{if(lhs[property]>rhs[property])
return-1;if(lhs[property]<rhs[property])
return 1;return 0;};}
WebInspector.ProfileDataGridTree.propertyComparators[(isAscending?1:0)][property]=comparator;}
return comparator;};WebInspector.BottomUpProfileDataGridNode=function(profileNode,owningTree)
{WebInspector.ProfileDataGridNode.call(this,profileNode,owningTree,this._willHaveChildren(profileNode));this._remainingNodeInfos=[];}
WebInspector.BottomUpProfileDataGridNode.prototype={_takePropertiesFromProfileDataGridNode:function(profileDataGridNode)
{this.save();this.selfTime=profileDataGridNode.selfTime;this.totalTime=profileDataGridNode.totalTime;},_keepOnlyChild:function(child)
{this.save();this.removeChildren();this.appendChild(child);},_exclude:function(aCallUID)
{if(this._remainingNodeInfos)
this.populate();this.save();var children=this.children;var index=this.children.length;while(index--)
children[index]._exclude(aCallUID);var child=this.childrenByCallUID[aCallUID];if(child)
this.merge(child,true);},restore:function()
{WebInspector.ProfileDataGridNode.prototype.restore.call(this);if(!this.children.length)
this.hasChildren=this._willHaveChildren(this.profileNode);},merge:function(child,shouldAbsorb)
{this.selfTime-=child.selfTime;WebInspector.ProfileDataGridNode.prototype.merge.call(this,child,shouldAbsorb);},populateChildren:function()
{WebInspector.BottomUpProfileDataGridNode._sharedPopulate(this);},_willHaveChildren:function(profileNode)
{return!!(profileNode.parent&&profileNode.parent.parent);},__proto__:WebInspector.ProfileDataGridNode.prototype}
WebInspector.BottomUpProfileDataGridNode._sharedPopulate=function(container)
{var remainingNodeInfos=container._remainingNodeInfos;var count=remainingNodeInfos.length;for(var index=0;index<count;++index){var nodeInfo=remainingNodeInfos[index];var ancestor=nodeInfo.ancestor;var focusNode=nodeInfo.focusNode;var child=container.findChild(ancestor);if(child){var totalTimeAccountedFor=nodeInfo.totalTimeAccountedFor;child.selfTime+=focusNode.selfTime;if(!totalTimeAccountedFor)
child.totalTime+=focusNode.totalTime;}else{child=new WebInspector.BottomUpProfileDataGridNode(ancestor,(container.tree));if(ancestor!==focusNode){child.selfTime=focusNode.selfTime;child.totalTime=focusNode.totalTime;}
container.appendChild(child);}
var parent=ancestor.parent;if(parent&&parent.parent){nodeInfo.ancestor=parent;child._remainingNodeInfos.push(nodeInfo);}}
for(var i=0;i<container.children.length;++i)
container.children[i].buildData();delete container._remainingNodeInfos;}
WebInspector.BottomUpProfileDataGridTree=function(profileView,rootProfileNode)
{WebInspector.ProfileDataGridTree.call(this,profileView,rootProfileNode);var profileNodeUIDs=0;var profileNodeGroups=[[],[rootProfileNode]];var visitedProfileNodesForCallUID={};this._remainingNodeInfos=[];for(var profileNodeGroupIndex=0;profileNodeGroupIndex<profileNodeGroups.length;++profileNodeGroupIndex){var parentProfileNodes=profileNodeGroups[profileNodeGroupIndex];var profileNodes=profileNodeGroups[++profileNodeGroupIndex];var count=profileNodes.length;for(var index=0;index<count;++index){var profileNode=profileNodes[index];if(!profileNode.UID)
profileNode.UID=++profileNodeUIDs;if(profileNode.parent){var visitedNodes=visitedProfileNodesForCallUID[profileNode.callUID];var totalTimeAccountedFor=false;if(!visitedNodes){visitedNodes={};visitedProfileNodesForCallUID[profileNode.callUID]=visitedNodes;}else{var parentCount=parentProfileNodes.length;for(var parentIndex=0;parentIndex<parentCount;++parentIndex){if(visitedNodes[parentProfileNodes[parentIndex].UID]){totalTimeAccountedFor=true;break;}}}
visitedNodes[profileNode.UID]=true;this._remainingNodeInfos.push({ancestor:profileNode,focusNode:profileNode,totalTimeAccountedFor:totalTimeAccountedFor});}
var children=profileNode.children;if(children.length){profileNodeGroups.push(parentProfileNodes.concat([profileNode]));profileNodeGroups.push(children);}}}
WebInspector.ProfileDataGridNode.populate(this);return this;}
WebInspector.BottomUpProfileDataGridTree.prototype={focus:function(profileDataGridNode)
{if(!profileDataGridNode)
return;this.save();var currentNode=profileDataGridNode;var focusNode=profileDataGridNode;while(currentNode.parent&&(currentNode instanceof WebInspector.ProfileDataGridNode)){currentNode._takePropertiesFromProfileDataGridNode(profileDataGridNode);focusNode=currentNode;currentNode=currentNode.parent;if(currentNode instanceof WebInspector.ProfileDataGridNode)
currentNode._keepOnlyChild(focusNode);}
this.children=[focusNode];this.totalTime=profileDataGridNode.totalTime;},exclude:function(profileDataGridNode)
{if(!profileDataGridNode)
return;this.save();var excludedCallUID=profileDataGridNode.callUID;var excludedTopLevelChild=this.childrenByCallUID[excludedCallUID];if(excludedTopLevelChild)
this.children.remove(excludedTopLevelChild);var children=this.children;var count=children.length;for(var index=0;index<count;++index)
children[index]._exclude(excludedCallUID);if(this.lastComparator)
this.sort(this.lastComparator,true);},buildData:function()
{},populateChildren:function()
{WebInspector.BottomUpProfileDataGridNode._sharedPopulate(this);},__proto__:WebInspector.ProfileDataGridTree.prototype};WebInspector.TopDownProfileDataGridNode=function(profileNode,owningTree)
{var hasChildren=!!(profileNode.children&&profileNode.children.length);WebInspector.ProfileDataGridNode.call(this,profileNode,owningTree,hasChildren);this._remainingChildren=profileNode.children;this.buildData();}
WebInspector.TopDownProfileDataGridNode.prototype={populateChildren:function()
{WebInspector.TopDownProfileDataGridNode._sharedPopulate(this);},__proto__:WebInspector.ProfileDataGridNode.prototype}
WebInspector.TopDownProfileDataGridNode._sharedPopulate=function(container)
{var children=container._remainingChildren;var childrenLength=children.length;for(var i=0;i<childrenLength;++i)
container.appendChild(new WebInspector.TopDownProfileDataGridNode(children[i],(container.tree)));container._remainingChildren=null;}
WebInspector.TopDownProfileDataGridNode._excludeRecursively=function(container,aCallUID)
{if(container._remainingChildren)
container.populate();container.save();var children=container.children;var index=container.children.length;while(index--)
WebInspector.TopDownProfileDataGridNode._excludeRecursively(children[index],aCallUID);var child=container.childrenByCallUID[aCallUID];if(child)
WebInspector.ProfileDataGridNode.merge(container,child,true);}
WebInspector.TopDownProfileDataGridTree=function(profileView,rootProfileNode)
{WebInspector.ProfileDataGridTree.call(this,profileView,rootProfileNode);this._remainingChildren=rootProfileNode.children;WebInspector.ProfileDataGridNode.populate(this);}
WebInspector.TopDownProfileDataGridTree.prototype={focus:function(profileDataGridNode)
{if(!profileDataGridNode)
return;this.save();profileDataGridNode.savePosition();this.children=[profileDataGridNode];this.totalTime=profileDataGridNode.totalTime;},exclude:function(profileDataGridNode)
{if(!profileDataGridNode)
return;this.save();WebInspector.TopDownProfileDataGridNode._excludeRecursively(this,profileDataGridNode.callUID);if(this.lastComparator)
this.sort(this.lastComparator,true);},restore:function()
{if(!this._savedChildren)
return;this.children[0].restorePosition();WebInspector.ProfileDataGridTree.prototype.restore.call(this);},populateChildren:function()
{WebInspector.TopDownProfileDataGridNode._sharedPopulate(this);},__proto__:WebInspector.ProfileDataGridTree.prototype};WebInspector.CPUFlameChartDataProvider=function(cpuProfile,target)
{WebInspector.FlameChartDataProvider.call(this);this._cpuProfile=cpuProfile;this._target=target;this._colorGenerator=WebInspector.CPUFlameChartDataProvider.colorGenerator();}
WebInspector.CPUFlameChartDataProvider.prototype={barHeight:function()
{return 15;},textBaseline:function()
{return 4;},textPadding:function()
{return 2;},dividerOffsets:function(startTime,endTime)
{return null;},minimumBoundary:function()
{return this._cpuProfile.profileStartTime;},totalTime:function()
{return this._cpuProfile.profileHead.totalTime;},maxStackDepth:function()
{return this._maxStackDepth;},timelineData:function()
{return this._timelineData||this._calculateTimelineData();},_calculateTimelineData:function()
{function ChartEntry(depth,duration,startTime,selfTime,node)
{this.depth=depth;this.duration=duration;this.startTime=startTime;this.selfTime=selfTime;this.node=node;}
var entries=[];var stack=[];var maxDepth=5;function onOpenFrame()
{stack.push(entries.length);entries.push(null);}
function onCloseFrame(depth,node,startTime,totalTime,selfTime)
{var index=stack.pop();entries[index]=new ChartEntry(depth,totalTime,startTime,selfTime,node);maxDepth=Math.max(maxDepth,depth);}
this._cpuProfile.forEachFrame(onOpenFrame,onCloseFrame);var entryNodes=new Array(entries.length);var entryLevels=new Uint8Array(entries.length);var entryTotalTimes=new Float32Array(entries.length);var entrySelfTimes=new Float32Array(entries.length);var entryStartTimes=new Float64Array(entries.length);var minimumBoundary=this.minimumBoundary();for(var i=0;i<entries.length;++i){var entry=entries[i];entryNodes[i]=entry.node;entryLevels[i]=entry.depth;entryTotalTimes[i]=entry.duration;entryStartTimes[i]=entry.startTime;entrySelfTimes[i]=entry.selfTime;}
this._maxStackDepth=maxDepth;this._timelineData=new WebInspector.FlameChart.TimelineData(entryLevels,entryTotalTimes,entryStartTimes);this._entryNodes=entryNodes;this._entrySelfTimes=entrySelfTimes;return this._timelineData;},_millisecondsToString:function(ms)
{if(ms===0)
return"0";if(ms<1000)
return WebInspector.UIString("%.1f\u2009ms",ms);return Number.secondsToString(ms/1000,true);},prepareHighlightedEntryInfo:function(entryIndex)
{var timelineData=this._timelineData;var node=this._entryNodes[entryIndex];if(!node)
return null;var entryInfo=[];function pushEntryInfoRow(title,text)
{var row={};row.title=title;row.text=text;entryInfo.push(row);}
var name=WebInspector.beautifyFunctionName(node.functionName);pushEntryInfoRow(WebInspector.UIString("Name"),name);var selfTime=this._millisecondsToString(this._entrySelfTimes[entryIndex]);var totalTime=this._millisecondsToString(timelineData.entryTotalTimes[entryIndex]);pushEntryInfoRow(WebInspector.UIString("Self time"),selfTime);pushEntryInfoRow(WebInspector.UIString("Total time"),totalTime);var text=(new WebInspector.Linkifier()).linkifyScriptLocation(this._target,node.scriptId,node.url,node.lineNumber,node.columnNumber).textContent;pushEntryInfoRow(WebInspector.UIString("URL"),text);pushEntryInfoRow(WebInspector.UIString("Aggregated self time"),Number.secondsToString(node.selfTime/1000,true));pushEntryInfoRow(WebInspector.UIString("Aggregated total time"),Number.secondsToString(node.totalTime/1000,true));if(node.deoptReason&&node.deoptReason!=="no reason")
pushEntryInfoRow(WebInspector.UIString("Not optimized"),node.deoptReason);return entryInfo;},canJumpToEntry:function(entryIndex)
{return this._entryNodes[entryIndex].scriptId!=="0";},entryTitle:function(entryIndex)
{var node=this._entryNodes[entryIndex];return WebInspector.beautifyFunctionName(node.functionName);},entryFont:function(entryIndex)
{if(!this._font){this._font=(this.barHeight()-4)+"px "+WebInspector.fontFamily();this._boldFont="bold "+this._font;}
var node=this._entryNodes[entryIndex];var reason=node.deoptReason;return(reason&&reason!=="no reason")?this._boldFont:this._font;},entryColor:function(entryIndex)
{var node=this._entryNodes[entryIndex];return this._colorGenerator.colorForID(node.functionName+":"+node.url);},decorateEntry:function(entryIndex,context,text,barX,barY,barWidth,barHeight)
{return false;},forceDecoration:function(entryIndex)
{return false;},highlightTimeRange:function(entryIndex)
{var startTime=this._timelineData.entryStartTimes[entryIndex];return{startTime:startTime,endTime:startTime+this._timelineData.entryTotalTimes[entryIndex]};},paddingLeft:function()
{return 15;},textColor:function(entryIndex)
{return"#333";}}
WebInspector.CPUFlameChartDataProvider.colorGenerator=function()
{if(!WebInspector.CPUFlameChartDataProvider._colorGenerator){var colorGenerator=new WebInspector.FlameChart.ColorGenerator({min:180,max:310,count:7},{min:50,max:80,count:5},{min:80,max:90,count:3});colorGenerator.setColorForID("(idle):","hsl(0, 0%, 94%)");colorGenerator.setColorForID("(program):","hsl(0, 0%, 80%)");colorGenerator.setColorForID("(garbage collector):","hsl(0, 0%, 80%)");WebInspector.CPUFlameChartDataProvider._colorGenerator=colorGenerator;}
return WebInspector.CPUFlameChartDataProvider._colorGenerator;}
WebInspector.CPUProfileFlameChart=function(dataProvider)
{WebInspector.VBox.call(this);this.element.id="cpu-flame-chart";this._overviewPane=new WebInspector.CPUProfileFlameChart.OverviewPane(dataProvider);this._overviewPane.show(this.element);this._mainPane=new WebInspector.FlameChart(dataProvider,this._overviewPane,true);this._mainPane.show(this.element);this._mainPane.addEventListener(WebInspector.FlameChart.Events.EntrySelected,this._onEntrySelected,this);this._overviewPane.addEventListener(WebInspector.OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);this._dataProvider=dataProvider;this._searchResults=[];}
WebInspector.CPUProfileFlameChart.prototype={focus:function()
{this._mainPane.focus();},_onWindowChanged:function(event)
{var windowLeft=event.data.windowTimeLeft;var windowRight=event.data.windowTimeRight;this._mainPane.setWindowTimes(windowLeft,windowRight);},selectRange:function(timeLeft,timeRight)
{this._overviewPane._selectRange(timeLeft,timeRight);},_onEntrySelected:function(event)
{this.dispatchEventToListeners(WebInspector.FlameChart.Events.EntrySelected,event.data);},update:function()
{this._overviewPane.update();this._mainPane.update();},performSearch:function(searchConfig,shouldJump,jumpBackwards)
{var matcher=createPlainTextSearchRegex(searchConfig.query,searchConfig.caseSensitive?"":"i");var selectedEntryIndex=this._searchResultIndex!==-1?this._searchResults[this._searchResultIndex]:-1;this._searchResults=[];var entriesCount=this._dataProvider._entryNodes.length;for(var index=0;index<entriesCount;++index){if(this._dataProvider.entryTitle(index).match(matcher))
this._searchResults.push(index);}
if(this._searchResults.length){this._searchResultIndex=this._searchResults.indexOf(selectedEntryIndex);if(this._searchResultIndex===-1)
this._searchResultIndex=jumpBackwards?this._searchResults.length-1:0;this._mainPane.setSelectedEntry(this._searchResults[this._searchResultIndex]);}else
this.searchCanceled();return this._searchResults.length;},searchCanceled:function()
{this._mainPane.setSelectedEntry(-1);this._searchResults=[];this._searchResultIndex=-1;},jumpToNextSearchResult:function()
{this._searchResultIndex=(this._searchResultIndex+1)%this._searchResults.length;this._mainPane.setSelectedEntry(this._searchResults[this._searchResultIndex]);},jumpToPreviousSearchResult:function()
{this._searchResultIndex=(this._searchResultIndex-1+this._searchResults.length)%this._searchResults.length;this._mainPane.setSelectedEntry(this._searchResults[this._searchResultIndex]);},currentSearchResultIndex:function()
{return this._searchResultIndex;},__proto__:WebInspector.VBox.prototype};WebInspector.CPUProfileFlameChart.OverviewCalculator=function()
{}
WebInspector.CPUProfileFlameChart.OverviewCalculator.prototype={paddingLeft:function()
{return 0;},_updateBoundaries:function(overviewPane)
{this._minimumBoundaries=overviewPane._dataProvider.minimumBoundary();var totalTime=overviewPane._dataProvider.totalTime();this._maximumBoundaries=this._minimumBoundaries+totalTime;this._xScaleFactor=overviewPane._overviewContainer.clientWidth/totalTime;},computePosition:function(time)
{return(time-this._minimumBoundaries)*this._xScaleFactor;},formatTime:function(value,precision)
{return Number.secondsToString((value-this._minimumBoundaries)/1000);},maximumBoundary:function()
{return this._maximumBoundaries;},minimumBoundary:function()
{return this._minimumBoundaries;},zeroTime:function()
{return this._minimumBoundaries;},boundarySpan:function()
{return this._maximumBoundaries-this._minimumBoundaries;}}
WebInspector.CPUProfileFlameChart.OverviewPane=function(dataProvider)
{WebInspector.VBox.call(this);this.element.classList.add("cpu-profile-flame-chart-overview-pane");this._overviewContainer=this.element.createChild("div","cpu-profile-flame-chart-overview-container");this._overviewGrid=new WebInspector.OverviewGrid("cpu-profile-flame-chart");this._overviewGrid.element.classList.add("fill");this._overviewCanvas=this._overviewContainer.createChild("canvas","cpu-profile-flame-chart-overview-canvas");this._overviewContainer.appendChild(this._overviewGrid.element);this._overviewCalculator=new WebInspector.CPUProfileFlameChart.OverviewCalculator();this._dataProvider=dataProvider;this._overviewGrid.addEventListener(WebInspector.OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);}
WebInspector.CPUProfileFlameChart.OverviewPane.prototype={requestWindowTimes:function(windowStartTime,windowEndTime)
{this._selectRange(windowStartTime,windowEndTime);},updateBoxSelection:function(startTime,endTime)
{},_selectRange:function(timeLeft,timeRight)
{var startTime=this._dataProvider.minimumBoundary();var totalTime=this._dataProvider.totalTime();this._overviewGrid.setWindow((timeLeft-startTime)/totalTime,(timeRight-startTime)/totalTime);},_onWindowChanged:function(event)
{var startTime=this._dataProvider.minimumBoundary();var totalTime=this._dataProvider.totalTime();var data={windowTimeLeft:startTime+this._overviewGrid.windowLeft()*totalTime,windowTimeRight:startTime+this._overviewGrid.windowRight()*totalTime};this.dispatchEventToListeners(WebInspector.OverviewGrid.Events.WindowChanged,data);},_timelineData:function()
{return this._dataProvider.timelineData();},onResize:function()
{this._scheduleUpdate();},_scheduleUpdate:function()
{if(this._updateTimerId)
return;this._updateTimerId=this.element.window().requestAnimationFrame(this.update.bind(this));},update:function()
{this._updateTimerId=0;var timelineData=this._timelineData();if(!timelineData)
return;this._resetCanvas(this._overviewContainer.clientWidth,this._overviewContainer.clientHeight-WebInspector.FlameChart.DividersBarHeight);this._overviewCalculator._updateBoundaries(this);this._overviewGrid.updateDividers(this._overviewCalculator);this._drawOverviewCanvas();},_drawOverviewCanvas:function()
{var canvasWidth=this._overviewCanvas.width;var canvasHeight=this._overviewCanvas.height;var drawData=this._calculateDrawData(canvasWidth);var context=this._overviewCanvas.getContext("2d");var ratio=window.devicePixelRatio;var offsetFromBottom=ratio;var lineWidth=1;var yScaleFactor=canvasHeight/(this._dataProvider.maxStackDepth()*1.1);context.lineWidth=lineWidth;context.translate(0.5,0.5);context.strokeStyle="rgba(20,0,0,0.4)";context.fillStyle="rgba(214,225,254,0.8)";context.moveTo(-lineWidth,canvasHeight+lineWidth);context.lineTo(-lineWidth,Math.round(canvasHeight-drawData[0]*yScaleFactor-offsetFromBottom));var value;for(var x=0;x<canvasWidth;++x){value=Math.round(canvasHeight-drawData[x]*yScaleFactor-offsetFromBottom);context.lineTo(x,value);}
context.lineTo(canvasWidth+lineWidth,value);context.lineTo(canvasWidth+lineWidth,canvasHeight+lineWidth);context.fill();context.stroke();context.closePath();},_calculateDrawData:function(width)
{var dataProvider=this._dataProvider;var timelineData=this._timelineData();var entryStartTimes=timelineData.entryStartTimes;var entryTotalTimes=timelineData.entryTotalTimes;var entryLevels=timelineData.entryLevels;var length=entryStartTimes.length;var minimumBoundary=this._dataProvider.minimumBoundary();var drawData=new Uint8Array(width);var scaleFactor=width/dataProvider.totalTime();for(var entryIndex=0;entryIndex<length;++entryIndex){var start=Math.floor((entryStartTimes[entryIndex]-minimumBoundary)*scaleFactor);var finish=Math.floor((entryStartTimes[entryIndex]-minimumBoundary+entryTotalTimes[entryIndex])*scaleFactor);for(var x=start;x<=finish;++x)
drawData[x]=Math.max(drawData[x],entryLevels[entryIndex]+1);}
return drawData;},_resetCanvas:function(width,height)
{var ratio=window.devicePixelRatio;this._overviewCanvas.width=width*ratio;this._overviewCanvas.height=height*ratio;this._overviewCanvas.style.width=width+"px";this._overviewCanvas.style.height=height+"px";},__proto__:WebInspector.VBox.prototype};WebInspector.CPUProfileView=function(profileHeader)
{WebInspector.VBox.call(this);this.element.classList.add("cpu-profile-view");this._searchableView=new WebInspector.SearchableView(this);this._searchableView.show(this.element);this._viewType=WebInspector.settings.createSetting("cpuProfilerView",WebInspector.CPUProfileView._TypeHeavy);var columns=[];columns.push({id:"self",title:WebInspector.UIString("Self"),width:"120px",sort:WebInspector.DataGrid.Order.Descending,sortable:true});columns.push({id:"total",title:WebInspector.UIString("Total"),width:"120px",sortable:true});columns.push({id:"function",title:WebInspector.UIString("Function"),disclosure:true,sortable:true});this.dataGrid=new WebInspector.DataGrid(columns);this.dataGrid.addEventListener(WebInspector.DataGrid.Events.SortingChanged,this._sortProfile,this);this.viewSelectComboBox=new WebInspector.StatusBarComboBox(this._changeView.bind(this));var options={};options[WebInspector.CPUProfileView._TypeFlame]=this.viewSelectComboBox.createOption(WebInspector.UIString("Chart"),"",WebInspector.CPUProfileView._TypeFlame);options[WebInspector.CPUProfileView._TypeHeavy]=this.viewSelectComboBox.createOption(WebInspector.UIString("Heavy (Bottom Up)"),"",WebInspector.CPUProfileView._TypeHeavy);options[WebInspector.CPUProfileView._TypeTree]=this.viewSelectComboBox.createOption(WebInspector.UIString("Tree (Top Down)"),"",WebInspector.CPUProfileView._TypeTree);var optionName=this._viewType.get()||WebInspector.CPUProfileView._TypeFlame;var option=options[optionName]||options[WebInspector.CPUProfileView._TypeFlame];this.viewSelectComboBox.select(option);this.focusButton=new WebInspector.StatusBarButton(WebInspector.UIString("Focus selected function."),"focus-status-bar-item");this.focusButton.setEnabled(false);this.focusButton.addEventListener("click",this._focusClicked,this);this.excludeButton=new WebInspector.StatusBarButton(WebInspector.UIString("Exclude selected function."),"delete-status-bar-item");this.excludeButton.setEnabled(false);this.excludeButton.addEventListener("click",this._excludeClicked,this);this.resetButton=new WebInspector.StatusBarButton(WebInspector.UIString("Restore all functions."),"refresh-status-bar-item");this.resetButton.setVisible(false);this.resetButton.addEventListener("click",this._resetClicked,this);this._profileHeader=profileHeader;this._linkifier=new WebInspector.Linkifier(new WebInspector.Linkifier.DefaultFormatter(30));this.profile=new WebInspector.CPUProfileDataModel(profileHeader._profile||profileHeader.protocolProfile());this._changeView();if(this._flameChart)
this._flameChart.update();}
WebInspector.CPUProfileView._TypeFlame="Flame";WebInspector.CPUProfileView._TypeTree="Tree";WebInspector.CPUProfileView._TypeHeavy="Heavy";WebInspector.CPUProfileView.Searchable=function()
{}
WebInspector.CPUProfileView.Searchable.prototype={jumpToNextSearchResult:function(){},jumpToPreviousSearchResult:function(){},searchCanceled:function(){},performSearch:function(searchConfig,shouldJump,jumpBackwards){},currentSearchResultIndex:function(){}}
WebInspector.CPUProfileView.prototype={focus:function()
{if(this._flameChart)
this._flameChart.focus();else
WebInspector.View.prototype.focus.call(this);},target:function()
{return this._profileHeader.target();},selectRange:function(timeLeft,timeRight)
{if(!this._flameChart)
return;this._flameChart.selectRange(timeLeft,timeRight);},statusBarItems:function()
{return[this.viewSelectComboBox,this.focusButton,this.excludeButton,this.resetButton];},_getBottomUpProfileDataGridTree:function()
{if(!this._bottomUpProfileDataGridTree)
this._bottomUpProfileDataGridTree=new WebInspector.BottomUpProfileDataGridTree(this,(this.profile.profileHead));return this._bottomUpProfileDataGridTree;},_getTopDownProfileDataGridTree:function()
{if(!this._topDownProfileDataGridTree)
this._topDownProfileDataGridTree=new WebInspector.TopDownProfileDataGridTree(this,(this.profile.profileHead));return this._topDownProfileDataGridTree;},willHide:function()
{this._currentSearchResultIndex=-1;},refresh:function()
{var selectedProfileNode=this.dataGrid.selectedNode?this.dataGrid.selectedNode.profileNode:null;this.dataGrid.rootNode().removeChildren();var children=this.profileDataGridTree.children;var count=children.length;for(var index=0;index<count;++index)
this.dataGrid.rootNode().appendChild(children[index]);if(selectedProfileNode)
selectedProfileNode.selected=true;},refreshVisibleData:function()
{var child=this.dataGrid.rootNode().children[0];while(child){child.refresh();child=child.traverseNextNode(false,null,true);}},searchableView:function()
{return this._searchableView;},supportsCaseSensitiveSearch:function()
{return true;},supportsRegexSearch:function()
{return false;},searchCanceled:function()
{this._searchableElement.searchCanceled();},performSearch:function(searchConfig,shouldJump,jumpBackwards)
{var matchesCount=this._searchableElement.performSearch(searchConfig,shouldJump,jumpBackwards);this._searchableView.updateSearchMatchesCount(matchesCount);this._searchableView.updateCurrentMatchIndex(this._searchableElement.currentSearchResultIndex());},jumpToNextSearchResult:function()
{this._searchableElement.jumpToNextSearchResult();this._searchableView.updateCurrentMatchIndex(this._searchableElement.currentSearchResultIndex());},jumpToPreviousSearchResult:function()
{this._searchableElement.jumpToPreviousSearchResult();this._searchableView.updateCurrentMatchIndex(this._searchableElement.currentSearchResultIndex());},_ensureFlameChartCreated:function()
{if(this._flameChart)
return;this._dataProvider=new WebInspector.CPUFlameChartDataProvider(this.profile,this._profileHeader.target());this._flameChart=new WebInspector.CPUProfileFlameChart(this._dataProvider);this._flameChart.addEventListener(WebInspector.FlameChart.Events.EntrySelected,this._onEntrySelected.bind(this));},_onEntrySelected:function(event)
{var entryIndex=event.data;var node=this._dataProvider._entryNodes[entryIndex];var target=this._profileHeader.target();if(!node||!node.scriptId||!target)
return;var script=target.debuggerModel.scriptForId(node.scriptId);if(!script)
return;var location=(script.target().debuggerModel.createRawLocation(script,node.lineNumber,node.columnNumber));WebInspector.Revealer.reveal(WebInspector.debuggerWorkspaceBinding.rawLocationToUILocation(location));},_changeView:function()
{if(!this.profile)
return;this._searchableView.closeSearch();if(this._visibleView)
this._visibleView.detach();this._viewType.set(this.viewSelectComboBox.selectedOption().value);switch(this._viewType.get()){case WebInspector.CPUProfileView._TypeFlame:this._ensureFlameChartCreated();this._visibleView=this._flameChart;this._searchableElement=this._flameChart;break;case WebInspector.CPUProfileView._TypeTree:this.profileDataGridTree=this._getTopDownProfileDataGridTree();this._sortProfile();this._visibleView=this.dataGrid;this._searchableElement=this.profileDataGridTree;break;case WebInspector.CPUProfileView._TypeHeavy:this.profileDataGridTree=this._getBottomUpProfileDataGridTree();this._sortProfile();this._visibleView=this.dataGrid;this._searchableElement=this.profileDataGridTree;break;}
var isFlame=this._viewType.get()===WebInspector.CPUProfileView._TypeFlame;this.focusButton.setVisible(!isFlame);this.excludeButton.setVisible(!isFlame);this.resetButton.setVisible(!isFlame);this._visibleView.show(this._searchableView.element);},_focusClicked:function(event)
{if(!this.dataGrid.selectedNode)
return;this.resetButton.setVisible(true);this.profileDataGridTree.focus(this.dataGrid.selectedNode);this.refresh();this.refreshVisibleData();},_excludeClicked:function(event)
{var selectedNode=this.dataGrid.selectedNode;if(!selectedNode)
return;selectedNode.deselect();this.resetButton.setVisible(true);this.profileDataGridTree.exclude(selectedNode);this.refresh();this.refreshVisibleData();},_resetClicked:function(event)
{this.resetButton.setVisible(false);this.profileDataGridTree.restore();this._linkifier.reset();this.refresh();this.refreshVisibleData();},_dataGridNodeSelected:function(node)
{this.focusButton.setEnabled(true);this.excludeButton.setEnabled(true);},_dataGridNodeDeselected:function(node)
{this.focusButton.setEnabled(false);this.excludeButton.setEnabled(false);},_sortProfile:function()
{var sortAscending=this.dataGrid.isSortOrderAscending();var sortColumnIdentifier=this.dataGrid.sortColumnIdentifier();var sortProperty={"self":"selfTime","total":"totalTime","function":"functionName"}[sortColumnIdentifier];this.profileDataGridTree.sort(WebInspector.ProfileDataGridTree.propertyComparator(sortProperty,sortAscending));this.refresh();},__proto__:WebInspector.VBox.prototype}
WebInspector.CPUProfileType=function()
{WebInspector.ProfileType.call(this,WebInspector.CPUProfileType.TypeId,WebInspector.UIString("Collect JavaScript CPU Profile"));this._recording=false;this._nextAnonymousConsoleProfileNumber=1;this._anonymousConsoleProfileIdToTitle={};WebInspector.CPUProfileType.instance=this;WebInspector.targetManager.addModelListener(WebInspector.CPUProfilerModel,WebInspector.CPUProfilerModel.EventTypes.ConsoleProfileStarted,this._consoleProfileStarted,this);WebInspector.targetManager.addModelListener(WebInspector.CPUProfilerModel,WebInspector.CPUProfilerModel.EventTypes.ConsoleProfileFinished,this._consoleProfileFinished,this);}
WebInspector.CPUProfileType.TypeId="CPU";WebInspector.CPUProfileType.prototype={fileExtension:function()
{return".cpuprofile";},get buttonTooltip()
{return this._recording?WebInspector.UIString("Stop CPU profiling."):WebInspector.UIString("Start CPU profiling.");},buttonClicked:function()
{if(this._recording){this.stopRecordingProfile();return false;}else{this.startRecordingProfile();return true;}},get treeItemTitle()
{return WebInspector.UIString("CPU PROFILES");},get description()
{return WebInspector.UIString("CPU profiles show where the execution time is spent in your page's JavaScript functions.");},_consoleProfileStarted:function(event)
{var protocolId=(event.data.protocolId);var scriptLocation=(event.data.scriptLocation);var resolvedTitle=(event.data.title);if(!resolvedTitle){resolvedTitle=WebInspector.UIString("Profile %s",this._nextAnonymousConsoleProfileNumber++);this._anonymousConsoleProfileIdToTitle[protocolId]=resolvedTitle;}
this._addMessageToConsole(WebInspector.ConsoleMessage.MessageType.Profile,scriptLocation,WebInspector.UIString("Profile '%s' started.",resolvedTitle));},_consoleProfileFinished:function(event)
{var protocolId=(event.data.protocolId);var scriptLocation=(event.data.scriptLocation);var cpuProfile=(event.data.cpuProfile);var resolvedTitle=(event.data.title);if(typeof resolvedTitle==="undefined"){resolvedTitle=this._anonymousConsoleProfileIdToTitle[protocolId];delete this._anonymousConsoleProfileIdToTitle[protocolId];}
var profile=new WebInspector.CPUProfileHeader(scriptLocation.target(),this,resolvedTitle);profile.setProtocolProfile(cpuProfile);this.addProfile(profile);this._addMessageToConsole(WebInspector.ConsoleMessage.MessageType.ProfileEnd,scriptLocation,WebInspector.UIString("Profile '%s' finished.",resolvedTitle));},_addMessageToConsole:function(type,scriptLocation,messageText)
{var script=scriptLocation.script();var target=scriptLocation.target();var message=new WebInspector.ConsoleMessage(target,WebInspector.ConsoleMessage.MessageSource.ConsoleAPI,WebInspector.ConsoleMessage.MessageLevel.Debug,messageText,type,undefined,undefined,undefined,undefined,undefined,[{functionName:"",scriptId:scriptLocation.scriptId,url:script?script.contentURL():"",lineNumber:scriptLocation.lineNumber,columnNumber:scriptLocation.columnNumber||0}]);target.consoleModel.addMessage(message);},startRecordingProfile:function()
{var target=WebInspector.context.flavor(WebInspector.Target);if(this._profileBeingRecorded||!target)
return;var profile=new WebInspector.CPUProfileHeader(target,this);this.setProfileBeingRecorded(profile);this.addProfile(profile);profile.updateStatus(WebInspector.UIString("Recording\u2026"));this._recording=true;target.cpuProfilerModel.startRecording();},stopRecordingProfile:function()
{this._recording=false;if(!this._profileBeingRecorded||!this._profileBeingRecorded.target())
return;function didStopProfiling(profile)
{if(!this._profileBeingRecorded)
return;console.assert(profile);this._profileBeingRecorded.setProtocolProfile(profile);this._profileBeingRecorded.updateStatus("");var recordedProfile=this._profileBeingRecorded;this.setProfileBeingRecorded(null);this.dispatchEventToListeners(WebInspector.ProfileType.Events.ProfileComplete,recordedProfile);}
this._profileBeingRecorded.target().cpuProfilerModel.stopRecording().then(didStopProfiling.bind(this));},createProfileLoadedFromFile:function(title)
{return new WebInspector.CPUProfileHeader(null,this,title);},profileBeingRecordedRemoved:function()
{this.stopRecordingProfile();},__proto__:WebInspector.ProfileType.prototype}
WebInspector.CPUProfileHeader=function(target,type,title)
{WebInspector.ProfileHeader.call(this,target,type,title||WebInspector.UIString("Profile %d",type.nextProfileUid()));this._tempFile=null;}
WebInspector.CPUProfileHeader.prototype={onTransferStarted:function()
{this._jsonifiedProfile="";this.updateStatus(WebInspector.UIString("Loading\u2026 %s",Number.bytesToString(this._jsonifiedProfile.length)),true);},onChunkTransferred:function(reader)
{this.updateStatus(WebInspector.UIString("Loading\u2026 %d%%",Number.bytesToString(this._jsonifiedProfile.length)));},onTransferFinished:function()
{this.updateStatus(WebInspector.UIString("Parsing\u2026"),true);this._profile=JSON.parse(this._jsonifiedProfile);this._jsonifiedProfile=null;this.updateStatus(WebInspector.UIString("Loaded"),false);if(this._profileType.profileBeingRecorded()===this)
this._profileType.setProfileBeingRecorded(null);},onError:function(reader,e)
{var subtitle;switch(e.target.error.code){case e.target.error.NOT_FOUND_ERR:subtitle=WebInspector.UIString("'%s' not found.",reader.fileName());break;case e.target.error.NOT_READABLE_ERR:subtitle=WebInspector.UIString("'%s' is not readable",reader.fileName());break;case e.target.error.ABORT_ERR:return;default:subtitle=WebInspector.UIString("'%s' error %d",reader.fileName(),e.target.error.code);}
this.updateStatus(subtitle);},write:function(text)
{this._jsonifiedProfile+=text;},close:function(){},dispose:function()
{this.removeTempFile();},createSidebarTreeElement:function(panel)
{return new WebInspector.ProfileSidebarTreeElement(panel,this,"profile-sidebar-tree-item");},createView:function()
{return new WebInspector.CPUProfileView(this);},canSaveToFile:function()
{return!this.fromFile()&&this._protocolProfile;},saveToFile:function()
{var fileOutputStream=new WebInspector.FileOutputStream();function onOpenForSave(accepted)
{if(!accepted)
return;function didRead(data)
{if(data)
fileOutputStream.write(data,fileOutputStream.close.bind(fileOutputStream));else
fileOutputStream.close();}
if(this._failedToCreateTempFile){WebInspector.console.error("Failed to open temp file with heap snapshot");fileOutputStream.close();}else if(this._tempFile){this._tempFile.read(didRead);}else{this._onTempFileReady=onOpenForSave.bind(this,accepted);}}
this._fileName=this._fileName||"CPU-"+new Date().toISO8601Compact()+this._profileType.fileExtension();fileOutputStream.open(this._fileName,onOpenForSave.bind(this));},loadFromFile:function(file)
{this.updateStatus(WebInspector.UIString("Loading\u2026"),true);var fileReader=new WebInspector.ChunkedFileReader(file,10000000,this);fileReader.start(this);},protocolProfile:function()
{return this._protocolProfile;},setProtocolProfile:function(cpuProfile)
{this._protocolProfile=cpuProfile;this._saveProfileDataToTempFile(cpuProfile);if(this.canSaveToFile())
this.dispatchEventToListeners(WebInspector.ProfileHeader.Events.ProfileReceived);},_saveProfileDataToTempFile:function(data)
{var serializedData=JSON.stringify(data);function didCreateTempFile(tempFile)
{this._writeToTempFile(tempFile,serializedData);}
WebInspector.TempFile.create("cpu-profiler",String(this.uid)).then(didCreateTempFile.bind(this));},_writeToTempFile:function(tempFile,serializedData)
{this._tempFile=tempFile;if(!tempFile){this._failedToCreateTempFile=true;this._notifyTempFileReady();return;}
function didWriteToTempFile(fileSize)
{if(!fileSize)
this._failedToCreateTempFile=true;tempFile.finishWriting();this._notifyTempFileReady();}
tempFile.write([serializedData],didWriteToTempFile.bind(this));},_notifyTempFileReady:function()
{if(this._onTempFileReady){this._onTempFileReady();this._onTempFileReady=null;}},__proto__:WebInspector.ProfileHeader.prototype};WebInspector.HeapSnapshotProgressEvent={Update:"ProgressUpdate",BrokenSnapshot:"BrokenSnapshot"};WebInspector.HeapSnapshotCommon={}
WebInspector.HeapSnapshotCommon.baseSystemDistance=100000000;WebInspector.HeapSnapshotCommon.AllocationNodeCallers=function(nodesWithSingleCaller,branchingCallers)
{this.nodesWithSingleCaller=nodesWithSingleCaller;this.branchingCallers=branchingCallers;}
WebInspector.HeapSnapshotCommon.SerializedAllocationNode=function(nodeId,functionName,scriptName,scriptId,line,column,count,size,liveCount,liveSize,hasChildren)
{this.id=nodeId;this.name=functionName;this.scriptName=scriptName;this.scriptId=scriptId;this.line=line;this.column=column;this.count=count;this.size=size;this.liveCount=liveCount;this.liveSize=liveSize;this.hasChildren=hasChildren;}
WebInspector.HeapSnapshotCommon.AllocationStackFrame=function(functionName,scriptName,scriptId,line,column)
{this.functionName=functionName;this.scriptName=scriptName;this.scriptId=scriptId;this.line=line;this.column=column;}
WebInspector.HeapSnapshotCommon.Node=function(id,name,distance,nodeIndex,retainedSize,selfSize,type)
{this.id=id;this.name=name;this.distance=distance;this.nodeIndex=nodeIndex;this.retainedSize=retainedSize;this.selfSize=selfSize;this.type=type;this.canBeQueried=false;this.detachedDOMTreeNode=false;}
WebInspector.HeapSnapshotCommon.Edge=function(name,node,type,edgeIndex)
{this.name=name;this.node=node;this.type=type;this.edgeIndex=edgeIndex;};WebInspector.HeapSnapshotCommon.Aggregate=function()
{this.count;this.distance;this.self;this.maxRet;this.type;this.name;this.idxs;}
WebInspector.HeapSnapshotCommon.AggregateForDiff=function(){this.indexes=[];this.ids=[];this.selfSizes=[];}
WebInspector.HeapSnapshotCommon.Diff=function()
{this.addedCount=0;this.removedCount=0;this.addedSize=0;this.removedSize=0;this.deletedIndexes=[];this.addedIndexes=[];}
WebInspector.HeapSnapshotCommon.DiffForClass=function()
{this.addedCount;this.removedCount;this.addedSize;this.removedSize;this.deletedIndexes;this.addedIndexes;this.countDelta;this.sizeDelta;}
WebInspector.HeapSnapshotCommon.ComparatorConfig=function()
{this.fieldName1;this.ascending1;this.fieldName2;this.ascending2;}
WebInspector.HeapSnapshotCommon.WorkerCommand=function()
{this.callId;this.disposition;this.objectId;this.newObjectId;this.methodName;this.methodArguments;this.source;}
WebInspector.HeapSnapshotCommon.ItemsRange=function(startPosition,endPosition,totalLength,items)
{this.startPosition=startPosition;this.endPosition=endPosition;this.totalLength=totalLength;this.items=items;}
WebInspector.HeapSnapshotCommon.StaticData=function(nodeCount,rootNodeIndex,totalSize,maxJSObjectId)
{this.nodeCount=nodeCount;this.rootNodeIndex=rootNodeIndex;this.totalSize=totalSize;this.maxJSObjectId=maxJSObjectId;}
WebInspector.HeapSnapshotCommon.Statistics=function()
{this.total;this.v8heap;this.native;this.code;this.jsArrays;this.strings;this.system;}
WebInspector.HeapSnapshotCommon.NodeFilter=function(minNodeId,maxNodeId)
{this.minNodeId=minNodeId;this.maxNodeId=maxNodeId;this.allocationNodeId;}
WebInspector.HeapSnapshotCommon.NodeFilter.prototype={equals:function(o)
{return this.minNodeId===o.minNodeId&&this.maxNodeId===o.maxNodeId&&this.allocationNodeId===o.allocationNodeId;}}
WebInspector.HeapSnapshotCommon.SearchConfig=function(query,caseSensitive,isRegex,shouldJump,jumpBackward)
{this.query=query;this.caseSensitive=caseSensitive;this.isRegex=isRegex;this.shouldJump=shouldJump;this.jumpBackward=jumpBackward;}
WebInspector.HeapSnapshotCommon.Samples=function(timestamps,lastAssignedIds,sizes)
{this.timestamps=timestamps;this.lastAssignedIds=lastAssignedIds;this.sizes=sizes;};WebInspector.HeapSnapshotWorkerProxy=function(eventHandler)
{this._eventHandler=eventHandler;this._nextObjectId=1;this._nextCallId=1;this._callbacks=[];this._previousCallbacks=[];this._worker=new WorkerRuntime.Worker("heap_snapshot_worker");this._worker.onmessage=this._messageReceived.bind(this);}
WebInspector.HeapSnapshotWorkerProxy.prototype={createLoader:function(profileUid,snapshotReceivedCallback)
{var objectId=this._nextObjectId++;var proxy=new WebInspector.HeapSnapshotLoaderProxy(this,objectId,profileUid,snapshotReceivedCallback);this._postMessage({callId:this._nextCallId++,disposition:"create",objectId:objectId,methodName:"WebInspector.HeapSnapshotLoader"});return proxy;},dispose:function()
{this._worker.terminate();if(this._interval)
clearInterval(this._interval);},disposeObject:function(objectId)
{this._postMessage({callId:this._nextCallId++,disposition:"dispose",objectId:objectId});},evaluateForTest:function(script,callback)
{var callId=this._nextCallId++;this._callbacks[callId]=callback;this._postMessage({callId:callId,disposition:"evaluateForTest",source:script});},callFactoryMethod:function(callback,objectId,methodName,proxyConstructor)
{var callId=this._nextCallId++;var methodArguments=Array.prototype.slice.call(arguments,4);var newObjectId=this._nextObjectId++;function wrapCallback(remoteResult)
{callback(remoteResult?new proxyConstructor(this,newObjectId):null);}
if(callback){this._callbacks[callId]=wrapCallback.bind(this);this._postMessage({callId:callId,disposition:"factory",objectId:objectId,methodName:methodName,methodArguments:methodArguments,newObjectId:newObjectId});return null;}else{this._postMessage({callId:callId,disposition:"factory",objectId:objectId,methodName:methodName,methodArguments:methodArguments,newObjectId:newObjectId});return new proxyConstructor(this,newObjectId);}},callMethod:function(callback,objectId,methodName)
{var callId=this._nextCallId++;var methodArguments=Array.prototype.slice.call(arguments,3);if(callback)
this._callbacks[callId]=callback;this._postMessage({callId:callId,disposition:"method",objectId:objectId,methodName:methodName,methodArguments:methodArguments});},startCheckingForLongRunningCalls:function()
{if(this._interval)
return;this._checkLongRunningCalls();this._interval=setInterval(this._checkLongRunningCalls.bind(this),300);},_checkLongRunningCalls:function()
{for(var callId in this._previousCallbacks)
if(!(callId in this._callbacks))
delete this._previousCallbacks[callId];var hasLongRunningCalls=false;for(callId in this._previousCallbacks){hasLongRunningCalls=true;break;}
this.dispatchEventToListeners("wait",hasLongRunningCalls);for(callId in this._callbacks)
this._previousCallbacks[callId]=true;},_messageReceived:function(event)
{var data=event.data;if(data.eventName){if(this._eventHandler)
this._eventHandler(data.eventName,data.data);return;}
if(data.error){if(data.errorMethodName)
WebInspector.console.error(WebInspector.UIString("An error occurred when a call to method '%s' was requested",data.errorMethodName));WebInspector.console.error(data["errorCallStack"]);delete this._callbacks[data.callId];return;}
if(!this._callbacks[data.callId])
return;var callback=this._callbacks[data.callId];delete this._callbacks[data.callId];callback(data.result);},_postMessage:function(message)
{this._worker.postMessage(message);},__proto__:WebInspector.Object.prototype}
WebInspector.HeapSnapshotProxyObject=function(worker,objectId)
{this._worker=worker;this._objectId=objectId;}
WebInspector.HeapSnapshotProxyObject.prototype={_callWorker:function(workerMethodName,args)
{args.splice(1,0,this._objectId);return this._worker[workerMethodName].apply(this._worker,args);},dispose:function()
{this._worker.disposeObject(this._objectId);},disposeWorker:function()
{this._worker.dispose();},callFactoryMethod:function(callback,methodName,proxyConstructor,var_args)
{return this._callWorker("callFactoryMethod",Array.prototype.slice.call(arguments,0));},callMethod:function(callback,methodName,var_args)
{return this._callWorker("callMethod",Array.prototype.slice.call(arguments,0));},_callMethodPromise:function(methodName,var_args)
{function action(args,fulfill)
{this._callWorker("callMethod",[fulfill].concat(args));}
return new Promise(action.bind(this,Array.prototype.slice.call(arguments)));}};WebInspector.HeapSnapshotLoaderProxy=function(worker,objectId,profileUid,snapshotReceivedCallback)
{WebInspector.HeapSnapshotProxyObject.call(this,worker,objectId);this._profileUid=profileUid;this._snapshotReceivedCallback=snapshotReceivedCallback;}
WebInspector.HeapSnapshotLoaderProxy.prototype={write:function(chunk,callback)
{this.callMethod(callback,"write",chunk);},close:function(callback)
{function buildSnapshot()
{if(callback)
callback();var showHiddenData=WebInspector.settings.showAdvancedHeapSnapshotProperties.get();this.callFactoryMethod(updateStaticData.bind(this),"buildSnapshot",WebInspector.HeapSnapshotProxy,showHiddenData);}
function updateStaticData(snapshotProxy)
{this.dispose();snapshotProxy.setProfileUid(this._profileUid);snapshotProxy.updateStaticData(this._snapshotReceivedCallback.bind(this));}
this.callMethod(buildSnapshot.bind(this),"close");},__proto__:WebInspector.HeapSnapshotProxyObject.prototype}
WebInspector.HeapSnapshotProxy=function(worker,objectId)
{WebInspector.HeapSnapshotProxyObject.call(this,worker,objectId);this._staticData=null;}
WebInspector.HeapSnapshotProxy.prototype={search:function(searchConfig,filter,callback)
{this.callMethod(callback,"search",searchConfig,filter);},aggregatesWithFilter:function(filter,callback)
{this.callMethod(callback,"aggregatesWithFilter",filter);},aggregatesForDiff:function(callback)
{this.callMethod(callback,"aggregatesForDiff");},calculateSnapshotDiff:function(baseSnapshotId,baseSnapshotAggregates,callback)
{this.callMethod(callback,"calculateSnapshotDiff",baseSnapshotId,baseSnapshotAggregates);},nodeClassName:function(snapshotObjectId,callback)
{this.callMethod(callback,"nodeClassName",snapshotObjectId);},createEdgesProvider:function(nodeIndex)
{return this.callFactoryMethod(null,"createEdgesProvider",WebInspector.HeapSnapshotProviderProxy,nodeIndex);},createRetainingEdgesProvider:function(nodeIndex)
{return this.callFactoryMethod(null,"createRetainingEdgesProvider",WebInspector.HeapSnapshotProviderProxy,nodeIndex);},createAddedNodesProvider:function(baseSnapshotId,className)
{return this.callFactoryMethod(null,"createAddedNodesProvider",WebInspector.HeapSnapshotProviderProxy,baseSnapshotId,className);},createDeletedNodesProvider:function(nodeIndexes)
{return this.callFactoryMethod(null,"createDeletedNodesProvider",WebInspector.HeapSnapshotProviderProxy,nodeIndexes);},createNodesProvider:function(filter)
{return this.callFactoryMethod(null,"createNodesProvider",WebInspector.HeapSnapshotProviderProxy,filter);},createNodesProviderForClass:function(className,nodeFilter)
{return this.callFactoryMethod(null,"createNodesProviderForClass",WebInspector.HeapSnapshotProviderProxy,className,nodeFilter);},allocationTracesTops:function(callback)
{this.callMethod(callback,"allocationTracesTops");},allocationNodeCallers:function(nodeId,callback)
{this.callMethod(callback,"allocationNodeCallers",nodeId);},allocationStack:function(nodeIndex,callback)
{this.callMethod(callback,"allocationStack",nodeIndex);},dispose:function()
{throw new Error("Should never be called");},get nodeCount()
{return this._staticData.nodeCount;},get rootNodeIndex()
{return this._staticData.rootNodeIndex;},updateStaticData:function(callback)
{function dataReceived(staticData)
{this._staticData=staticData;callback(this);}
this.callMethod(dataReceived.bind(this),"updateStaticData");},getStatistics:function()
{return this._callMethodPromise("getStatistics");},getSamples:function()
{return this._callMethodPromise("getSamples");},get totalSize()
{return this._staticData.totalSize;},get uid()
{return this._profileUid;},setProfileUid:function(profileUid)
{this._profileUid=profileUid;},maxJSObjectId:function()
{return this._staticData.maxJSObjectId;},__proto__:WebInspector.HeapSnapshotProxyObject.prototype}
WebInspector.HeapSnapshotProviderProxy=function(worker,objectId)
{WebInspector.HeapSnapshotProxyObject.call(this,worker,objectId);}
WebInspector.HeapSnapshotProviderProxy.prototype={nodePosition:function(snapshotObjectId,callback)
{this.callMethod(callback,"nodePosition",snapshotObjectId);},isEmpty:function(callback)
{this.callMethod(callback,"isEmpty");},serializeItemsRange:function(startPosition,endPosition,callback)
{this.callMethod(callback,"serializeItemsRange",startPosition,endPosition);},sortAndRewind:function(comparator,callback)
{this.callMethod(callback,"sortAndRewind",comparator);},__proto__:WebInspector.HeapSnapshotProxyObject.prototype};WebInspector.HeapSnapshotSortableDataGrid=function(dataDisplayDelegate,columns)
{WebInspector.DataGrid.call(this,columns);this._dataDisplayDelegate=dataDisplayDelegate;this._recursiveSortingDepth=0;this._highlightedNode=null;this._populatedAndSorted=false;this._nameFilter=null;this._nodeFilter=new WebInspector.HeapSnapshotCommon.NodeFilter();this.addEventListener(WebInspector.HeapSnapshotSortableDataGrid.Events.SortingComplete,this._sortingComplete,this);this.addEventListener(WebInspector.DataGrid.Events.SortingChanged,this.sortingChanged,this);}
WebInspector.HeapSnapshotSortableDataGrid.Events={ContentShown:"ContentShown",SortingComplete:"SortingComplete"}
WebInspector.HeapSnapshotSortableDataGrid.prototype={nodeFilter:function()
{return this._nodeFilter;},setNameFilter:function(nameFilter)
{this._nameFilter=nameFilter;},defaultPopulateCount:function()
{return 100;},_disposeAllNodes:function()
{var children=this.topLevelNodes();for(var i=0,l=children.length;i<l;++i)
children[i].dispose();},wasShown:function()
{if(this._nameFilter){this._nameFilter.addEventListener(WebInspector.StatusBarInput.Event.TextChanged,this._onNameFilterChanged,this);this.updateVisibleNodes(true);}
if(this._populatedAndSorted)
this.dispatchEventToListeners(WebInspector.HeapSnapshotSortableDataGrid.Events.ContentShown,this);},_sortingComplete:function()
{this.removeEventListener(WebInspector.HeapSnapshotSortableDataGrid.Events.SortingComplete,this._sortingComplete,this);this._populatedAndSorted=true;this.dispatchEventToListeners(WebInspector.HeapSnapshotSortableDataGrid.Events.ContentShown,this);},willHide:function()
{if(this._nameFilter)
this._nameFilter.removeEventListener(WebInspector.StatusBarInput.Event.TextChanged,this._onNameFilterChanged,this);this._clearCurrentHighlight();},populateContextMenu:function(contextMenu,event)
{var td=event.target.enclosingNodeOrSelfWithNodeName("td");if(!td)
return;var node=td.heapSnapshotNode;function revealInSummaryView()
{this._dataDisplayDelegate.showObject(node.snapshotNodeId,"Summary");}
if(node instanceof WebInspector.HeapSnapshotRetainingObjectNode)
contextMenu.appendItem(WebInspector.UIString.capitalize("Reveal in Summary ^view"),revealInSummaryView.bind(this));},resetSortingCache:function()
{delete this._lastSortColumnIdentifier;delete this._lastSortAscending;},topLevelNodes:function()
{return this.rootNode().children;},revealObjectByHeapSnapshotId:function(heapSnapshotObjectId,callback)
{},highlightNode:function(node)
{this._clearCurrentHighlight();this._highlightedNode=node;WebInspector.runCSSAnimationOnce(this._highlightedNode.element(),"highlighted-row");},nodeWasDetached:function(node)
{if(this._highlightedNode===node)
this._clearCurrentHighlight();},_clearCurrentHighlight:function()
{if(!this._highlightedNode)
return
this._highlightedNode.element().classList.remove("highlighted-row");this._highlightedNode=null;},resetNameFilter:function()
{this._nameFilter.setValue("");},_onNameFilterChanged:function()
{this.updateVisibleNodes(true);},sortingChanged:function()
{var sortAscending=this.isSortOrderAscending();var sortColumnIdentifier=this.sortColumnIdentifier();if(this._lastSortColumnIdentifier===sortColumnIdentifier&&this._lastSortAscending===sortAscending)
return;this._lastSortColumnIdentifier=sortColumnIdentifier;this._lastSortAscending=sortAscending;var sortFields=this._sortFields(sortColumnIdentifier,sortAscending);function SortByTwoFields(nodeA,nodeB)
{var field1=nodeA[sortFields[0]];var field2=nodeB[sortFields[0]];var result=field1<field2?-1:(field1>field2?1:0);if(!sortFields[1])
result=-result;if(result!==0)
return result;field1=nodeA[sortFields[2]];field2=nodeB[sortFields[2]];result=field1<field2?-1:(field1>field2?1:0);if(!sortFields[3])
result=-result;return result;}
this._performSorting(SortByTwoFields);},_performSorting:function(sortFunction)
{this.recursiveSortingEnter();var children=this.allChildren(this.rootNode());this.rootNode().removeChildren();children.sort(sortFunction);for(var i=0,l=children.length;i<l;++i){var child=children[i];this.appendChildAfterSorting(child);if(child.expanded)
child.sort();}
this.recursiveSortingLeave();},appendChildAfterSorting:function(child)
{var revealed=child.revealed;this.rootNode().appendChild(child);child.revealed=revealed;},recursiveSortingEnter:function()
{++this._recursiveSortingDepth;},recursiveSortingLeave:function()
{if(!this._recursiveSortingDepth)
return;if(--this._recursiveSortingDepth)
return;this.updateVisibleNodes(true);this.dispatchEventToListeners(WebInspector.HeapSnapshotSortableDataGrid.Events.SortingComplete);},updateVisibleNodes:function(force)
{},allChildren:function(parent)
{return parent.children;},insertChild:function(parent,node,index)
{parent.insertChild(node,index);},removeChildByIndex:function(parent,index)
{parent.removeChild(parent.children[index]);},removeAllChildren:function(parent)
{parent.removeChildren();},__proto__:WebInspector.DataGrid.prototype}
WebInspector.HeapSnapshotViewportDataGrid=function(dataDisplayDelegate,columns)
{WebInspector.HeapSnapshotSortableDataGrid.call(this,dataDisplayDelegate,columns);this.scrollContainer.addEventListener("scroll",this._onScroll.bind(this),true);this._topPaddingHeight=0;this._bottomPaddingHeight=0;}
WebInspector.HeapSnapshotViewportDataGrid.prototype={topLevelNodes:function()
{return this.allChildren(this.rootNode());},appendChildAfterSorting:function(child)
{},updateVisibleNodes:function(force)
{var guardZoneHeight=40;var scrollHeight=this.scrollContainer.scrollHeight;var scrollTop=this.scrollContainer.scrollTop;var scrollBottom=scrollHeight-scrollTop-this.scrollContainer.offsetHeight;scrollTop=Math.max(0,scrollTop-guardZoneHeight);scrollBottom=Math.max(0,scrollBottom-guardZoneHeight);var viewPortHeight=scrollHeight-scrollTop-scrollBottom;if(!force&&scrollTop>=this._topPaddingHeight&&scrollBottom>=this._bottomPaddingHeight)
return;var hysteresisHeight=500;scrollTop-=hysteresisHeight;viewPortHeight+=2*hysteresisHeight;var selectedNode=this.selectedNode;this.rootNode().removeChildren();this._topPaddingHeight=0;this._bottomPaddingHeight=0;this._addVisibleNodes(this.rootNode(),scrollTop,scrollTop+viewPortHeight);this.setVerticalPadding(this._topPaddingHeight,this._bottomPaddingHeight);if(selectedNode){if(selectedNode.parent)
selectedNode.select(true);else
this.selectedNode=selectedNode;}},_addVisibleNodes:function(parentNode,topBound,bottomBound)
{if(!parentNode.expanded)
return 0;var children=this.allChildren(parentNode);var topPadding=0;var nameFilterValue=this._nameFilter?this._nameFilter.value().toLowerCase():"";for(var i=0;i<children.length;++i){var child=children[i];if(nameFilterValue&&child.filteredOut&&child.filteredOut(nameFilterValue))
continue;var newTop=topPadding+this._nodeHeight(child);if(newTop>topBound)
break;topPadding=newTop;}
var position=topPadding;for(;i<children.length&&position<bottomBound;++i){var child=children[i];if(nameFilterValue&&child.filteredOut&&child.filteredOut(nameFilterValue))
continue;var hasChildren=child.hasChildren;child.removeChildren();child.hasChildren=hasChildren;child.revealed=true;parentNode.appendChild(child);position+=child.nodeSelfHeight();position+=this._addVisibleNodes(child,topBound-position,bottomBound-position);}
var bottomPadding=0;for(;i<children.length;++i){var child=children[i];if(nameFilterValue&&child.filteredOut&&child.filteredOut(nameFilterValue))
continue;bottomPadding+=this._nodeHeight(child);}
this._topPaddingHeight+=topPadding;this._bottomPaddingHeight+=bottomPadding;return position+bottomPadding;},_nodeHeight:function(node)
{if(!node.revealed)
return 0;var result=node.nodeSelfHeight();if(!node.expanded)
return result;var children=this.allChildren(node);for(var i=0;i<children.length;i++)
result+=this._nodeHeight(children[i]);return result;},revealTreeNode:function(pathToReveal)
{var height=this._calculateOffset(pathToReveal);var node=(pathToReveal.peekLast());var scrollTop=this.scrollContainer.scrollTop;var scrollBottom=scrollTop+this.scrollContainer.offsetHeight;if(height>=scrollTop&&height<scrollBottom)
return Promise.resolve(node);var scrollGap=40;this.scrollContainer.scrollTop=Math.max(0,height-scrollGap);return new Promise(this._scrollTo.bind(this,node));},_scrollTo:function(node,fulfill)
{console.assert(!this._scrollToResolveCallback);this._scrollToResolveCallback=fulfill.bind(null,node);},_calculateOffset:function(pathToReveal)
{var parentNode=this.rootNode();var height=0;for(var i=0;i<pathToReveal.length;++i){var node=pathToReveal[i];var children=this.allChildren(parentNode);for(var j=0;j<children.length;++j){var child=children[j];if(node===child){height+=node.nodeSelfHeight();break;}
height+=this._nodeHeight(child);}
parentNode=node;}
return height-pathToReveal.peekLast().nodeSelfHeight();},allChildren:function(parent)
{return parent._allChildren||(parent._allChildren=[]);},appendNode:function(parent,node)
{this.allChildren(parent).push(node);},insertChild:function(parent,node,index)
{this.allChildren(parent).splice(index,0,node);},removeChildByIndex:function(parent,index)
{this.allChildren(parent).splice(index,1);},removeAllChildren:function(parent)
{parent._allChildren=[];},removeTopLevelNodes:function()
{this._disposeAllNodes();this.rootNode().removeChildren();this.rootNode()._allChildren=[];},_isScrolledIntoView:function(element)
{var viewportTop=this.scrollContainer.scrollTop;var viewportBottom=viewportTop+this.scrollContainer.clientHeight;var elemTop=element.offsetTop;var elemBottom=elemTop+element.offsetHeight;return elemBottom<=viewportBottom&&elemTop>=viewportTop;},onResize:function()
{WebInspector.HeapSnapshotSortableDataGrid.prototype.onResize.call(this);this.updateVisibleNodes(false);},_onScroll:function(event)
{this.updateVisibleNodes(false);if(this._scrollToResolveCallback){this._scrollToResolveCallback();this._scrollToResolveCallback=null;}},__proto__:WebInspector.HeapSnapshotSortableDataGrid.prototype}
WebInspector.HeapSnapshotContainmentDataGrid=function(dataDisplayDelegate,columns)
{columns=columns||[{id:"object",title:WebInspector.UIString("Object"),disclosure:true,sortable:true},{id:"distance",title:WebInspector.UIString("Distance"),width:"80px",sortable:true},{id:"shallowSize",title:WebInspector.UIString("Shallow Size"),width:"120px",sortable:true},{id:"retainedSize",title:WebInspector.UIString("Retained Size"),width:"120px",sortable:true,sort:WebInspector.DataGrid.Order.Descending}];WebInspector.HeapSnapshotSortableDataGrid.call(this,dataDisplayDelegate,columns);}
WebInspector.HeapSnapshotContainmentDataGrid.prototype={setDataSource:function(snapshot,nodeIndex)
{this.snapshot=snapshot;var node={nodeIndex:nodeIndex||snapshot.rootNodeIndex};var fakeEdge={node:node};this.setRootNode(this._createRootNode(snapshot,fakeEdge));this.rootNode().sort();},_createRootNode:function(snapshot,fakeEdge)
{return new WebInspector.HeapSnapshotObjectNode(this,snapshot,fakeEdge,null);},sortingChanged:function()
{var rootNode=this.rootNode();if(rootNode.hasChildren)
rootNode.sort();},__proto__:WebInspector.HeapSnapshotSortableDataGrid.prototype}
WebInspector.HeapSnapshotRetainmentDataGrid=function(dataDisplayDelegate)
{var columns=[{id:"object",title:WebInspector.UIString("Object"),disclosure:true,sortable:true},{id:"distance",title:WebInspector.UIString("Distance"),width:"80px",sortable:true,sort:WebInspector.DataGrid.Order.Ascending},{id:"shallowSize",title:WebInspector.UIString("Shallow Size"),width:"120px",sortable:true},{id:"retainedSize",title:WebInspector.UIString("Retained Size"),width:"120px",sortable:true}];WebInspector.HeapSnapshotContainmentDataGrid.call(this,dataDisplayDelegate,columns);}
WebInspector.HeapSnapshotRetainmentDataGrid.Events={ExpandRetainersComplete:"ExpandRetainersComplete"}
WebInspector.HeapSnapshotRetainmentDataGrid.prototype={_createRootNode:function(snapshot,fakeEdge)
{return new WebInspector.HeapSnapshotRetainingObjectNode(this,snapshot,fakeEdge,null);},_sortFields:function(sortColumn,sortAscending)
{return{object:["_name",sortAscending,"_count",false],count:["_count",sortAscending,"_name",true],shallowSize:["_shallowSize",sortAscending,"_name",true],retainedSize:["_retainedSize",sortAscending,"_name",true],distance:["_distance",sortAscending,"_name",true]}[sortColumn];},reset:function()
{this.rootNode().removeChildren();this.resetSortingCache();},setDataSource:function(snapshot,nodeIndex)
{WebInspector.HeapSnapshotContainmentDataGrid.prototype.setDataSource.call(this,snapshot,nodeIndex);this.rootNode().expand();},__proto__:WebInspector.HeapSnapshotContainmentDataGrid.prototype}
WebInspector.HeapSnapshotConstructorsDataGrid=function(dataDisplayDelegate)
{var columns=[{id:"object",title:WebInspector.UIString("Constructor"),disclosure:true,sortable:true},{id:"distance",title:WebInspector.UIString("Distance"),width:"90px",sortable:true},{id:"count",title:WebInspector.UIString("Objects Count"),width:"90px",sortable:true},{id:"shallowSize",title:WebInspector.UIString("Shallow Size"),width:"120px",sortable:true},{id:"retainedSize",title:WebInspector.UIString("Retained Size"),width:"120px",sort:WebInspector.DataGrid.Order.Descending,sortable:true}];WebInspector.HeapSnapshotViewportDataGrid.call(this,dataDisplayDelegate,columns);this._profileIndex=-1;this._objectIdToSelect=null;}
WebInspector.HeapSnapshotConstructorsDataGrid.prototype={_sortFields:function(sortColumn,sortAscending)
{return{object:["_name",sortAscending,"_count",false],distance:["_distance",sortAscending,"_retainedSize",true],count:["_count",sortAscending,"_name",true],shallowSize:["_shallowSize",sortAscending,"_name",true],retainedSize:["_retainedSize",sortAscending,"_name",true]}[sortColumn];},revealObjectByHeapSnapshotId:function(id,callback)
{if(!this.snapshot){this._objectIdToSelect=id;return;}
function didPopulateNode(parentNode,node)
{if(node)
this.revealTreeNode([parentNode,node]).then(callback);else
callback(node);}
function didGetClassName(className)
{if(!className){callback(null);return;}
var constructorNodes=this.topLevelNodes();for(var i=0;i<constructorNodes.length;i++){var parent=constructorNodes[i];if(parent._name===className){parent.populateNodeBySnapshotObjectId(parseInt(id,10),didPopulateNode.bind(this));return;}}
callback(null);}
this.snapshot.nodeClassName(parseInt(id,10),didGetClassName.bind(this));},clear:function()
{this._nextRequestedFilter=null;this._lastFilter=null;this.removeTopLevelNodes();},setDataSource:function(snapshot)
{this.snapshot=snapshot;if(this._profileIndex===-1)
this._populateChildren();if(this._objectIdToSelect){this.revealObjectByHeapSnapshotId(this._objectIdToSelect,function(){});this._objectIdToSelect=null;}},setSelectionRange:function(minNodeId,maxNodeId)
{this._nodeFilter=new WebInspector.HeapSnapshotCommon.NodeFilter(minNodeId,maxNodeId);this._populateChildren(this._nodeFilter);},setAllocationNodeId:function(allocationNodeId)
{this._nodeFilter=new WebInspector.HeapSnapshotCommon.NodeFilter();this._nodeFilter.allocationNodeId=allocationNodeId;this._populateChildren(this._nodeFilter);},_aggregatesReceived:function(nodeFilter,aggregates)
{this._filterInProgress=null;if(this._nextRequestedFilter){this.snapshot.aggregatesWithFilter(this._nextRequestedFilter,this._aggregatesReceived.bind(this,this._nextRequestedFilter));this._filterInProgress=this._nextRequestedFilter;this._nextRequestedFilter=null;}
this.removeTopLevelNodes();this.resetSortingCache();for(var constructor in aggregates)
this.appendNode(this.rootNode(),new WebInspector.HeapSnapshotConstructorNode(this,constructor,aggregates[constructor],nodeFilter));this.sortingChanged();this._lastFilter=nodeFilter;},_populateChildren:function(nodeFilter)
{nodeFilter=nodeFilter||new WebInspector.HeapSnapshotCommon.NodeFilter();if(this._filterInProgress){this._nextRequestedFilter=this._filterInProgress.equals(nodeFilter)?null:nodeFilter;return;}
if(this._lastFilter&&this._lastFilter.equals(nodeFilter))
return;this._filterInProgress=nodeFilter;this.snapshot.aggregatesWithFilter(nodeFilter,this._aggregatesReceived.bind(this,nodeFilter));},filterSelectIndexChanged:function(profiles,profileIndex)
{this._profileIndex=profileIndex;this._nodeFilter=undefined;if(profileIndex!==-1){var minNodeId=profileIndex>0?profiles[profileIndex-1].maxJSObjectId:0;var maxNodeId=profiles[profileIndex].maxJSObjectId;this._nodeFilter=new WebInspector.HeapSnapshotCommon.NodeFilter(minNodeId,maxNodeId);}
this._populateChildren(this._nodeFilter);},__proto__:WebInspector.HeapSnapshotViewportDataGrid.prototype}
WebInspector.HeapSnapshotDiffDataGrid=function(dataDisplayDelegate)
{var columns=[{id:"object",title:WebInspector.UIString("Constructor"),disclosure:true,sortable:true},{id:"addedCount",title:WebInspector.UIString("# New"),width:"72px",sortable:true},{id:"removedCount",title:WebInspector.UIString("# Deleted"),width:"72px",sortable:true},{id:"countDelta",title:WebInspector.UIString("# Delta"),width:"64px",sortable:true},{id:"addedSize",title:WebInspector.UIString("Alloc. Size"),width:"72px",sortable:true,sort:WebInspector.DataGrid.Order.Descending},{id:"removedSize",title:WebInspector.UIString("Freed Size"),width:"72px",sortable:true},{id:"sizeDelta",title:WebInspector.UIString("Size Delta"),width:"72px",sortable:true}];WebInspector.HeapSnapshotViewportDataGrid.call(this,dataDisplayDelegate,columns);}
WebInspector.HeapSnapshotDiffDataGrid.prototype={defaultPopulateCount:function()
{return 50;},_sortFields:function(sortColumn,sortAscending)
{return{object:["_name",sortAscending,"_count",false],addedCount:["_addedCount",sortAscending,"_name",true],removedCount:["_removedCount",sortAscending,"_name",true],countDelta:["_countDelta",sortAscending,"_name",true],addedSize:["_addedSize",sortAscending,"_name",true],removedSize:["_removedSize",sortAscending,"_name",true],sizeDelta:["_sizeDelta",sortAscending,"_name",true]}[sortColumn];},setDataSource:function(snapshot)
{this.snapshot=snapshot;},setBaseDataSource:function(baseSnapshot)
{this.baseSnapshot=baseSnapshot;this.removeTopLevelNodes();this.resetSortingCache();if(this.baseSnapshot===this.snapshot){this.dispatchEventToListeners(WebInspector.HeapSnapshotSortableDataGrid.Events.SortingComplete);return;}
this._populateChildren();},_populateChildren:function()
{function aggregatesForDiffReceived(aggregatesForDiff)
{this.snapshot.calculateSnapshotDiff(this.baseSnapshot.uid,aggregatesForDiff,didCalculateSnapshotDiff.bind(this));function didCalculateSnapshotDiff(diffByClassName)
{for(var className in diffByClassName){var diff=diffByClassName[className];this.appendNode(this.rootNode(),new WebInspector.HeapSnapshotDiffNode(this,className,diff));}
this.sortingChanged();}}
this.baseSnapshot.aggregatesForDiff(aggregatesForDiffReceived.bind(this));},__proto__:WebInspector.HeapSnapshotViewportDataGrid.prototype}
WebInspector.AllocationDataGrid=function(target,dataDisplayDelegate)
{var columns=[{id:"liveCount",title:WebInspector.UIString("Live Count"),width:"72px",sortable:true},{id:"count",title:WebInspector.UIString("Count"),width:"72px",sortable:true},{id:"liveSize",title:WebInspector.UIString("Live Size"),width:"72px",sortable:true},{id:"size",title:WebInspector.UIString("Size"),width:"72px",sortable:true,sort:WebInspector.DataGrid.Order.Descending},{id:"name",title:WebInspector.UIString("Function"),disclosure:true,sortable:true},];WebInspector.HeapSnapshotViewportDataGrid.call(this,dataDisplayDelegate,columns);this._target=target;this._linkifier=new WebInspector.Linkifier();}
WebInspector.AllocationDataGrid.prototype={target:function()
{return this._target;},dispose:function()
{this._linkifier.reset();},setDataSource:function(snapshot)
{this.snapshot=snapshot;this.snapshot.allocationTracesTops(didReceiveAllocationTracesTops.bind(this));function didReceiveAllocationTracesTops(tops)
{this._topNodes=tops;this._populateChildren();}},_populateChildren:function()
{this.removeTopLevelNodes();var root=this.rootNode();var tops=this._topNodes;for(var i=0;i<tops.length;i++)
this.appendNode(root,new WebInspector.AllocationGridNode(this,tops[i]));this.updateVisibleNodes(true);},sortingChanged:function()
{this._topNodes.sort(this._createComparator());this.rootNode().removeChildren();this._populateChildren();},_createComparator:function()
{var fieldName=this.sortColumnIdentifier();var compareResult=(this.sortOrder()===WebInspector.DataGrid.Order.Ascending)?+1:-1;function compare(a,b)
{if(a[fieldName]>b[fieldName])
return compareResult;if(a[fieldName]<b[fieldName])
return-compareResult;return 0;}
return compare;},__proto__:WebInspector.HeapSnapshotViewportDataGrid.prototype};WebInspector.HeapSnapshotGridNode=function(tree,hasChildren)
{WebInspector.DataGridNode.call(this,null,hasChildren);this._dataGrid=tree;this._instanceCount=0;this._savedChildren=null;this._retrievedChildrenRanges=[];this._providerObject=null;}
WebInspector.HeapSnapshotGridNode.Events={PopulateComplete:"PopulateComplete"}
WebInspector.HeapSnapshotGridNode.createComparator=function(fieldNames)
{return({fieldName1:fieldNames[0],ascending1:fieldNames[1],fieldName2:fieldNames[2],ascending2:fieldNames[3]});}
WebInspector.HeapSnapshotGridNode.ChildrenProvider=function(){}
WebInspector.HeapSnapshotGridNode.ChildrenProvider.prototype={dispose:function(){},nodePosition:function(snapshotObjectId,callback){},isEmpty:function(callback){},serializeItemsRange:function(startPosition,endPosition,callback){},sortAndRewind:function(comparator,callback){}}
WebInspector.HeapSnapshotGridNode.prototype={heapSnapshotDataGrid:function()
{return this._dataGrid;},createProvider:function()
{throw new Error("Not implemented.");},retainersDataSource:function()
{return null;},_provider:function()
{if(!this._providerObject)
this._providerObject=this.createProvider();return this._providerObject;},createCell:function(columnIdentifier)
{var cell=WebInspector.DataGridNode.prototype.createCell.call(this,columnIdentifier);if(this._searchMatched)
cell.classList.add("highlight");return cell;},collapse:function()
{WebInspector.DataGridNode.prototype.collapse.call(this);this._dataGrid.updateVisibleNodes(true);},expand:function()
{WebInspector.DataGridNode.prototype.expand.call(this);this._dataGrid.updateVisibleNodes(true);},dispose:function()
{if(this._providerObject)
this._providerObject.dispose();for(var node=this.children[0];node;node=node.traverseNextNode(true,this,true))
if(node.dispose)
node.dispose();},_reachableFromWindow:false,queryObjectContent:function(callback)
{},wasDetached:function()
{this._dataGrid.nodeWasDetached(this);},_toPercentString:function(num)
{return num.toFixed(0)+"\u2009%";},_toUIDistance:function(distance)
{var baseSystemDistance=WebInspector.HeapSnapshotCommon.baseSystemDistance;return distance>=0&&distance<baseSystemDistance?WebInspector.UIString("%d",distance):WebInspector.UIString("\u2212");},allChildren:function()
{return this._dataGrid.allChildren(this);},removeChildByIndex:function(index)
{this._dataGrid.removeChildByIndex(this,index);},childForPosition:function(nodePosition)
{var indexOfFirstChildInRange=0;for(var i=0;i<this._retrievedChildrenRanges.length;i++){var range=this._retrievedChildrenRanges[i];if(range.from<=nodePosition&&nodePosition<range.to){var childIndex=indexOfFirstChildInRange+nodePosition-range.from;return this.allChildren()[childIndex];}
indexOfFirstChildInRange+=range.to-range.from+1;}
return null;},_createValueCell:function(columnIdentifier)
{var cell=createElement("td");cell.className="numeric-column";if(this.dataGrid.snapshot.totalSize!==0){var div=createElement("div");var valueSpan=createElement("span");valueSpan.textContent=this.data[columnIdentifier];div.appendChild(valueSpan);var percentColumn=columnIdentifier+"-percent";if(percentColumn in this.data){var percentSpan=createElement("span");percentSpan.className="percent-column";percentSpan.textContent=this.data[percentColumn];div.appendChild(percentSpan);div.classList.add("profile-multiple-values");}
cell.appendChild(div);}
return cell;},populate:function(event)
{if(this._populated)
return;this._populated=true;function sorted()
{this._populateChildren();}
this._provider().sortAndRewind(this.comparator(),sorted.bind(this));},expandWithoutPopulate:function(callback)
{this._populated=true;this.expand();this._provider().sortAndRewind(this.comparator(),callback);},_populateChildren:function(fromPosition,toPosition,afterPopulate)
{fromPosition=fromPosition||0;toPosition=toPosition||fromPosition+this._dataGrid.defaultPopulateCount();var firstNotSerializedPosition=fromPosition;function serializeNextChunk()
{if(firstNotSerializedPosition>=toPosition)
return;var end=Math.min(firstNotSerializedPosition+this._dataGrid.defaultPopulateCount(),toPosition);this._provider().serializeItemsRange(firstNotSerializedPosition,end,childrenRetrieved.bind(this));firstNotSerializedPosition=end;}
function insertRetrievedChild(item,insertionIndex)
{if(this._savedChildren){var hash=this._childHashForEntity(item);if(hash in this._savedChildren){this._dataGrid.insertChild(this,this._savedChildren[hash],insertionIndex);return;}}
this._dataGrid.insertChild(this,this._createChildNode(item),insertionIndex);}
function insertShowMoreButton(from,to,insertionIndex)
{var button=new WebInspector.ShowMoreDataGridNode(this._populateChildren.bind(this),from,to,this._dataGrid.defaultPopulateCount());this._dataGrid.insertChild(this,button,insertionIndex);}
function childrenRetrieved(itemsRange)
{var itemIndex=0;var itemPosition=itemsRange.startPosition;var items=itemsRange.items;var insertionIndex=0;if(!this._retrievedChildrenRanges.length){if(itemsRange.startPosition>0){this._retrievedChildrenRanges.push({from:0,to:0});insertShowMoreButton.call(this,0,itemsRange.startPosition,insertionIndex++);}
this._retrievedChildrenRanges.push({from:itemsRange.startPosition,to:itemsRange.endPosition});for(var i=0,l=items.length;i<l;++i)
insertRetrievedChild.call(this,items[i],insertionIndex++);if(itemsRange.endPosition<itemsRange.totalLength)
insertShowMoreButton.call(this,itemsRange.endPosition,itemsRange.totalLength,insertionIndex++);}else{var rangeIndex=0;var found=false;var range;while(rangeIndex<this._retrievedChildrenRanges.length){range=this._retrievedChildrenRanges[rangeIndex];if(range.to>=itemPosition){found=true;break;}
insertionIndex+=range.to-range.from;if(range.to<itemsRange.totalLength)
insertionIndex+=1;++rangeIndex;}
if(!found||itemsRange.startPosition<range.from){this.allChildren()[insertionIndex-1].setEndPosition(itemsRange.startPosition);insertShowMoreButton.call(this,itemsRange.startPosition,found?range.from:itemsRange.totalLength,insertionIndex);range={from:itemsRange.startPosition,to:itemsRange.startPosition};if(!found)
rangeIndex=this._retrievedChildrenRanges.length;this._retrievedChildrenRanges.splice(rangeIndex,0,range);}else{insertionIndex+=itemPosition-range.from;}
while(range.to<itemsRange.endPosition){var skipCount=range.to-itemPosition;insertionIndex+=skipCount;itemIndex+=skipCount;itemPosition=range.to;var nextRange=this._retrievedChildrenRanges[rangeIndex+1];var newEndOfRange=nextRange?nextRange.from:itemsRange.totalLength;if(newEndOfRange>itemsRange.endPosition)
newEndOfRange=itemsRange.endPosition;while(itemPosition<newEndOfRange){insertRetrievedChild.call(this,items[itemIndex++],insertionIndex++);++itemPosition;}
if(nextRange&&newEndOfRange===nextRange.from){range.to=nextRange.to;this.removeChildByIndex(insertionIndex);this._retrievedChildrenRanges.splice(rangeIndex+1,1);}else{range.to=newEndOfRange;if(newEndOfRange===itemsRange.totalLength)
this.removeChildByIndex(insertionIndex);else
this.allChildren()[insertionIndex].setStartPosition(itemsRange.endPosition);}}}
this._instanceCount+=items.length;if(firstNotSerializedPosition<toPosition){serializeNextChunk.call(this);return;}
if(this.expanded)
this._dataGrid.updateVisibleNodes(true);if(afterPopulate)
afterPopulate();this.dispatchEventToListeners(WebInspector.HeapSnapshotGridNode.Events.PopulateComplete);}
serializeNextChunk.call(this);},_saveChildren:function()
{this._savedChildren=null;var children=this.allChildren();for(var i=0,l=children.length;i<l;++i){var child=children[i];if(!child.expanded)
continue;if(!this._savedChildren)
this._savedChildren={};this._savedChildren[this._childHashForNode(child)]=child;}},sort:function()
{this._dataGrid.recursiveSortingEnter();function afterSort()
{this._saveChildren();this._dataGrid.removeAllChildren(this);this._retrievedChildrenRanges=[];function afterPopulate()
{var children=this.allChildren();for(var i=0,l=children.length;i<l;++i){var child=children[i];if(child.expanded)
child.sort();}
this._dataGrid.recursiveSortingLeave();}
var instanceCount=this._instanceCount;this._instanceCount=0;this._populateChildren(0,instanceCount,afterPopulate.bind(this));}
this._provider().sortAndRewind(this.comparator(),afterSort.bind(this));},__proto__:WebInspector.DataGridNode.prototype}
WebInspector.HeapSnapshotGenericObjectNode=function(dataGrid,node)
{WebInspector.HeapSnapshotGridNode.call(this,dataGrid,false);if(!node)
return;this._name=node.name;this._type=node.type;this._distance=node.distance;this._shallowSize=node.selfSize;this._retainedSize=node.retainedSize;this.snapshotNodeId=node.id;this.snapshotNodeIndex=node.nodeIndex;if(this._type==="string")
this._reachableFromWindow=true;else if(this._type==="object"&&this._name.startsWith("Window")){this._name=this.shortenWindowURL(this._name,false);this._reachableFromWindow=true;}else if(node.canBeQueried)
this._reachableFromWindow=true;if(node.detachedDOMTreeNode)
this.detachedDOMTreeNode=true;var snapshot=dataGrid.snapshot;var shallowSizePercent=this._shallowSize/snapshot.totalSize*100.0;var retainedSizePercent=this._retainedSize/snapshot.totalSize*100.0;this.data={"distance":this._toUIDistance(this._distance),"shallowSize":Number.withThousandsSeparator(this._shallowSize),"retainedSize":Number.withThousandsSeparator(this._retainedSize),"shallowSize-percent":this._toPercentString(shallowSizePercent),"retainedSize-percent":this._toPercentString(retainedSizePercent)};};WebInspector.HeapSnapshotGenericObjectNode.prototype={retainersDataSource:function()
{return{snapshot:this._dataGrid.snapshot,snapshotNodeIndex:this.snapshotNodeIndex};},createCell:function(columnIdentifier)
{var cell=columnIdentifier!=="object"?this._createValueCell(columnIdentifier):this._createObjectCell();if(this._searchMatched)
cell.classList.add("highlight");return cell;},_createObjectCell:function()
{var value=this._name;var valueStyle="object";switch(this._type){case"concatenated string":case"string":value="\""+value+"\"";valueStyle="string";break;case"regexp":value="/"+value+"/";valueStyle="string";break;case"closure":value="function"+(value?" ":"")+value+"()";valueStyle="function";break;case"number":valueStyle="number";break;case"hidden":valueStyle="null";break;case"array":value=(value||"")+"[]";break;};if(this._reachableFromWindow)
valueStyle+=" highlight";if(value==="Object")
value="";if(this.detachedDOMTreeNode)
valueStyle+=" detached-dom-tree-node";return this._createObjectCellWithValue(valueStyle,value);},_createObjectCellWithValue:function(valueStyle,value)
{var cell=createElement("td");cell.className="object-column";var div=createElement("div");div.className="source-code event-properties";div.style.overflow="visible";this._prefixObjectCell(div);var valueSpan=createElement("span");valueSpan.className="value object-value-"+valueStyle;valueSpan.textContent=value;div.appendChild(valueSpan);var idSpan=createElement("span");idSpan.className="object-value-id";idSpan.textContent=" @"+this.snapshotNodeId;div.appendChild(idSpan);cell.appendChild(div);cell.classList.add("disclosure");if(this.depth)
cell.style.setProperty("padding-left",(this.depth*this.dataGrid.indentWidth)+"px");cell.heapSnapshotNode=this;return cell;},_prefixObjectCell:function(div)
{},queryObjectContent:function(target,callback,objectGroupName)
{function formatResult(error,object)
{if(!error&&object.type)
callback(target.runtimeModel.createRemoteObject(object));else
callback(target.runtimeModel.createRemoteObjectFromPrimitiveValue(WebInspector.UIString("Preview is not available")));}
if(this._type==="string")
callback(target.runtimeModel.createRemoteObjectFromPrimitiveValue(this._name));else
target.heapProfilerAgent().getObjectByHeapObjectId(String(this.snapshotNodeId),objectGroupName,formatResult);},updateHasChildren:function()
{function isEmptyCallback(isEmpty)
{this.hasChildren=!isEmpty;}
this._provider().isEmpty(isEmptyCallback.bind(this));},shortenWindowURL:function(fullName,hasObjectId)
{var startPos=fullName.indexOf("/");var endPos=hasObjectId?fullName.indexOf("@"):fullName.length;if(startPos!==-1&&endPos!==-1){var fullURL=fullName.substring(startPos+1,endPos).trimLeft();var url=fullURL.trimURL();if(url.length>40)
url=url.trimMiddle(40);return fullName.substr(0,startPos+2)+url+fullName.substr(endPos);}else
return fullName;},__proto__:WebInspector.HeapSnapshotGridNode.prototype}
WebInspector.HeapSnapshotObjectNode=function(dataGrid,snapshot,edge,parentObjectNode)
{WebInspector.HeapSnapshotGenericObjectNode.call(this,dataGrid,edge.node);this._referenceName=edge.name;this._referenceType=edge.type;this._edgeIndex=edge.edgeIndex;this._snapshot=snapshot;this._parentObjectNode=parentObjectNode;this._cycledWithAncestorGridNode=this._findAncestorWithSameSnapshotNodeId();if(!this._cycledWithAncestorGridNode)
this.updateHasChildren();var data=this.data;data["count"]="";data["addedCount"]="";data["removedCount"]="";data["countDelta"]="";data["addedSize"]="";data["removedSize"]="";data["sizeDelta"]="";}
WebInspector.HeapSnapshotObjectNode.prototype={retainersDataSource:function()
{return{snapshot:this._snapshot,snapshotNodeIndex:this.snapshotNodeIndex};},createProvider:function()
{return this._snapshot.createEdgesProvider(this.snapshotNodeIndex);},_findAncestorWithSameSnapshotNodeId:function()
{var ancestor=this._parentObjectNode;while(ancestor){if(ancestor.snapshotNodeId===this.snapshotNodeId)
return ancestor;ancestor=ancestor._parentObjectNode;}
return null;},_createChildNode:function(item)
{return new WebInspector.HeapSnapshotObjectNode(this._dataGrid,this._snapshot,item,this);},_childHashForEntity:function(edge)
{return edge.edgeIndex;},_childHashForNode:function(childNode)
{return childNode._edgeIndex;},comparator:function()
{var sortAscending=this._dataGrid.isSortOrderAscending();var sortColumnIdentifier=this._dataGrid.sortColumnIdentifier();var sortFields={object:["!edgeName",sortAscending,"retainedSize",false],count:["!edgeName",true,"retainedSize",false],shallowSize:["selfSize",sortAscending,"!edgeName",true],retainedSize:["retainedSize",sortAscending,"!edgeName",true],distance:["distance",sortAscending,"_name",true]}[sortColumnIdentifier]||["!edgeName",true,"retainedSize",false];return WebInspector.HeapSnapshotGridNode.createComparator(sortFields);},_prefixObjectCell:function(div)
{var name=this._referenceName||"(empty)";var nameClass="name";switch(this._referenceType){case"context":nameClass="object-value-number";break;case"internal":case"hidden":case"weak":nameClass="object-value-null";break;case"element":name="["+name+"]";break;}
if(this._cycledWithAncestorGridNode)
div.className+=" cycled-ancessor-node";var nameSpan=createElement("span");nameSpan.className=nameClass;nameSpan.textContent=name;div.appendChild(nameSpan);var separatorSpan=createElement("span");separatorSpan.className="grayed";separatorSpan.textContent=this._edgeNodeSeparator();div.appendChild(separatorSpan);},_edgeNodeSeparator:function()
{return" :: ";},__proto__:WebInspector.HeapSnapshotGenericObjectNode.prototype}
WebInspector.HeapSnapshotRetainingObjectNode=function(dataGrid,snapshot,edge,parentRetainingObjectNode)
{WebInspector.HeapSnapshotObjectNode.call(this,dataGrid,snapshot,edge,parentRetainingObjectNode);}
WebInspector.HeapSnapshotRetainingObjectNode.prototype={createProvider:function()
{return this._snapshot.createRetainingEdgesProvider(this.snapshotNodeIndex);},_createChildNode:function(item)
{return new WebInspector.HeapSnapshotRetainingObjectNode(this._dataGrid,this._snapshot,item,this);},_edgeNodeSeparator:function()
{return" in ";},expand:function()
{this._expandRetainersChain(20);},_expandRetainersChain:function(maxExpandLevels)
{function populateComplete()
{this.removeEventListener(WebInspector.HeapSnapshotGridNode.Events.PopulateComplete,populateComplete,this);this._expandRetainersChain(maxExpandLevels);}
if(!this._populated){this.addEventListener(WebInspector.HeapSnapshotGridNode.Events.PopulateComplete,populateComplete,this);this.populate();return;}
WebInspector.HeapSnapshotGenericObjectNode.prototype.expand.call(this);if(--maxExpandLevels>0&&this.children.length>0){var retainer=this.children[0];if(retainer._distance>1){retainer._expandRetainersChain(maxExpandLevels);return;}}
this._dataGrid.dispatchEventToListeners(WebInspector.HeapSnapshotRetainmentDataGrid.Events.ExpandRetainersComplete);},__proto__:WebInspector.HeapSnapshotObjectNode.prototype}
WebInspector.HeapSnapshotInstanceNode=function(dataGrid,snapshot,node,isDeletedNode)
{WebInspector.HeapSnapshotGenericObjectNode.call(this,dataGrid,node);this._baseSnapshotOrSnapshot=snapshot;this._isDeletedNode=isDeletedNode;this.updateHasChildren();var data=this.data;data["count"]="";data["countDelta"]="";data["sizeDelta"]="";if(this._isDeletedNode){data["addedCount"]="";data["addedSize"]="";data["removedCount"]="\u2022";data["removedSize"]=Number.withThousandsSeparator(this._shallowSize);}else{data["addedCount"]="\u2022";data["addedSize"]=Number.withThousandsSeparator(this._shallowSize);data["removedCount"]="";data["removedSize"]="";}};WebInspector.HeapSnapshotInstanceNode.prototype={retainersDataSource:function()
{return{snapshot:this._baseSnapshotOrSnapshot,snapshotNodeIndex:this.snapshotNodeIndex};},createProvider:function()
{return this._baseSnapshotOrSnapshot.createEdgesProvider(this.snapshotNodeIndex);},_createChildNode:function(item)
{return new WebInspector.HeapSnapshotObjectNode(this._dataGrid,this._baseSnapshotOrSnapshot,item,null);},_childHashForEntity:function(edge)
{return edge.edgeIndex;},_childHashForNode:function(childNode)
{return childNode._edgeIndex;},comparator:function()
{var sortAscending=this._dataGrid.isSortOrderAscending();var sortColumnIdentifier=this._dataGrid.sortColumnIdentifier();var sortFields={object:["!edgeName",sortAscending,"retainedSize",false],distance:["distance",sortAscending,"retainedSize",false],count:["!edgeName",true,"retainedSize",false],addedSize:["selfSize",sortAscending,"!edgeName",true],removedSize:["selfSize",sortAscending,"!edgeName",true],shallowSize:["selfSize",sortAscending,"!edgeName",true],retainedSize:["retainedSize",sortAscending,"!edgeName",true]}[sortColumnIdentifier]||["!edgeName",true,"retainedSize",false];return WebInspector.HeapSnapshotGridNode.createComparator(sortFields);},__proto__:WebInspector.HeapSnapshotGenericObjectNode.prototype}
WebInspector.HeapSnapshotConstructorNode=function(dataGrid,className,aggregate,nodeFilter)
{WebInspector.HeapSnapshotGridNode.call(this,dataGrid,aggregate.count>0);this._name=className;this._nodeFilter=nodeFilter;this._distance=aggregate.distance;this._count=aggregate.count;this._shallowSize=aggregate.self;this._retainedSize=aggregate.maxRet;var snapshot=dataGrid.snapshot;var countPercent=this._count/snapshot.nodeCount*100.0;var retainedSizePercent=this._retainedSize/snapshot.totalSize*100.0;var shallowSizePercent=this._shallowSize/snapshot.totalSize*100.0;this.data={"object":className,"count":Number.withThousandsSeparator(this._count),"distance":this._toUIDistance(this._distance),"shallowSize":Number.withThousandsSeparator(this._shallowSize),"retainedSize":Number.withThousandsSeparator(this._retainedSize),"count-percent":this._toPercentString(countPercent),"shallowSize-percent":this._toPercentString(shallowSizePercent),"retainedSize-percent":this._toPercentString(retainedSizePercent)};}
WebInspector.HeapSnapshotConstructorNode.prototype={createProvider:function()
{return this._dataGrid.snapshot.createNodesProviderForClass(this._name,this._nodeFilter)},populateNodeBySnapshotObjectId:function(snapshotObjectId,callback)
{function didExpand()
{this._provider().nodePosition(snapshotObjectId,didGetNodePosition.bind(this));}
function didGetNodePosition(nodePosition)
{if(nodePosition===-1){this.collapse();callback(null,null);}else{this._populateChildren(nodePosition,null,didPopulateChildren.bind(this,nodePosition));}}
function didPopulateChildren(nodePosition)
{callback(this,(this.childForPosition(nodePosition)));}
this._dataGrid.resetNameFilter();this.expandWithoutPopulate(didExpand.bind(this));},filteredOut:function(filterValue)
{return this._name.toLowerCase().indexOf(filterValue)===-1;},createCell:function(columnIdentifier)
{var cell=columnIdentifier!=="object"?this._createValueCell(columnIdentifier):WebInspector.HeapSnapshotGridNode.prototype.createCell.call(this,columnIdentifier);if(this._searchMatched)
cell.classList.add("highlight");return cell;},_createChildNode:function(item)
{return new WebInspector.HeapSnapshotInstanceNode(this._dataGrid,this._dataGrid.snapshot,item,false);},comparator:function()
{var sortAscending=this._dataGrid.isSortOrderAscending();var sortColumnIdentifier=this._dataGrid.sortColumnIdentifier();var sortFields={object:["id",sortAscending,"retainedSize",false],distance:["distance",sortAscending,"retainedSize",false],count:["id",true,"retainedSize",false],shallowSize:["selfSize",sortAscending,"id",true],retainedSize:["retainedSize",sortAscending,"id",true]}[sortColumnIdentifier];return WebInspector.HeapSnapshotGridNode.createComparator(sortFields);},_childHashForEntity:function(node)
{return node.id;},_childHashForNode:function(childNode)
{return childNode.snapshotNodeId;},__proto__:WebInspector.HeapSnapshotGridNode.prototype}
WebInspector.HeapSnapshotDiffNodesProvider=function(addedNodesProvider,deletedNodesProvider,addedCount,removedCount)
{this._addedNodesProvider=addedNodesProvider;this._deletedNodesProvider=deletedNodesProvider;this._addedCount=addedCount;this._removedCount=removedCount;}
WebInspector.HeapSnapshotDiffNodesProvider.prototype={dispose:function()
{this._addedNodesProvider.dispose();this._deletedNodesProvider.dispose();},nodePosition:function(snapshotObjectId,callback)
{throw new Error("Unreachable");},isEmpty:function(callback)
{callback(false);},serializeItemsRange:function(beginPosition,endPosition,callback)
{function didReceiveAllItems(items)
{items.totalLength=this._addedCount+this._removedCount;callback(items);}
function didReceiveDeletedItems(addedItems,itemsRange)
{var items=itemsRange.items;if(!addedItems.items.length)
addedItems.startPosition=this._addedCount+itemsRange.startPosition;for(var i=0;i<items.length;i++){items[i].isAddedNotRemoved=false;addedItems.items.push(items[i]);}
addedItems.endPosition=this._addedCount+itemsRange.endPosition;didReceiveAllItems.call(this,addedItems);}
function didReceiveAddedItems(itemsRange)
{var items=itemsRange.items;for(var i=0;i<items.length;i++)
items[i].isAddedNotRemoved=true;if(itemsRange.endPosition<endPosition)
return this._deletedNodesProvider.serializeItemsRange(0,endPosition-itemsRange.endPosition,didReceiveDeletedItems.bind(this,itemsRange));itemsRange.totalLength=this._addedCount+this._removedCount;didReceiveAllItems.call(this,itemsRange);}
if(beginPosition<this._addedCount){this._addedNodesProvider.serializeItemsRange(beginPosition,endPosition,didReceiveAddedItems.bind(this));}else{var emptyRange=new WebInspector.HeapSnapshotCommon.ItemsRange(0,0,0,[]);this._deletedNodesProvider.serializeItemsRange(beginPosition-this._addedCount,endPosition-this._addedCount,didReceiveDeletedItems.bind(this,emptyRange));}},sortAndRewind:function(comparator,callback)
{function afterSort()
{this._deletedNodesProvider.sortAndRewind(comparator,callback);}
this._addedNodesProvider.sortAndRewind(comparator,afterSort.bind(this));}};WebInspector.HeapSnapshotDiffNode=function(dataGrid,className,diffForClass)
{WebInspector.HeapSnapshotGridNode.call(this,dataGrid,true);this._name=className;this._addedCount=diffForClass.addedCount;this._removedCount=diffForClass.removedCount;this._countDelta=diffForClass.countDelta;this._addedSize=diffForClass.addedSize;this._removedSize=diffForClass.removedSize;this._sizeDelta=diffForClass.sizeDelta;this._deletedIndexes=diffForClass.deletedIndexes;this.data={"object":className,"addedCount":Number.withThousandsSeparator(this._addedCount),"removedCount":Number.withThousandsSeparator(this._removedCount),"countDelta":this._signForDelta(this._countDelta)+Number.withThousandsSeparator(Math.abs(this._countDelta)),"addedSize":Number.withThousandsSeparator(this._addedSize),"removedSize":Number.withThousandsSeparator(this._removedSize),"sizeDelta":this._signForDelta(this._sizeDelta)+Number.withThousandsSeparator(Math.abs(this._sizeDelta))};}
WebInspector.HeapSnapshotDiffNode.prototype={createProvider:function()
{var tree=this._dataGrid;return new WebInspector.HeapSnapshotDiffNodesProvider(tree.snapshot.createAddedNodesProvider(tree.baseSnapshot.uid,this._name),tree.baseSnapshot.createDeletedNodesProvider(this._deletedIndexes),this._addedCount,this._removedCount);},createCell:function(columnIdentifier)
{var cell=WebInspector.HeapSnapshotGridNode.prototype.createCell.call(this,columnIdentifier);if(columnIdentifier!=="object")
cell.classList.add("numeric-column");return cell;},_createChildNode:function(item)
{if(item.isAddedNotRemoved)
return new WebInspector.HeapSnapshotInstanceNode(this._dataGrid,this._dataGrid.snapshot,item,false);else
return new WebInspector.HeapSnapshotInstanceNode(this._dataGrid,this._dataGrid.baseSnapshot,item,true);},_childHashForEntity:function(node)
{return node.id;},_childHashForNode:function(childNode)
{return childNode.snapshotNodeId;},comparator:function()
{var sortAscending=this._dataGrid.isSortOrderAscending();var sortColumnIdentifier=this._dataGrid.sortColumnIdentifier();var sortFields={object:["id",sortAscending,"selfSize",false],addedCount:["selfSize",sortAscending,"id",true],removedCount:["selfSize",sortAscending,"id",true],countDelta:["selfSize",sortAscending,"id",true],addedSize:["selfSize",sortAscending,"id",true],removedSize:["selfSize",sortAscending,"id",true],sizeDelta:["selfSize",sortAscending,"id",true]}[sortColumnIdentifier];return WebInspector.HeapSnapshotGridNode.createComparator(sortFields);},filteredOut:function(filterValue)
{return this._name.toLowerCase().indexOf(filterValue)===-1;},_signForDelta:function(delta)
{if(delta===0)
return"";if(delta>0)
return"+";else
return"\u2212";},__proto__:WebInspector.HeapSnapshotGridNode.prototype}
WebInspector.AllocationGridNode=function(dataGrid,data)
{WebInspector.HeapSnapshotGridNode.call(this,dataGrid,data.hasChildren);this._populated=false;this._allocationNode=data;this.data={"liveCount":Number.withThousandsSeparator(data.liveCount),"count":Number.withThousandsSeparator(data.count),"liveSize":Number.withThousandsSeparator(data.liveSize),"size":Number.withThousandsSeparator(data.size),"name":data.name};}
WebInspector.AllocationGridNode.prototype={populate:function()
{if(this._populated)
return;this._populated=true;this._dataGrid.snapshot.allocationNodeCallers(this._allocationNode.id,didReceiveCallers.bind(this));function didReceiveCallers(callers)
{var callersChain=callers.nodesWithSingleCaller;var parentNode=this;var dataGrid=(this._dataGrid);for(var i=0;i<callersChain.length;i++){var child=new WebInspector.AllocationGridNode(dataGrid,callersChain[i]);dataGrid.appendNode(parentNode,child);parentNode=child;parentNode._populated=true;if(this.expanded)
parentNode.expand();}
var callersBranch=callers.branchingCallers;callersBranch.sort(this._dataGrid._createComparator());for(var i=0;i<callersBranch.length;i++)
dataGrid.appendNode(parentNode,new WebInspector.AllocationGridNode(dataGrid,callersBranch[i]));dataGrid.updateVisibleNodes(true);}},expand:function()
{WebInspector.HeapSnapshotGridNode.prototype.expand.call(this);if(this.children.length===1)
this.children[0].expand();},createCell:function(columnIdentifier)
{if(columnIdentifier!=="name")
return this._createValueCell(columnIdentifier);var cell=WebInspector.HeapSnapshotGridNode.prototype.createCell.call(this,columnIdentifier);var allocationNode=this._allocationNode;var target=this._dataGrid.target();if(allocationNode.scriptId){var linkifier=this._dataGrid._linkifier;var urlElement=linkifier.linkifyScriptLocation(target,String(allocationNode.scriptId),allocationNode.scriptName,allocationNode.line-1,allocationNode.column-1,"profile-node-file");urlElement.style.maxWidth="75%";cell.insertBefore(urlElement,cell.firstChild);}
return cell;},allocationNodeId:function()
{return this._allocationNode.id;},__proto__:WebInspector.HeapSnapshotGridNode.prototype};WebInspector.HeapSnapshotView=function(dataDisplayDelegate,profile)
{WebInspector.VBox.call(this);this.element.classList.add("heap-snapshot-view");profile.profileType().addEventListener(WebInspector.HeapSnapshotProfileType.SnapshotReceived,this._onReceiveSnapshot,this);profile.profileType().addEventListener(WebInspector.ProfileType.Events.RemoveProfileHeader,this._onProfileHeaderRemoved,this);if(profile.profileType().id===WebInspector.TrackingHeapSnapshotProfileType.TypeId){this._trackingOverviewGrid=new WebInspector.HeapTrackingOverviewGrid(profile);this._trackingOverviewGrid.addEventListener(WebInspector.HeapTrackingOverviewGrid.IdsRangeChanged,this._onIdsRangeChanged.bind(this));}
this._parentDataDisplayDelegate=dataDisplayDelegate;this._searchableView=new WebInspector.SearchableView(this);this._searchableView.show(this.element);this._splitView=new WebInspector.SplitView(false,true,"heapSnapshotSplitViewState",200,200);this._splitView.show(this._searchableView.element);this._containmentView=new WebInspector.VBox();this._containmentView.setMinimumSize(50,25);this._containmentDataGrid=new WebInspector.HeapSnapshotContainmentDataGrid(this);this._containmentDataGrid.show(this._containmentView.element);this._containmentDataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,this._selectionChanged,this);this._statisticsView=new WebInspector.HeapSnapshotStatisticsView();this._constructorsView=new WebInspector.VBox();this._constructorsView.setMinimumSize(50,25);this._constructorsDataGrid=new WebInspector.HeapSnapshotConstructorsDataGrid(this);this._constructorsDataGrid.show(this._constructorsView.element);this._constructorsDataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,this._selectionChanged,this);this._diffView=new WebInspector.VBox();this._diffView.setMinimumSize(50,25);this._diffDataGrid=new WebInspector.HeapSnapshotDiffDataGrid(this);this._diffDataGrid.show(this._diffView.element);this._diffDataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,this._selectionChanged,this);if(profile._hasAllocationStacks){this._allocationView=new WebInspector.VBox();this._allocationView.setMinimumSize(50,25);this._allocationDataGrid=new WebInspector.AllocationDataGrid(profile.target(),this);this._allocationDataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,this._onSelectAllocationNode,this);this._allocationDataGrid.show(this._allocationView.element);this._allocationStackView=new WebInspector.HeapAllocationStackView(profile.target());this._allocationStackView.setMinimumSize(50,25);this._tabbedPane=new WebInspector.TabbedPane();this._tabbedPane.setCloseableTabs(false);this._tabbedPane.headerElement().classList.add("heap-object-details-header");}
this._retainmentView=new WebInspector.VBox();this._retainmentView.setMinimumSize(50,21);this._retainmentView.element.classList.add("retaining-paths-view");var splitViewResizer;if(this._allocationStackView){this._tabbedPane=new WebInspector.TabbedPane();this._tabbedPane.setCloseableTabs(false);this._tabbedPane.headerElement().classList.add("heap-object-details-header");this._tabbedPane.appendTab("retainers",WebInspector.UIString("Retainers"),this._retainmentView);this._tabbedPane.appendTab("allocation-stack",WebInspector.UIString("Allocation stack"),this._allocationStackView);splitViewResizer=this._tabbedPane.headerElement();this._objectDetailsView=this._tabbedPane;}else{var retainmentViewHeader=createElementWithClass("div","heap-snapshot-view-resizer");var retainingPathsTitleDiv=retainmentViewHeader.createChild("div","title");var retainingPathsTitle=retainingPathsTitleDiv.createChild("span");retainingPathsTitle.textContent=WebInspector.UIString("Retainers");this._retainmentView.element.appendChild(retainmentViewHeader);splitViewResizer=retainmentViewHeader;this._objectDetailsView=this._retainmentView;}
this._splitView.hideDefaultResizer();this._splitView.installResizer(splitViewResizer);this._retainmentDataGrid=new WebInspector.HeapSnapshotRetainmentDataGrid(this);this._retainmentDataGrid.show(this._retainmentView.element);this._retainmentDataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,this._inspectedObjectChanged,this);this._retainmentDataGrid.reset();this._perspectives=[];this._perspectives.push(new WebInspector.HeapSnapshotView.SummaryPerspective());if(profile.profileType()!==WebInspector.ProfileTypeRegistry.instance.trackingHeapSnapshotProfileType)
this._perspectives.push(new WebInspector.HeapSnapshotView.ComparisonPerspective());this._perspectives.push(new WebInspector.HeapSnapshotView.ContainmentPerspective());if(this._allocationView)
this._perspectives.push(new WebInspector.HeapSnapshotView.AllocationPerspective());this._perspectives.push(new WebInspector.HeapSnapshotView.StatisticsPerspective());this._perspectiveSelect=new WebInspector.StatusBarComboBox(this._onSelectedPerspectiveChanged.bind(this));for(var i=0;i<this._perspectives.length;++i)
this._perspectiveSelect.createOption(this._perspectives[i].title());this._profile=profile;this._baseSelect=new WebInspector.StatusBarComboBox(this._changeBase.bind(this));this._baseSelect.setVisible(false);this._updateBaseOptions();this._filterSelect=new WebInspector.StatusBarComboBox(this._changeFilter.bind(this));this._filterSelect.setVisible(false);this._updateFilterOptions();this._classNameFilter=new WebInspector.StatusBarInput("Class filter");this._classNameFilter.setVisible(false);this._constructorsDataGrid.setNameFilter(this._classNameFilter);this._diffDataGrid.setNameFilter(this._classNameFilter);this._selectedSizeText=new WebInspector.StatusBarText("");this._popoverHelper=new WebInspector.ObjectPopoverHelper(this.element,this._getHoverAnchor.bind(this),this._resolveObjectForPopover.bind(this),undefined,true);this._currentPerspectiveIndex=0;this._currentPerspective=this._perspectives[0];this._currentPerspective.activate(this);this._dataGrid=this._currentPerspective.masterGrid(this);this._refreshView();this._searchThrottler=new WebInspector.Throttler(0);}
WebInspector.HeapSnapshotView.Perspective=function(title)
{this._title=title;}
WebInspector.HeapSnapshotView.Perspective.prototype={activate:function(heapSnapshotView){},deactivate:function(heapSnapshotView)
{heapSnapshotView._baseSelect.setVisible(false);heapSnapshotView._filterSelect.setVisible(false);heapSnapshotView._classNameFilter.setVisible(false);if(heapSnapshotView._trackingOverviewGrid)
heapSnapshotView._trackingOverviewGrid.detach();if(heapSnapshotView._allocationView)
heapSnapshotView._allocationView.detach();if(heapSnapshotView._statisticsView)
heapSnapshotView._statisticsView.detach();heapSnapshotView._splitView.detach();heapSnapshotView._splitView.detachChildViews();},masterGrid:function(heapSnapshotView)
{return null;},title:function()
{return this._title;},supportsSearch:function()
{return false;}}
WebInspector.HeapSnapshotView.SummaryPerspective=function()
{WebInspector.HeapSnapshotView.Perspective.call(this,WebInspector.UIString("Summary"));}
WebInspector.HeapSnapshotView.SummaryPerspective.prototype={activate:function(heapSnapshotView)
{heapSnapshotView._splitView.setMainView(heapSnapshotView._constructorsView);heapSnapshotView._splitView.setSidebarView(heapSnapshotView._objectDetailsView);heapSnapshotView._splitView.show(heapSnapshotView._searchableView.element);heapSnapshotView._filterSelect.setVisible(true);heapSnapshotView._classNameFilter.setVisible(true);if(heapSnapshotView._trackingOverviewGrid){heapSnapshotView._trackingOverviewGrid.show(heapSnapshotView._searchableView.element,heapSnapshotView._splitView.element);heapSnapshotView._trackingOverviewGrid.update();heapSnapshotView._trackingOverviewGrid._updateGrid();}},masterGrid:function(heapSnapshotView)
{return heapSnapshotView._constructorsDataGrid;},supportsSearch:function()
{return true;},__proto__:WebInspector.HeapSnapshotView.Perspective.prototype}
WebInspector.HeapSnapshotView.ComparisonPerspective=function()
{WebInspector.HeapSnapshotView.Perspective.call(this,WebInspector.UIString("Comparison"));}
WebInspector.HeapSnapshotView.ComparisonPerspective.prototype={activate:function(heapSnapshotView)
{heapSnapshotView._splitView.setMainView(heapSnapshotView._diffView);heapSnapshotView._splitView.setSidebarView(heapSnapshotView._objectDetailsView);heapSnapshotView._splitView.show(heapSnapshotView._searchableView.element);heapSnapshotView._baseSelect.setVisible(true);heapSnapshotView._classNameFilter.setVisible(true);},masterGrid:function(heapSnapshotView)
{return heapSnapshotView._diffDataGrid;},supportsSearch:function()
{return true;},__proto__:WebInspector.HeapSnapshotView.Perspective.prototype}
WebInspector.HeapSnapshotView.ContainmentPerspective=function()
{WebInspector.HeapSnapshotView.Perspective.call(this,WebInspector.UIString("Containment"));}
WebInspector.HeapSnapshotView.ContainmentPerspective.prototype={activate:function(heapSnapshotView)
{heapSnapshotView._splitView.setMainView(heapSnapshotView._containmentView);heapSnapshotView._splitView.setSidebarView(heapSnapshotView._objectDetailsView);heapSnapshotView._splitView.show(heapSnapshotView._searchableView.element);},masterGrid:function(heapSnapshotView)
{return heapSnapshotView._containmentDataGrid;},__proto__:WebInspector.HeapSnapshotView.Perspective.prototype}
WebInspector.HeapSnapshotView.AllocationPerspective=function()
{WebInspector.HeapSnapshotView.Perspective.call(this,WebInspector.UIString("Allocation"));this._allocationSplitView=new WebInspector.SplitView(false,true,"heapSnapshotAllocationSplitViewState",200,200);this._allocationSplitView.setSidebarView(new WebInspector.VBox());var resizer=createElementWithClass("div","heap-snapshot-view-resizer");var title=resizer.createChild("div","title").createChild("span");title.textContent=WebInspector.UIString("Live objects");this._allocationSplitView.hideDefaultResizer();this._allocationSplitView.installResizer(resizer);this._allocationSplitView.sidebarView().element.appendChild(resizer);}
WebInspector.HeapSnapshotView.AllocationPerspective.prototype={activate:function(heapSnapshotView)
{this._allocationSplitView.setMainView(heapSnapshotView._allocationView);heapSnapshotView._splitView.setMainView(heapSnapshotView._constructorsView);heapSnapshotView._splitView.setSidebarView(heapSnapshotView._objectDetailsView);this._allocationSplitView.setSidebarView(heapSnapshotView._splitView);this._allocationSplitView.show(heapSnapshotView._searchableView.element);heapSnapshotView._constructorsDataGrid.clear();var selectedNode=heapSnapshotView._allocationDataGrid.selectedNode;if(selectedNode)
heapSnapshotView._constructorsDataGrid.setAllocationNodeId(selectedNode.allocationNodeId());},deactivate:function(heapSnapshotView)
{this._allocationSplitView.detach();WebInspector.HeapSnapshotView.Perspective.prototype.deactivate.call(this,heapSnapshotView);},masterGrid:function(heapSnapshotView)
{return heapSnapshotView._allocationDataGrid;},__proto__:WebInspector.HeapSnapshotView.Perspective.prototype}
WebInspector.HeapSnapshotView.StatisticsPerspective=function()
{WebInspector.HeapSnapshotView.Perspective.call(this,WebInspector.UIString("Statistics"));}
WebInspector.HeapSnapshotView.StatisticsPerspective.prototype={activate:function(heapSnapshotView)
{heapSnapshotView._statisticsView.show(heapSnapshotView._searchableView.element);},masterGrid:function(heapSnapshotView)
{return null;},__proto__:WebInspector.HeapSnapshotView.Perspective.prototype}
WebInspector.HeapSnapshotView.prototype={searchableView:function()
{return this._searchableView;},showProfile:function(profile)
{return this._parentDataDisplayDelegate.showProfile(profile);},showObject:function(snapshotObjectId,perspectiveName)
{if(snapshotObjectId<=this._profile.maxJSObjectId)
this.selectLiveObject(perspectiveName,snapshotObjectId);else
this._parentDataDisplayDelegate.showObject(snapshotObjectId,perspectiveName);},_refreshView:function()
{this._profile._loadPromise.then(profileCallback.bind(this));function profileCallback(heapSnapshotProxy)
{heapSnapshotProxy.getStatistics().then(this._gotStatistics.bind(this));if(this._profile.profileType().id===WebInspector.TrackingHeapSnapshotProfileType.TypeId&&this._profile.fromFile())
heapSnapshotProxy.getSamples().then(didGetSamples.bind(this,heapSnapshotProxy));else
setSnapshotProxy.call(this,heapSnapshotProxy);}
function didGetSamples(heapSnapshotProxy,samples)
{setSnapshotProxy.call(this,heapSnapshotProxy);this._trackingOverviewGrid._setSamples(samples);}
function setSnapshotProxy(heapSnapshotProxy)
{var list=this._profiles();var profileIndex=list.indexOf(this._profile);this._baseSelect.setSelectedIndex(Math.max(0,profileIndex-1));this._dataGrid.setDataSource(heapSnapshotProxy);}},_gotStatistics:function(statistics)
{this._statisticsView.setTotal(statistics.total);this._statisticsView.addRecord(statistics.code,WebInspector.UIString("Code"),"#f77");this._statisticsView.addRecord(statistics.strings,WebInspector.UIString("Strings"),"#5e5");this._statisticsView.addRecord(statistics.jsArrays,WebInspector.UIString("JS Arrays"),"#7af");this._statisticsView.addRecord(statistics.native,WebInspector.UIString("Typed Arrays"),"#fc5");this._statisticsView.addRecord(statistics.system,WebInspector.UIString("System Objects"),"#98f");this._statisticsView.addRecord(statistics.total,WebInspector.UIString("Total"));},_onIdsRangeChanged:function(event)
{var minId=event.data.minId;var maxId=event.data.maxId;this._selectedSizeText.setText(WebInspector.UIString("Selected size: %s",Number.bytesToString(event.data.size)));if(this._constructorsDataGrid.snapshot)
this._constructorsDataGrid.setSelectionRange(minId,maxId);},statusBarItems:function()
{var result=[this._perspectiveSelect,this._classNameFilter];if(this._profile.profileType()!==WebInspector.ProfileTypeRegistry.instance.trackingHeapSnapshotProfileType)
result.push(this._baseSelect,this._filterSelect);result.push(this._selectedSizeText);return result;},wasShown:function()
{this._profile._loadPromise.then(this._profile._wasShown.bind(this._profile));},willHide:function()
{this._currentSearchResultIndex=-1;this._popoverHelper.hidePopover();if(this.helpPopover&&this.helpPopover.isShowing())
this.helpPopover.hide();},supportsCaseSensitiveSearch:function()
{return true;},supportsRegexSearch:function()
{return false;},searchCanceled:function()
{this._currentSearchResultIndex=-1;this._searchResults=[];},_selectRevealedNode:function(callback,node)
{if(node)
node.select();callback();},performSearch:function(searchConfig,shouldJump,jumpBackwards)
{var nextQuery=new WebInspector.HeapSnapshotCommon.SearchConfig(searchConfig.query.trim(),searchConfig.caseSensitive,searchConfig.isRegex,shouldJump,jumpBackwards||false);this._searchThrottler.schedule(this._performSearch.bind(this,nextQuery));},_performSearch:function(nextQuery,callback)
{this.searchCanceled();if(!this._currentPerspective.supportsSearch()){callback();return;}
this.currentQuery=nextQuery;var query=nextQuery.query.trim();if(!query){callback();return;}
if(query.charAt(0)==="@"){var snapshotNodeId=parseInt(query.substring(1),10);if(!isNaN(snapshotNodeId))
this._dataGrid.revealObjectByHeapSnapshotId(String(snapshotNodeId),this._selectRevealedNode.bind(this,callback));else
callback();return;}
function didSearch(entryIds)
{this._searchResults=entryIds;this._searchableView.updateSearchMatchesCount(this._searchResults.length);if(this._searchResults.length)
this._currentSearchResultIndex=nextQuery.jumpBackwards?this._searchResults.length-1:0;this._jumpToSearchResult(this._currentSearchResultIndex,callback);}
this._profile._snapshotProxy.search(this.currentQuery,this._dataGrid.nodeFilter(),didSearch.bind(this));},jumpToNextSearchResult:function()
{if(!this._searchResults.length)
return;this._currentSearchResultIndex=(this._currentSearchResultIndex+1)%this._searchResults.length;this._searchThrottler.schedule(this._jumpToSearchResult.bind(this,this._currentSearchResultIndex));},jumpToPreviousSearchResult:function()
{if(!this._searchResults.length)
return;this._currentSearchResultIndex=(this._currentSearchResultIndex+this._searchResults.length-1)%this._searchResults.length;this._searchThrottler.schedule(this._jumpToSearchResult.bind(this,this._currentSearchResultIndex));},_jumpToSearchResult:function(searchResultIndex,callback)
{this._dataGrid.revealObjectByHeapSnapshotId(String(this._searchResults[searchResultIndex]),this._selectRevealedNode.bind(this,callback));this._searchableView.updateCurrentMatchIndex(searchResultIndex);},refreshVisibleData:function()
{if(!this._dataGrid)
return;var child=this._dataGrid.rootNode().children[0];while(child){child.refresh();child=child.traverseNextNode(false,null,true);}},_changeBase:function()
{if(this._baseProfile===this._profiles()[this._baseSelect.selectedIndex()])
return;this._baseProfile=this._profiles()[this._baseSelect.selectedIndex()];var dataGrid=(this._dataGrid);if(dataGrid.snapshot)
this._baseProfile._loadPromise.then(dataGrid.setBaseDataSource.bind(dataGrid));if(!this.currentQuery||!this._searchResults)
return;this.performSearch(this.currentQuery,false);},_changeFilter:function()
{var profileIndex=this._filterSelect.selectedIndex()-1;this._dataGrid.filterSelectIndexChanged(this._profiles(),profileIndex);WebInspector.notifications.dispatchEventToListeners(WebInspector.UserMetrics.UserAction,{action:WebInspector.UserMetrics.UserActionNames.HeapSnapshotFilterChanged,label:this._filterSelect.selectedOption().label});if(!this.currentQuery||!this._searchResults)
return;this.performSearch(this.currentQuery,false);},_profiles:function()
{return this._profile.profileType().getProfiles();},populateContextMenu:function(contextMenu,event)
{if(this._dataGrid)
this._dataGrid.populateContextMenu(contextMenu,event);},_selectionChanged:function(event)
{var selectedNode=event.target.selectedNode;this._setSelectedNodeForDetailsView(selectedNode);this._inspectedObjectChanged(event);},_onSelectAllocationNode:function(event)
{var selectedNode=event.target.selectedNode;this._constructorsDataGrid.setAllocationNodeId(selectedNode.allocationNodeId());this._setSelectedNodeForDetailsView(null);},_inspectedObjectChanged:function(event)
{var selectedNode=event.target.selectedNode;var target=this._profile.target();if(target&&selectedNode instanceof WebInspector.HeapSnapshotGenericObjectNode)
target.heapProfilerAgent().addInspectedHeapObject(String(selectedNode.snapshotNodeId));},_setSelectedNodeForDetailsView:function(nodeItem)
{var dataSource=nodeItem&&nodeItem.retainersDataSource();if(dataSource){this._retainmentDataGrid.setDataSource(dataSource.snapshot,dataSource.snapshotNodeIndex);if(this._allocationStackView)
this._allocationStackView.setAllocatedObject(dataSource.snapshot,dataSource.snapshotNodeIndex);}else{if(this._allocationStackView)
this._allocationStackView.clear();this._retainmentDataGrid.reset();}},_changePerspectiveAndWait:function(perspectiveTitle,callback)
{var perspectiveIndex=null;for(var i=0;i<this._perspectives.length;++i){if(this._perspectives[i].title()===perspectiveTitle){perspectiveIndex=i;break;}}
if(this._currentPerspectiveIndex===perspectiveIndex||perspectiveIndex===null){setTimeout(callback,0);return;}
function dataGridContentShown(event)
{var dataGrid=event.data;dataGrid.removeEventListener(WebInspector.HeapSnapshotSortableDataGrid.Events.ContentShown,dataGridContentShown,this);if(dataGrid===this._dataGrid)
callback();}
this._perspectives[perspectiveIndex].masterGrid(this).addEventListener(WebInspector.HeapSnapshotSortableDataGrid.Events.ContentShown,dataGridContentShown,this);this._perspectiveSelect.setSelectedIndex(perspectiveIndex);this._changePerspective(perspectiveIndex);},_updateDataSourceAndView:function()
{var dataGrid=this._dataGrid;if(!dataGrid||dataGrid.snapshot)
return;this._profile._loadPromise.then(didLoadSnapshot.bind(this));function didLoadSnapshot(snapshotProxy)
{if(this._dataGrid!==dataGrid)
return;if(dataGrid.snapshot!==snapshotProxy)
dataGrid.setDataSource(snapshotProxy);if(dataGrid===this._diffDataGrid){if(!this._baseProfile)
this._baseProfile=this._profiles()[this._baseSelect.selectedIndex()];this._baseProfile._loadPromise.then(didLoadBaseSnaphot.bind(this));}}
function didLoadBaseSnaphot(baseSnapshotProxy)
{if(this._diffDataGrid.baseSnapshot!==baseSnapshotProxy)
this._diffDataGrid.setBaseDataSource(baseSnapshotProxy);}},_onSelectedPerspectiveChanged:function(event)
{this._changePerspective(event.target.selectedIndex);this._onSelectedViewChanged(event);},_onSelectedViewChanged:function(event)
{},_changePerspective:function(selectedIndex)
{if(selectedIndex===this._currentPerspectiveIndex)
return;this._currentPerspectiveIndex=selectedIndex;this._currentPerspective.deactivate(this);var perspective=this._perspectives[selectedIndex];this._currentPerspective=perspective;this._dataGrid=perspective.masterGrid(this);perspective.activate(this);this.refreshVisibleData();if(this._dataGrid)
this._dataGrid.updateWidths();this._updateDataSourceAndView();if(!this.currentQuery||!this._searchResults)
return;this.performSearch(this.currentQuery,false);},selectLiveObject:function(perspectiveName,snapshotObjectId)
{this._changePerspectiveAndWait(perspectiveName,didChangePerspective.bind(this));function didChangePerspective()
{this._dataGrid.revealObjectByHeapSnapshotId(snapshotObjectId,didRevealObject);}
function didRevealObject(node)
{if(node)
node.select();else
WebInspector.console.error("Cannot find corresponding heap snapshot node");}},_getHoverAnchor:function(target)
{var span=target.enclosingNodeOrSelfWithNodeName("span");if(!span)
return;var row=target.enclosingNodeOrSelfWithNodeName("tr");if(!row)
return;span.node=row._dataGridNode;return span;},_resolveObjectForPopover:function(element,showCallback,objectGroupName)
{if(!this._profile.target())
return;if(!element.node)
return;element.node.queryObjectContent(this._profile.target(),showCallback,objectGroupName);},_updateBaseOptions:function()
{var list=this._profiles();if(this._baseSelect.size()===list.length)
return;for(var i=this._baseSelect.size(),n=list.length;i<n;++i){var title=list[i].title;this._baseSelect.createOption(title);}},_updateFilterOptions:function()
{var list=this._profiles();if(this._filterSelect.size()-1===list.length)
return;if(!this._filterSelect.size())
this._filterSelect.createOption(WebInspector.UIString("All objects"));for(var i=this._filterSelect.size()-1,n=list.length;i<n;++i){var title=list[i].title;if(!i)
title=WebInspector.UIString("Objects allocated before %s",title);else
title=WebInspector.UIString("Objects allocated between %s and %s",list[i-1].title,title);this._filterSelect.createOption(title);}},_updateControls:function()
{this._updateBaseOptions();this._updateFilterOptions();},_onReceiveSnapshot:function(event)
{this._updateControls();},_onProfileHeaderRemoved:function(event)
{var profile=event.data;if(this._profile===profile){this.detach();this._profile.profileType().removeEventListener(WebInspector.HeapSnapshotProfileType.SnapshotReceived,this._onReceiveSnapshot,this);this._profile.profileType().removeEventListener(WebInspector.ProfileType.Events.RemoveProfileHeader,this._onProfileHeaderRemoved,this);this.dispose();}else{this._updateControls();}},dispose:function()
{if(this._allocationStackView){this._allocationStackView.clear();this._allocationDataGrid.dispose();}
if(this._trackingOverviewGrid)
this._trackingOverviewGrid.dispose();},__proto__:WebInspector.VBox.prototype}
WebInspector.HeapSnapshotProfileType=function(id,title)
{WebInspector.ProfileType.call(this,id||WebInspector.HeapSnapshotProfileType.TypeId,title||WebInspector.UIString("Take Heap Snapshot"));WebInspector.targetManager.observeTargets(this);WebInspector.targetManager.addModelListener(WebInspector.HeapProfilerModel,WebInspector.HeapProfilerModel.Events.ResetProfiles,this._resetProfiles,this);WebInspector.targetManager.addModelListener(WebInspector.HeapProfilerModel,WebInspector.HeapProfilerModel.Events.AddHeapSnapshotChunk,this._addHeapSnapshotChunk,this);WebInspector.targetManager.addModelListener(WebInspector.HeapProfilerModel,WebInspector.HeapProfilerModel.Events.ReportHeapSnapshotProgress,this._reportHeapSnapshotProgress,this);}
WebInspector.HeapSnapshotProfileType.TypeId="HEAP";WebInspector.HeapSnapshotProfileType.SnapshotReceived="SnapshotReceived";WebInspector.HeapSnapshotProfileType.prototype={targetAdded:function(target)
{target.heapProfilerModel.enable();},targetRemoved:function(target)
{},fileExtension:function()
{return".heapsnapshot";},get buttonTooltip()
{return WebInspector.UIString("Take heap snapshot.");},isInstantProfile:function()
{return true;},buttonClicked:function()
{this._takeHeapSnapshot(function(){});WebInspector.userMetrics.ProfilesHeapProfileTaken.record();return false;},get treeItemTitle()
{return WebInspector.UIString("HEAP SNAPSHOTS");},get description()
{return WebInspector.UIString("Heap snapshot profiles show memory distribution among your page's JavaScript objects and related DOM nodes.");},createProfileLoadedFromFile:function(title)
{return new WebInspector.HeapProfileHeader(null,this,title);},_takeHeapSnapshot:function(callback)
{if(this.profileBeingRecorded())
return;var target=(WebInspector.context.flavor(WebInspector.Target));var profile=new WebInspector.HeapProfileHeader(target,this);this.setProfileBeingRecorded(profile);this.addProfile(profile);profile.updateStatus(WebInspector.UIString("Snapshotting\u2026"));function didTakeHeapSnapshot(error)
{var profile=this._profileBeingRecorded;profile.title=WebInspector.UIString("Snapshot %d",profile.uid);profile._finishLoad();this.setProfileBeingRecorded(null);this.dispatchEventToListeners(WebInspector.ProfileType.Events.ProfileComplete,profile);callback();}
target.heapProfilerAgent().takeHeapSnapshot(true,didTakeHeapSnapshot.bind(this));},_addHeapSnapshotChunk:function(event)
{if(!this.profileBeingRecorded())
return;var chunk=(event.data);this.profileBeingRecorded().transferChunk(chunk);},_reportHeapSnapshotProgress:function(event)
{var profile=this.profileBeingRecorded();if(!profile)
return;var data=(event.data);profile.updateStatus(WebInspector.UIString("%.0f%%",(data.done/data.total)*100),true);if(data.finished)
profile._prepareToLoad();},_resetProfiles:function()
{this._reset();},_snapshotReceived:function(profile)
{if(this._profileBeingRecorded===profile)
this.setProfileBeingRecorded(null);this.dispatchEventToListeners(WebInspector.HeapSnapshotProfileType.SnapshotReceived,profile);},__proto__:WebInspector.ProfileType.prototype}
WebInspector.TrackingHeapSnapshotProfileType=function()
{WebInspector.HeapSnapshotProfileType.call(this,WebInspector.TrackingHeapSnapshotProfileType.TypeId,WebInspector.UIString("Record Heap Allocations"));}
WebInspector.TrackingHeapSnapshotProfileType.TypeId="HEAP-RECORD";WebInspector.TrackingHeapSnapshotProfileType.HeapStatsUpdate="HeapStatsUpdate";WebInspector.TrackingHeapSnapshotProfileType.TrackingStarted="TrackingStarted";WebInspector.TrackingHeapSnapshotProfileType.TrackingStopped="TrackingStopped";WebInspector.TrackingHeapSnapshotProfileType.Samples=function()
{this.sizes=[];this.ids=[];this.timestamps=[];this.max=[];this.totalTime=30000;}
WebInspector.TrackingHeapSnapshotProfileType.prototype={targetAdded:function(target)
{WebInspector.HeapSnapshotProfileType.prototype.targetAdded.call(this,target);target.heapProfilerModel.addEventListener(WebInspector.HeapProfilerModel.Events.HeapStatsUpdate,this._heapStatsUpdate,this);target.heapProfilerModel.addEventListener(WebInspector.HeapProfilerModel.Events.LastSeenObjectId,this._lastSeenObjectId,this);},targetRemoved:function(target)
{WebInspector.HeapSnapshotProfileType.prototype.targetRemoved.call(this,target);target.heapProfilerModel.removeEventListener(WebInspector.HeapProfilerModel.Events.HeapStatsUpdate,this._heapStatsUpdate,this);target.heapProfilerModel.removeEventListener(WebInspector.HeapProfilerModel.Events.LastSeenObjectId,this._lastSeenObjectId,this);},_heapStatsUpdate:function(event)
{if(!this._profileSamples)
return;var samples=(event.data);var index;for(var i=0;i<samples.length;i+=3){index=samples[i];var size=samples[i+2];this._profileSamples.sizes[index]=size;if(!this._profileSamples.max[index])
this._profileSamples.max[index]=size;}},_lastSeenObjectId:function(event)
{var profileSamples=this._profileSamples;if(!profileSamples)
return;var data=(event.data);var currentIndex=Math.max(profileSamples.ids.length,profileSamples.max.length-1);profileSamples.ids[currentIndex]=data.lastSeenObjectId;if(!profileSamples.max[currentIndex]){profileSamples.max[currentIndex]=0;profileSamples.sizes[currentIndex]=0;}
profileSamples.timestamps[currentIndex]=data.timestamp;if(profileSamples.totalTime<data.timestamp-profileSamples.timestamps[0])
profileSamples.totalTime*=2;this.dispatchEventToListeners(WebInspector.TrackingHeapSnapshotProfileType.HeapStatsUpdate,this._profileSamples);this._profileBeingRecorded.updateStatus(null,true);},hasTemporaryView:function()
{return true;},get buttonTooltip()
{return this._recording?WebInspector.UIString("Stop recording heap profile."):WebInspector.UIString("Start recording heap profile.");},isInstantProfile:function()
{return false;},buttonClicked:function()
{return this._toggleRecording();},_startRecordingProfile:function()
{if(this.profileBeingRecorded())
return;var recordAllocationStacks=WebInspector.settings.recordAllocationStacks.get();this._addNewProfile(recordAllocationStacks);this.profileBeingRecorded().target().heapProfilerAgent().startTrackingHeapObjects(recordAllocationStacks);},_addNewProfile:function(withAllocationStacks)
{var target=WebInspector.context.flavor(WebInspector.Target);this.setProfileBeingRecorded(new WebInspector.HeapProfileHeader(target,this,undefined,withAllocationStacks));this._profileSamples=new WebInspector.TrackingHeapSnapshotProfileType.Samples();this._profileBeingRecorded._profileSamples=this._profileSamples;this._recording=true;this.addProfile(this._profileBeingRecorded);this._profileBeingRecorded.updateStatus(WebInspector.UIString("Recording\u2026"));this.dispatchEventToListeners(WebInspector.TrackingHeapSnapshotProfileType.TrackingStarted);},_stopRecordingProfile:function()
{this._profileBeingRecorded.updateStatus(WebInspector.UIString("Snapshotting\u2026"));function didTakeHeapSnapshot(error)
{var profile=this.profileBeingRecorded();if(!profile)
return;profile._finishLoad();this._profileSamples=null;this.setProfileBeingRecorded(null);this.dispatchEventToListeners(WebInspector.ProfileType.Events.ProfileComplete,profile);}
this._profileBeingRecorded.target().heapProfilerAgent().stopTrackingHeapObjects(true,didTakeHeapSnapshot.bind(this));this._recording=false;this.dispatchEventToListeners(WebInspector.TrackingHeapSnapshotProfileType.TrackingStopped);},_toggleRecording:function()
{if(this._recording)
this._stopRecordingProfile();else
this._startRecordingProfile();return this._recording;},fileExtension:function()
{return".heaptimeline";},get treeItemTitle()
{return WebInspector.UIString("HEAP TIMELINES");},get description()
{return WebInspector.UIString("Record JavaScript object allocations over time. Use this profile type to isolate memory leaks.");},_resetProfiles:function()
{var wasRecording=this._recording;var recordingAllocationStacks=wasRecording&&this.profileBeingRecorded()._hasAllocationStacks;this.setProfileBeingRecorded(null);WebInspector.HeapSnapshotProfileType.prototype._resetProfiles.call(this);this._profileSamples=null;if(wasRecording)
this._addNewProfile(recordingAllocationStacks);},profileBeingRecordedRemoved:function()
{this._stopRecordingProfile();this._profileSamples=null;},__proto__:WebInspector.HeapSnapshotProfileType.prototype}
WebInspector.HeapProfileHeader=function(target,type,title,hasAllocationStacks)
{WebInspector.ProfileHeader.call(this,target,type,title||WebInspector.UIString("Snapshot %d",type.nextProfileUid()));this._hasAllocationStacks=!!hasAllocationStacks;this.maxJSObjectId=-1;this._workerProxy=null;this._receiver=null;this._snapshotProxy=null;this._loadPromise=new Promise(loadResolver.bind(this));this._totalNumberOfChunks=0;this._bufferedWriter=null;function loadResolver(fulfill)
{this._fulfillLoad=fulfill;}}
WebInspector.HeapProfileHeader.prototype={createSidebarTreeElement:function(dataDisplayDelegate)
{return new WebInspector.ProfileSidebarTreeElement(dataDisplayDelegate,this,"heap-snapshot-sidebar-tree-item");},createView:function(dataDisplayDelegate)
{return new WebInspector.HeapSnapshotView(dataDisplayDelegate,this);},_prepareToLoad:function()
{console.assert(!this._receiver,"Already loading");this._setupWorker();this.updateStatus(WebInspector.UIString("Loading\u2026"),true);},_finishLoad:function()
{if(!this._wasDisposed)
this._receiver.close();if(this._bufferedWriter){this._bufferedWriter.finishWriting(this._didWriteToTempFile.bind(this));this._bufferedWriter=null;}},_didWriteToTempFile:function(tempFile)
{if(this._wasDisposed){if(tempFile)
tempFile.remove();return;}
this._tempFile=tempFile;if(!tempFile)
this._failedToCreateTempFile=true;if(this._onTempFileReady){this._onTempFileReady();this._onTempFileReady=null;}},_setupWorker:function()
{function setProfileWait(event)
{this.updateStatus(null,event.data);}
console.assert(!this._workerProxy,"HeapSnapshotWorkerProxy already exists");this._workerProxy=new WebInspector.HeapSnapshotWorkerProxy(this._handleWorkerEvent.bind(this));this._workerProxy.addEventListener("wait",setProfileWait,this);this._receiver=this._workerProxy.createLoader(this.uid,this._snapshotReceived.bind(this));},_handleWorkerEvent:function(eventName,data)
{if(WebInspector.HeapSnapshotProgressEvent.BrokenSnapshot===eventName){var error=(data);WebInspector.console.error(error);return;}
if(WebInspector.HeapSnapshotProgressEvent.Update!==eventName)
return;var subtitle=(data);this.updateStatus(subtitle);},dispose:function()
{if(this._workerProxy)
this._workerProxy.dispose();this.removeTempFile();this._wasDisposed=true;},_didCompleteSnapshotTransfer:function()
{if(!this._snapshotProxy)
return;this.updateStatus(Number.bytesToString(this._snapshotProxy.totalSize),false);},transferChunk:function(chunk)
{if(!this._bufferedWriter)
this._bufferedWriter=new WebInspector.DeferredTempFile("heap-profiler",String(this.uid));this._bufferedWriter.write([chunk]);++this._totalNumberOfChunks;this._receiver.write(chunk);},_snapshotReceived:function(snapshotProxy)
{if(this._wasDisposed)
return;this._receiver=null;this._snapshotProxy=snapshotProxy;this.maxJSObjectId=snapshotProxy.maxJSObjectId();this._didCompleteSnapshotTransfer();this._workerProxy.startCheckingForLongRunningCalls();this.notifySnapshotReceived();},notifySnapshotReceived:function()
{this._fulfillLoad(this._snapshotProxy);this._profileType._snapshotReceived(this);if(this.canSaveToFile())
this.dispatchEventToListeners(WebInspector.ProfileHeader.Events.ProfileReceived);},_wasShown:function()
{},canSaveToFile:function()
{return!this.fromFile()&&!!this._snapshotProxy;},saveToFile:function()
{var fileOutputStream=new WebInspector.FileOutputStream();function onOpen(accepted)
{if(!accepted)
return;if(this._failedToCreateTempFile){WebInspector.console.error("Failed to open temp file with heap snapshot");fileOutputStream.close();}else if(this._tempFile){var delegate=new WebInspector.SaveSnapshotOutputStreamDelegate(this);this._tempFile.writeToOutputSteam(fileOutputStream,delegate);}else{this._onTempFileReady=onOpen.bind(this,accepted);this._updateSaveProgress(0,1);}}
this._fileName=this._fileName||"Heap-"+new Date().toISO8601Compact()+this._profileType.fileExtension();fileOutputStream.open(this._fileName,onOpen.bind(this));},_updateSaveProgress:function(value,total)
{var percentValue=((total?(value/total):0)*100).toFixed(0);this.updateStatus(WebInspector.UIString("Saving\u2026 %d%%",percentValue));},loadFromFile:function(file)
{this.updateStatus(WebInspector.UIString("Loading\u2026"),true);this._setupWorker();var delegate=new WebInspector.HeapSnapshotLoadFromFileDelegate(this);var fileReader=this._createFileReader(file,delegate);fileReader.start(this._receiver);},_createFileReader:function(file,delegate)
{return new WebInspector.ChunkedFileReader(file,10000000,delegate);},__proto__:WebInspector.ProfileHeader.prototype}
WebInspector.HeapSnapshotLoadFromFileDelegate=function(snapshotHeader)
{this._snapshotHeader=snapshotHeader;}
WebInspector.HeapSnapshotLoadFromFileDelegate.prototype={onTransferStarted:function()
{},onChunkTransferred:function(reader)
{},onTransferFinished:function()
{},onError:function(reader,e)
{var subtitle;switch(e.target.error.code){case e.target.error.NOT_FOUND_ERR:subtitle=WebInspector.UIString("'%s' not found.",reader.fileName());break;case e.target.error.NOT_READABLE_ERR:subtitle=WebInspector.UIString("'%s' is not readable",reader.fileName());break;case e.target.error.ABORT_ERR:return;default:subtitle=WebInspector.UIString("'%s' error %d",reader.fileName(),e.target.error.code);}
this._snapshotHeader.updateStatus(subtitle);}}
WebInspector.SaveSnapshotOutputStreamDelegate=function(profileHeader)
{this._profileHeader=profileHeader;}
WebInspector.SaveSnapshotOutputStreamDelegate.prototype={onTransferStarted:function()
{this._profileHeader._updateSaveProgress(0,1);},onTransferFinished:function()
{this._profileHeader._didCompleteSnapshotTransfer();},onChunkTransferred:function(reader)
{this._profileHeader._updateSaveProgress(reader.loadedSize(),reader.fileSize());},onError:function(reader,event)
{WebInspector.console.error("Failed to read heap snapshot from temp file: "+(event).message);this.onTransferFinished();}}
WebInspector.HeapTrackingOverviewGrid=function(heapProfileHeader)
{WebInspector.VBox.call(this);this.element.id="heap-recording-view";this.element.classList.add("heap-tracking-overview");this._overviewContainer=this.element.createChild("div","heap-overview-container");this._overviewGrid=new WebInspector.OverviewGrid("heap-recording");this._overviewGrid.element.classList.add("fill");this._overviewCanvas=this._overviewContainer.createChild("canvas","heap-recording-overview-canvas");this._overviewContainer.appendChild(this._overviewGrid.element);this._overviewCalculator=new WebInspector.HeapTrackingOverviewGrid.OverviewCalculator();this._overviewGrid.addEventListener(WebInspector.OverviewGrid.Events.WindowChanged,this._onWindowChanged,this);this._profileSamples=heapProfileHeader.fromFile()?new WebInspector.TrackingHeapSnapshotProfileType.Samples():heapProfileHeader._profileSamples;this._profileType=heapProfileHeader.profileType();if(!heapProfileHeader.fromFile()&&heapProfileHeader.profileType().profileBeingRecorded()===heapProfileHeader){this._profileType.addEventListener(WebInspector.TrackingHeapSnapshotProfileType.HeapStatsUpdate,this._onHeapStatsUpdate,this);this._profileType.addEventListener(WebInspector.TrackingHeapSnapshotProfileType.TrackingStopped,this._onStopTracking,this);}
this._windowLeft=0.0;this._windowRight=1.0;this._overviewGrid.setWindow(this._windowLeft,this._windowRight);this._yScale=new WebInspector.HeapTrackingOverviewGrid.SmoothScale();this._xScale=new WebInspector.HeapTrackingOverviewGrid.SmoothScale();}
WebInspector.HeapTrackingOverviewGrid.IdsRangeChanged="IdsRangeChanged";WebInspector.HeapTrackingOverviewGrid.prototype={dispose:function()
{this._onStopTracking();},_onStopTracking:function()
{this._profileType.removeEventListener(WebInspector.TrackingHeapSnapshotProfileType.HeapStatsUpdate,this._onHeapStatsUpdate,this);this._profileType.removeEventListener(WebInspector.TrackingHeapSnapshotProfileType.TrackingStopped,this._onStopTracking,this);},_onHeapStatsUpdate:function(event)
{this._profileSamples=event.data;this._scheduleUpdate();},_setSamples:function(samples)
{if(!samples)
return;console.assert(!this._profileSamples.timestamps.length,"Should only call this method when loading from file.");console.assert(samples.timestamps.length);this._profileSamples=new WebInspector.TrackingHeapSnapshotProfileType.Samples();this._profileSamples.sizes=samples.sizes;this._profileSamples.ids=samples.lastAssignedIds;this._profileSamples.timestamps=samples.timestamps;this._profileSamples.max=samples.sizes;this._profileSamples.totalTime=(samples.timestamps.peekLast());this.update();},_drawOverviewCanvas:function(width,height)
{if(!this._profileSamples)
return;var profileSamples=this._profileSamples;var sizes=profileSamples.sizes;var topSizes=profileSamples.max;var timestamps=profileSamples.timestamps;var startTime=timestamps[0];var endTime=timestamps[timestamps.length-1];var scaleFactor=this._xScale.nextScale(width/profileSamples.totalTime);var maxSize=0;function aggregateAndCall(sizes,callback)
{var size=0;var currentX=0;for(var i=1;i<timestamps.length;++i){var x=Math.floor((timestamps[i]-startTime)*scaleFactor);if(x!==currentX){if(size)
callback(currentX,size);size=0;currentX=x;}
size+=sizes[i];}
callback(currentX,size);}
function maxSizeCallback(x,size)
{maxSize=Math.max(maxSize,size);}
aggregateAndCall(sizes,maxSizeCallback);var yScaleFactor=this._yScale.nextScale(maxSize?height/(maxSize*1.1):0.0);this._overviewCanvas.width=width*window.devicePixelRatio;this._overviewCanvas.height=height*window.devicePixelRatio;this._overviewCanvas.style.width=width+"px";this._overviewCanvas.style.height=height+"px";var context=this._overviewCanvas.getContext("2d");context.scale(window.devicePixelRatio,window.devicePixelRatio);context.beginPath();context.lineWidth=2;context.strokeStyle="rgba(192, 192, 192, 0.6)";var currentX=(endTime-startTime)*scaleFactor;context.moveTo(currentX,height-1);context.lineTo(currentX,0);context.stroke();context.closePath();var gridY;var gridValue;var gridLabelHeight=14;if(yScaleFactor){const maxGridValue=(height-gridLabelHeight)/yScaleFactor;gridValue=Math.pow(1024,Math.floor(Math.log(maxGridValue)/Math.log(1024)));gridValue*=Math.pow(10,Math.floor(Math.log(maxGridValue/gridValue)/Math.LN10));if(gridValue*5<=maxGridValue)
gridValue*=5;gridY=Math.round(height-gridValue*yScaleFactor-0.5)+0.5;context.beginPath();context.lineWidth=1;context.strokeStyle="rgba(0, 0, 0, 0.2)";context.moveTo(0,gridY);context.lineTo(width,gridY);context.stroke();context.closePath();}
function drawBarCallback(x,size)
{context.moveTo(x,height-1);context.lineTo(x,Math.round(height-size*yScaleFactor-1));}
context.beginPath();context.lineWidth=2;context.strokeStyle="rgba(192, 192, 192, 0.6)";aggregateAndCall(topSizes,drawBarCallback);context.stroke();context.closePath();context.beginPath();context.lineWidth=2;context.strokeStyle="rgba(0, 0, 192, 0.8)";aggregateAndCall(sizes,drawBarCallback);context.stroke();context.closePath();if(gridValue){var label=Number.bytesToString(gridValue);var labelPadding=4;var labelX=0;var labelY=gridY-0.5;var labelWidth=2*labelPadding+context.measureText(label).width;context.beginPath();context.textBaseline="bottom";context.font="10px "+window.getComputedStyle(this.element,null).getPropertyValue("font-family");context.fillStyle="rgba(255, 255, 255, 0.75)";context.fillRect(labelX,labelY-gridLabelHeight,labelWidth,gridLabelHeight);context.fillStyle="rgb(64, 64, 64)";context.fillText(label,labelX+labelPadding,labelY);context.fill();context.closePath();}},onResize:function()
{this._updateOverviewCanvas=true;this._scheduleUpdate();},_onWindowChanged:function()
{if(!this._updateGridTimerId)
this._updateGridTimerId=setTimeout(this._updateGrid.bind(this),10);},_scheduleUpdate:function()
{if(this._updateTimerId)
return;this._updateTimerId=setTimeout(this.update.bind(this),10);},_updateBoundaries:function()
{this._windowLeft=this._overviewGrid.windowLeft();this._windowRight=this._overviewGrid.windowRight();this._windowWidth=this._windowRight-this._windowLeft;},update:function()
{this._updateTimerId=null;if(!this.isShowing())
return;this._updateBoundaries();this._overviewCalculator._updateBoundaries(this);this._overviewGrid.updateDividers(this._overviewCalculator);this._drawOverviewCanvas(this._overviewContainer.clientWidth,this._overviewContainer.clientHeight-20);},_updateGrid:function()
{this._updateGridTimerId=0;this._updateBoundaries();var ids=this._profileSamples.ids;var timestamps=this._profileSamples.timestamps;var sizes=this._profileSamples.sizes;var startTime=timestamps[0];var totalTime=this._profileSamples.totalTime;var timeLeft=startTime+totalTime*this._windowLeft;var timeRight=startTime+totalTime*this._windowRight;var minId=0;var maxId=ids[ids.length-1]+1;var size=0;for(var i=0;i<timestamps.length;++i){if(!timestamps[i])
continue;if(timestamps[i]>timeRight)
break;maxId=ids[i];if(timestamps[i]<timeLeft){minId=ids[i];continue;}
size+=sizes[i];}
this.dispatchEventToListeners(WebInspector.HeapTrackingOverviewGrid.IdsRangeChanged,{minId:minId,maxId:maxId,size:size});},__proto__:WebInspector.VBox.prototype}
WebInspector.HeapTrackingOverviewGrid.SmoothScale=function()
{this._lastUpdate=0;this._currentScale=0.0;}
WebInspector.HeapTrackingOverviewGrid.SmoothScale.prototype={nextScale:function(target){target=target||this._currentScale;if(this._currentScale){var now=Date.now();var timeDeltaMs=now-this._lastUpdate;this._lastUpdate=now;var maxChangePerSec=20;var maxChangePerDelta=Math.pow(maxChangePerSec,timeDeltaMs/1000);var scaleChange=target/this._currentScale;this._currentScale*=Number.constrain(scaleChange,1/maxChangePerDelta,maxChangePerDelta);}else{this._currentScale=target;}
return this._currentScale;}}
WebInspector.HeapTrackingOverviewGrid.OverviewCalculator=function()
{}
WebInspector.HeapTrackingOverviewGrid.OverviewCalculator.prototype={paddingLeft:function()
{return 0;},_updateBoundaries:function(chart)
{this._minimumBoundaries=0;this._maximumBoundaries=chart._profileSamples.totalTime;this._xScaleFactor=chart._overviewContainer.clientWidth/this._maximumBoundaries;},computePosition:function(time)
{return(time-this._minimumBoundaries)*this._xScaleFactor;},formatTime:function(value,precision)
{return Number.secondsToString(value/1000,!!precision);},maximumBoundary:function()
{return this._maximumBoundaries;},minimumBoundary:function()
{return this._minimumBoundaries;},zeroTime:function()
{return this._minimumBoundaries;},boundarySpan:function()
{return this._maximumBoundaries-this._minimumBoundaries;}}
WebInspector.HeapSnapshotStatisticsView=function()
{WebInspector.VBox.call(this);this.setMinimumSize(50,25);this._pieChart=new WebInspector.PieChart(150,WebInspector.HeapSnapshotStatisticsView._valueFormatter,true);this._pieChart.element.classList.add("heap-snapshot-stats-pie-chart");this.element.appendChild(this._pieChart.element);this._labels=this.element.createChild("div","heap-snapshot-stats-legend");}
WebInspector.HeapSnapshotStatisticsView._valueFormatter=function(value)
{return WebInspector.UIString("%s KB",Number.withThousandsSeparator(Math.round(value/1024)));}
WebInspector.HeapSnapshotStatisticsView.prototype={setTotal:function(value)
{this._pieChart.setTotal(value);},addRecord:function(value,name,color)
{if(color)
this._pieChart.addSlice(value,color);var node=this._labels.createChild("div");var swatchDiv=node.createChild("div","heap-snapshot-stats-swatch");var nameDiv=node.createChild("div","heap-snapshot-stats-name");var sizeDiv=node.createChild("div","heap-snapshot-stats-size");if(color)
swatchDiv.style.backgroundColor=color;else
swatchDiv.classList.add("heap-snapshot-stats-empty-swatch");nameDiv.textContent=name;sizeDiv.textContent=WebInspector.HeapSnapshotStatisticsView._valueFormatter(value);},__proto__:WebInspector.VBox.prototype}
WebInspector.HeapAllocationStackView=function(target)
{WebInspector.View.call(this);this._target=target;;this._linkifier=new WebInspector.Linkifier();}
WebInspector.HeapAllocationStackView.prototype={setAllocatedObject:function(snapshot,snapshotNodeIndex)
{this.clear();snapshot.allocationStack(snapshotNodeIndex,this._didReceiveAllocationStack.bind(this));},clear:function()
{this.element.removeChildren();this._linkifier.reset();},_didReceiveAllocationStack:function(frames)
{if(!frames){var stackDiv=this.element.createChild("div","no-heap-allocation-stack");stackDiv.createTextChild(WebInspector.UIString("Stack was not recorded for this object because it had been allocated before this profile recording started."));return;}
var stackDiv=this.element.createChild("div","heap-allocation-stack");for(var i=0;i<frames.length;i++){var frame=frames[i];var frameDiv=stackDiv.createChild("div","stack-frame");var name=frameDiv.createChild("div");name.textContent=WebInspector.beautifyFunctionName(frame.functionName);if(frame.scriptId){var urlElement=this._linkifier.linkifyScriptLocation(this._target,String(frame.scriptId),frame.scriptName,frame.line-1,frame.column-1);frameDiv.appendChild(urlElement);}}},__proto__:WebInspector.View.prototype};WebInspector.ProfileLauncherView=function(profilesPanel)
{WebInspector.VBox.call(this);this._panel=profilesPanel;this.element.classList.add("profile-launcher-view");this.element.classList.add("panel-enabler-view");this._contentElement=this.element.createChild("div","profile-launcher-view-content");this._innerContentElement=this._contentElement.createChild("div");var targetSpan=this._contentElement.createChild("span");var selectTargetText=targetSpan.createChild("span");selectTargetText.textContent=WebInspector.UIString("Target:");var targetsSelect=targetSpan.createChild("select","chrome-select");new WebInspector.TargetsComboBoxController(targetsSelect,targetSpan);this._controlButton=createTextButton("",this._controlButtonClicked.bind(this),"control-profiling");this._contentElement.appendChild(this._controlButton);this._recordButtonEnabled=true;this._loadButton=createTextButton(WebInspector.UIString("Load"),this._loadButtonClicked.bind(this),"load-profile");this._contentElement.appendChild(this._loadButton);WebInspector.targetManager.observeTargets(this);}
WebInspector.ProfileLauncherView.prototype={searchableView:function()
{return null;},targetAdded:function(target)
{this._updateLoadButtonLayout();},targetRemoved:function(target)
{this._updateLoadButtonLayout();},_updateLoadButtonLayout:function()
{this._loadButton.classList.toggle("multi-target",WebInspector.targetManager.targetsWithJSContext().length>1);},addProfileType:function(profileType)
{var descriptionElement=this._innerContentElement.createChild("h1");descriptionElement.textContent=profileType.description;var decorationElement=profileType.decorationElement();if(decorationElement)
this._innerContentElement.appendChild(decorationElement);this._isInstantProfile=profileType.isInstantProfile();this._isEnabled=profileType.isEnabled();},_controlButtonClicked:function()
{this._panel.toggleRecordButton();},_loadButtonClicked:function()
{this._panel.showLoadFromFileDialog();},_updateControls:function()
{if(this._isEnabled&&this._recordButtonEnabled)
this._controlButton.removeAttribute("disabled");else
this._controlButton.setAttribute("disabled","");this._controlButton.title=this._recordButtonEnabled?"":WebInspector.anotherProfilerActiveLabel();if(this._isInstantProfile){this._controlButton.classList.remove("running");this._controlButton.textContent=WebInspector.UIString("Take Snapshot");}else if(this._isProfiling){this._controlButton.classList.add("running");this._controlButton.textContent=WebInspector.UIString("Stop");}else{this._controlButton.classList.remove("running");this._controlButton.textContent=WebInspector.UIString("Start");}},profileStarted:function()
{this._isProfiling=true;this._updateControls();},profileFinished:function()
{this._isProfiling=false;this._updateControls();},updateProfileType:function(profileType,recordButtonEnabled)
{this._isInstantProfile=profileType.isInstantProfile();this._recordButtonEnabled=recordButtonEnabled;this._isEnabled=profileType.isEnabled();this._updateControls();},__proto__:WebInspector.VBox.prototype}
WebInspector.MultiProfileLauncherView=function(profilesPanel)
{WebInspector.ProfileLauncherView.call(this,profilesPanel);WebInspector.settings.selectedProfileType=WebInspector.settings.createSetting("selectedProfileType","CPU");var header=this._innerContentElement.createChild("h1");header.textContent=WebInspector.UIString("Select profiling type");this._profileTypeSelectorForm=this._innerContentElement.createChild("form");this._innerContentElement.createChild("div","flexible-space");this._typeIdToOptionElement={};}
WebInspector.MultiProfileLauncherView.EventTypes={ProfileTypeSelected:"profile-type-selected"}
WebInspector.MultiProfileLauncherView.prototype={addProfileType:function(profileType)
{var labelElement=createRadioLabel("profile-type",profileType.name);this._profileTypeSelectorForm.appendChild(labelElement);var optionElement=labelElement.radioElement;this._typeIdToOptionElement[profileType.id]=optionElement;optionElement._profileType=profileType;optionElement.style.hidden=true;optionElement.addEventListener("change",this._profileTypeChanged.bind(this,profileType),false);var descriptionElement=labelElement.createChild("p");descriptionElement.textContent=profileType.description;var decorationElement=profileType.decorationElement();if(decorationElement)
labelElement.appendChild(decorationElement);},restoreSelectedProfileType:function()
{var typeId=WebInspector.settings.selectedProfileType.get();if(!(typeId in this._typeIdToOptionElement))
typeId=Object.keys(this._typeIdToOptionElement)[0];this._typeIdToOptionElement[typeId].checked=true;var type=this._typeIdToOptionElement[typeId]._profileType;this.dispatchEventToListeners(WebInspector.MultiProfileLauncherView.EventTypes.ProfileTypeSelected,type);},_controlButtonClicked:function()
{this._panel.toggleRecordButton();},_updateControls:function()
{WebInspector.ProfileLauncherView.prototype._updateControls.call(this);var items=this._profileTypeSelectorForm.elements;for(var i=0;i<items.length;++i){if(items[i].type==="radio")
items[i].disabled=this._isProfiling;}},_profileTypeChanged:function(profileType)
{this.dispatchEventToListeners(WebInspector.MultiProfileLauncherView.EventTypes.ProfileTypeSelected,profileType);this._isInstantProfile=profileType.isInstantProfile();this._isEnabled=profileType.isEnabled();this._updateControls();WebInspector.settings.selectedProfileType.set(profileType.id);},profileStarted:function()
{this._isProfiling=true;this._updateControls();},profileFinished:function()
{this._isProfiling=false;this._updateControls();},__proto__:WebInspector.ProfileLauncherView.prototype};WebInspector.CanvasProfileView=function(profile)
{WebInspector.VBox.call(this);this.registerRequiredCSS("profiler/canvasProfiler.css");this.element.classList.add("canvas-profile-view");this._profile=profile;this._traceLogId=profile.traceLogId();this._traceLogPlayer=(profile.traceLogPlayer());this._linkifier=new WebInspector.Linkifier();this._replayInfoSplitView=new WebInspector.SplitView(true,true,"canvasProfileViewReplaySplitViewState",0.34);this._replayInfoSplitView.show(this.element);this._imageSplitView=new WebInspector.SplitView(false,true,"canvasProfileViewSplitViewState",300);this._replayInfoSplitView.setMainView(this._imageSplitView);var replayImageContainerView=new WebInspector.VBoxWithResizeCallback(this._onReplayImageResize.bind(this));replayImageContainerView.setMinimumSize(50,28);this._imageSplitView.setMainView(replayImageContainerView);var replayImageContainer=replayImageContainerView.element;replayImageContainer.id="canvas-replay-image-container";var replayImageParent=replayImageContainer.createChild("div","canvas-replay-image-parent");replayImageParent.createChild("span");this._replayImageElement=replayImageParent.createChild("img");this._debugInfoElement=replayImageContainer.createChild("div","canvas-debug-info hidden");this._spinnerIcon=replayImageContainer.createChild("div","spinner-icon small hidden");var replayLogContainerView=new WebInspector.VBox();replayLogContainerView.setMinimumSize(22,22);this._imageSplitView.setSidebarView(replayLogContainerView);var replayLogContainer=replayLogContainerView.element;var controlsToolbar=new WebInspector.StatusBar(replayLogContainer);var logGridContainer=replayLogContainer.createChild("div","canvas-replay-log");this._createControlButton(controlsToolbar,"first-step-status-bar-item",WebInspector.UIString("First call."),this._onReplayFirstStepClick.bind(this));this._createControlButton(controlsToolbar,"step-out-status-bar-item",WebInspector.UIString("Previous call."),this._onReplayStepClick.bind(this,false));this._createControlButton(controlsToolbar,"step-in-status-bar-item",WebInspector.UIString("Next call."),this._onReplayStepClick.bind(this,true));this._createControlButton(controlsToolbar,"step-backwards-status-bar-item",WebInspector.UIString("Previous drawing call."),this._onReplayDrawingCallClick.bind(this,false));this._createControlButton(controlsToolbar,"step-over-status-bar-item",WebInspector.UIString("Next drawing call."),this._onReplayDrawingCallClick.bind(this,true));this._createControlButton(controlsToolbar,"last-step-status-bar-item",WebInspector.UIString("Last call."),this._onReplayLastStepClick.bind(this));this._replayContextSelector=new WebInspector.StatusBarComboBox(this._onReplayContextChanged.bind(this));this._replayContextSelector.createOption(WebInspector.UIString("<screenshot auto>"),WebInspector.UIString("Show screenshot of the last replayed resource."),"");controlsToolbar.appendStatusBarItem(this._replayContextSelector);this._installReplayInfoSidebarWidgets(replayLogContainer);this._replayStateView=new WebInspector.CanvasReplayStateView(this._traceLogPlayer);this._replayInfoSplitView.setSidebarView(this._replayStateView);this._replayContexts={};var columns=[{title:"#",sortable:false,width:"5%"},{title:WebInspector.UIString("Call"),sortable:false,width:"75%",disclosure:true},{title:WebInspector.UIString("Location"),sortable:false,width:"20%"}];this._logGrid=new WebInspector.DataGrid(columns);this._logGrid.element.classList.add("fill");this._logGrid.show(logGridContainer);this._logGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,this._replayTraceLog,this);this.element.addEventListener("mousedown",this._onMouseClick.bind(this),true);this._popoverHelper=new WebInspector.ObjectPopoverHelper(this.element,this._popoverAnchor.bind(this),this._resolveObjectForPopover.bind(this),this._onHidePopover.bind(this),true);this._popoverHelper.setRemoteObjectFormatter(this._hexNumbersFormatter.bind(this));this._requestTraceLog(0);}
WebInspector.CanvasProfileView.TraceLogPollingInterval=500;WebInspector.CanvasProfileView.prototype={dispose:function()
{this._linkifier.reset();},statusBarItems:function()
{return[];},get profile()
{return this._profile;},_onReplayImageResize:function()
{var parent=this._replayImageElement.parentElement;this._replayImageElement.style.maxWidth=(parent.clientWidth-1)+"px";this._replayImageElement.style.maxHeight=(parent.clientHeight-1)+"px";},elementsToRestoreScrollPositionsFor:function()
{return[this._logGrid.scrollContainer];},_installReplayInfoSidebarWidgets:function(replayLogElement)
{this._replayInfoResizeWidgetElement=replayLogElement.createChild("div","resizer-widget");this._replayInfoSplitView.addEventListener(WebInspector.SplitView.Events.ShowModeChanged,this._updateReplayInfoResizeWidget,this);this._updateReplayInfoResizeWidget();this._replayInfoSplitView.installResizer(this._replayInfoResizeWidgetElement);},_updateReplayInfoResizeWidget:function()
{this._replayInfoResizeWidgetElement.classList.toggle("hidden",this._replayInfoSplitView.showMode()!==WebInspector.SplitView.ShowMode.Both);},_onMouseClick:function(event)
{var resourceLinkElement=event.target.enclosingNodeOrSelfWithClass("canvas-formatted-resource");if(resourceLinkElement){this._replayInfoSplitView.showBoth();this._replayStateView.selectResource(resourceLinkElement.__resourceId);event.consume(true);return;}
if(event.target.enclosingNodeOrSelfWithClass("webkit-html-resource-link"))
event.consume(false);},_createControlButton:function(toolbar,className,title,clickCallback)
{var button=new WebInspector.StatusBarButton(title,className+" canvas-replay-button");toolbar.appendStatusBarItem(button);button.makeLongClickEnabled();button.addEventListener("click",clickCallback,this);button.addEventListener("longClickDown",clickCallback,this);button.addEventListener("longClickPress",clickCallback,this);},_onReplayContextChanged:function()
{var selectedContextId=this._replayContextSelector.selectedOption().value;function didReceiveResourceState(resourceState)
{this._enableWaitIcon(false);if(selectedContextId!==this._replayContextSelector.selectedOption().value)
return;var imageURL=(resourceState&&resourceState.imageURL)||"";this._replayImageElement.src=imageURL;this._replayImageElement.style.visibility=imageURL?"":"hidden";}
this._enableWaitIcon(true);this._traceLogPlayer.getResourceState(selectedContextId,didReceiveResourceState.bind(this));},_onReplayStepClick:function(forward)
{var selectedNode=this._logGrid.selectedNode;if(!selectedNode)
return;var nextNode=selectedNode;do{nextNode=forward?nextNode.traverseNextNode(false):nextNode.traversePreviousNode(false);}while(nextNode&&typeof nextNode.index!=="number");(nextNode||selectedNode).revealAndSelect();},_onReplayDrawingCallClick:function(forward)
{var selectedNode=this._logGrid.selectedNode;if(!selectedNode)
return;var nextNode=selectedNode;while(nextNode){var sibling=forward?nextNode.nextSibling:nextNode.previousSibling;if(sibling){nextNode=sibling;if(nextNode.hasChildren||nextNode.call.isDrawingCall)
break;}else{nextNode=nextNode.parent;if(!forward)
break;}}
if(!nextNode&&forward)
this._onReplayLastStepClick();else
(nextNode||selectedNode).revealAndSelect();},_onReplayFirstStepClick:function()
{var firstNode=this._logGrid.rootNode().children[0];if(firstNode)
firstNode.revealAndSelect();},_onReplayLastStepClick:function()
{var lastNode=this._logGrid.rootNode().children.peekLast();if(!lastNode)
return;while(lastNode.expanded){var lastChild=lastNode.children.peekLast();if(!lastChild)
break;lastNode=lastChild;}
lastNode.revealAndSelect();},_enableWaitIcon:function(enable)
{this._spinnerIcon.classList.toggle("hidden",!enable);this._debugInfoElement.classList.toggle("hidden",enable);},_replayTraceLog:function()
{if(this._pendingReplayTraceLogEvent)
return;var index=this._selectedCallIndex();if(index===-1||index===this._lastReplayCallIndex)
return;this._lastReplayCallIndex=index;this._pendingReplayTraceLogEvent=true;function didReplayTraceLog(resourceState,replayTime)
{delete this._pendingReplayTraceLogEvent;this._enableWaitIcon(false);this._debugInfoElement.textContent=WebInspector.UIString("Replay time: %s",Number.secondsToString(replayTime/1000,true));this._onReplayContextChanged();if(index!==this._selectedCallIndex())
this._replayTraceLog();}
this._enableWaitIcon(true);this._traceLogPlayer.replayTraceLog(index,didReplayTraceLog.bind(this));},_requestTraceLog:function(offset)
{function didReceiveTraceLog(traceLog)
{this._enableWaitIcon(false);if(!traceLog)
return;var callNodes=[];var calls=traceLog.calls;var index=traceLog.startOffset;for(var i=0,n=calls.length;i<n;++i)
callNodes.push(this._createCallNode(index++,calls[i]));var contexts=traceLog.contexts;for(var i=0,n=contexts.length;i<n;++i){var contextId=contexts[i].resourceId||"";var description=contexts[i].description||"";if(this._replayContexts[contextId])
continue;this._replayContexts[contextId]=true;this._replayContextSelector.createOption(description,WebInspector.UIString("Show screenshot of this context's canvas."),contextId);}
this._appendCallNodes(callNodes);if(traceLog.alive)
setTimeout(this._requestTraceLog.bind(this,index),WebInspector.CanvasProfileView.TraceLogPollingInterval);else
this._flattenSingleFrameNode();this._profile._updateCapturingStatus(traceLog);this._onReplayLastStepClick();}
this._enableWaitIcon(true);this._traceLogPlayer.getTraceLog(offset,undefined,didReceiveTraceLog.bind(this));},_selectedCallIndex:function()
{var node=this._logGrid.selectedNode;return node?this._peekLastRecursively(node).index:-1;},_peekLastRecursively:function(node)
{var lastChild;while((lastChild=node.children.peekLast()))
node=lastChild;return node;},_appendCallNodes:function(callNodes)
{var rootNode=this._logGrid.rootNode();var frameNode=rootNode.children.peekLast();if(frameNode&&this._peekLastRecursively(frameNode).call.isFrameEndCall)
frameNode=null;for(var i=0,n=callNodes.length;i<n;++i){if(!frameNode){var index=rootNode.children.length;var data={};data[0]="";data[1]=WebInspector.UIString("Frame #%d",index+1);data[2]="";frameNode=new WebInspector.DataGridNode(data);frameNode.selectable=true;rootNode.appendChild(frameNode);}
var nextFrameCallIndex=i+1;while(nextFrameCallIndex<n&&!callNodes[nextFrameCallIndex-1].call.isFrameEndCall)
++nextFrameCallIndex;this._appendCallNodesToFrameNode(frameNode,callNodes,i,nextFrameCallIndex);i=nextFrameCallIndex-1;frameNode=null;}},_appendCallNodesToFrameNode:function(frameNode,callNodes,fromIndex,toIndex)
{var self=this;function appendDrawCallGroup()
{var index=self._drawCallGroupsCount||0;var data={};data[0]="";data[1]=WebInspector.UIString("Draw call group #%d",index+1);data[2]="";var node=new WebInspector.DataGridNode(data);node.selectable=true;self._drawCallGroupsCount=index+1;frameNode.appendChild(node);return node;}
function splitDrawCallGroup(drawCallGroup)
{var splitIndex=0;var splitNode;while((splitNode=drawCallGroup.children[splitIndex])){if(splitNode.call.isDrawingCall)
break;++splitIndex;}
var newDrawCallGroup=appendDrawCallGroup();var lastNode;while((lastNode=drawCallGroup.children[splitIndex+1]))
newDrawCallGroup.appendChild(lastNode);return newDrawCallGroup;}
var drawCallGroup=frameNode.children.peekLast();var groupHasDrawCall=false;if(drawCallGroup){for(var i=0,n=drawCallGroup.children.length;i<n;++i){if(drawCallGroup.children[i].call.isDrawingCall){groupHasDrawCall=true;break;}}}else
drawCallGroup=appendDrawCallGroup();for(var i=fromIndex;i<toIndex;++i){var node=callNodes[i];drawCallGroup.appendChild(node);if(node.call.isDrawingCall){if(groupHasDrawCall)
drawCallGroup=splitDrawCallGroup(drawCallGroup);else
groupHasDrawCall=true;}}},_createCallNode:function(index,call)
{var callViewElement=createElement("div");var data={};data[0]=index+1;data[1]=callViewElement;data[2]="";if(call.sourceURL){var lineNumber=Math.max(0,call.lineNumber-1)||0;var columnNumber=Math.max(0,call.columnNumber-1)||0;data[2]=this._linkifier.linkifyScriptLocation(this._profile.target(),null,call.sourceURL,lineNumber,columnNumber);}
var node=new WebInspector.DataGridNode(data);node.index=index;node.selectable=true;node.call=call;callViewElement.createChild("span","canvas-function-name").textContent=call.functionName||"context."+call.property;var target=this._profile.target();if(!target)
return node;if(call.arguments){callViewElement.createTextChild("(");for(var i=0,n=call.arguments.length;i<n;++i){var argument=(call.arguments[i]);if(i)
callViewElement.createTextChild(", ");var element=WebInspector.CanvasProfileDataGridHelper.createCallArgumentElement(target,argument);element.__argumentIndex=i;callViewElement.appendChild(element);}
callViewElement.createTextChild(")");}else if(call.value){callViewElement.createTextChild(" = ");callViewElement.appendChild(WebInspector.CanvasProfileDataGridHelper.createCallArgumentElement(target,call.value));}
if(call.result){callViewElement.createTextChild(" => ");callViewElement.appendChild(WebInspector.CanvasProfileDataGridHelper.createCallArgumentElement(target,call.result));}
return node;},_popoverAnchor:function(element,event)
{var argumentElement=element.enclosingNodeOrSelfWithClass("canvas-call-argument");if(!argumentElement||argumentElement.__suppressPopover)
return;return argumentElement;},_resolveObjectForPopover:function(argumentElement,showCallback,objectGroupName)
{function showObjectPopover(error,result,resourceState)
{if(error)
return;if(!result)
return;this._popoverAnchorElement=argumentElement.cloneNode(true);this._popoverAnchorElement.classList.add("canvas-popover-anchor");this._popoverAnchorElement.classList.add("source-frame-eval-expression");argumentElement.parentElement.appendChild(this._popoverAnchorElement);var diffLeft=this._popoverAnchorElement.boxInWindow().x-argumentElement.boxInWindow().x;this._popoverAnchorElement.style.left=this._popoverAnchorElement.offsetLeft-diffLeft+"px";showCallback(this._profile.target().runtimeModel.createRemoteObject(result),false,this._popoverAnchorElement);}
var evalResult=argumentElement.__evalResult;if(evalResult)
showObjectPopover.call(this,null,evalResult);else{var dataGridNode=this._logGrid.dataGridNodeFromNode(argumentElement);if(!dataGridNode||typeof dataGridNode.index!=="number"){this._popoverHelper.hidePopover();return;}
var callIndex=dataGridNode.index;var argumentIndex=argumentElement.__argumentIndex;if(typeof argumentIndex!=="number")
argumentIndex=-1;this._profile.target().canvasAgent().evaluateTraceLogCallArgument(this._traceLogId,callIndex,argumentIndex,objectGroupName,showObjectPopover.bind(this));}},_hexNumbersFormatter:function(object)
{if(object.type==="number"){var str="0000"+Number(object.description).toString(16).toUpperCase();str=str.replace(/^0+(.{4,})$/,"$1");return"0x"+str;}
return object.description||"";},_onHidePopover:function()
{if(this._popoverAnchorElement){this._popoverAnchorElement.remove();delete this._popoverAnchorElement;}},_flattenSingleFrameNode:function()
{var rootNode=this._logGrid.rootNode();if(rootNode.children.length!==1)
return;var frameNode=rootNode.children[0];while(frameNode.children[0])
rootNode.appendChild(frameNode.children[0]);rootNode.removeChild(frameNode);},__proto__:WebInspector.VBox.prototype}
WebInspector.CanvasProfileType=function()
{WebInspector.ProfileType.call(this,WebInspector.CanvasProfileType.TypeId,WebInspector.UIString("Capture Canvas Frame"));this._recording=false;this._lastProfileHeader=null;this._capturingModeSelector=new WebInspector.StatusBarComboBox(this._dispatchViewUpdatedEvent.bind(this));this._capturingModeSelector.element.title=WebInspector.UIString("Canvas capture mode.");this._capturingModeSelector.createOption(WebInspector.UIString("Single Frame"),WebInspector.UIString("Capture a single canvas frame."),"");this._capturingModeSelector.createOption(WebInspector.UIString("Consecutive Frames"),WebInspector.UIString("Capture consecutive canvas frames."),"1");this._frameOptions={};this._framesWithCanvases={};this._frameSelector=new WebInspector.StatusBarComboBox(this._dispatchViewUpdatedEvent.bind(this));this._frameSelector.element.title=WebInspector.UIString("Frame containing the canvases to capture.");this._frameSelector.element.classList.add("hidden");this._target=null;WebInspector.targetManager.observeTargets(this);this._canvasAgentEnabled=false;this._decorationElement=createElement("div");this._decorationElement.className="profile-canvas-decoration";this._updateDecorationElement();}
WebInspector.CanvasProfileType.TypeId="CANVAS_PROFILE";WebInspector.CanvasProfileType.prototype={targetAdded:function(target)
{if(this._target||target!==WebInspector.targetManager.mainTarget())
return;this._target=target;this._target.resourceTreeModel.frames().forEach(this._addFrame,this);this._target.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.FrameAdded,this._frameAdded,this);this._target.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.FrameDetached,this._frameRemoved,this);new WebInspector.CanvasDispatcher(this._target,this);},targetRemoved:function(target)
{if(this._target!==target)
return;this._target.resourceTreeModel.removeEventListener(WebInspector.ResourceTreeModel.EventTypes.FrameAdded,this._frameAdded,this);this._target.resourceTreeModel.removeEventListener(WebInspector.ResourceTreeModel.EventTypes.FrameDetached,this._frameRemoved,this);this._target=null;},statusBarItems:function()
{return[this._capturingModeSelector,this._frameSelector];},get buttonTooltip()
{if(this._isSingleFrameMode())
return WebInspector.UIString("Capture next canvas frame.");else
return this._recording?WebInspector.UIString("Stop capturing canvas frames."):WebInspector.UIString("Start capturing canvas frames.");},buttonClicked:function()
{if(!this._canvasAgentEnabled)
return false;if(this._recording){this._recording=false;this._stopFrameCapturing();}else if(this._isSingleFrameMode()){this._recording=false;this._runSingleFrameCapturing();}else{this._recording=true;this._startFrameCapturing();}
return this._recording;},_runSingleFrameCapturing:function()
{var frameId=this._selectedFrameId();WebInspector.targetManager.suspendAllTargets();if(this._target)
this._target.canvasAgent().captureFrame(frameId,this._didStartCapturingFrame.bind(this,frameId));WebInspector.targetManager.resumeAllTargets();},_startFrameCapturing:function()
{var frameId=this._selectedFrameId();WebInspector.targetManager.suspendAllTargets();this._target.canvasAgent().startCapturing(frameId,this._didStartCapturingFrame.bind(this,frameId));},_stopFrameCapturing:function()
{if(!this._lastProfileHeader){WebInspector.targetManager.resumeAllTargets();return;}
var profileHeader=this._lastProfileHeader;var traceLogId=profileHeader.traceLogId();this._lastProfileHeader=null;function didStopCapturing()
{profileHeader._updateCapturingStatus();}
if(this._target)
this._target.canvasAgent().stopCapturing(traceLogId,didStopCapturing);WebInspector.targetManager.resumeAllTargets();},_didStartCapturingFrame:function(frameId,error,traceLogId)
{if(error||this._lastProfileHeader&&this._lastProfileHeader.traceLogId()===traceLogId||!this._target)
return;var profileHeader=new WebInspector.CanvasProfileHeader(this._target,this,traceLogId,frameId);this._lastProfileHeader=profileHeader;this.addProfile(profileHeader);profileHeader._updateCapturingStatus();},get treeItemTitle()
{return WebInspector.UIString("CANVAS PROFILE");},get description()
{return WebInspector.UIString("Canvas calls instrumentation");},decorationElement:function()
{return this._decorationElement;},removeProfile:function(profile)
{WebInspector.ProfileType.prototype.removeProfile.call(this,profile);if(this._recording&&profile===this._lastProfileHeader)
this._recording=false;},_updateDecorationElement:function(forcePageReload)
{this._decorationElement.removeChildren();this._decorationElement.createChild("label","","dt-icon-label").type="warning-icon";this._decorationElement.createTextChild(this._canvasAgentEnabled?WebInspector.UIString("Canvas Profiler is enabled."):WebInspector.UIString("Canvas Profiler is disabled."));var button=createTextButton(this._canvasAgentEnabled?WebInspector.UIString("Disable"):WebInspector.UIString("Enable"),this._onProfilerEnableButtonClick.bind(this,!this._canvasAgentEnabled));this._decorationElement.appendChild(button);var target=this._target;if(!target)
return;function hasUninstrumentedCanvasesCallback(error,result)
{if(error||result)
target.resourceTreeModel.reloadPage();}
if(forcePageReload){if(this._canvasAgentEnabled){target.canvasAgent().hasUninstrumentedCanvases(hasUninstrumentedCanvasesCallback);}else{for(var frameId in this._framesWithCanvases){if(this._framesWithCanvases.hasOwnProperty(frameId)){target.resourceTreeModel.reloadPage();break;}}}}},_onProfilerEnableButtonClick:function(enable)
{if(this._canvasAgentEnabled===enable||!this._target)
return;function callback(error)
{if(error)
return;this._canvasAgentEnabled=enable;this._updateDecorationElement(true);this._dispatchViewUpdatedEvent();}
if(enable)
this._target.canvasAgent().enable(callback.bind(this));else
this._target.canvasAgent().disable(callback.bind(this));},_isSingleFrameMode:function()
{return!this._capturingModeSelector.selectedOption().value;},_frameAdded:function(event)
{var frame=(event.data);this._addFrame(frame);},_addFrame:function(frame)
{var frameId=frame.id;var option=createElement("option");option.text=frame.displayName();option.title=frame.url;option.value=frameId;this._frameOptions[frameId]=option;if(this._framesWithCanvases[frameId]){this._frameSelector.addOption(option);this._dispatchViewUpdatedEvent();}},_frameRemoved:function(event)
{var frame=(event.data);var frameId=frame.id;var option=this._frameOptions[frameId];if(option&&this._framesWithCanvases[frameId]){this._frameSelector.removeOption(option);this._dispatchViewUpdatedEvent();}
delete this._frameOptions[frameId];delete this._framesWithCanvases[frameId];},_contextCreated:function(frameId)
{if(this._framesWithCanvases[frameId])
return;this._framesWithCanvases[frameId]=true;var option=this._frameOptions[frameId];if(option){this._frameSelector.addOption(option);this._dispatchViewUpdatedEvent();}},_traceLogsRemoved:function(frameId,traceLogId)
{var sidebarElementsToDelete=[];var sidebarElements=(this.treeElement?this.treeElement.children():[]);for(var i=0,n=sidebarElements.length;i<n;++i){var header=(sidebarElements[i].profile);if(!header)
continue;if(frameId&&frameId!==header.frameId())
continue;if(traceLogId&&traceLogId!==header.traceLogId())
continue;sidebarElementsToDelete.push(sidebarElements[i]);}
for(var i=0,n=sidebarElementsToDelete.length;i<n;++i)
sidebarElementsToDelete[i].ondelete();},_selectedFrameId:function()
{var option=this._frameSelector.selectedOption();return option?option.value:undefined;},_dispatchViewUpdatedEvent:function()
{this._frameSelector.element.classList.toggle("hidden",this._frameSelector.size()<=1);this.dispatchEventToListeners(WebInspector.ProfileType.Events.ViewUpdated);},isInstantProfile:function()
{return this._isSingleFrameMode();},isEnabled:function()
{return this._canvasAgentEnabled;},__proto__:WebInspector.ProfileType.prototype}
WebInspector.CanvasDispatcher=function(target,profileType)
{this._profileType=profileType;target.registerCanvasDispatcher(this);}
WebInspector.CanvasDispatcher.prototype={contextCreated:function(frameId)
{this._profileType._contextCreated(frameId);},traceLogsRemoved:function(frameId,traceLogId)
{this._profileType._traceLogsRemoved(frameId,traceLogId);}}
WebInspector.CanvasProfileHeader=function(target,type,traceLogId,frameId)
{WebInspector.ProfileHeader.call(this,target,type,WebInspector.UIString("Trace Log %d",type.nextProfileUid()));this._traceLogId=traceLogId||"";this._frameId=frameId;this._alive=true;this._traceLogSize=0;this._traceLogPlayer=traceLogId?new WebInspector.CanvasTraceLogPlayerProxy(target,traceLogId):null;}
WebInspector.CanvasProfileHeader.prototype={traceLogId:function()
{return this._traceLogId;},traceLogPlayer:function()
{return this._traceLogPlayer;},frameId:function()
{return this._frameId;},createSidebarTreeElement:function(panel)
{return new WebInspector.ProfileSidebarTreeElement(panel,this,"profile-sidebar-tree-item");},createView:function()
{return new WebInspector.CanvasProfileView(this);},dispose:function()
{if(this._traceLogPlayer)
this._traceLogPlayer.dispose();clearTimeout(this._requestStatusTimer);this._alive=false;},_updateCapturingStatus:function(traceLog)
{if(!this._traceLogId)
return;if(traceLog){this._alive=traceLog.alive;this._traceLogSize=traceLog.totalAvailableCalls;}
var subtitle=this._alive?WebInspector.UIString("Capturing\u2026 %d calls",this._traceLogSize):WebInspector.UIString("Captured %d calls",this._traceLogSize);this.updateStatus(subtitle,this._alive);if(this._alive){clearTimeout(this._requestStatusTimer);this._requestStatusTimer=setTimeout(this._requestCapturingStatus.bind(this),WebInspector.CanvasProfileView.TraceLogPollingInterval);}},_requestCapturingStatus:function()
{function didReceiveTraceLog(traceLog)
{if(!traceLog)
return;this._alive=traceLog.alive;this._traceLogSize=traceLog.totalAvailableCalls;this._updateCapturingStatus();}
this._traceLogPlayer.getTraceLog(0,0,didReceiveTraceLog.bind(this));},__proto__:WebInspector.ProfileHeader.prototype}
WebInspector.CanvasProfileDataGridHelper={createCallArgumentElement:function(target,callArgument)
{if(callArgument.enumName)
return WebInspector.CanvasProfileDataGridHelper.createEnumValueElement(target,callArgument.enumName,+callArgument.description);var element=createElement("span");element.className="canvas-call-argument";var description=callArgument.description;if(callArgument.type==="string"){const maxStringLength=150;element.createTextChild("\"");element.createChild("span","canvas-formatted-string").textContent=description.trimMiddle(maxStringLength);element.createTextChild("\"");element.__suppressPopover=(description.length<=maxStringLength&&!/[\r\n]/.test(description));if(!element.__suppressPopover)
element.__evalResult=target.runtimeModel.createRemoteObjectFromPrimitiveValue(description);}else{var type=callArgument.subtype||callArgument.type;if(type){element.classList.add("canvas-formatted-"+type);if(["null","undefined","boolean","number"].indexOf(type)>=0)
element.__suppressPopover=true;}
element.textContent=description;if(callArgument.remoteObject)
element.__evalResult=target.runtimeModel.createRemoteObject(callArgument.remoteObject);}
if(callArgument.resourceId){element.classList.add("canvas-formatted-resource");element.__resourceId=callArgument.resourceId;}
return element;},createEnumValueElement:function(target,enumName,enumValue)
{var element=createElement("span");element.className="canvas-call-argument canvas-formatted-number";element.textContent=enumName;element.__evalResult=target.runtimeModel.createRemoteObjectFromPrimitiveValue(enumValue);return element;}}
WebInspector.CanvasTraceLogPlayerProxy=function(target,traceLogId)
{WebInspector.SDKObject.call(this,target);this._traceLogId=traceLogId;this._currentResourceStates={};this._defaultResourceId=null;}
WebInspector.CanvasTraceLogPlayerProxy.Events={CanvasTraceLogReceived:"CanvasTraceLogReceived",CanvasReplayStateChanged:"CanvasReplayStateChanged",CanvasResourceStateReceived:"CanvasResourceStateReceived",}
WebInspector.CanvasTraceLogPlayerProxy.prototype={getTraceLog:function(startOffset,maxLength,userCallback)
{function callback(error,traceLog)
{if(error||!traceLog){userCallback(null);return;}
userCallback(traceLog);this.dispatchEventToListeners(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasTraceLogReceived,traceLog);}
this.target().canvasAgent().getTraceLog(this._traceLogId,startOffset,maxLength,callback.bind(this));},dispose:function()
{this._currentResourceStates={};CanvasAgent.dropTraceLog(this._traceLogId);this.dispatchEventToListeners(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasReplayStateChanged);},getResourceState:function(resourceId,userCallback)
{resourceId=resourceId||this._defaultResourceId;if(!resourceId){userCallback(null);return;}
var effectiveResourceId=(resourceId);if(this._currentResourceStates[effectiveResourceId]){userCallback(this._currentResourceStates[effectiveResourceId]);return;}
function callback(error,resourceState)
{if(error||!resourceState){userCallback(null);return;}
this._currentResourceStates[effectiveResourceId]=resourceState;userCallback(resourceState);this.dispatchEventToListeners(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasResourceStateReceived,resourceState);}
this.target().canvasAgent().getResourceState(this._traceLogId,effectiveResourceId,callback.bind(this));},replayTraceLog:function(index,userCallback)
{function callback(error,resourceState,replayTime)
{this._currentResourceStates={};if(error){userCallback(null,replayTime);}else{this._defaultResourceId=resourceState.id;this._currentResourceStates[resourceState.id]=resourceState;userCallback(resourceState,replayTime);}
this.dispatchEventToListeners(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasReplayStateChanged);if(!error)
this.dispatchEventToListeners(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasResourceStateReceived,resourceState);}
this.target().canvasAgent().replayTraceLog(this._traceLogId,index,callback.bind(this));},clearResourceStates:function()
{this._currentResourceStates={};this.dispatchEventToListeners(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasReplayStateChanged);},__proto__:WebInspector.SDKObject.prototype};WebInspector.CanvasReplayStateView=function(traceLogPlayer)
{WebInspector.VBox.call(this);this.registerRequiredCSS("profiler/canvasProfiler.css");this.element.classList.add("canvas-replay-state-view");this._traceLogPlayer=traceLogPlayer;var controlsToolbar=new WebInspector.StatusBar(this.element);this._prevButton=this._createControlButton(controlsToolbar,"play-backwards-status-bar-item",WebInspector.UIString("Previous resource."),this._onResourceNavigationClick.bind(this,false));this._nextButton=this._createControlButton(controlsToolbar,"play-status-bar-item",WebInspector.UIString("Next resource."),this._onResourceNavigationClick.bind(this,true));this._createControlButton(controlsToolbar,"refresh-status-bar-item",WebInspector.UIString("Refresh."),this._onStateRefreshClick.bind(this));this._resourceSelector=new WebInspector.StatusBarComboBox(this._onReplayResourceChanged.bind(this));this._currentOption=this._resourceSelector.createOption(WebInspector.UIString("<auto>"),WebInspector.UIString("Show state of the last replayed resource."),"");controlsToolbar.appendStatusBarItem(this._resourceSelector);this._resourceIdToDescription={};this._gridNodesExpandedState={};this._gridScrollPositions={};this._currentResourceId=null;this._prevOptionsStack=[];this._nextOptionsStack=[];this._highlightedGridNodes=[];var columns=[{title:WebInspector.UIString("Name"),sortable:false,width:"50%",disclosure:true},{title:WebInspector.UIString("Value"),sortable:false,width:"50%"}];this._stateGrid=new WebInspector.DataGrid(columns);this._stateGrid.element.classList.add("fill");this._stateGrid.show(this.element);this._traceLogPlayer.addEventListener(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasReplayStateChanged,this._onReplayResourceChanged,this);this._traceLogPlayer.addEventListener(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasTraceLogReceived,this._onCanvasTraceLogReceived,this);this._traceLogPlayer.addEventListener(WebInspector.CanvasTraceLogPlayerProxy.Events.CanvasResourceStateReceived,this._onCanvasResourceStateReceived,this);this._updateButtonsEnabledState();}
WebInspector.CanvasReplayStateView.prototype={selectResource:function(resourceId)
{if(resourceId===this._resourceSelector.selectedOption().value)
return;var option=this._resourceSelector.selectElement().firstChild;for(var index=0;option;++index,option=option.nextSibling){if(resourceId===option.value){this._resourceSelector.setSelectedIndex(index);this._onReplayResourceChanged();break;}}},_createControlButton:function(toolbar,className,title,clickCallback)
{var button=new WebInspector.StatusBarButton(title,className);toolbar.appendStatusBarItem(button);button.makeLongClickEnabled();button.addEventListener("click",clickCallback,this);button.addEventListener("longClickDown",clickCallback,this);button.addEventListener("longClickPress",clickCallback,this);return button;},_onResourceNavigationClick:function(forward)
{var newOption=forward?this._nextOptionsStack.pop():this._prevOptionsStack.pop();if(!newOption)
return;(forward?this._prevOptionsStack:this._nextOptionsStack).push(this._currentOption);this._isNavigationButton=true;this.selectResource(newOption.value);delete this._isNavigationButton;this._updateButtonsEnabledState();},_onStateRefreshClick:function()
{this._traceLogPlayer.clearResourceStates();},_updateButtonsEnabledState:function()
{this._prevButton.setEnabled(this._prevOptionsStack.length>0);this._nextButton.setEnabled(this._nextOptionsStack.length>0);},_updateCurrentOption:function()
{const maxStackSize=256;var selectedOption=this._resourceSelector.selectedOption();if(this._currentOption===selectedOption)
return;if(!this._isNavigationButton){this._prevOptionsStack.push(this._currentOption);this._nextOptionsStack=[];if(this._prevOptionsStack.length>maxStackSize)
this._prevOptionsStack.shift();this._updateButtonsEnabledState();}
this._currentOption=selectedOption;},_collectResourcesFromTraceLog:function(traceLog)
{var collectedResources=[];var calls=traceLog.calls;for(var i=0,n=calls.length;i<n;++i){var call=calls[i];var args=call.arguments||[];for(var j=0;j<args.length;++j)
this._collectResourceFromCallArgument(args[j],collectedResources);this._collectResourceFromCallArgument(call.result,collectedResources);this._collectResourceFromCallArgument(call.value,collectedResources);}
var contexts=traceLog.contexts;for(var i=0,n=contexts.length;i<n;++i)
this._collectResourceFromCallArgument(contexts[i],collectedResources);this._addCollectedResourcesToSelector(collectedResources);},_collectResourcesFromResourceState:function(resourceState)
{var collectedResources=[];this._collectResourceFromResourceStateDescriptors(resourceState.descriptors,collectedResources);this._addCollectedResourcesToSelector(collectedResources);},_collectResourceFromResourceStateDescriptors:function(descriptors,output)
{if(!descriptors)
return;for(var i=0,n=descriptors.length;i<n;++i){var descriptor=descriptors[i];this._collectResourceFromCallArgument(descriptor.value,output);this._collectResourceFromResourceStateDescriptors(descriptor.values,output);}},_collectResourceFromCallArgument:function(argument,output)
{if(!argument)
return;var resourceId=argument.resourceId;if(!resourceId||this._resourceIdToDescription[resourceId])
return;this._resourceIdToDescription[resourceId]=argument.description;output.push(argument);},_addCollectedResourcesToSelector:function(collectedResources)
{if(!collectedResources.length)
return;function comparator(arg1,arg2)
{var a=arg1.description;var b=arg2.description;return String.naturalOrderComparator(a,b);}
collectedResources.sort(comparator);var selectElement=this._resourceSelector.selectElement();var currentOption=selectElement.firstChild;currentOption=currentOption.nextSibling;for(var i=0,n=collectedResources.length;i<n;++i){var argument=collectedResources[i];while(currentOption&&String.naturalOrderComparator(currentOption.text,argument.description)<0)
currentOption=currentOption.nextSibling;var option=this._resourceSelector.createOption(argument.description,WebInspector.UIString("Show state of this resource."),argument.resourceId);if(currentOption)
selectElement.insertBefore(option,currentOption);}},_onReplayResourceChanged:function()
{this._updateCurrentOption();var selectedResourceId=this._resourceSelector.selectedOption().value;function didReceiveResourceState(resourceState)
{if(selectedResourceId!==this._resourceSelector.selectedOption().value)
return;this._showResourceState(resourceState);}
this._traceLogPlayer.getResourceState(selectedResourceId,didReceiveResourceState.bind(this));},_onCanvasTraceLogReceived:function(event)
{var traceLog=(event.data);console.assert(traceLog);this._collectResourcesFromTraceLog(traceLog);},_onCanvasResourceStateReceived:function(event)
{var resourceState=(event.data);console.assert(resourceState);this._collectResourcesFromResourceState(resourceState);},_showResourceState:function(resourceState)
{this._saveExpandedState();this._saveScrollState();var rootNode=this._stateGrid.rootNode();if(!resourceState){this._currentResourceId=null;this._updateDataGridHighlights([]);rootNode.removeChildren();return;}
var nodesToHighlight=[];var nameToOldGridNodes={};function populateNameToNodesMap(map,node)
{if(!node)
return;for(var i=0,child;child=node.children[i];++i){var item={node:child,children:{}};map[child.name]=item;populateNameToNodesMap(item.children,child);}}
populateNameToNodesMap(nameToOldGridNodes,rootNode);rootNode.removeChildren();function comparator(d1,d2)
{var hasChildren1=!!d1.values;var hasChildren2=!!d2.values;if(hasChildren1!==hasChildren2)
return hasChildren1?1:-1;return String.naturalOrderComparator(d1.name,d2.name);}
function appendResourceStateDescriptors(descriptors,parent,nameToOldChildren)
{descriptors=descriptors||[];descriptors.sort(comparator);var oldChildren=nameToOldChildren||{};for(var i=0,n=descriptors.length;i<n;++i){var descriptor=descriptors[i];var childNode=this._createDataGridNode(descriptor);parent.appendChild(childNode);var oldChildrenItem=oldChildren[childNode.name]||{};var oldChildNode=oldChildrenItem.node;if(!oldChildNode||oldChildNode.element().textContent!==childNode.element().textContent)
nodesToHighlight.push(childNode);appendResourceStateDescriptors.call(this,descriptor.values,childNode,oldChildrenItem.children);}}
appendResourceStateDescriptors.call(this,resourceState.descriptors,rootNode,nameToOldGridNodes);var shouldHighlightChanges=(this._resourceKindId(this._currentResourceId)===this._resourceKindId(resourceState.id));this._currentResourceId=resourceState.id;this._restoreExpandedState();this._updateDataGridHighlights(shouldHighlightChanges?nodesToHighlight:[]);this._restoreScrollState();},_updateDataGridHighlights:function(nodes)
{for(var i=0,n=this._highlightedGridNodes.length;i<n;++i)
this._highlightedGridNodes[i].element().classList.remove("canvas-grid-node-highlighted");this._highlightedGridNodes=nodes;for(var i=0,n=this._highlightedGridNodes.length;i<n;++i){var node=this._highlightedGridNodes[i];WebInspector.runCSSAnimationOnce(node.element(),"canvas-grid-node-highlighted");node.reveal();}},_resourceKindId:function(resourceId)
{var description=(resourceId&&this._resourceIdToDescription[resourceId])||"";return description.replace(/\d+/g,"");},_forEachGridNode:function(callback)
{function processRecursively(node,key)
{for(var i=0,child;child=node.children[i];++i){var childKey=key+"#"+child.name;callback(child,childKey);processRecursively(child,childKey);}}
processRecursively(this._stateGrid.rootNode(),"");},_saveExpandedState:function()
{if(!this._currentResourceId)
return;var expandedState={};var key=this._resourceKindId(this._currentResourceId);this._gridNodesExpandedState[key]=expandedState;function callback(node,key)
{if(node.expanded)
expandedState[key]=true;}
this._forEachGridNode(callback);},_restoreExpandedState:function()
{if(!this._currentResourceId)
return;var key=this._resourceKindId(this._currentResourceId);var expandedState=this._gridNodesExpandedState[key];if(!expandedState)
return;function callback(node,key)
{if(expandedState[key])
node.expand();}
this._forEachGridNode(callback);},_saveScrollState:function()
{if(!this._currentResourceId)
return;var key=this._resourceKindId(this._currentResourceId);this._gridScrollPositions[key]={scrollTop:this._stateGrid.scrollContainer.scrollTop,scrollLeft:this._stateGrid.scrollContainer.scrollLeft};},_restoreScrollState:function()
{if(!this._currentResourceId)
return;var key=this._resourceKindId(this._currentResourceId);var scrollState=this._gridScrollPositions[key];if(!scrollState)
return;this._stateGrid.scrollContainer.scrollTop=scrollState.scrollTop;this._stateGrid.scrollContainer.scrollLeft=scrollState.scrollLeft;},_createDataGridNode:function(descriptor)
{var name=descriptor.name;var callArgument=descriptor.value;var target=this._traceLogPlayer.target();var valueElement=callArgument?WebInspector.CanvasProfileDataGridHelper.createCallArgumentElement(target,callArgument):"";var nameElement=name;if(target&&typeof descriptor.enumValueForName!=="undefined")
nameElement=WebInspector.CanvasProfileDataGridHelper.createEnumValueElement(target,name,+descriptor.enumValueForName);if(descriptor.isArray&&descriptor.values){if(typeof nameElement==="string")
nameElement+="["+descriptor.values.length+"]";else{var element=createElement("span");element.appendChild(nameElement);element.createTextChild("["+descriptor.values.length+"]");nameElement=element;}}
var data={};data[0]=nameElement;data[1]=valueElement;var node=new WebInspector.DataGridNode(data);node.selectable=false;node.name=name;return node;},__proto__:WebInspector.VBox.prototype};WebInspector.ProfileTypeRegistry=function()
{this._profileTypes=[];this.cpuProfileType=new WebInspector.CPUProfileType();this._addProfileType(this.cpuProfileType);this.heapSnapshotProfileType=new WebInspector.HeapSnapshotProfileType();this._addProfileType(this.heapSnapshotProfileType);this.trackingHeapSnapshotProfileType=new WebInspector.TrackingHeapSnapshotProfileType();this._addProfileType(this.trackingHeapSnapshotProfileType);if(Runtime.experiments.isEnabled("canvasInspection")){this.canvasProfileType=new WebInspector.CanvasProfileType();this._addProfileType(this.canvasProfileType);}}
WebInspector.ProfileTypeRegistry.prototype={_addProfileType:function(profileType)
{this._profileTypes.push(profileType);},profileTypes:function()
{return this._profileTypes;}}
WebInspector.ProfileTypeRegistry.instance=new WebInspector.ProfileTypeRegistry();;WebInspector.TargetsComboBoxController=function(selectElement,elementToHide)
{elementToHide.classList.add("hidden");selectElement.addEventListener("change",this._onComboBoxSelectionChange.bind(this),false);this._selectElement=selectElement;this._elementToHide=elementToHide;this._targetToOption=new Map();WebInspector.context.addFlavorChangeListener(WebInspector.Target,this._targetChangedExternally,this);WebInspector.targetManager.observeTargets(this);}
WebInspector.TargetsComboBoxController.prototype={targetAdded:function(target)
{if(!target.hasJSContext())
return;var option=this._selectElement.createChild("option");option.text=target.name();option.__target=target;this._targetToOption.set(target,option);if(WebInspector.context.flavor(WebInspector.Target)===target)
this._selectElement.selectedIndex=Array.prototype.indexOf.call((this._selectElement),option);this._updateVisibility();},targetRemoved:function(target)
{if(!target.hasJSContext())
return;var option=this._targetToOption.remove(target);this._selectElement.removeChild(option);this._updateVisibility();},_onComboBoxSelectionChange:function()
{var selectedOption=this._selectElement[this._selectElement.selectedIndex];if(!selectedOption)
return;WebInspector.context.setFlavor(WebInspector.Target,selectedOption.__target);},_updateVisibility:function()
{var hidden=this._selectElement.childElementCount===1;this._elementToHide.classList.toggle("hidden",hidden);},_targetChangedExternally:function(event)
{var target=(event.data);if(target){var option=(this._targetToOption.get(target));this._select(option);}},_select:function(option)
{this._selectElement.selectedIndex=Array.prototype.indexOf.call((this._selectElement),option);}};Runtime.cachedResources["profiler/canvasProfiler.css"]="/*\n * Copyright (C) 2012 Google Inc. All rights reserved.\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions are\n * met:\n *\n *     * Redistributions of source code must retain the above copyright\n * notice, this list of conditions and the following disclaimer.\n *     * Redistributions in binary form must reproduce the above\n * copyright notice, this list of conditions and the following disclaimer\n * in the documentation and/or other materials provided with the\n * distribution.\n *     * Neither the name of Google Inc. nor the names of its\n * contributors may be used to endorse or promote products derived from\n * this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n * \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n.canvas-profile-view,\n#canvas-replay-image-container {\n    overflow: hidden;\n}\n\n#canvas-replay-image-container {\n    text-align: center;\n    background-color: black;\n    overflow: hidden;\n    padding: 0;\n    color: white;\n    flex: auto;\n}\n\n.canvas-profile-view .resizer-widget {\n    position: absolute;\n    top: 0;\n    right: 0;\n    height: 24px;\n    width: 16px;\n    background-image: url(Images/statusbarResizerHorizontal.png);\n    background-repeat: no-repeat;\n    background-position: center;\n    z-index: 13;\n}\n\n.canvas-replay-image-parent {\n    position: absolute;\n    top: 5px;\n    left: 5px;\n    right: 5px;\n    bottom: 10px;\n}\n\n.canvas-replay-image-parent > span {\n    display: inline-block;\n    height: 100%;\n    vertical-align: middle;\n}\n\n.canvas-replay-image-parent > img {\n    vertical-align: middle;\n}\n\n.canvas-debug-info {\n    position: absolute;\n    left: 0;\n    right: 0;\n    bottom: 6px;\n}\n\n.canvas-profile-view .spinner-icon {\n    position: absolute;\n    width: 16px;\n    height: 16px;\n    right: 4px;\n    bottom: 4px;\n}\n\n.canvas-replay-log {\n    flex: auto;\n    position: relative;\n}\n\n.canvas-replay-log .data-grid {\n    border: none;\n}\n\n.canvas-replay-button {\n    min-width: 32px;\n}\n\n.canvas-popover-anchor {\n    position: absolute;\n    text-indent: 0;\n    padding: 0;\n    margin: 0;\n}\n.data-grid:focus tr.selected .canvas-popover-anchor {\n    background-color: #aaa !important;\n}\n\n.canvas-function-name {\n}\n\n.canvas-formatted-resource {\n    color: rgb(33%, 33%, 33%);\n}\n.canvas-formatted-resource.canvas-popover-anchor,\n.canvas-formatted-resource:hover {\n    color: rgb(38, 38, 38);\n    text-decoration: underline;\n    cursor: pointer;\n}\n\n/* Keep in sync with \"object-value-*\" CSS styles. */\n.canvas-formatted-object,\n.canvas-formatted-node,\n.canvas-formatted-array {\n    color: #222;\n}\n.canvas-formatted-number {\n    color: rgb(28, 0, 207);\n}\n.canvas-formatted-string,\n.canvas-formatted-regexp {\n    color: rgb(196, 26, 22);\n}\n.canvas-formatted-null,\n.canvas-formatted-undefined {\n    color: rgb(128, 128, 128);\n}\n.data-grid:focus tr.selected .canvas-call-argument,\n.data-grid:focus tr.selected .canvas-formatted-string {\n    color: inherit !important;\n}\n\n.canvas-replay-state-view .data-grid {\n    top: 23px;\n}\n\n.canvas-replay-state-view .data-grid .data-container tr:nth-child(odd).canvas-grid-node-highlighted {\n    -webkit-animation: fadeout-odd 2s 0s;\n    background-color: rgb(255, 255, 175);\n}\n\n.canvas-replay-state-view .data-grid .data-container tr:nth-child(even).canvas-grid-node-highlighted {\n    -webkit-animation: fadeout-even 2s 0s;\n    background-color: rgb(235, 235, 120);\n}\n\n@-webkit-keyframes fadeout-odd {\n    from { background-color: rgb(255, 255, 25); }\n    to { background-color: rgb(255, 255, 175); }\n}\n\n@-webkit-keyframes fadeout-even {\n    from { background-color: rgb(255, 255, 25); }\n    to { background-color: rgb(235, 235, 120); }\n}\n\n.canvas-profile-view .status-bar {\n    background-color: #eee;\n    border-bottom: 1px solid #ccc;\n}\n\n/*# sourceURL=profiler/canvasProfiler.css */";Runtime.cachedResources["profiler/heapProfiler.css"]="/*\n * Copyright (C) 2009 Google Inc. All rights reserved.\n * Copyright (C) 2010 Apple Inc. All rights reserved.\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions are\n * met:\n *\n *     * Redistributions of source code must retain the above copyright\n * notice, this list of conditions and the following disclaimer.\n *     * Redistributions in binary form must reproduce the above\n * copyright notice, this list of conditions and the following disclaimer\n * in the documentation and/or other materials provided with the\n * distribution.\n *     * Neither the name of Google Inc. nor the names of its\n * contributors may be used to endorse or promote products derived from\n * this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n * \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n.heap-snapshot-sidebar-tree-item .icon {\n    content: url(Images/profileIcon.png);\n}\n\n.heap-snapshot-sidebar-tree-item.small .icon {\n    content: url(Images/profileSmallIcon.png);\n}\n\n.heap-snapshot-view {\n    overflow: hidden;\n}\n\n.heap-snapshot-view .data-grid {\n    border: none;\n}\n\n.heap-snapshot-view .data-grid tr:empty {\n    height: 16px;\n    visibility: hidden;\n}\n\n.heap-snapshot-view .data-grid span.percent-column {\n    width: 32px;\n}\n\n.heap-snapshot-view .object-value-object,\n.object-value-node {\n    display: inline;\n    position: static;\n}\n\n.detached-dom-tree-node {\n    background-color: #FF9999;\n}\n\n.heap-snapshot-view .object-value-string {\n    white-space: nowrap;\n}\n\n.heap-snapshot-view tr:not(.selected) .object-value-id {\n    color: grey;\n}\n\n.heap-snapshot-view .data-grid {\n    flex: auto;\n}\n\n.heap-snapshot-view .heap-tracking-overview {\n    flex: 0 0 80px;\n    height: 80px;\n}\n\n.heap-snapshot-view .retaining-paths-view {\n    overflow: hidden;\n}\n\n.heap-snapshot-view .heap-snapshot-view-resizer {\n    background-image: url(Images/statusbarResizerVertical.png);\n    background-color: #eee;\n    border-bottom: 1px solid rgb(179, 179, 179);\n    background-repeat: no-repeat;\n    background-position: right center, center;\n    flex: 0 0 21px;\n}\n\n.heap-snapshot-view .heap-snapshot-view-resizer .title > span {\n    display: inline-block;\n    padding-top: 3px;\n    vertical-align: middle;\n    margin-left: 4px;\n    margin-right: 8px;\n}\n\n.heap-snapshot-view .heap-snapshot-view-resizer * {\n    pointer-events: none;\n}\n\n.heap-snapshot-view .heap-object-details-header {\n    background-color: #eee;\n}\n\n.heap-snapshot-view tr:not(.selected) td.object-column span.highlight {\n    background-color: rgb(255, 255, 200);\n}\n\n.heap-snapshot-view td.object-column span.grayed {\n    color: gray;\n}\n\n.cycled-ancessor-node {\n    opacity: 0.6;\n}\n\n#heap-recording-view .heap-snapshot-view {\n    top: 80px;\n}\n\n.heap-overview-container {\n    overflow: hidden;\n    position: absolute;\n    top: 0;\n    width: 100%;\n    height: 80px;\n}\n\n#heap-recording-overview-grid .resources-dividers-label-bar {\n    pointer-events: auto;\n}\n\n#heap-recording-overview-container {\n    border-bottom: 1px solid rgba(0, 0, 0, 0.3);\n}\n\n.heap-recording-overview-canvas {\n    position: absolute;\n    top: 20px;\n    left: 0;\n    right: 0;\n    bottom: 0;\n}\n\n.heap-snapshot-stats-pie-chart {\n    margin: 12px 30px;\n}\n\n.heap-snapshot-stats-legend {\n    margin-left: 24px;\n}\n\n.heap-snapshot-stats-legend > div {\n    margin-top: 1px;\n    width: 170px;\n}\n\n.heap-snapshot-stats-swatch {\n    display: inline-block;\n    width: 10px;\n    height: 10px;\n    border: 1px solid rgba(100, 100, 100, 0.3);\n}\n\n.heap-snapshot-stats-swatch.heap-snapshot-stats-empty-swatch {\n    border: none;\n}\n\n.heap-snapshot-stats-name,\n.heap-snapshot-stats-size {\n    display: inline-block;\n    margin-left: 6px;\n}\n\n.heap-snapshot-stats-size {\n    float: right;\n    text-align: right;\n}\n\n.heap-allocation-stack .stack-frame {\n    display: flex;\n    justify-content: space-between;\n    border-bottom: 1px solid rgb(240, 240, 240);\n    padding: 2px;\n}\n\n.heap-allocation-stack .stack-frame a {\n    color: rgb(33%, 33%, 33%);\n}\n\n.no-heap-allocation-stack {\n    padding: 5px;\n}\n\n/*# sourceURL=profiler/heapProfiler.css */";Runtime.cachedResources["profiler/profilesPanel.css"]="/*\n * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.\n * Copyright (C) 2009 Anthony Ricaud <rik@webkit.org>\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n * 1.  Redistributions of source code must retain the above copyright\n *     notice, this list of conditions and the following disclaimer.\n * 2.  Redistributions in binary form must reproduce the above copyright\n *     notice, this list of conditions and the following disclaimer in the\n *     documentation and/or other materials provided with the distribution.\n * 3.  Neither the name of Apple Computer, Inc. (\"Apple\") nor the names of\n *     its contributors may be used to endorse or promote products derived\n *     from this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY\n * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\n * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\n * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\n * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n/* Profiler Style */\n\n#profile-views {\n    flex: auto;\n    position: relative;\n}\n\n.profile-view .data-grid table.data {\n    background: white;\n}\n\n.profile-view .data-grid tr:not(.selected) .highlight {\n    background-color: rgb(255, 230, 179);\n}\n\n.profile-view .data-grid tr:hover td:not(.bottom-filler-td) {\n    background-color: rgba(0, 0, 0, 0.1);\n}\n\n.profile-view .data-grid td.numeric-column {\n    text-align: right;\n}\n\n.profile-view .data-grid div.profile-multiple-values {\n    float: right;\n}\n\n.profile-view .data-grid span.percent-column {\n    color: #999;\n    width: 48px;\n    display: inline-block;\n}\n\n.profile-view .data-grid tr.selected span {\n    color: inherit;\n}\n\n.profiles-status-bar {\n    display: flex;\n    background-color: #eee;\n    flex: 0 0 25px;\n    flex-direction: row;\n    border-bottom: 1px solid rgb(202, 202, 202);\n}\n\n.profile-launcher-view-tree-item > .icon {\n    width: 4px !important;\n    visibility: hidden;\n}\n\n.profiles-sidebar-tree-box {\n    overflow: auto;\n    flex: auto;\n}\n\n.profiles-sidebar-tree-box > ol {\n    overflow: auto;\n    flex: auto;\n}\n\n.profile-sidebar-tree-item .icon {\n    content: url(Images/profileIcon.png);\n}\n\n.profile-sidebar-tree-item.small .icon {\n    content: url(Images/profileSmallIcon.png);\n}\n\n.profile-group-sidebar-tree-item .icon {\n    content: url(Images/profileGroupIcon.png);\n}\n\n.sidebar-tree-item .title-container > .save-link {\n    text-decoration: underline;\n    margin-left: auto;\n    display: none;\n}\n\n.sidebar-tree-item.selected .title-container > .save-link {\n    display: block;\n}\n\n.cpu-profile-view {\n    display: none;\n    overflow: hidden;\n}\n\n.cpu-profile-view.visible {\n    display: flex;\n}\n\n.cpu-profile-view .data-grid {\n    border: none;\n    flex: auto;\n}\n\n.cpu-profile-view .data-grid th.self-column,\n.cpu-profile-view .data-grid th.total-column {\n    text-align: center;\n}\n\n.profile-node-file {\n    float: right;\n    color: gray;\n}\n\n.profile-warn-marker {\n    background-image: url(Images/statusbarButtonGlyphs.png);\n    background-size: 320px 144px;\n    background-position: -202px -107px;\n    width: 10px;\n    height: 10px;\n    vertical-align: -1px;\n    margin-right: 2px;\n    display: inline-block;\n}\n\n.data-grid tr.selected .profile-node-file {\n    color: rgb(33%, 33%, 33%);\n}\n\n.data-grid:focus tr.selected .profile-node-file {\n    color: white;\n}\n\n.profile-launcher-view-content {\n    padding: 0 16px;\n    text-align: left;\n}\n\n.control-profiling {\n    -webkit-align-self: flex-start;\n    margin-right: 50px;\n}\n\n.profile-launcher-view-content h1 {\n    padding: 15px 0 10px;\n}\n\n.panel-enabler-view.profile-launcher-view form {\n    padding: 0;\n    font-size: 13px;\n    width: 100%;\n}\n\n.panel-enabler-view.profile-launcher-view label {\n    margin: 0;\n}\n\n.profile-launcher-view-content p {\n    color: grey;\n    margin-top: 1px;\n    margin-left: 22px;\n}\n\n.profile-launcher-view-content button.running {\n    color: hsl(0, 100%, 58%);\n}\n\n.profile-launcher-view-content button.running:hover {\n    color: hsl(0, 100%, 42%);\n}\n\nbody.inactive .profile-launcher-view-content button.running:not(.status-bar-item) {\n    color: rgb(220, 130, 130);\n}\n\n.highlighted-row {\n    -webkit-animation: row_highlight 2s 0s;\n}\n\n@-webkit-keyframes row_highlight {\n    from {background-color: rgba(255, 255, 120, 1); }\n    to { background-color: rgba(255, 255, 120, 0); }\n}\n\n.profile-canvas-decoration label[is=dt-icon-label] {\n    margin-right: 4px;\n}\n\n.profile-canvas-decoration {\n    color: red;\n    margin: -14px 0 13px 22px;\n    padding-left: 14px;\n}\n\n.profile-canvas-decoration button {\n    margin: 0 0 0 10px !important;\n}\n\n.profiles.panel select.chrome-select {\n    font-size: 12px;\n    width: 150px;\n    margin-left: 10px;\n    margin-right: 10px;\n}\n\nbutton.load-profile {\n    margin-left: 20px;\n}\n\nbutton.load-profile.multi-target {\n    display: block;\n    margin-top: 14px;\n    margin-left: 0;\n}\n\n.cpu-profile-flame-chart-overview-container {\n    overflow: hidden;\n    position: absolute;\n    top: 0;\n    width: 100%;\n    height: 80px;\n}\n\n#cpu-profile-flame-chart-overview-container {\n    border-bottom: 1px solid rgba(0, 0, 0, 0.3);\n}\n\n.cpu-profile-flame-chart-overview-canvas {\n    position: absolute;\n    top: 20px;\n    left: 0;\n    right: 0;\n    bottom: 0;\n}\n\n#cpu-profile-flame-chart-overview-grid .resources-dividers-label-bar {\n    pointer-events: auto;\n}\n\n.cpu-profile-flame-chart-overview-pane {\n    flex: 0 0 80px !important;\n}\n\n/*# sourceURL=profiler/profilesPanel.css */";