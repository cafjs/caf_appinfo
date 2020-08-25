/*!
 Copyright 2020 Caf.js Labs and contributors

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

/**
 *  Proxy that allows a CA to send email.
 *
 * @module caf_appinfo/proxy_appinfo
 * @augments external:caf_components/gen_proxy
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const genProxy = caf_comp.gen_proxy;

exports.newInstance = async function($, spec) {
    try {
        const that = genProxy.create($, spec);

        /**
         * Gets resource statistics of an app.
         *
         * @param {string} app A fully qualified app name, e.g.,
         * 'root-launcher'.
         *
         * @return {appInfoType} App statistics for resource consumption.
         *
         * @memberof! module:caf_appinfo/proxy_appinfo#
         * @alias getAppInfo
         */
        that.getAppInfo = function(app) {
            return $._.getAppInfo(app);
        };

        /**
         * Reloads app stats from a remote server.
         *
         * This can only be called by a privileged CA or it throws.
         *
         * @memberof! module:caf_appinfo/proxy_appinfo#
         * @alias reload
         */
        that.reload = function() {
            return $._.reload();
        };

        Object.freeze(that);

        return [null, that];
    } catch (err) {
        return [err];
    }
};
