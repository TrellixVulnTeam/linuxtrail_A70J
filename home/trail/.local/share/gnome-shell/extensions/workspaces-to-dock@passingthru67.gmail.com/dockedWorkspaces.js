/* ========================================================================================================
 * dockedWorkspaces.js - dock object that holds the workspaces thumbnailsBox
 * --------------------------------------------------------------------------------------------------------
 *  CREDITS:  This code was copied from the dash-to-dock extension https://github.com/micheleg/dash-to-dock
 *  and modified to create a workspaces dock. Many thanks to michele_g for a great extension.
 *
 *  Part of this code also comes from gnome-shell-extensions:
 *  http://git.gnome.org/browse/gnome-shell-extensions/
 * ========================================================================================================
 */


const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Signals = imports.signals;
const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Meta = imports.gi.Meta;
const IconTheme = imports.gi.Gtk.IconTheme;

const Main = imports.ui.main;
const WorkspacesView = imports.ui.workspacesView;
const WorkspaceThumbnail = imports.ui.workspaceThumbnail;
const Tweener = imports.ui.tweener;
const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const OverviewControls = imports.ui.overviewControls;
const Layout = imports.ui.layout;
const MessageTray = imports.ui.messageTray;

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;
const Me = ExtensionUtils.getCurrentExtension();
const Extension = Me.imports.extension;
const Convenience = Me.imports.convenience;
const MyWorkspaceThumbnail = Me.imports.myWorkspaceThumbnail;
const ShortcutsPanel = Me.imports.shortcutsPanel;

const DashToDock_UUID = "dash-to-dock@micxgx.gmail.com";
let DashToDockExtension = null;
let DashToDock = null;

const DOCK_PADDING = 1;
const DOCK_HIDDEN_WIDTH = 0;
const DOCK_EDGE_VISIBLE_WIDTH = 5;
const PRESSURE_TIMEOUT = 1000;

let GSFunctions = {};

const DockedWorkspaces = new Lang.Class({
    Name: 'workspacesToDock.dockedWorkspaces',

    _init: function() {
        this._gsCurrentVersion = Config.PACKAGE_VERSION.split('.');
        this._settings = Convenience.getSettings('org.gnome.shell.extensions.workspaces-to-dock');
        this._signalHandler = new Convenience.globalSignalHandler();

        // temporarily disable redisplay until initialized (prevents connected signals from trying to update dock visibility)
        this._disableRedisplay = true;
        this._updateRegion = false;

        // set RTL value
        this._rtl = Clutter.get_default_text_direction() == Clutter.TextDirection.RTL;

        // Load settings
        this._bindSettingsChanges();

        // Authohide current status. Not to be confused with autohide enable/disagle global (g)settings
        // Initially set to null - will be set during first enable/disable autohide
        this._autohideStatus = null;

        // initialize animation status object
        this._animStatus = new AnimationStatus(true);

        // initialize popup menu flag
        this._popupMenuShowing = false;

        // initialize colors with generic values
        this._defaultBackground = {red:0, green:0, blue:0};
        this._customBackground = {red:0, green:0, blue:0};
        this._cssStylesheet = null;

        // Initialize pressure barrier variables
        this._canUsePressure = false;
        this._pressureSensed = false;
        this._pressureBarrier = null;
        this._barrier = null;
        this._messageTrayShowing = false;
        this._removeBarrierTimeoutId = 0;

        // Override Gnome Shell functions
        this._overrideGnomeShellFunctions();

        // Create a new thumbnailsbox object
        this._thumbnailsBox = new MyWorkspaceThumbnail.myThumbnailsBox(this);
        if (this._gsCurrentVersion[1] == 10 && this._gsCurrentVersion[2] && this._gsCurrentVersion[2] == 0) {
            this._thumbnailsBoxBackground = this._thumbnailsBox._background;
        } else {
            this._thumbnailsBoxBackground = this._thumbnailsBox.actor;
        }

        this._shortcutsPanel = new ShortcutsPanel.ShortcutsPanel(this);

        // Create the main container, turn on track hover, add hoverChange signal
        this.actor = new St.BoxLayout({
            name: 'workspacestodockContainer',
            reactive: true,
            track_hover: true
        });
        this.actor.connect("notify::hover", Lang.bind(this, this._hoverChanged));
        this.actor.connect("scroll-event", Lang.bind(this, this._onScrollEvent));
        this.actor.connect("button-release-event", Lang.bind(this, this._onDockClicked));
        this._realizeId = this.actor.connect("realize", Lang.bind(this, this._initialize));

        // Create the staticbox that stores the size and position where the dock is shown for determining window overlaps
        // note: used by intellihide module to check window overlap
        this.staticBox = new Clutter.ActorBox({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        });

        // Put dock on the primary monitor
        this._monitor = Main.layoutManager.primaryMonitor;

        // Connect global signals
        this._signalHandler.push(
            [
                this._thumbnailsBoxBackground,
                'notify::width',
                Lang.bind(this, this._thumbnailsBoxResized)
            ],
            [
                Main.layoutManager,
                'monitors-changed',
                Lang.bind(this, this._onMonitorsChanged)
            ],
            [
                St.ThemeContext.get_for_stage(global.stage),
                'changed',
                Lang.bind(this, this._onThemeChanged)
            ],
            [
                IconTheme.get_default(),
                'changed',
                Lang.bind(this, this._onIconsChanged)
            ],
            [
                ExtensionSystem._signals,
                'extension-state-changed',
                Lang.bind(this, this._onExtensionSystemStateChanged)
            ],
            [
                Main.overview.viewSelector,
                'notify::y',
                Lang.bind(this, this._updateYPosition)
            ],
            [
                Main.messageTray,
                'showing',
                Lang.bind(this, this._onMessageTrayShowing)
            ],
            [
                Main.messageTray,
                'hiding',
                Lang.bind(this, this._onMessageTrayHiding)
            ],
            [
                global.screen,
                'in-fullscreen-changed',
                Lang.bind(this, this._updateBarrier)
            ]
        );

        // Bind keyboard shortcuts
        if (this._settings.get_boolean('toggle-dock-with-keyboard-shortcut'))
            this._bindDockKeyboardShortcut();

        // Connect DashToDock hover signal if the extension is already loaded and enabled
        this._hoveringDash = false;
        DashToDockExtension = ExtensionUtils.extensions[DashToDock_UUID];
        if (DashToDockExtension) {
            if (DashToDockExtension.state == ExtensionSystem.ExtensionState.ENABLED) {
                DashToDock = DashToDockExtension.imports.extension;
                if (DashToDock && DashToDock.dock) {
                    var keys = DashToDock.dock._settings.list_keys();
                    if (keys.indexOf('dock-position') > -1) {
                        DashToDockExtension.hasDockPositionKey = true;
                    }
                    // Connect DashToDock hover signal
                    this._signalHandler.pushWithLabel(
                        'DashToDockHoverSignal',
                        [
                            DashToDock.dock._box,
                            'notify::hover',
                            Lang.bind(this, this._onDashToDockHoverChanged)
                        ],
                        [
                            DashToDock.dock._box,
                            'leave-event',
                            Lang.bind(this, this._onDashToDockLeave)
                        ],
                        [
                            DashToDock.dock,
                            'showing',
                            Lang.bind(this, this._onDashToDockShowing)
                        ],
                        [
                            DashToDock.dock,
                            'hiding',
                            Lang.bind(this, this._onDashToDockHiding)
                        ]
                    );
                }
            }
        }

        //Hide the dock whilst setting positions
        //this.actor.hide(); but I need to access its width, so I use opacity
        this.actor.set_opacity(0);

        // Add workspaces to the main container actor and then to the Chrome.
        this.actor.add_actor(this._thumbnailsBox.actor);
        this.actor.add_actor(this._shortcutsPanel.actor);

        Main.layoutManager.addChrome(this.actor, {
            affectsStruts: this._settings.get_boolean('dock-fixed'),
            trackFullscreen: true
        });

        // Lower the dock below the screenShieldGroup so that panel and messageTray popups can receive focus & clicks
        if (Main.layoutManager.uiGroup.contains(Main.layoutManager.screenShieldGroup))
            Main.layoutManager.uiGroup.set_child_below_sibling(this.actor, Main.layoutManager.screenShieldGroup);
    },

    _initialize: function() {
        if(this._realizeId > 0){
            this.actor.disconnect(this._realizeId);
            this._realizeId = 0;
        }

        // Show the thumbnailsBox.  We need it to calculate the width of the dock.
        this._thumbnailsBox._createThumbnails();

        // Set initial position and opacity
        this._resetPosition();
        this.actor.set_opacity(255);

        this._disableRedisplay = false;
        this._updateRegion = true;

        // Now that the dock is on the stage and custom themes are loaded
        // retrieve background color and set background opacity
        this._updateBackgroundOpacity();

        // Setup pressure barrier (GS38+ only)
        this._updatePressureBarrier();
        this._updateBarrier();

        // Not really required because thumbnailsBox width signal will trigger a redisplay
        // Also found GS3.6 crashes returning from lock screen (Ubuntu GS Remix)
        // NOTE: GS3.14 thumbnailsBox width signal triggers ealier so now we need this.
        this._redisplay();
    },

    destroy: function() {
        // Destroy thumbnailsBox & global signals
        this._thumbnailsBox._destroyThumbnails();

        this._shortcutsPanel.destroy();

        // Disconnect global signals
        this._signalHandler.disconnect();

        // Disconnect GSettings signals
        this._settings.run_dispose();

        // Unbind keyboard shortcuts
        this._unbindDockKeyboardShortcut();

        // Removed barrier timeout
        if (this._removeBarrierTimeoutId > 0)
            Mainloop.source_remove(this._removeBarrierTimeoutId);

        // Remove existing barrier
        this._removeBarrier();

        // Destroy main clutter actor: this should be sufficient
        // From clutter documentation:
        // If the actor is inside a container, the actor will be removed.
        // When you destroy a container, its children will be destroyed as well.
        this.actor.destroy();

        // Restore normal Gnome Shell functions
        this._restoreGnomeShellFunctions();
    },

    // function called during init to override gnome shell 3.4/3.6/3.8
    _overrideGnomeShellFunctions: function() {
        let self = this;

        // Force normal workspaces to be always zoomed
        // GS38 moved things to the overviewControls thumbnailsSlider
        GSFunctions['ThumbnailsSlider_getAlwaysZoomOut'] = OverviewControls.ThumbnailsSlider.prototype._getAlwaysZoomOut;
        OverviewControls.ThumbnailsSlider.prototype._getAlwaysZoomOut = function() {
            let alwaysZoomOut = true;
            return alwaysZoomOut;
        };

        // Hide normal workspaces thumbnailsBox
        Main.overview._controls._thumbnailsSlider.actor.opacity = 0;

        // Set MAX_THUMBNAIL_SCALE to custom value
        GSFunctions['WorkspaceThumbnail_MAX_THUMBNAIL_SCALE'] = WorkspaceThumbnail.MAX_THUMBNAIL_SCALE;
        if (this._settings.get_boolean('customize-thumbnail')) {
            WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = this._settings.get_double('thumbnail-size');
        };

        // Extend LayoutManager _updateRegions function to destroy/create workspace thumbnails when completed.
        // NOTE1: needed because 'monitors-changed' signal doesn't wait for queued regions to update.
        // We need to wait so that the screen workspace workarea is adjusted before creating workspace thumbnails.
        // Otherwise when we move the primary workspace to another monitor, the workspace thumbnails won't adjust for the top panel.
        // NOTE2: also needed when dock-fixed is enabled/disabled to adjust for workspace area change
        GSFunctions['LayoutManager_updateRegions'] = Layout.LayoutManager.prototype._updateRegions;
        Layout.LayoutManager.prototype._updateRegions = function() {
            let ret = GSFunctions['LayoutManager_updateRegions'].call(this);
            //this.emit('regions-updated');
            if (self._updateRegion) {
                self._refreshThumbnails();
                self._updateRegion = false;
            }
            return ret;
        };

        // Override geometry calculations of activities overview to use workspaces-to-dock instead of the default thumbnailsbox.
        // NOTE: This is needed for when the dock is positioned on a secondary monitor and also for when the shortcuts panel is visible
        // causing the dock to be wider than normal.
        GSFunctions['WorkspacesDisplay_updateWorkspacesActualGeometry'] = WorkspacesView.WorkspacesDisplay.prototype._updateWorkspacesActualGeometry;
        WorkspacesView.WorkspacesDisplay.prototype._updateWorkspacesActualGeometry = function() {
            if (!this._workspacesViews.length)
                return;

            let [x, y] = this.actor.get_transformed_position();
            let allocation = this.actor.allocation;
            let width = allocation.x2 - allocation.x1;
            let height = allocation.y2 - allocation.y1;

            let spacing = Main.overview._controls.actor.get_theme_node().get_length('spacing');
            let monitors = Main.layoutManager.monitors;
            for (let i = 0; i < monitors.length; i++) {
                let geometry = { x: monitors[i].x, y: monitors[i].y, width: monitors[i].width, height: monitors[i].height };

                // Adjust y and height for primary overview geometry (top panel, etc.)
                if (i == this._primaryIndex) {
                    geometry.y = y;
                    geometry.height = height;
                }

                // Adjust width for dash
                let dashWidth = 0;
                if (DashToDock && DashToDock.dock) {
                    let dashMonitorIndex = DashToDock.dock._settings.get_int('preferred-monitor');
                    if (dashMonitorIndex < 0 || dashMonitorIndex >= Main.layoutManager.monitors.length) {
                        dashMonitorIndex = this._primaryIndex;
                    }
                    if (i == dashMonitorIndex) {
                        if (DashToDockExtension.hasDockPositionKey)  {
                            if (DashToDock.dock._settings.get_enum('dock-position') == St.Side.LEFT ||
                                DashToDock.dock._settings.get_enum('dock-position') == St.Side.RIGHT) {
                                    dashWidth = DashToDock.dock._box.width + spacing;
                            }
                        } else {
                            dashWidth = DashToDock.dock._box.width + spacing;
                        }
                    }
                } else {
                    if (i == this._primaryIndex) {
                        dashWidth = Main.overview._controls._dashSlider.getVisibleWidth() + spacing;
                    }
                }
                geometry.width -= dashWidth;

                // Adjust width for workspaces thumbnails
                let thumbnailsWidth = 0;
                let thumbnailsMonitorIndex = self._settings.get_int('preferred-monitor');
                if (thumbnailsMonitorIndex < 0 || thumbnailsMonitorIndex >= Main.layoutManager.monitors.length) {
                    thumbnailsMonitorIndex = this._primaryIndex;
                }
                if (i == thumbnailsMonitorIndex) {
                    thumbnailsWidth = (self.staticBox.x2 - self.staticBox.x1) + spacing;
                }
                geometry.width -= thumbnailsWidth;

                // Adjust x for relevant dock
                if (this.actor.get_text_direction() == Clutter.TextDirection.LTR) {
                    geometry.x += dashWidth;
                } else {
                    geometry.x += thumbnailsWidth;
                }

                this._workspacesViews[i].setMyActualGeometry(geometry);
            }
        };

        // This override is needed to prevent calls from updateWorkspacesActualGeometry bound to the workspacesDisplay object
        // without destroying and recreating Main.overview.viewSelector._workspacesDisplay.
        // We replace this function with a new setMyActualGeometry function (see below)
        // TODO: This is very hackish. We need to find a better way to accomplish this
        GSFunctions['WorkspacesViewBase_setActualGeometry'] = WorkspacesView.WorkspacesViewBase.prototype.setActualGeometry;
        WorkspacesView.WorkspacesViewBase.prototype.setActualGeometry = function(geom) {
            //GSFunctions['WorkspacesView_setActualGeometry'].call(this, geom);
            return;
        };

        // This additional function replaces the WorkspacesView setActualGeometry function above.
        // TODO: This is very hackish. We need to find a better way to accomplish this
        WorkspacesView.WorkspacesViewBase.prototype.setMyActualGeometry = function(geom) {
            this._actualGeometry = geom;
            this._syncActualGeometry();
        };
    },

    // function called during destroy to restore gnome shell 3.4/3.6/3.8
    _restoreGnomeShellFunctions: function() {
        // Restore normal workspaces to previous zoom setting
        OverviewControls.ThumbnailsSlider.prototype._getAlwaysZoomOut = GSFunctions['ThumbnailsSlider_getAlwaysZoomOut'];

        // Show normal workspaces thumbnailsBox
        Main.overview._controls._thumbnailsSlider.actor.opacity = 255;

        // Restore MAX_THUMBNAIL_SCALE to default value
        WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = GSFunctions['WorkspaceThumbnail_MAX_THUMBNAIL_SCALE'];

        // Restore normal LayoutManager _updateRegions function
        Layout.LayoutManager.prototype._updateRegions = GSFunctions['LayoutManager_updateRegions'];

        // Restore normal WorkspacesDisplay _updateworksapgesActualGeometray function
        WorkspacesView.WorkspacesDisplay.prototype._updateWorkspacesActualGeometry = GSFunctions['WorkspacesDisplay_updateWorkspacesActualGeometry'];

        // Restore normal WorkspacesView _setActualGeometry function
        WorkspacesView.WorkspacesViewBase.prototype.setActualGeometry = GSFunctions['WorkspacesViewBase_setActualGeometry'];
        WorkspacesView.WorkspacesViewBase.prototype.setMyActualGeometry = null;
    },

    // handler for when thumbnailsBox is resized
    _thumbnailsBoxResized: function() {
        this._updateSize();
        this._redisplay();
    },

    // handler for when dock y position is updated
    _updateYPosition: function() {
        this._updateSize();
    },

    // handler for when dock height is updated
    _updateHeight: function() {
        this._updateSize();
    },

    // handler to bind settings when preferences changed
    _bindSettingsChanges: function() {
        this._settings.connect('changed::opaque-background', Lang.bind(this, function() {
            this._updateBackgroundOpacity();
        }));

        this._settings.connect('changed::background-opacity', Lang.bind(this, function() {
            this._updateBackgroundOpacity();
        }));

        this._settings.connect('changed::opaque-background-always', Lang.bind(this, function() {
            this._updateBackgroundOpacity();
        }));

        this._settings.connect('changed::dock-fixed', Lang.bind(this, function() {
            Main.layoutManager.removeChrome(this.actor);
            Main.layoutManager.addChrome(this.actor, {
                affectsStruts: this._settings.get_boolean('dock-fixed'),
                trackFullscreen: true
            });

            // Lower the dock below the screenShieldGroup so that panel and messageTray popups can receive focus & clicks
            if (Main.layoutManager.uiGroup.contains(Main.layoutManager.screenShieldGroup))
                Main.layoutManager.uiGroup.set_child_below_sibling(this.actor, Main.layoutManager.screenShieldGroup);

            // Add or remove barrier depending on if dock-fixed
            this._updateBarrier();

            if (this._settings.get_boolean('dock-fixed')) {
                // show dock immediately when setting changes
                this._autohideStatus = true; // It could be false but the dock could be hidden
                this.disableAutoHide();
            } else {
                this.emit('box-changed');
            }

            // Add or remove addtional style class when workspace is fixed and set to full height
            if (this._settings.get_boolean('dock-fixed') && this._settings.get_boolean('extend-height') && this._settings.get_double('top-margin') == 0) {
                this._thumbnailsBoxBackground.add_style_class_name('workspace-thumbnails-fullheight');
            } else {
                this._thumbnailsBoxBackground.remove_style_class_name('workspace-thumbnails-fullheight');
            }

            // Refresh thumbnails to adjust for workarea size change
            // NOTE1: setting updateRegion=true forces a thumbnails refresh when layoutManager updates
            // regions (see overrideGnomeShellFunctions)
            // NOTE2: We also force thumbnails refresh on animation complete in case dock is hidden when
            // dock-fixed is enabled.
            this._updateRegion = true;
        }));

        this._settings.connect('changed::autohide', Lang.bind(this, function() {
            this.emit('box-changed');
            this._updateBarrier();
        }));

        this._settings.connect('changed::preferred-monitor', Lang.bind(this, function() {
            this._resetPosition();
            this._redisplay();
        }));

        this._settings.connect('changed::show-shortcuts-panel', Lang.bind(this, function() {
            this._updateSize();
            this._redisplay();
        }));

        this._settings.connect('changed::shortcuts-panel-icon-size', Lang.bind(this, function() {
            this._shortcutsPanel.refresh();
            this._updateSize();
            this._redisplay();
        }));

        this._settings.connect('changed::dock-edge-visible', Lang.bind(this, function() {
            if (this._autohideStatus) {
                this._animateIn(this._settings.get_double('animation-time'), 0);
                this._animateOut(this._settings.get_double('animation-time'), 0);
            }
        }));

        this._settings.connect('changed::require-pressure-to-show', Lang.bind(this, this._updateBarrier));
        this._settings.connect('changed::pressure-threshold', Lang.bind(this, function() {
            this._updatePressureBarrier();
            this._updateBarrier();
        }));

        this._settings.connect('changed::customize-thumbnail', Lang.bind(this, function() {
            // Set Gnome Shell's workspace thumbnail size so that overview mode layout doesn't overlap dock
            if (this._settings.get_boolean('customize-thumbnail')) {
                WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = this._settings.get_double('thumbnail-size');
            } else {
                WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = GSFunctions['WorkspaceThumbnail_MAX_THUMBNAIL_SCALE'];
            }
            // hide and show thumbnailsBox to resize thumbnails
            this._refreshThumbnails();
        }));

        this._settings.connect('changed::thumbnail-size', Lang.bind(this, function() {
            // Set Gnome Shell's workspace thumbnail size so that overview mode layout doesn't overlap dock
            if (this._settings.get_boolean('customize-thumbnail')) {
                WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = this._settings.get_double('thumbnail-size');
            } else {
                WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = GSFunctions['WorkspaceThumbnail_MAX_THUMBNAIL_SCALE'];
            }
            // hide and show thumbnailsBox to resize thumbnails
            this._refreshThumbnails();
        }));

        this._settings.connect('changed::workspace-captions', Lang.bind(this, function() {
            // hide and show thumbnailsBox to reset workspace apps in caption
            this._refreshThumbnails();
        }));
        this._settings.connect('changed::workspace-caption-height', Lang.bind(this, function() {
            // hide and show thumbnailsBox to reset workspace apps in caption
            this._refreshThumbnails();
        }));
        this._settings.connect('changed::workspace-caption-items', Lang.bind(this, function() {
            // hide and show thumbnailsBox to reset workspace apps in caption
            this._refreshThumbnails();
        }));
        this._settings.connect('changed::workspace-caption-windowcount-image', Lang.bind(this, function() {
            // hide and show thumbnailsBox to reset workspace apps in caption
            this._refreshThumbnails();
        }));
        this._settings.connect('changed::workspace-caption-taskbar-icon-size', Lang.bind(this, function() {
            // hide and show thumbnailsBox to reset workspace apps in caption
            this._refreshThumbnails();
        }));

        this._settings.connect('changed::extend-height', Lang.bind(this, function() {
            // Add or remove addtional style class when workspace is fixed and set to full height
            if (this._settings.get_boolean('dock-fixed') && this._settings.get_boolean('extend-height') && this._settings.get_double('top-margin') == 0) {
                this._thumbnailsBoxBackground.add_style_class_name('workspace-thumbnails-fullheight');
            } else {
                this._thumbnailsBoxBackground.remove_style_class_name('workspace-thumbnails-fullheight');
            }
            this._updateSize();
            if (this._settings.get_boolean('dock-fixed')) {
                this._updateRegion = true;
            }
        }));
        this._settings.connect('changed::top-margin', Lang.bind(this, function() {
            // Add or remove addtional style class when workspace is fixed and set to full height
            if (this._settings.get_boolean('dock-fixed') && this._settings.get_boolean('extend-height') && this._settings.get_double('top-margin') == 0) {
                this._thumbnailsBoxBackground.add_style_class_name('workspace-thumbnails-fullheight');
            } else {
                this._thumbnailsBoxBackground.remove_style_class_name('workspace-thumbnails-fullheight');
            }
            this._updateSize();
            if (this._settings.get_boolean('dock-fixed')) {
                this._updateRegion = true;
            }
        }));
        this._settings.connect('changed::bottom-margin', Lang.bind(this, function() {
            // Add or remove addtional style class when workspace is fixed and set to full height
            if (this._settings.get_boolean('dock-fixed') && this._settings.get_boolean('extend-height') && this._settings.get_double('top-margin') == 0) {
                this._thumbnailsBoxBackground.add_style_class_name('workspace-thumbnails-fullheight');
            } else {
                this._thumbnailsBoxBackground.remove_style_class_name('workspace-thumbnails-fullheight');
            }
            this._updateSize();
            if (this._settings.get_boolean('dock-fixed')) {
                this._updateRegion = true;
            }
        }));

        this._settings.connect('changed::toggle-dock-with-keyboard-shortcut', Lang.bind(this, function(){
            if (this._settings.get_boolean('toggle-dock-with-keyboard-shortcut'))
                this._bindDockKeyboardShortcut();
            else
                this._unbindDockKeyboardShortcut();
        }));
    },

    _updatePressureBarrier: function() {
        let self = this;
        this._canUsePressure = global.display.supports_extended_barriers();
        let pressureThreshold = this._settings.get_double('pressure-threshold');

        // Remove existing pressure barrier
        if (this._pressureBarrier) {
            this._pressureBarrier.destroy();
            this._pressureBarrier = null;
        }

        // Create new pressure barrier based on pressure threshold setting
        if (this._canUsePressure) {
            this._pressureBarrier = new Layout.PressureBarrier(pressureThreshold, PRESSURE_TIMEOUT,
                                Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.OVERVIEW);
            this._pressureBarrier.connect('trigger', function(barrier){
                self._onPressureSensed();
            });
        }
    },

    _bindDockKeyboardShortcut: function() {
        Main.wm.addKeybinding('dock-keyboard-shortcut', this._settings, Meta.KeyBindingFlags.NONE, Shell.KeyBindingMode.NORMAL,
            Lang.bind(this, function() {
                if (this._autohideStatus && (this._animStatus.hidden() || this._animStatus.hiding())) {
                    this._show();
                } else {
                    this._hide();
                }
            })
        );
    },

    _unbindDockKeyboardShortcut: function() {
        Main.wm.removeKeybinding('dock-keyboard-shortcut');
    },

    // handler for mouse hover events
    _hoverChanged: function() {
        if (this._canUsePressure && this._settings.get_boolean('require-pressure-to-show') && this._barrier) {
            if (this._pressureSensed == false) {
                return;
            }
        }

        if (this._settings.get_boolean('require-click-to-show')) {
            // check if metaWin is maximized
            let activeWorkspace = global.screen.get_active_workspace();
            let maximized = false;
            let windows = global.get_window_actors();
            for (let i = windows.length-1; i >= 0; i--) {
                let metaWin = windows[i].get_meta_window();
                if (metaWin.get_workspace() == activeWorkspace) {
                    if (metaWin.appears_focused && metaWin.maximized_horizontally) {
                        maximized = true;
                        break;
                    }
                }
            }
            // set hovering flag if maximized
            // used by the _onDockClicked function (hover+click)
            if (maximized) {
                if (this.actor.hover) {
                    this._hovering = true;
                    return;
                } else {
                    this._hovering = false;
                }
            } else {
                this._hovering = false;
            }
        }

        //Skip if dock is not in autohide mode for instance because it is shown by intellihide
        if (this._settings.get_boolean('autohide') && this._autohideStatus) {
            if (this.actor.hover) {
                this._show();
            } else {
                this._hide();
            }
        }
    },

    // handler for mouse click events - works in conjuction with hover event to show dock for maxmized windows
    _onDockClicked: function() {
        if (this._settings.get_boolean('require-click-to-show')) {
            if (this._hovering) {
                //Skip if dock is not in autohide mode for instance because it is shown by intellihide
                if (this._settings.get_boolean('autohide') && this._autohideStatus) {
                    if (this.actor.hover) {
                        this._show();
                    } else {
                        this._hide();
                    }
                }
                this._hovering = false;
            }
        }
    },

    // handler for mouse pressure sensed (GS38+ only)
    _onPressureSensed: function() {
        this._pressureSensed = true;
        this._hoverChanged();
    },

    _onDashToDockShowing: function() {
        //Skip if dock is not in dashtodock hover mode
        if (this._settings.get_boolean('dashtodock-hover') && DashToDock && DashToDock.dock) {
            if (Main.overview.visible == false) {
                if (DashToDock.dock._box.hover) {
                    this._hoveringDash = true;
                    this._show();
                }
            }
        }
    },

    _onDashToDockHiding: function() {
        //Skip if dock is not in dashtodock hover mode
        if (this._settings.get_boolean('dashtodock-hover') && DashToDock && DashToDock.dock) {
            this._hoveringDash = false;
            this._hide();
        }
    },

    _onDashToDockLeave: function() {
        // NOTE: Causing workspaces-to-dock to hide when switching workspaces in Gnome 3.14.
        // Remove until a workaround can be found.
        // this._hoveringDash = false;
    },

    // handler for DashToDock hover events
    _onDashToDockHoverChanged: function() {
        //Skip if dock is not in dashtodock hover mode
        if (this._settings.get_boolean('dashtodock-hover') && DashToDock && DashToDock.dock && DashToDock.dock._animStatus.shown()) {
            if (DashToDock.dock._box.hover) {
                if (Main.overview.visible == false) {
                    this._hoveringDash = true;
                    this._show();
                }
            } else {
                this._hoveringDash = false;
                this._hide();
            }
        }
    },

    // handler for extensionSystem state changes
    _onExtensionSystemStateChanged: function(source, extension) {
        // Only looking for DashToDock state changes
        if (extension.uuid == DashToDock_UUID) {
            DashToDockExtension = extension;
            if (DashToDockExtension.state == ExtensionSystem.ExtensionState.ENABLED) {
                DashToDock = DashToDockExtension.imports.extension;
                if (DashToDock && DashToDock.dock) {
                    var keys = DashToDock.dock._settings.list_keys();
                    if (keys.indexOf('dock-position') > -1) {
                        DashToDockExtension.hasDockPositionKey = true;
                    }
                    // Connect DashToDock hover signal
                    this._signalHandler.pushWithLabel(
                        'DashToDockHoverSignal',
                        [
                            DashToDock.dock._box,
                            'notify::hover',
                            Lang.bind(this, this._onDashToDockHoverChanged)
                        ],
                        [
                            DashToDock.dock._box,
                            'leave-event',
                            Lang.bind(this, this._onDashToDockLeave)
                        ],
                        [
                            DashToDock.dock,
                            'showing',
                            Lang.bind(this, this._onDashToDockShowing)
                        ],
                        [
                            DashToDock.dock,
                            'hiding',
                            Lang.bind(this, this._onDashToDockHiding)
                        ]
                    );
                }
            } else if (extension.state == ExtensionSystem.ExtensionState.DISABLED || extension.state == ExtensionSystem.ExtensionState.UNINSTALLED) {
                DashToDock = null;
                this._signalHandler.disconnectWithLabel('DashToDockHoverSignal');
                this._hoveringDash = false;
            }
        }
    },

    // handler for mouse scroll events
    // Switches workspace by scrolling over the dock
    // This comes from desktop-scroller@obsidien.github.com
    _onScrollEvent: function (actor, event) {
        if (this._settings.get_boolean('disable-scroll') && this._autohideStatus && (this._animStatus.hidden() || this._animStatus.hiding()))
            return Clutter.EVENT_STOP;

        let activeWs = global.screen.get_active_workspace();
        let direction;
        switch (event.get_scroll_direction()) {
        case Clutter.ScrollDirection.UP:
            direction = Meta.MotionDirection.UP;
            break;
        case Clutter.ScrollDirection.DOWN:
            direction = Meta.MotionDirection.DOWN;
            break;
        }

        if (direction) {
            let ws = activeWs.get_neighbor(direction);

            if (Main.wm._workspaceSwitcherPopup == null)
                Main.wm._workspaceSwitcherPopup = new WorkspaceSwitcherPopup.WorkspaceSwitcherPopup();

            // Set the workspaceSwitcherPopup actor to non reactive,
            // to prevent it from grabbing focus away from the dock
            Main.wm._workspaceSwitcherPopup.actor.reactive = false;
            Main.wm._workspaceSwitcherPopup.connect('destroy', function() {
                Main.wm._workspaceSwitcherPopup = null;
            });

            // Do not show wokspaceSwitcher in overview
            if (!Main.overview.visible)
                Main.wm._workspaceSwitcherPopup.display(direction, ws.index());

            Main.wm.actionMoveWorkspace(ws);
        }

        return Clutter.EVENT_STOP;
    },

    // autohide function to show dock
    _show: function() {
        let anim = this._animStatus;

        if (this._autohideStatus && (anim.hidden() || anim.hiding())) {
            let delay;
            // If the dock is hidden, wait this._settings.get_double('show-delay') before showing it;
            // otherwise show it immediately.
            if (anim.hidden()) {
                delay = this._settings.get_double('show-delay');
            } else if (anim.hiding()) {
                // suppress all potential queued hiding animations (always give priority to show)
                this._removeAnimations();
                delay = 0;
            }

            this._animateIn(this._settings.get_double('animation-time'), delay);
        }
    },

    // autohide function to hide dock
    _hide: function() {
        let anim = this._animStatus;

        // If no hiding animation is running or queued
        if (!this._hoveringDash && this._autohideStatus && (anim.showing() || anim.shown())) {
            let delay;

            // If a show is queued but still not started (i.e the mouse was
            // over the screen  border but then went away, i.e not a sufficient
            // amount of time is passeed to trigger the dock showing) remove it.
            if (anim.showing()) {
                if (anim.running) {
                    // If a show already started, let it finish; queue hide without removing the show.
                    // to obtain this I increase the delay to avoid the overlap and interference
                    // between the animations
                    delay = this._settings.get_double('hide-delay') + 2 * this._settings.get_double('animation-time') + this._settings.get_double('show-delay');
                } else {
                    this._removeAnimations();
                    delay = 0;
                }
            } else if (anim.shown()) {
                delay = this._settings.get_double('hide-delay');
            }

            this._animateOut(this._settings.get_double('animation-time'), delay);
        }
    },

    setPopupMenuFlag: function(showing) {
        this._popupMenuShowing = showing;
        if (!showing) {
            if (this.actor.hover == true) {
                this.actor.sync_hover();
            } else {
                this._hide();
            }
        }
    },

    // autohide function to animate the show dock process
    _animateIn: function(time, delay) {
        // Set final_position
        let final_position;
        if (this._rtl) {
            final_position = this._monitor.x + this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING;
        } else {
            final_position = this._monitor.x + this._monitor.width - this._thumbnailsBox.actor.width - this._shortcutsPanelWidth - DOCK_PADDING;
        }

        if (final_position !== this.actor.x) {
            this._animStatus.queue(true);
            Tweener.addTween(this.actor, {
                x: final_position,
                time: time,
                delay: delay,
                transition: 'easeOutQuad',
                onUpdate: Lang.bind(this, this._updateClip),
                onStart: Lang.bind(this, function() {
                    this._animStatus.start();
                    this._unsetHiddenWidth();
                }),
                onOverwrite: Lang.bind(this, function() {
                    this._animStatus.clear();
                }),
                onComplete: Lang.bind(this, function() {
                    this._animStatus.end();
                    if (this._removeBarrierTimeoutId > 0) {
                        Mainloop.source_remove(this._removeBarrierTimeoutId);
                    }
                    // Remove barrier so that mouse pointer is released and can access monitors on other side of dock
                    // NOTE: Delay needed to keep mouse from moving past dock and re-hiding dock immediately. This
                    // gives users an opportunity to hover over the dock
                    this._removeBarrierTimeoutId = Mainloop.timeout_add(100, Lang.bind(this, this._removeBarrier));

                    // Force thumbnails refresh on animation complete in case dock hidden when dock-fixed enabled.
                    if (this._settings.get_boolean('dock-fixed')) {
                        this._updateRegion = true;
                    }
                })
            });
        } else {
            // Still need to trigger animStatus states so that show/hide dock functions work properly
            this._animStatus.queue(true);
            this._animStatus.end();
        }
    },

    // autohide function to animate the hide dock process
    _animateOut: function(time, delay) {
        if (this._popupMenuShowing)
            return;

        // Set final_position
        let final_position;
        if (this._rtl) {
            if (this._settings.get_boolean('dock-edge-visible')) {
                final_position = this._monitor.x + DOCK_PADDING + DOCK_EDGE_VISIBLE_WIDTH;
            } else {
                final_position = this._monitor.x + DOCK_PADDING;
            }
        } else {
            if (this._settings.get_boolean('dock-edge-visible')) {
                final_position = this._monitor.x + this._monitor.width - DOCK_PADDING - DOCK_EDGE_VISIBLE_WIDTH;
            } else {
                final_position = this._monitor.x + this._monitor.width - DOCK_PADDING;
            }
        }

        if (final_position !== this.actor.x) {
            this._animStatus.queue(false);
            Tweener.addTween(this.actor, {
                x: final_position,
                time: time,
                delay: delay,
                transition: 'easeOutQuad',
                onUpdate: Lang.bind(this, this._updateClip),
                onStart: Lang.bind(this, function() {
                    this._animStatus.start();
                }),
                onOverwrite: Lang.bind(this, function() {
                    this._animStatus.clear();
                }),
                onComplete: Lang.bind(this, function() {
                    this._animStatus.end();
                    this._setHiddenWidth();
                    this._updateBarrier();
                })
            });
        } else {
            // Still need to trigger animStatus states so that show/hide dock functions work properly
            this._animStatus.queue(false);
            this._animStatus.end();
            this._setHiddenWidth();
        }
    },

    // autohide function to remove show-hide animations
    _removeAnimations: function() {
        Tweener.removeTweens(this.actor);
        this._animStatus.clearAll();
    },

    // autohide function to fade out opaque background
    _fadeOutBackground: function(time, delay) {
        // CSS time is in ms
        this._thumbnailsBoxBackground.set_style('transition-duration:' + time*1000 + ';' +
            'transition-delay:' + delay*1000 + ';' +
            'background-color:' + this._defaultBackground);

        this._shortcutsPanel.actor.set_style('transition-duration:' + time*1000 + ';' +
            'transition-delay:' + delay*1000 + ';' +
            'background-color:' + this._defaultBackground);
    },

    // autohide function to fade in opaque background
    _fadeInBackground: function(time, delay) {
        // CSS time is in ms
        this._thumbnailsBoxBackground.set_style('transition-duration:' + time*1000 + ';' +
            'transition-delay:' + delay*1000 + ';' +
            'background-color:' + this._customBackground);

        this._shortcutsPanel.actor.set_style('transition-duration:' + time*1000 + ';' +
            'transition-delay:' + delay*1000 + ';' +
            'background-color:' + this._customBackground);
    },

    // This function handles hiding the dock when dock is in stationary-fixed
    // position but overlapped by gnome panel menus or meta popup windows
    fadeOutDock: function(time, delay, metaOverlap) {
        if (Main.layoutManager._inOverview) {
            // Hide fixed dock when in overviewmode applications view
            this.actor.opacity = 0;
        }

        // Make thumbnail windowclones non-reactive
        // NOTE: Need this for when in overviewmode applications view and dock is in fixed mode.
        // Fixed dock has opacity set to 0 but is still reactive.
        this.actor.reactive = false;
        this._thumbnailsBox.actor.reactive = false;
        for (let i = 0; i < this._thumbnailsBox._thumbnails.length; i++) {
            let thumbnail = this._thumbnailsBox._thumbnails[i];
            thumbnail.setWindowClonesReactiveState(false);
        }
    },

    // This function handles showing the dock when dock is stationary-fixed
    // position but overlapped by gnome panel menus or meta popup windows
    fadeInDock: function(time, delay) {
        this.actor.opacity = 255;

        // Return thumbnail windowclones to reactive state
        this.actor.reactive = true;
        this._thumbnailsBox.actor.reactive = true;
        for (let i = 0; i < this._thumbnailsBox._thumbnails.length; i++) {
            let thumbnail = this._thumbnailsBox._thumbnails[i];
            thumbnail.setWindowClonesReactiveState(true);
        }
    },

    // retrieve default background color
    _getBackgroundColor: function() {
        // Remove custom style
        let oldStyle = this._thumbnailsBoxBackground.get_style();
        this._thumbnailsBoxBackground.set_style(null);

        // Prevent shell crash if the actor is not on the stage
        // It happens enabling/disabling repeatedly the extension
        if (!this._thumbnailsBoxBackground.get_stage())
            return null;

        let themeNode = this._thumbnailsBoxBackground.get_theme_node();
        this._thumbnailsBoxBackground.set_style(oldStyle);

        let backgroundColor = themeNode.get_background_color();
        return backgroundColor;
    },

    // update background opacity based on preferences
    _updateBackgroundOpacity: function() {
        let backgroundColor = this._getBackgroundColor();

        if (backgroundColor) {
            let newAlpha = this._settings.get_double('background-opacity');
            this._defaultBackground = "rgba(" + backgroundColor.red + "," + backgroundColor.green + "," + backgroundColor.blue + "," + Math.round(backgroundColor.alpha/2.55)/100 + ")";
            this._customBackground = "rgba(" + backgroundColor.red + "," + backgroundColor.green + "," + backgroundColor.blue + "," + newAlpha + ")";

            if (this._settings.get_boolean('opaque-background') && (this._autohideStatus || this._settings.get_boolean('opaque-background-always'))) {
                this._fadeInBackground(this._settings.get_double('animation-time'), 0);
            } else if (!this._settings.get_boolean('opaque-background') || (!this._autohideStatus && !this._settings.get_boolean('opaque-background-always'))) {
                this._fadeOutBackground(this._settings.get_double('animation-time'), 0);
            }
        }
    },

    // handler for theme changes
    _onThemeChanged: function() {
        this._changeStylesheet();
        if (!this._disableRedisplay)
            this._updateBackgroundOpacity();
    },

    // function to change stylesheets
    _changeStylesheet: function() {
        // Get css filename
        let filename = "workspaces-to-dock.css";

        // Get new theme stylesheet
        let themeStylesheet = Main._defaultCssStylesheet;
        if (Main._cssStylesheet != null)
            themeStylesheet = Main._cssStylesheet;

        // Get theme directory
        let themeDirectory = GLib.path_get_dirname(themeStylesheet);

        // Test for workspacesToDock stylesheet
        let newStylesheet = themeDirectory + '/extensions/workspaces-to-dock/' + filename;
        if (!GLib.file_test(newStylesheet, GLib.FileTest.EXISTS)) {
            let defaultStylesheet = Gio.File.new_for_path(Me.path + "/themes/default/" + filename);
            if (defaultStylesheet.query_exists(null)) {
                newStylesheet = defaultStylesheet.get_path();
            } else {
                throw new Error(_("No Workspaces-To-Dock stylesheet found") + " (extension.js).");
            }
        }

        if (Extension.workspacesToDockStylesheet && Extension.workspacesToDockStylesheet == newStylesheet) {
            return false;
        }

        // Change workspacesToDock stylesheet by updating theme
        let themeContext = St.ThemeContext.get_for_stage(global.stage);
        if (!themeContext)
            return false;

        let theme = themeContext.get_theme();
        if (!theme)
            return false;

        let customStylesheets = theme.get_custom_stylesheets();
        if (!customStylesheets)
            return false;

        let previousStylesheet = Extension.workspacesToDockStylesheet;
        Extension.workspacesToDockStylesheet = newStylesheet;

        let newTheme = new St.Theme ({ application_stylesheet: themeStylesheet });
        for (let i = 0; i < customStylesheets.length; i++) {
            if (customStylesheets[i] != previousStylesheet) {
                newTheme.load_stylesheet(customStylesheets[i]);
            }
        }

        newTheme.load_stylesheet(Extension.workspacesToDockStylesheet);

        themeContext.set_theme (newTheme);

        if (!this._disableRedisplay) {
            this._refreshThumbnails();
        }

        return true;
    },

    // handler for icon changes
    _onIconsChanged: function() {
        if (this._disableRedisplay)
            return

        this._refreshThumbnails();
    },

    // resdiplay dock called if size-position changed due to dock resizing
    _redisplay: function() {
        if (this._disableRedisplay)
            return


        // Initial display of dock .. sets autohideStatus
        if (this._autohideStatus == null) {
            if (this._settings.get_boolean('dock-fixed')) {
                this._autohideStatus = false;
                this.fadeInDock(this._settings.get_double('animation-time'), 0);
            } else {
                // Initial animation is out .. intellihide will animate in if its needed
                this._removeAnimations();
                this._animateOut(0, 0);
                this._autohideStatus = true;
            }
        } else {
            // Redisplay dock by animating back in .. necessary if thumbnailsBox size changed
            // even if dock is fixed
            if (this._autohideStatus == false) {
                // had to comment out because GS3.4 fixed-dock isn't fully faded in yet when redisplay occurs again
                //this._removeAnimations();
                this._animateIn(this._settings.get_double('animation-time'), 0);
                this._autohideStatus = false;
            }
        }

        this._updateBackgroundOpacity();
        this._updateClip();
        this._updateBarrier();
    },

    // set dock width in vinsible/hidden states (called when animateOut completes)
    // this fixes long-standing issue of dead zone preventing mouse clicks on secondary monitor to the right
    _setHiddenWidth: function() {
        let width;
        if (this._settings.get_boolean('dock-edge-visible')) {
            width = DOCK_PADDING + DOCK_EDGE_VISIBLE_WIDTH + DOCK_HIDDEN_WIDTH;
        } else {
            width = DOCK_PADDING + DOCK_HIDDEN_WIDTH;
        }
        this.actor.set_size(width, this.actor.height);

        // New clip coordinates
        let x1, x2;
        if (this._rtl) {
            x1 = width;
            x2 = 0;
        } else {
            x1 = 0;
            x2 = width;
        }
        let y1= 0;
        let y2 = this._monitor.y + this._monitor.height;
        // SANITY CHECK: ------------------

        // Apply the clip
        this.actor.set_clip(x1, y1, x2 - x1, y2);
    },

    // unset dock width (called before animateIn starts)
    _unsetHiddenWidth: function() {
        let width = this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING;
        this.actor.set_size(width, this.actor.height);

        // New clip coordinates
        let x1, x2;
        if (this._rtl) {
            x1 = width;
            x2 = this._monitor.x + this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING - this.actor.x;
        } else {
            x1 = 0;
            x2 = this._monitor.x + this._monitor.width - this.actor.x;
        }
        let y1= 0;
        let y2 = this._monitor.y + this._monitor.height;
        // SANITY CHECK: ------------------

        // Apply the clip
        this.actor.set_clip(x1, y1, x2 - x1, y2);
    },

    // update the dock size
    _updateSize: function() {
        this._shortcutsPanelWidth = this._settings.get_boolean('show-shortcuts-panel') ? this._shortcutsPanel.actor.width : 0;

        // check if the dock is on the primary monitor
        let primary = false;
        if (this._monitor.x == Main.layoutManager.primaryMonitor.x && this._monitor.y == Main.layoutManager.primaryMonitor.y)
            primary = true;

        // x position needed because updating size resets position of staticBox (see code below)
        let onScreenX;
        if (this._rtl) {
            onScreenX = this._monitor.x;
        } else {
            onScreenX = this._monitor.x + this._monitor.width - this._thumbnailsBox.actor.width - this._shortcutsPanelWidth - DOCK_PADDING;
        }

        // Update height
        let y, height;
        if (this._settings.get_boolean('extend-height')) {
            let topMargin = Math.floor(this._settings.get_double('top-margin') * this._monitor.height);
            let bottomMargin = Math.floor(this._settings.get_double('bottom-margin') * this._monitor.height);
            if (primary) {
                y = this._monitor.y + Main.panel.actor.height + topMargin;
                height = this._monitor.height - Main.panel.actor.height - topMargin - bottomMargin;
            } else {
                y = this._monitor.y + topMargin;
                height = this._monitor.height - topMargin - bottomMargin;
            }
        } else {
            y = this._monitor.y + Main.panel.actor.height + Main.overview._searchEntryBin.y + Main.overview._searchEntryBin.height;
            height = this._monitor.height - (Main.overview._searchEntryBin.y + Main.overview._searchEntryBin.height + Main.messageTray.actor.height);
        }
        this.yPosition = y;

        //// skip updating if size is same
        //if ((this.actor.y == y) && (this.actor.width == this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING) && (this.actor.height == height)) {
            //return;
        //}

        // Updating size also resets the position of the staticBox (used to detect window overlaps)
        this.staticBox.init_rect(onScreenX, y, this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING, height);

        // Updating size shouldn't reset the x position of the dock unless in fixed-position
        // especially if it's in the hidden slid out position
        if (this._settings.get_boolean('dock-fixed')) {
            this.actor.set_position(onScreenX, y);
        } else {
            this.actor.y = y;
        }

        let width;
        if (this._animStatus.hidden()) {
            if (this._settings.get_boolean('dock-edge-visible')) {
                width = DOCK_PADDING + DOCK_EDGE_VISIBLE_WIDTH + DOCK_HIDDEN_WIDTH;
            } else {
                width = DOCK_PADDING + DOCK_HIDDEN_WIDTH;
            }
        } else {
            width = this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING;
        }
        this.actor.set_size(width, height);

        // Set anchor points
        let anchorPoint, boxPosition;
        if (this._rtl) {
            anchorPoint = Clutter.Gravity.NORTH_EAST;
            boxPosition = this.actor.width - DOCK_PADDING;
        } else {
            anchorPoint = Clutter.Gravity.NORTH_WEST;
            boxPosition = DOCK_PADDING;
        }
        this.actor.move_anchor_point_from_gravity(anchorPoint);
        this._thumbnailsBox.actor.height = height;
    },

    // 'Hard' reset dock positon: called on start and when monitor changes
    _resetPosition: function() {
        this._monitor = this._getMonitor();

        this._updateSize();

        let onScreenX, offScreenX, anchorPoint, boxPosition;
        if (this._rtl) {
            anchorPoint = Clutter.Gravity.NORTH_EAST;
            boxPosition = this.actor.width - DOCK_PADDING;
            onScreenX = this._monitor.x;
            if (this._settings.get_boolean('dock-edge-visible')) {
                offScreenX = this._monitor.x - this._thumbnailsBox.actor.width - this._shortcutsPanelWidth + DOCK_EDGE_VISIBLE_WIDTH + DOCK_PADDING;
            } else {
                offScreenX = this._monitor.x - this._thumbnailsBox.actor.width - this._shortcutsPanelWidth + DOCK_PADDING;
                    }
        } else {
            anchorPoint = Clutter.Gravity.NORTH_WEST;
            boxPosition = DOCK_PADDING;
            onScreenX = this._monitor.x + this._monitor.width - this._thumbnailsBox.actor.width - this._shortcutsPanelWidth - DOCK_PADDING;
            if (this._settings.get_boolean('dock-edge-visible')) {
                offScreenX = this._monitor.x + this._monitor.width - DOCK_PADDING - DOCK_EDGE_VISIBLE_WIDTH;
            } else {
                offScreenX = this._monitor.x + this._monitor.width - DOCK_PADDING;
            }
        }

        this.actor.move_anchor_point_from_gravity(anchorPoint);

        if (this._settings.get_boolean('dock-fixed')) {
            //position on the screen so that its initial show is not animated
            this.actor.set_position(onScreenX, this.actor.y);
        } else {
            //position off the screen so that its initial show is animated
            this.actor.set_position(offScreenX, this.actor.y);
        }

        this._updateBackgroundOpacity();
        this._updateClip();
        this._updateBarrier();
    },

    _onMonitorsChanged: function() {
        this._resetPosition();
        this._redisplay();
        this._updateRegion = true;
    },

    _refreshThumbnails: function() {
        this._thumbnailsBox._destroyThumbnails();
        this._thumbnailsBox._createThumbnails();
    },

    // Retrieve the preferred monitor
    _getMonitor: function() {
        let monitorIndex = this._settings.get_int('preferred-monitor');
        let monitor;

        if (monitorIndex > 0 && monitorIndex < Main.layoutManager.monitors.length) {
            monitor = Main.layoutManager.monitors[monitorIndex];
        } else {
            monitor = Main.layoutManager.primaryMonitor;
        }

        return monitor;
    },

    // Remove pressure barrier (GS38+ only)
    _removeBarrier: function() {
        if (this._barrier) {
            if (this._pressureBarrier) {
                this._pressureBarrier.removeBarrier(this._barrier);
            }
            this._barrier.destroy();
            this._barrier = null;
        }
        this._removeBarrierTimeoutId = 0;
        return false;
    },

    _onMessageTrayShowing: function() {
        if ((this._settings.get_boolean('ignore-message-tray') && !this._autohideStatus) || this._settings.get_boolean('dock-fixed')) {
            // Temporary move the dock below the top panel so that it slide below it.
            //this.actor.lower(Main.layoutManager.panelBox);

            // Remove other tweens that could mess with the state machine
            Tweener.removeTweens(this.actor);
            Tweener.addTween(this.actor, {
                  y: this.yPosition - Main.messageTray.actor.height,
                  time: MessageTray.ANIMATION_TIME,
                  transition: 'easeOutQuad'
                });
        }

        this._messageTrayShowing = true;
        this._updateBarrier();
    },

    _onMessageTrayHiding: function() {
        if ((this._settings.get_boolean('ignore-message-tray') && !this._autohideStatus) || this._settings.get_boolean('dock-fixed')) {
            // Remove other tweens that could mess with the state machine
            Tweener.removeTweens(this.actor);
            Tweener.addTween(this.actor, {
                  y: this.yPosition,
                  time: MessageTray.ANIMATION_TIME,
                  transition: 'easeOutQuad',
                  onComplete: Lang.bind(this, function(){
                      // Reset desired dock stack order (on top to accept dnd of app icons)
                      //this.actor.raise(global.top_window_group);
                    })
                });
        }

        this._messageTrayShowing = false;
        this._updateBarrier();
    },

    // Update pressure barrier size (GS38+ only)
    _updateBarrier: function() {
        // Remove existing barrier
        this._removeBarrier();

        // Manually reset pressure barrier
        // This is necessary because we remove the pressure barrier when it is triggered to show the dock
        if (this._pressureBarrier) {
            this._pressureBarrier._reset();
            this._pressureBarrier._isTriggered = false;
        }

        // Create new barrier
        // Note: dock in fixed possition doesn't use pressure barrier
        if (this.actor.visible && this._canUsePressure && this._settings.get_boolean('autohide')
                    && this._autohideStatus && this._settings.get_boolean('require-pressure-to-show')
                    && !this._settings.get_boolean('dock-fixed') && !this._messageTrayShowing) {
            let x, direction;
            if (this._rtl) {
                x = this._monitor.x;
                direction = Meta.BarrierDirection.POSITIVE_X;
            } else {
                x = this._monitor.x + this._monitor.width;
                direction = Meta.BarrierDirection.NEGATIVE_X;
            }
            this._barrier = new Meta.Barrier({display: global.display,
                                x1: x, x2: x,
                                y1: this.actor.y, y2: (this.actor.y + this.actor.height),
                                directions: direction});

            if (this._pressureBarrier) {
                this._pressureBarrier.addBarrier(this._barrier);
            }
        }

        // Reset pressureSensed flag
        this._pressureSensed = false;
    },

    // Utility function to make the dock clipped to the primary monitor
    // clip dock to its original allocation along x and to the current monitor along y
    // the current monitor; inspired by dock@gnome-shell-extensions.gcampax.github.com
    _updateClip: function() {
        // Implicitly assume that the stage and actor's parent share the same coordinate space
        // Translate back into actor's coordinate space
        // While the actor moves, the clip has to move in the opposite direction
        // to mantain its position in respect to the screen.
        let x1, x2;
        if (this._rtl) {
            x1 = this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING;
            x2 = this._monitor.x + this._thumbnailsBox.actor.width + this._shortcutsPanelWidth + DOCK_PADDING - this.actor.x;
        } else {
            x1 = 0;
            x2 = this._monitor.x + this._monitor.width - this.actor.x;
        }
        let y1 = 0;
        let y2 = this._monitor.y + this._monitor.height;
        // SANITY CHECK: ------------------

        // Apply the clip
        this.actor.set_clip(x1, y1, x2 - x1, y2);
    },

    // Disable autohide effect, thus show workspaces
    disableAutoHide: function() {
        if (this._autohideStatus == true) {
            this._autohideStatus = false;

            this._removeAnimations();
            this._animateIn(this._settings.get_double('animation-time'), 0);

            if (this._settings.get_boolean('opaque-background') && !this._settings.get_boolean('opaque-background-always'))
                this._fadeOutBackground(this._settings.get_double('animation-time'), 0);

        }
    },

    // Enable autohide effect, hide workspaces
    enableAutoHide: function() {

        this._autohideStatus = true;

        let delay = 0; // immediately fadein background if hide is blocked by mouseover, otherwise start fadein when dock is already hidden.
        this._removeAnimations();

        if (this.actor.hover == true) {
            this.actor.sync_hover();
        }

        if (!((this._hoveringDash && !Main.overview.visible) || this.actor.hover) || !this._settings.get_boolean('autohide')) {
            this._animateOut(this._settings.get_double('animation-time'), 0);
            delay = this._settings.get_double('animation-time');
        } else {
            delay = 0;
        }

        if (this._settings.get_boolean('opaque-background') && !this._settings.get_boolean('opaque-background-always')) {
            this._fadeInBackground(this._settings.get_double('animation-time'), delay);
        }
    }

});
Signals.addSignalMethods(DockedWorkspaces.prototype);

/*
 * Store animation status in a perhaps overcomplicated way.
 * status is true for visible, false for hidden
 */
const AnimationStatus = new Lang.Class({
    Name: 'workspacesToDock.animationStatus',

    _init: function(initialStatus) {
        this.status = initialStatus;
        this.nextStatus = [];
        this.queued = false;
        this.running = false;
    },

    queue: function(nextStatus) {
        this.nextStatus.push(nextStatus);
        this.queued = true;
    },

    start: function() {
        if (this.nextStatus.length == 1) {
            this.queued = false;
        }
        this.running = true;
    },

    end: function() {
        if (this.nextStatus.length == 1) {
            this.queued = false; // in the case end is called and start was not
        }
        this.running = false;
        this.status = this.nextStatus.shift();
    },

    clear: function() {
        if (this.nextStatus.length == 1) {
            this.queued = false;
            this.running = false;
        }

        this.nextStatus.splice(0, 1);
    },

    clearAll: function() {
        this.queued = false;
        this.running = false;
        this.nextStatus.splice(0, this.nextStatus.length);
    },

    // Return true if a showing animation is running or queued
    showing: function() {
        if ((this.running == true || this.queued == true) && this.nextStatus[0] == true)
            return true;
        else
            return false;
    },

    shown: function() {
        if (this.status == true && !(this.queued || this.running))
            return true;
        else
            return false;
    },

    // Return true if an hiding animation is running or queued
    hiding: function() {
        if ((this.running == true || this.queued == true) && this.nextStatus[0] == false)
            return true;
        else
            return false;
    },

    hidden: function() {
        if (this.status == false && !(this.queued || this.running))
            return true;
        else
            return false;
    }
});
