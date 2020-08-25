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
 *  Gathers performance app stats for this CA.
 *
 *
 * @module caf_appinfo/plug_ca_appinfo
 * @augments external:caf_components/gen_plug_ca
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const myUtils = caf_comp.myUtils;
const genPlugCA = caf_comp.gen_plug_ca;
const json_rpc = require('caf_transport').json_rpc;
const assert = require('assert');
const appinfo_util = require('./appinfo_util');
const {WEB_APP_NAME} = appinfo_util;


exports.newInstance = async function($, spec) {
    try {
        const that = genPlugCA.create($, spec);
        const caOwner = json_rpc.splitName($.ca.__ca_getName__())[0];
        const isAdmin = (caOwner === 'root');

        // transactional ops
        const target = {
            async reloadImpl() {
                try {
                    await $._.$.appInfo.reload();
                } catch (err) {
                    $.ca.$.log && $.ca.$.log.warn('Cannot reload stats ' +
                                                  myUtils.errToPrettyStr(err));
                }
                return [];
            }
        };

        that.__ca_setLogActionsTarget__(target);

        that.reload = function() {
            if (isAdmin) {
                that.__ca_lazyApply__('reloadImpl', []);
            } else {
                throw new Error('Reload() is a privileged operation');
            }
        };

        that.getAppInfo = function(app) {
            if (app === WEB_APP_NAME) {
                if (isAdmin) {
                    return $._.$.appInfo.getAppInfo(app);
                } else {
                    throw new Error('Inspecting nginx is a ' +
                                    'privileged operation');
                }
            } else {
                const appArray = json_rpc.splitName(app);
                assert(appArray.length === 2);

                if (isAdmin || (caOwner === appArray[0])) {
                    return $._.$.appInfo.getAppInfo(app);
                } else {
                    throw new Error(
                        'Inspecting apps of a different owner is a ' +
                            'privileged operation'
                    );
                }
            }
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
