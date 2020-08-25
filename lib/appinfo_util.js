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

const WEB_APP_NAME = exports.WEB_APP_NAME = 'nginx';
const json_rpc = require('caf_transport').json_rpc;

exports.initApps = function(allApps, actual, requested) {
    allApps[WEB_APP_NAME] = {
        startTime: Number.MAX_SAFE_INTEGER, endTime: 0
    };
    const initAppImpl = function(x) {
        try {
            if (x.app && (json_rpc.splitName(x.app).length === 2)) {
                allApps[x.app] = {
                    startTime: Number.MAX_SAFE_INTEGER, endTime: 0
                };
            }
        } catch (err) {
            // ignoring badly formed names

        }
    };

    actual.forEach(initAppImpl);
    requested.forEach(initAppImpl);
};

exports.initRanges = function(allApps, actual, requested) {
    const findDates = (x) => {
        const p = x.app && allApps[x.app];
        if (p) {
            let {startTime, endTime} = p;
            if (x.timestamp < startTime) {
                startTime = x.timestamp;
            }
            if (x.timestamp > endTime) {
                endTime = x.timestamp;
            }
            allApps[x.app] = {startTime, endTime};
        }
    };

    actual.forEach(findDates);
    requested.forEach(findDates);
};

exports.initStats = function(allApps) {
    const nEntries = (appName) => {
        const p = allApps[appName];
        if (p) {
            let {startTime, endTime} = p;
            return endTime < startTime ?
                0 :
                1 + (endTime-startTime)/86400000;
        } else {
            return 0;
        }
    };

    Object.keys(allApps).forEach((appName) => {
        const nSize = nEntries(appName);
        const app = {
            cpuActual: (new Array(nSize)).fill(0),
            cpuRequested: (new Array(nSize)).fill(0),
            memoryActual: (new Array(nSize)).fill(0),
            memoryRequested: (new Array(nSize)).fill(0),
            egressActual: (new Array(nSize)).fill(0),
        };
        allApps[appName].app = app;

        if (appName !== WEB_APP_NAME) {
            const redis = {
                cpuActual: (new Array(nSize)).fill(0),
                cpuRequested: (new Array(nSize)).fill(0),
                memoryActual: (new Array(nSize)).fill(0),
                memoryRequested: (new Array(nSize)).fill(0),
                egressActual: (new Array(nSize)).fill(0)
            };
            allApps[appName].redis = redis;
        }
    });
};

exports.normalize = function(x) {
    const timestamp = (new Date(x.timestamp)).getTime();
    let amount;
    switch (x.resource) {
    case 'cpu':
        // per day not per second
        amount = x.amount / 86400;
        return {...x, amount, timestamp};
    case 'memory':
        // per day not per second, and in megabytes
        amount = x.amount / 86400000000;
        return {...x, amount, timestamp};
    case 'networkEgress':
        // in megabytes
        amount = x.amount / 1000000;
        return {...x, amount, timestamp};
    default:
        return {...x, timestamp};
    }
};
