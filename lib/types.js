
/**
 * @global
 * @typedef {Object | Array | string | number | null | boolean} jsonType
 *
 */

/**
 * @global
 * @typedef {Object} infoType
 * @property {Array.<number>} cpuActual Percentage of a cpu thread used.
 * @property {Array.<number>} cpuRequest Percentage of a cpu thread requested.
 * @property {Array.<number>} memoryActual Memory in megabytes used.
 * @property {Array.<number>} memoryRequest Memory in megabytes requested.
 * @property {Array.<number>} egressActual Egress traffic per day in megabytes.
 */

/**
 * @global
 * @typedef {Object} appInfoType
 * @property {string} appName The full name of the app.
 * @property {number} startTime The start date of the trace in msec since 1970.
 * @property {number} endTime The end date of the trace in msec since 1970.
 * @property {infoType=} redis Redis backend stats.
 * @property {infoType} app Node.js app daemon  (or nginx) stats.
*/
