var path = require('path');
const fsNew = require('fs-extra')
const git = require('./src/git/git');
const transport = require('./src/transport/transport');
const transportNew = require('./src/transport/transportNew');
const prefs = require('./src/preference/prefs') ;
const os = require('os');
const baseDirName = require('./package.json').name;

/**
 * @function _projectSaved
 * @description this method calls when user save changes in model file
 */
function _projectSaved() {
     console.log("project saved");
     git.projectLoaded();
}

/**
 * @function _projectClosed
 * @description this method calls when user close model file
 */
function _projectClosed() {
     console.log("project closed");
}

/**
 * @function init
 * @description function will be called when the extension is loaded
 */
function init() {
     
     /* Register preference for repository url */
     app.preferences.register(prefs);
     app.commands.register('tool.transport:import', transport.importModel);
     app.commands.register('tool.transport:export', transport.exportModel);
     app.commands.register('tool.transport:exportNew', transportNew.exportNewModel);
     app.commands.register('tool.transport:importNew', transportNew.importNewModel);
     app.commands.register('tool.git:initclone', git.initClone);
     app.commands.register('tool.git:sync', git.sync);
     
     /* Enable below line when git feature to enable 
     app.project.on('projectLoaded', git.projectLoaded);
     */
     /* app.commands.register('tool.git:init', git.getInit);
     app.commands.register('tool.git:addremote', git.getAddRemote);
     app.commands.register('tool.git:commit', git.getCommit);
     app.commands.register('tool.git:addconfig', git.getAddConfig);
     app.commands.register('tool.git:configlist', git.getConfigList);
     app.commands.register('tool.git:push', git.getPush);
     app.commands.register('tool.git:pull', git.getPull);
     app.commands.register('tool.git:log', git.getLog);
     app.commands.register('tool.git:status', git.getStatus);
     app.commands.register('tool.git:diff', git.getDiff);
     app.commands.register('tool.git:clone', git.gitClone);
     app.project.on('projectClosed', _projectClosed);
     app.project.on('projectSaved', _projectSaved); */
     // app.project.on('projectCreated', _projectCreated);
     app.project.on('projectSaved', _projectSaved);
}
function runStarUML(){
     /* possible values of os 'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32' */
     let homeDirectory = os.homedir();
     let dest = '';
     let src = __dirname+path.sep;
     if(os.platform == 'win32') {
          dest = homeDirectory+path.sep+'AppData'+path.sep+'Roaming'+path.sep+'StarUML'+path.sep+'extensions'+path.sep+'user'+path.sep+baseDirName+path.sep;
     }
     else if(os.platform == 'linux') {
          dest = homeDirectory+'.config'+path.sep+'StarUML'+path.sep+'extensions'+path.sep+'user'+path.sep+baseDirName+path.sep;
     }
     console.log("platform : ",os.platform);
     console.log("base : ",baseDirName);
     console.log("src : ",src);
     console.log("dest : ",dest);
     console.log("Coping files..!")
     fsNew.copy(src, dest)
     .then(() => console.log('success!'))
     .catch(err => console.error(err));
     return '';
}

exports.init = init
exports.runStarUML = runStarUML