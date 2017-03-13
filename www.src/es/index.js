/*****************************************************************************
 *
 * Logology V{{{VERSION}}}
 * Author: {{{AUTHOR.NAME}}} <{{{AUTHOR.EMAIL}}}> <{{{AUTHOR.SITE}}}>
 *
 * Author: Kerri Shotts <kerrishotts@gmail.com>
 *         http://www.photokandy.com/books/mastering-phonegap
 *
 * MIT LICENSED
 *
 * Copyright (c) 2016 Packt Publishing
 * Portions Copyright (c) 2016 Kerri Shotts (photoKandy Studios LLC)
 * Portions Copyright various third parties where noted.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
 * OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 *****************************************************************************/

/*globals MobileAccessibility, setImmediate*/

// we need to use the Fetch API (replaces XHR), but not available in all
// instances, so we use a polyfill
require("whatwg-fetch-local");

// inject SVG assets
let SVGInjector = require("svg-injector");

// Need ES6 polyfill as well
//require("core-js");
require("babel-polyfill");

import once from "once";
import Emitter from "yasmf-emitter";
import h from "yasmf-h";
import GCS from "./lib/grandCentralStation";
import L from "./app/localization/localization";
import {createSoftKeyboard} from "./lib/SoftKeyboard";
import {createTheme} from "./lib/Theme";
import {createThemeManager} from "./lib/ThemeManager";
import {createNavigationViewController} from "./lib/NavigationViewController";
import {createSplitViewController} from "./lib/SplitViewController";
import {createViewController} from "./lib/ViewController";
import {createDictionaries} from "./app/models/Dictionaries";
import {createSearchViewController} from "./app/controllers/SearchViewController";
import {createMenuViewController} from "./app/controllers/MenuViewController";
import {createAboutViewController} from "./app/controllers/AboutViewController";
import {createSettingsViewController} from "./app/controllers/SettingsViewController";
import {createDefinitionViewController} from "./app/controllers/DefinitionViewController";
import {createNotesViewController} from "./app/controllers/NotesViewController";
import {createDefinitions} from "./app/models/Definitions";
import {createNote} from "./app/models/Note";
import {getFavorites} from "./app/models/Favorites";
import {getNotes} from "./app/models/Notes";
import {getSettings} from "./app/models/Settings";
import StarterDictionary from "./app/models/StarterDictionary";
import XHRDictionary from "./app/models/XHRDictionary";
import SQLDictionary from "./app/models/SQLDictionary";
let settings = getSettings();

let animate = true;

/*L.T = function(key) {
    return key;
}*/

L._T = L.T;
L.T = (function () {
    let memo = [];
    return function T(key, ...args) {
        //console.log(key, args.length, args);
        if (args.length === 0) {
            if (memo[key]) {
                return memo[key];
            } else {
                return memo[key] = L._T(key,...args);
            }
        } else {
            return L._T(key, ...args)
        }
    };
})();

class App extends Emitter {
    constructor() {
        super();
        let startAppOnce = once(this.start.bind(this));
        document.addEventListener("deviceready", startAppOnce, false);
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(startAppOnce, 1000);
        }, false);
        GCS.on("APP:startupFailure", this.onStartupFailure, this);

        this.version = "{{{VERSION}}}";
    }

    onStartupFailure(sender, notice, err) {
        console.log(`Startup failure ${err}`);
    }

    configureSVGIcons() {
        let injectSVGs = document.querySelectorAll("img.inject-svg");
        SVGInjector(injectSVGs);
    }

    configureAccessibility() {
        // zoom our text for accessibility
        if (typeof MobileAccessibility !== "undefined") {
            MobileAccessibility.usePreferredTextZoom(true);
        }
    }

    screenReaderSpeak(s) {
        MobileAccessibility.isScreenReaderRunning(active => {
            if (active) {
                MobileAccessibility.speak(s, 1);
            }
        });
    }

    notifyAccessibility() {
        // when a view is pushed / popped, we need to notify accessibility
        // that the view changed on iOS.
        // We also need to focus the first navigable element.

        function focusElement() {
            MobileAccessibility.isScreenReaderRunning(active => {
                if (active) {
                    app.contentnvc.topView.elementTree.querySelector("[class*='icon']").focus();
                }
            });
        }
        if (typeof MobileAccessibility !== "undefined") {
            let viewNameToSpeak = app.contentnvc.topView.elementTree.querySelector("h1").textContent;
            if (device.platform === "iOS") {
                setTimeout( () => {
                    MobileAccessibility.postNotification(MobileAccessibilityNotifications.SCREEN_CHANGED,
                        "", ({wasSuccessful} = {}) => {
                            setTimeout( () => {
                                MobileAccessibility.postNotification(MobileAccessibilityNotifications.ANNOUNCEMENT,
                                    viewNameToSpeak, ({wasSuccessful} = {}) => {
                                        if (!wasSuccessful) {
                                            console.log("Couldn't speak view name");
                                        } else {
                                            focusElement();
                                        }
                                    });
                            }, 10);
                        });
                }, 10);
            } else {
                MobileAccessibility.isScreenReaderRunning(active => {
                    if (active) {
                        MobileAccessibility.speak(viewNameToSpeak, 1);
                        focusElement();
                    }
                });
            }
        }
    }

    configureTheme() {
        // load theme
        this.themeManager = createThemeManager();
        this.themeManager.registerTheme(createTheme());
        this.themeManager.registerTheme(createTheme({name: "Light", cssClass: "theme-light", namespace: "light-"}));
        this.themeManager.registerTheme(createTheme({name: "Dark", cssClass: "theme-dark", namespace: "dark-"}));
        this.themeManager.currentTheme = this.themeManager.getThemeByName("Default");
    }

    configureSoftKeyboard() {
        this.softKeyboard = createSoftKeyboard({selectors: [".ui-scroll-container",
                                                            "[is='y-scroll-container']",
                                                            "y-scroll-container",
                                                            "textarea"]});
    }

    viewLastDictionary() {
        let lastDictionary = this.settings.lastDictionary;
        if (lastDictionary) {
            GCS.emit("APP:DO:viewDictionary", lastDictionary);
        } else {
            // navigate to the first available dictionary
            GCS.emit("APP:DO:viewDictionary", this.dictionaries.dictionaries[0]);
        }
    }

    viewDictionary(dictionaryName) {
        // get an associated instance
        return this.dictionaries.getDictionaryInstance({name: dictionaryName})
                   .then(dictionary => {
                       this.settings.lastDictionary = dictionaryName;
                       let svc = createSearchViewController({model: dictionary});
                       this.contentnvc.popToRoot()
                           .then(() => this.contentnvc.push(svc, {animate: false}))
                           .then(() => this.notifyAccessibility())
                           .then(() => GCS.emit("APP:DO:hideSplash")); // hide the splash screen, if necessary
                   })
                   .catch(err => {
                       GCS.emit("APP:DO:viewDictionary", this.dictionaries.dictionaries[0]);
                   });
    }

    viewDefinition(lemma) {
        let definitions = [];
        return this.dictionaries.getDictionaryInstance({name: this.settings.lastDictionary})
                   .then(dictionary => {
                       let model = createDefinitions({dictionary, lemma});
                       let dvc = createDefinitionViewController({model});
                       //model.on("model:changed:entries", once(() => {
                       return this.contentnvc.push(dvc, {animate})
                                  .then(() => this.notifyAccessibility())
                                  .then(() => model.loadEntries());
                       //}), this);
                   });
    }

    viewNotes(lemma) {
        let model = createNote({lemma});
        let nvc = createNotesViewController({model});
        return this.contentnvc.push(nvc, {animate})
                   .then(() => this.notifyAccessibility());
    }

    showAbout() {
        let avc = createAboutViewController();
        //GCS.emit("APP:DO:menu");
        return this.contentnvc.push(avc, {animate})
                   .then(() => this.notifyAccessibility());
    }

    showSettings() {
        let svc = createSettingsViewController();
        //GCS.emit("APP:DO:menu");
        return this.contentnvc.push(svc, {animate})
                   .then(() => this.notifyAccessibility());
    }

    toggleFavorite(word) {
        let favorites = getFavorites();
        favorites.toggleFavorite(word)
                 .then(() => favorites.isWordAFavorite(word))
                 .then(r => {
                     GCS.emit("APP:DID:favDefinition", word, r);
                     this.screenReaderSpeak(L.T(r ? "sr:word-favorited" : "sr:word-unfavorited"));
                 });
    }

    openURL(url) {
        // encode the URL; if not, iOS crashes with spaces
        let encodedURL = encodeURI(url);
        function continueOpen() {
            if (typeof cordova !== "undefined" && cordova.inAppBrowser) {
                cordova.inAppBrowser.open(encodedURL, "_blank", `location=no,closebuttoncaption=${L.T("browser:done")}`);
            } else {
                window.open(encodedURL, '_blank', 'location=yes');
            }
        }
        continueOpen();
        return;
        // the following is great, but SafariView Controller doesn't always want to re-appear ATM
        // can we use the Safari View Controller?
        if (typeof SafariViewController !== "undefined" &&
            typeof device !== "undefined") {
            if (device.platform === "iOS") {
                SafariViewController.isAvailable(available => {
                    if (available) {
                        SafariViewController.show({url: encodedURL});
                    } else {
                        continueOpen();
                    }
                });
            } else {
                continueOpen();
            }
        } else {
            continueOpen();
        }
    }

    handleNavigationRequests(sender, notice, ...data) {
        // notice will be of the form APP:DO:command
        let [, , command] = notice.split(":");
        switch (command) {
            case "menu":
                this.splitViewController.toggleSidebar({animate});
                break;
            case "back":
                this.contentnvc.pop({animate})
                    .then(() => this.notifyAccessibility());
                break;
            case "menuBack":
                this.sidenvc.pop({animate});
                break;
            case "about":
                this.showAbout();
                break;
            case "settings":
                this.showSettings();
                break;
            case "viewDictionary":
                this.viewDictionary(data[0]);
                break;
            case "viewLastDictionary":
                this.viewLastDictionary();
                break;
            case "viewDefinition":
                this.viewDefinition(data[0]);
                break;
            case "favDefinition":
                this.toggleFavorite(data[0]);
                break;
            case "noteDefinition":
                this.viewNotes(data[0]);
                break;
            case "shareDefinition":
                // share definition
                break;
            case "URL":
                this.openURL(data[0]);
                break;
            case "hideSplash":
                if (typeof navigator !== "undefined") {
                    if (navigator.splashscreen) {
                        setTimeout(() => navigator.splashscreen.hide(), 500);
                    }
                }
                break;
            default:
                console.log(["Couldn't handle a navigation request:", sender, notice, data]);
        }
    }

    applyDeviceProperties() {

        [document.body, document.body.parentElement].forEach( el => {
            el.classList.add((typeof device !== "undefined" ? device.platform.toLowerCase() : "browser"));
            if (typeof orientation !== "undefined") {
                el.classList.add(Math.abs(orientation) === 90 ? "landscape" : "portrait");
            } else {
                el.classList.add(window.innerWidth > window.innerHeight ? "landscape" : "portrait");
            }
        });
    }

    applySettings() {

        animate = (settings.reduceMotion === "no");

        document.body.style.fontFamily = settings.fontFamily === "default" ? "" : settings.fontFamily;

        Array.from(document.styleSheets).forEach((ss) => {
            if (ss.href && ss.href.indexOf("app.css") > -1) {
                Array.from(ss.rules).forEach((r) => {
                    if (r.selectorText === "html") {
                        r.style.fontSize = settings.fontSize == 0 ? "100%" : `${settings.fontSize}%`;
                    }
                });
            }
        });
        try {
            let theme = this.themeManager.getThemeByName(settings.theme);
            if (!theme) {
                theme = this.themeManager.getThemeByName("Default");
            }
            this.themeManager.currentTheme = theme;
            if (typeof StatusBar !== "undefined") {
                let barColor = {
                    "iOS": {
                        "Default": {color: "#eeac11", bg: "styleLightContent"},
                        "Light": {color: "#FFFFFF", bg: "styleDefault"},
                        "Dark": {color: "#40566F", bg: "styleLightContent"}
                    },
                    "Android": {
                        "Default": {color: "#c68f0e", bg: "styleLightContent"},
                        "Light": {color: "#CCCCCC", bg: "styleDefault"},
                        "Dark": {color: "#212d3a", bg: "styleLightContent"}
                    }
                }
                if (typeof device !== "undefined" && barColor[platform]) {
                    let platform = device.platform;
                    StatusBar.backgroundColorByHexString(barColor[platform][settings.theme].color);
                    StatusBar[barColor[platform][settings.theme].bg]();
                }
            }
        } catch (err) {
            console.log("couldn't change theme to ", settings.theme);
        }

    }

    enableEmitterLog(e) {
        e.on("/.*/", (...args) => console.log(args));
    }

    async configurei18n() {
        // load localization information
        this.locale = await L.loadLocale();
        L.loadTranslations(require("./app/localization/root/messages.json"));
    }

    async start() {

        try {
            let rootElement = document.getElementById("rootContainer");

            this.configureAccessibility();
            this.configureTheme();
            this.configureSoftKeyboard();
            this.configureSVGIcons();

            await this.configurei18n();

            // load settings
            this.settings = settings;
            this.applySettings();

            // create dictionaries list
            this.dictionaries = createDictionaries();

            // starter only useful for quick testing
            // this.dictionaries.addDictionary({name: "Starter", Dictionary: StarterDictionary});

            let platform = "browser";
            if (typeof device !== "undefined") {
                platform = device.platform.toLowerCase();
            }

            if (typeof sqlitePlugin !== "undefined" && platform !== "browser") {
                // introduced ch8
                this.dictionaries.addDictionary({name: "WordNet", Dictionary: SQLDictionary, options: {path: "wordnet.db"}});
            } else {
                // introduced ch4
                this.dictionaries.addDictionary({name: "WordNet", Dictionary: XHRDictionary, options: {path: "wordnet.json"}});
            }

            let rrv = createViewController();

            // if you want a split view:
            // let mvc = createMenuViewController({model: this.dictionaries});
            // let nvc = createNavigationViewController({subviews: [rrv]);
            // let mvnc = createNavigationViewController({subviews: [mvc]});
            // this.splitViewController = createSplitViewController({subviews: [mvnc, nvc], themeManager: this.themeManager, renderElement: rootElement});
            // this.contentnvc = nvc;
            // this.sidenvc = mvnc;

            let nvc = createNavigationViewController({subviews: [rrv], themeManager: this.themeManager, renderElement: rootElement});
            this.contentnvc = nvc;
            this.contentnvc.visible = true;

            // logging, debug only
            //GCS.on("/.*/", (...args) => console.log(args));

            GCS.on("/APP:DO:.+/", this.handleNavigationRequests, this)

            GCS.on("APP:SETTINGS:changed", this.applySettings, this);

            // tell everyone that the app has started
            GCS.emit("APP:started");
            this.emit("started");

            // and ask the app to go to the last dictionary
            GCS.emit("APP:DO:viewLastDictionary");

            // handle back button for Android
            document.addEventListener("backbutton", (e) => {
                e.preventDefault();
                if (this.contentnvc.subviews.length < 3) {
                    // quit instead
                    navigator.app.exitApp();
                } else {
                    GCS.emit("APP:DO:back")
                }
            }, false);

            // handle tap of status bar to scroll any view to top.
            window.addEventListener("statusTap", (e) => {
                Array.from(this.contentnvc.topView.elementTree.querySelectorAll('[is*=scroll], textarea')).forEach((el) => el.scrollTop=0);
            });

            // handle changes in orientation / etc

            document.addEventListener("resume", this.applyDeviceProperties, false);
            document.addEventListener("orientationchange", this.applyDeviceProperties, false);
            document.addEventListener("resize", this.applyDeviceProperties, false);
            GCS.on("APP:SETTINGS:changed", this.applyDeviceProperties, this);


        } catch (err) {
            GCS.emit("APP:startupFailure", err);
            this.emit("startupFailure", err);
        }
    }
}

let app = new App();
export default app;

if (global) {
    global.appVersion = "{{{VERSION}}}";
}
if (window) {
    window.appVersion = "{{{VERSION}}}";
}