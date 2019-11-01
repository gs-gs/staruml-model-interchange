const git = require('./src/git/git');
const transport = require('./src/transport/transport');
const forEach = require('async-foreach');

function _projectSaved() {
     console.log("project saved");
     git.projectLoaded();
}

function _projectCreated() {
     console.log("project created");
}

function _projectClosed() {
     console.log("project closed");
}

function test() {


     /* ,{
          "label": "Test",
          "id": "tool.transport.test",
          "command": "tool.transport:test"
     } */

     console.log("afasdf");
}

/**
 * @function init
 * @description function will be called when the extension is loaded
 */
function init() {
     app.commands.register('tool.transport:import', transport.importModel);

     app.commands.register('tool.transport:export', transport.exportModel);
     app.commands.register('tool.transport:test', test);

     app.commands.register('tool.git:init', git.getInit);
     app.commands.register('tool.git:addremote', git.getAddRemote);
     app.commands.register('tool.git:commit', git.getCommit);
     app.commands.register('tool.git:addconfig', git.getAddConfig);
     app.commands.register('tool.git:savechanges', git.getSaveChanges);
     app.commands.register('tool.git:configlist', git.getConfigList);
     app.commands.register('tool.git:push', git.getPush);

     app.project.on('projectLoaded', git.projectLoaded);
     app.project.on('projectClosed', _projectClosed);
     app.project.on('projectCreated', _projectCreated);
     app.project.on('projectSaved', _projectSaved);


     app.project.on('projectSaved', _projectSaved);
    /*  app.modelExplorer._events('dropOnDiagram',function(){

     }); */

}

exports.init = init