var path = require('path');
const fs = require('fs');
const git = require('simple-git/promise');
const constant = require('../constant');
var _fname = null;
var _dirname = null;
var junk = require('junk');

function _projectLoaded() {

     _fname = app.project.getFilename();
     if (_fname) {
          _dirname = path.dirname(_fname);
          fs.readdir(_dirname, function (err, files) {
               console.log(files.filter(junk.not));
          });
     }
}
async function _gitInit() {

    if (!_fname && !_dirname) {
         app.dialogs.showInfoDialog(constant.project_not_found);
         return;
    }
    try {
         let isRepo = await git(_dirname).checkIsRepo();
         if (!isRepo) {
              await git(_dirname).init();
              await git(_dirname).add('./*');
              app.dialogs.showInfoDialog(constant.repo_initialized);
         } else {
              app.dialogs.showInfoDialog(constant.repo_already_initialized);
         }
    } catch (error) {
         app.dialogs.showErrorDialog(error.message);
    }

}

async function _gitAddRemote() {

    let isRepo = await git(_dirname).checkIsRepo();
    if (!isRepo) {
         app.dialogs.showErrorDialog(constant.init_repo_first);
         return;
    }
    let resAddRemote = await app.dialogs.showInputDialog(constant.enter_remote_url);
    if (resAddRemote.buttonId == 'ok') {
         if (resAddRemote.returnValue) {
              try {
                   await git(_dirname).addRemote('origin', resAddRemote.returnValue);
                   app.dialogs.showInfoDialog(constant.repo_added_success);
              } catch (error) {
                   app.dialogs.showErrorDialog(error.message);
              }
         } else {
              app.dialogs.showErrorDialog(constant.invalid_repo_url);
         }
    }
}

async function _gitCommit() {

    let isRepo = await git(_dirname).checkIsRepo();
    if (!isRepo) {
         app.dialogs.showErrorDialog(constant.init_repo_first);
         return;
    }

    let resCommit = await app.dialogs.showTextDialog(constant.enter_commit_msg, "");
    if (resCommit.buttonId == "ok") {
         if (resCommit.returnValue) {
              try {
                   
                   let commit = await git(_dirname).commit(resCommit.returnValue);
                   console.log(commit);
              } catch (error) {
                   app.dialogs.showErrorDialog(error.message);
              }
         } else {
              app.dialogs.showErrorDialog(constant.invalid_commit_msg);
         }
    }
}

async function _gitAddConfig() {
    try {
         let isRepo = await git(_dirname).checkIsRepo();

         if (!isRepo) {
              app.dialogs.showErrorDialog(constant.init_repo_first);
              return;
         }

         let _username = null,
              _email = null;
         let resUsername = await app.dialogs.showInputDialog(constant.enter_username);
         if (resUsername.buttonId == 'ok') {
              _username = resUsername.returnValue;
              if (_username) {
                   let resPassword = await app.dialogs.showInputDialog(constant.enter_email);
                   if (resPassword.buttonId == 'ok') {
                        _email = resPassword.returnValue;
                        if (_email) {
                             console.log("username", _username);
                             console.log("email", _email);

                             git(_dirname).addConfig('user.name', _username);
                             git(_dirname).addConfig('user.email', _email);

                             app.dialogs.showInfoDialog(constant.getConfigMsg(_username, _email));
                        } else {
                             app.dialogs.showErrorDialog(constant.enter_valid_email);
                        }
                   }
              } else {
                   app.dialogs.showErrorDialog(constant.enter_valid_username);
              }
         }


    } catch (err) {
         app.dialogs.showErrorDialog(err.message);
    }
}

async function _gitConfigList() {

    try {

         let isRepo = await git(_dirname).checkIsRepo();
         if (!isRepo) {
              app.dialogs.showErrorDialog(constant.init_repo_first);
              return;
         }


         let result = await git(_dirname).raw([
              'config',
              '--list'
         ]);
         console.log(result);
         let buttons=[{
              id:1,
              text:"ok"
         }];
         app.dialogs.showInfoDialog(result);
    } catch (error) {
         console.log(error);
    }


}

async function _gitPush(){
    try {
         let isRepo = await git(_dirname).checkIsRepo();

         if (!isRepo) {
              app.dialogs.showErrorDialog(constant.init_repo_first);
              return;
         }

         let result = await git(_dirname).push(['-u', 'origin', 'master'])
         app.dialogs.showInfoDialog(result);
         console.log(result);
    }catch(error){
         app.dialogs.showErrorDialog(error.message);
    }
}



async function _gitSaveChanges() {
    try {

         let isRepo = await git(_dirname).checkIsRepo();
         if (!isRepo) {
              app.dialogs.showErrorDialog(constant.init_repo_first);
              return;
         }
         let result = await git(_dirname).add('./*');
         app.dialogs.showInfoDialog(constant.changes_saved);
    } catch (error) {
         console.log(error);
    }
}
module.exports.getInit=_gitInit;
module.exports.getAddRemote=_gitAddRemote;
module.exports.getCommit=_gitCommit;
module.exports.getAddConfig=_gitAddConfig;
module.exports.getSaveChanges=_gitSaveChanges;
module.exports.getConfigList=_gitConfigList;
module.exports.getPush=_gitPush;
module.exports.projectLoaded=_projectLoaded;
