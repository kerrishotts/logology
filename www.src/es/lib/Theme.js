/*****************************************************************************
 *
 * Author: Kerri Shotts <kerrishotts@gmail.com>
 *         http://www.photokandy.com/books/mastering-phonegap
 *
 * MIT LICENSED
 *
 * Copyright (c) 2016 Kerri Shotts (photoKandy Studios LLC)
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

const _name = Symbol("_name"),
      _cssClass = Symbol("_cssClass"),
      _namespace = Symbol("_namespace");

export default class Theme extends Emitter {

    constructor({name = "Default", cssClass = "theme-default", namespace = "default-"} = {}) {
        super();
        this[_name] = name;
        this[_cssClass] = cssClass;
        this[_namespace] = namespace;
    }

    get name()/*: string*/ {
        return this[_name];
    }

    get cssClass()/*: string*/ {
        return this[_cssClass];
    }

    get namespace()/*: string*/ {
        return this[_namespace];
    }

    get ANIMATION_TIMING()/*: milliseconds*/ {
        return 300; // milliseconds
    }

    get ANIMATION_TIMING_FUZZ() {
        return 50;
/*        if (typeof device !== "undefined") {
            return device.platform === "Android" ? 0 : 0;
        }*/
    }

///mark: CSS classes

    /*
     * Here anims == animation setup, animd == animation doing, animh = animation hold
     */
    get CLASS_VIEW_ANIMS_LEAVE_IN()/*: string*/ { return /*this.namespace +*/ "anims-view-leave-in"; }
    get CLASS_VIEW_ANIMD_LEAVE_IN()/*: string*/ { return /*this.namespace +*/ "animd-view-leave-in"; }
    get CLASS_VIEW_ANIMH_LEAVE_IN()/*: string*/ { return /*this.namespace +*/ "animh-view-leave-in"; }
    get CLASS_VIEW_ANIMS_ENTER_IN()/*: string*/ { return /*this.namespace +*/ "anims-view-enter-in"; }
    get CLASS_VIEW_ANIMD_ENTER_IN()/*: string*/ { return /*this.namespace +*/ "animd-view-enter-in"; }
    get CLASS_VIEW_ANIMH_ENTER_IN()/*: string*/ { return /*this.namespace +*/ "animh-view-enter-in"; }
    get CLASS_VIEW_ANIMS_LEAVE_OUT()/*: string*/ { return /*this.namespace +*/ "anims-view-leave-out"; }
    get CLASS_VIEW_ANIMD_LEAVE_OUT()/*: string*/ { return /*this.namespace +*/ "animd-view-leave-out"; }
    get CLASS_VIEW_ANIMH_LEAVE_OUT()/*: string*/ { return /*this.namespace +*/ "animh-view-leave-out"; }
    get CLASS_VIEW_ANIMS_ENTER_OUT()/*: string*/ { return /*this.namespace +*/ "anims-view-enter-out"; }
    get CLASS_VIEW_ANIMD_ENTER_OUT()/*: string*/ { return /*this.namespace +*/ "animd-view-enter-out"; }
    get CLASS_VIEW_ANIMH_ENTER_OUT()/*: string*/ { return /*this.namespace +*/ "animh-view-enter-out"; }

    get CLASS_SPLIT_ANIMS_ENTER()/*: string*/ { return /*this.namespace +*/ "anims-split-enter"; }
    get CLASS_SPLIT_ANIMD_ENTER()/*: string*/ { return /*this.namespace +*/ "animd-split-enter"; }
    get CLASS_SPLIT_ANIMH_ENTER()/*: string*/ { return /*this.namespace +*/ "animh-split-enter"; }
    get CLASS_SPLIT_ANIMS_LEAVE()/*: string*/ { return /*this.namespace +*/ "anims-split-leave"; }
    get CLASS_SPLIT_ANIMD_LEAVE()/*: string*/ { return /*this.namespace +*/ "animd-split-leave"; }
    get CLASS_SPLIT_ANIMH_LEAVE()/*: string*/ { return /*this.namespace +*/ "animh-split-leave"; }

    get CLASS_VIEW_VISIBLE()/*: string*/ { return /*this.namespace +*/ "visible"; }
    get CLASS_VIEW_NOT_VISIBLE()/*: string*/ { return /*this.namespace +*/ "not-visible"; }
    get CLASS_VIEW_DISPLAYED()/*: string*/ { return /*this.namespace +*/ "displayed"; }
    get CLASS_VIEW_NOT_DISPLAYED()/*: string*/ { return /*this.namespace +*/ "not-displayed"; }

/// visibility and display for elements

    markElementVisibility(e/*: Node*/, visibility) {
        if (e) {
            if (visibility === undefined) {
                e.classList.remove(this.CLASS_VIEW_VISIBLE, this.CLASS_VIEW_NOT_VISIBLE);
            } else {
                e.classList.remove(visibility ? this.CLASS_VIEW_NOT_VISIBLE : this.CLASS_VIEW_VISIBLE);
                e.classList.add(visibility ? this.CLASS_VIEW_VISIBLE : this.CLASS_VIEW_NOT_VISIBLE);
                //TODO: handle ARIA
            }
        }
    }
    markElementDisplay(e/*: Node*/, display) {
        if (e) {
            e.classList.remove(display ? this.CLASS_VIEW_NOT_DISPLAYED : this.CLASS_VIEW_DISPLAYED);
            e.classList.add(display ? this.CLASS_VIEW_DISPLAYED : this.CLASS_VIEW_NOT_DISPLAYED);
        }
    }

///mark: animations

    addClearClassToElement(c, e) {
        /*let existingClears = e.getAttribute("y-anim-clear-class");
        if (existingClears) {
            existingClears = existingClears.split(" ");
        } else {*/
        let existingClears = [];
        /*}*/

        if (c instanceof Array) {
           existingClears.push(...c);
        } else {
           existingClears.push(c);
        }
        e.setAttribute("y-anim-clear-class", existingClears.join(" "));
    }

    clearElementClasses(e) {
        let existingClears = e.getAttribute("y-anim-clear-class");
        if (existingClears) {
            existingClears = existingClears.split(" ");
            e.classList.remove.apply(e.classList, existingClears);
            e.removeAttribute("y-anim-clear-class");
        }
    }

    animateElementWithAnimSequence ([e, setup, doing, hold], { animate/*: boolean*/ = true } = {}) {
        return new Promise((resolve) => {
                let finalAnimationStep = () => {
                    e.classList.remove(setup, doing);
                    e.classList.add(hold);
                    //console.log("bye");
                    setImmediate(() => resolve());
                    resolve();
                };
                //this.clearElementClasses(e);
                if (animate) {
                    e.classList.add(setup);
                    setTimeout(() => {
                        e.classList.add(doing);
                  //      this.addClearClassToElement([doing, hold], e);
                        setTimeout(finalAnimationStep, this.ANIMATION_TIMING + this.ANIMATION_TIMING_FUZZ);
                        /*e.addEventListener("transitionend", function animationOver() {
                            //console.log("hi");
                            e.removeEventListener("transitionend", animationOver);
                            finalAnimationStep();
                        });*/
                    }, 32);
                } else {
                  //  this.addClearClassToElement(hold, e);
                    finalAnimationStep();
                }
        });
    }

    animateViewHierarchyPush({enteringViewElement/*: Node*/, leavingViewElement/*: Node*/, options} = {})/*: Promise*/ {
        return Promise.all(
            [[leavingViewElement, this.CLASS_VIEW_ANIMS_LEAVE_IN, this.CLASS_VIEW_ANIMD_LEAVE_IN, this.CLASS_VIEW_ANIMH_LEAVE_IN],
              [enteringViewElement, this.CLASS_VIEW_ANIMS_ENTER_IN, this.CLASS_VIEW_ANIMD_ENTER_IN, this.CLASS_VIEW_ANIMH_ENTER_IN]]
                .map(arr => this.animateElementWithAnimSequence(arr, options)));
    }
    animateViewHierarchyPop({enteringViewElement/*: Node*/, leavingViewElement/*: Node*/, options} = {})/*: Promise*/ {
        return Promise.all(
            [[leavingViewElement, this.CLASS_VIEW_ANIMS_LEAVE_OUT, this.CLASS_VIEW_ANIMD_LEAVE_OUT, this.CLASS_VIEW_ANIMH_LEAVE_OUT],
              [enteringViewElement, this.CLASS_VIEW_ANIMS_ENTER_OUT, this.CLASS_VIEW_ANIMD_ENTER_OUT, this.CLASS_VIEW_ANIMH_ENTER_OUT]]
                .map(arr => this.animateElementWithAnimSequence(arr, options)));
    }
    animateModalViewEnter({enteringViewElement/*: Node*/, leavingViewElement/*: Node*/} = {})/*: Promise*/ {
    }
    animateModalViewExit({enteringViewElement/*: Node*/, leavingViewElement/*: Node*/} = {})/*: Promise*/ {
    }
    animateAlertViewEnter({enteringViewElement/*: Node*/})/*: Promise*/ {
    }
    animateAlertViewExit({leavingViewElement/*: Node*/})/*: Promise*/ {
    }
    animateSplitViewSidebarEnter({splitViewElement/*: Node*/, options})/*: Promise*/ {
        return Promise.all(
            [[splitViewElement, this.CLASS_SPLIT_ANIMS_ENTER,
                                  this.CLASS_SPLIT_ANIMD_ENTER,
                                  this.CLASS_SPLIT_ANIMH_ENTER]]
                .map(arr => this.animateElementWithAnimSequence(arr, options)));
    }
    animateSplitViewSidebarLeave({splitViewElement/*: Node*/, options})/*: Promise*/ {
        return Promise.all(
            [[splitViewElement, this.CLASS_SPLIT_ANIMS_LEAVE,
                                  this.CLASS_SPLIT_ANIMD_LEAVE,
                                  this.CLASS_SPLIT_ANIMH_LEAVE]]
                .map(arr => this.animateElementWithAnimSequence(arr, options)));
    }

}

export function createTheme(options = {}) {
    return new Theme(options);
}