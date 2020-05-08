const path = require('path');
const os = require('os');

let fileName = '';
let ext = '';

/**
 * @function initialize
 * @description initialize project to get project filename and extension
 */
function initialize() {

    let basePath = app.project.filename;
    if (basePath != null) {

        let base = path.parse(basePath).base;
        let res = base.split(".");
        if (res.length == 2) {
            fileName = res[0];
            ext = res[1];
        }
    }

}

/**
 * @function getFileName
 * @description return staruml project name 
 * @returns {String} fileName
 */
function getFileName() {
    return fileName;
}

/**
 * @function getExtension
 * @description return project file extension
 * @returns {String} ext
 */
function getExtension() {
    return ext;
}

/**
 * @function getExtension
 * @description return datastore of project which holds the path of git repository
 * @returns {store} store
 */
function getStore() {
    const store = require('data-store')({
        /* path: process.cwd() + '/.' + getFileName() + '_' + getExtension() + '.json' */
        path: path.join(os.homedir(), '.config/staruml-model-interchange.json')
    });
    console.log("Home Directory : ", os.homedir());
    return store;
}

/**
 * @function getDiffPath
 * @description returns path of diff changes file path
 * @returns {String}
 */
function getDiffPath() {
    let configPath = path.join(os.homedir(), '.config');
    return path.join(configPath, 'diffChanges.diff');
}
module.exports.initialize = initialize;
module.exports.getStore = getStore;
module.exports.getFileName = getFileName;
module.exports.getExtension = getExtension;
module.exports.getDiffPath = getDiffPath;