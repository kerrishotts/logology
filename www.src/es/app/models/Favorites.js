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

import KVStore from "../lib/KVStore";
import {createWebSQLKVStore} from "../lib/WebSQLKVStore";

// region private properties

// endregion

export default class Favorites extends KVStore {
    constructor({adapter} = {}) {
        if (!adapter) {
            adapter = createWebSQLKVStore({namespace: "favorites"});
        }
        super({adapter});
    }

    isWordAFavorite(word) {
        return this.exists(word);
    }

    saveWordAsFavorite(word) {
        return this.set(word, "true");
    }

    toggleFavorite(word) {
        return this.exists(word).then(r => r ? this.remove(word) : this.saveWordAsFavorite(word));
    }

    removeFavoriteWord(word) {
        return this.remove(word);
    }
}

export function createFavorites(options = {}) {
    return new Favorites(options);
}

let favorites;
export function getFavorites() {
    if (!favorites) {
        favorites = createFavorites();
    }
    return favorites;
}