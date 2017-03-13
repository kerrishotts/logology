/*****************************************************************************
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

import Emitter from "yasmf-emitter";
import GCS from "../../lib/grandCentralStation";

// private property symbols
let _fontFamily = Symbol("_fontFamily"), // font family
    _fontSize = Symbol("_fontSize"),   // 0 = use system default, otherwise specific point sizes
    _theme = Symbol("_theme"),      // light, dark, lightHighContrast, etc.
    _externalResources = Symbol("_externalResources"), // link templates to external resources, like Wikipedia
    _showImages = Symbol("_images"), // determines if images are shown (if possible)
    _lastDictionary = Symbol("_lastDictionary"), // records the last dictionary
    _pageSize = Symbol("_pageSize"),   // page length (search results, etc.)
    _lastLemma = Symbol("_lastLemma"),
    _reduceMotion = Symbol("_reduceMotion"),
    _localStorage = Symbol("_localStorage"); // for testing

export default class Settings extends Emitter {
    constructor({localStorage} = {}) {
        super();
        this[_fontFamily] = "default"; // will just use the default font family
        this[_fontSize] = 0;           // 0 will use app default (from system)
        this[_theme] = "Default";      // default theme
        this[_lastLemma] = "";         // no word last looked up
        this[_showImages] = true;      // not currently used
        this[_pageSize] = 100;         // search result limit
        this[_lastDictionary] = undefined; // if undefined, the app will pick the first one
        this[_reduceMotion] = "no";    // if yes, animations will be reduced
        if (typeof device !== "undefined") {
            if (device.platform === "Android") {
                this[_reduceMotion] = "yes"; // because Android doesn't like do animate well. *sigh*
                this[_pageSize] = 50;         // reduce search result limit
            }
        }
        this[_externalResources] = {
            "Wikipedia": "http://www.wikipedia.org/search-redirect.php?language=en&search=%WORD%",
            "WordNet": "http://wordnetweb.princeton.edu/perl/webwn?s=%WORD%"
        };
    }

    init() {
        super.init();
        this.retrieveSettings();
    }

    _emitChangeNotice(notice, newV, oldV) {
        this.emit(notice + "Changed", newV, oldV);
        this.emit("settingsChanged");
    }

    get localStorage() {
        return this[_localStorage] ? this[_localStorage] : (typeof localStorage !== "undefined" ? localStorage : {});
    }

    get entries() {
        return [
            {category: "setting:category:accessibility",
             items: [
                 {name: "setting:reduce-motion", key: "reduceMotion", value: this.reduceMotion, type: "select", options: [
                     {name: "setting:reduce-motion:no", value: "no"},
                     {name: "setting:reduce-motion:yes", value: "yes"}
                 ]}
             ]
            },
            {category: "setting:category:readability",
             items: [
                {name: "setting:font-family", key: "fontFamily", value: this.fontFamily, type: "select", options: [
                    {name: "setting:font-family:Default", value: "default"},
                    {name: "setting:font-family:Helvetica-Neue", value: "HelveticaNeue, 'Helvetica Neue', Helvetica, Arial, sans-serif"},
                    {name: "setting:font-family:Lucida-Grande", value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif"},
                    {name: "setting:font-family:Georgia", value: "Georgia, serif"},
                    {name: "setting:font-family:Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif"},
                    {name: "setting:font-family:Times-New-Roman", value: "'Times New Roman', Times, serif"}
                ]},
                {name: "setting:font-size",   key: "fontSize", value: this.fontSize, type: "select", options: [
                    {name: "setting:font-size:Default", value: 0},
                    {name: "setting:font-size:Tiny", value: 50},
                    {name: "setting:font-size:Small", value: 75},
                    {name: "setting:font-size:Normal", value: 100},
                    {name: "setting:font-size:Large", value: 125},
                    {name: "setting:font-size:Huge", value: 150},
                    {name: "setting:font-size:Gigantic", value: 250}
                ]},
                {name: "setting:theme", key: "theme", value: this.theme, type: "select", options: [
                    {name: "setting:theme:Default", value: "Default"},
                    {name: "setting:theme:Light", value: "Light"},
                    {name: "setting:theme:Dark", value: "Dark"}
                ]},
             ]
            },
            {category: "setting:category:performance",
             items: [
                {name: "setting:page-size", key: "pageSize", value: this.pageSize, type: "select", options: [
                    {name: "setting:page-size:20", value: 20},
                    {name: "setting:page-size:50", value: 50},
                    {name: "setting:page-size:80", value: 80},
                    {name: "setting:page-size:100", value: 100},
                    {name: "setting:page-size:150", value: 150},
                    {name: "setting:page-size:200", value: 200}
                ]}
             ]
            }
        ];
    }

    retrieveSettings() {
        const storage = this.localStorage;
        if (storage.fontFamily !== undefined) { this[_fontFamily] = storage.fontFamily; }
        if (storage.fontSize !== undefined) { this[_fontSize] = storage.fontSize; }
        if (storage.theme !== undefined) { this[_theme] = storage.theme; }
        if (storage.showImages !== undefined) { this[_showImages] = storage.showImages; }
        if (storage.externalResources !== undefined) { this[_externalResources] = JSON.parse(storage.externalResources); }
        if (storage.pageSize !== undefined) { this[_pageSize] = storage.pageSize; }
        if (storage.lastDictionary !== undefined) { this[_lastDictionary] = storage.lastDictionary; }
        if (storage.lastLemma !== undefined) { this[_lastLemma] = storage.lastLemma; }
        if (storage.reduceMotion !== undefined) { this[_reduceMotion] = storage.reduceMotion; }
        this.emit("settingsRetrieved");
        GCS.emit("APP:SETTINGS:loaded");
        this.emit("settingsChanged"); // this will save the settings again, but that's OK
    }

    persistSettings() {
        const storage = this.localStorage;
        if (this.fontFamily !== undefined) { storage.fontFamily = this.fontFamily; }
        if (this.fontSize !== undefined) { storage.fontSize = this.fontSize; }
        if (this.theme !== undefined) { storage.theme = this.theme; }
        if (this.showImages !== undefined) { storage.showImages = this.showImages; }
        storage.externalResources = JSON.stringify(this.externalResources);
        if (this.pageSize !== undefined) { storage.pageSize = this.pageSize; }
        if (this.lastDictionary !== undefined) { storage.lastDictionary = this.lastDictionary; }
        if (this.lastLemma !== undefined) { storage.lastLemma = this.lastLemma; }
        if (this.reduceMotion !== undefined) { storage.reduceMotion = this.reduceMotion; }
        this.emit("settingsPersisted");
        GCS.emit("APP:SETTINGS:persisted");
    }

    onSettingsChanged() {
        GCS.emit("APP:SETTINGS:changed");
        // save the settings whenever they change
        this.persistSettings();
    }

    get fontFamily() { return this[_fontFamily]; }
    set fontFamily(v) {
        this._emitChangeNotice("fontFamily", v, this[_fontFamily]);
        this[_fontFamily] = v;
    }

    get fontSize() { return this[_fontSize]; }
    set fontSize(v) {
        this._emitChangeNotice("fontSize", v, this[_fontFamily]);
        this[_fontSize] = v;
    }

    get reduceMotion() { return this[_reduceMotion]; }
    set reduceMotion(v) {
        this._emitChangeNotice("reduceMotion", v, this[_reduceMotion]);
        this[_reduceMotion] = v;
    }

    get theme() { return this[_theme]; }
    set theme(v) {
        this._emitChangeNotice("theme", v, this[_theme]);
        this[_theme] = v;
    }

    get showImages() { return this[_showImages]; }
    set showImages(v) {
        this._emitChangeNotice("showImages", v, this[_showImages]);
        this[_showImages] = v;
    }

    get pageSize() { return this[_pageSize]; }
    set pageSize(s) {
        this._emitChangeNotice("pageSize", s, this[_pageSize]);
        this[_pageSize] = s;
    }

    get lastDictionary() { return this[_lastDictionary]; }
    set lastDictionary(d) {
        this._emitChangeNotice("lastDictionary", d, this[_lastDictionary]);
        this[_lastDictionary] = d;
    }

    get lastLemma() { return this[_lastLemma]; }
    set lastLemma(l) {
        this._emitChangeNotice("lastLemma", l, this[_lastLemma]);
        this[_lastLemma] = l;
    }

    get externalResources() { return this[_externalResources]; }

    addExternalResource({name, template}) {
        this._emitChangeNotice("externalResources");
        this[_externalResources][name] = template;
    }
    removeExternalResource(name) {
        this[_externalResources][name] = undefined;
    }
}

export function createSettings(...args) {
    return new Settings(...args);
}

let settings;
export function getSettings() {
    if (!settings) {
        settings = createSettings();
        settings.retrieveSettings();
    }
    return settings;
}