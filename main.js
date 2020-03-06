const git = require('./src/git/git');
const transport = require('./src/transport/transport');

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
     app.commands.register('tool.transport:import', transport.importModel);
     app.commands.register('tool.transport:export', transport.exportModel);
     app.commands.register('tool.git:init', git.getInit);
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
     app.project.on('projectLoaded', git.projectLoaded);
     app.project.on('projectClosed', _projectClosed);
     app.project.on('projectSaved', _projectSaved);
}

exports.init = init