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
 * Calls an external service to gather performance app stats.
 *
 *  Properties:
 *
 *       {appInfoDir: string=, appInfoFile: string}
 *
 * where:
 *
 * * `appInfoDir:` a directory for the appInfo URL config.
 * * `appInfoFile`: a json file to configure appInfo.
 *
 * @module caf_appinfo/plug_appinfo
 * @augments external:caf_components/gen_plug
 */
// @ts-ignore: augments not attached to a class
const assert = require('assert');
const caf_comp = require('caf_components');
const genPlug = caf_comp.gen_plug;

const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const appinfo_util = require('./appinfo_util');

const {WEB_APP_NAME} = appinfo_util;

exports.newInstance = async function($, spec) {
    try {
        const that = genPlug.create($, spec);

        let appInfo = {};

        $._.$.log && $._.$.log.debug('New AppInfo plug');

        const appInfoDir = spec.env.appInfoDir ||
              $.loader.__ca_firstModulePath__();

        const loadConfig = function(fileName) {
            try {
                const buf = fs.readFileSync(path.resolve(appInfoDir,
                                                         fileName));
                return JSON.parse(buf.toString('utf8'));
            } catch (err) {
                $._.$.log && $._.$.log.debug('AppInfo: trying default path ' +
                                             'for ' + fileName);
                return $._.$.loader.__ca_loadResource__(fileName);
            }
        };

        assert.equal(typeof spec.env.appInfoFile, 'string',
                     "'spec.env.appInfoFile' is not a string");
        const appInfoConfig = loadConfig(spec.env.appInfoFile);

        const process = function(actual, requested) {
            const allApps = {};

            appinfo_util.initApps(allApps, actual, requested);
            appinfo_util.initRanges(allApps, actual, requested);
            appinfo_util.initStats(allApps);

            const findIndex = (x, target) =>
                Math.trunc((x.timestamp - target.startTime)/86400000);

            const findRecord = (x, target) =>
                ((x.type === 'apps') || (x.app === WEB_APP_NAME)) ?
                    target.app :
                    ((x.type === 'redis') ? target.redis : null);

            const processImpl = (trace, isActual) => {
                trace.forEach((x) => {
                    if (x.app && allApps[x.app]) {
                        const target = allApps[x.app];
                        target.appName = x.app;
                        const index = findIndex(x, target);
                        const rec = findRecord(x, target);
                        if (rec) {
                            switch (x.resource) {
                            case 'cpu':
                                if (isActual) {
                                    rec.cpuActual[index] = x.amount;
                                } else {
                                    rec.cpuRequested[index] = x.amount;
                                }
                                break;
                            case 'memory':
                                if (isActual) {
                                    rec.memoryActual[index] = x.amount;
                                } else {
                                    rec.memoryRequested[index] = x.amount;
                                }
                                break;
                            case 'networkEgress':
                                /* not a typo, the GKE `requested` database
                                   includes `actual` egress data...*/
                                rec.egressActual[index] = x.amount;
                                break;
                            }
                        }
                    }
                });
            };

            processImpl(actual, true);
            processImpl(requested, false);

            return allApps;
        };

        that.reload = async function() {
            const reloadImpl = async function(url) {
                const response = await fetch(url);
                const body = await response.text();
                return JSON.parse(
                    '[' + body.split('\n').join(',').slice(0, -1) + ']'
                ).map(appinfo_util.normalize);
            };

            const actual = await reloadImpl(appInfoConfig.actualURL);
            const requested = await reloadImpl(appInfoConfig.requestedURL);

            appInfo = process(actual, requested);
        };

        that.getAppInfo = function(app) {
            return appInfo[app];
        };

        await that.reload();

        return [null, that];
    } catch (err) {
        return [err];
    }
};
