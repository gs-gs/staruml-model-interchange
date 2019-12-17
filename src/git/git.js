var path = require('path');
const fs = require('fs');
const git = require('simple-git/promise');
const constant = require('../constant');
var _fname = null;
var _mdirname = null;
var junk = require('junk');

function _projectLoaded() {

     /*_fname = app.project.getFilename();
      if (_fname) {
          _mdirname = path.dirname(_fname);
          _mdirname = _mdirname+path.sep;
          fs.readdir(_mdirname, function (err, files) {
               console.log(files.filter(junk.not));
          });
     } */



     _fname = app.project.getFilename();
     if (_fname) {
          _mdirname = path.dirname(_fname);
          _mdirname = _mdirname + path.sep + 'tmp';

          if (!fs.existsSync(_mdirname)) {
               fs.mkdirSync(_mdirname);
               /* git=gitP(__dirname); */
               fs.readdir(_mdirname, function (err, files) {
                    console.log(files.filter(junk.not));
               });
          }
          /* else{
                         const git;
                    } */

     }

}
async function _gitInit() {

     if (!_fname && !_mdirname) {
          app.dialogs.showInfoDialog(constant.project_not_found);
          return;
     }
     try {
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               await git(_mdirname).init();
               /* Getting fatal error : pathspec'./*' did not match any files
               await git(_mdirname).add('./*'); */
               app.dialogs.showInfoDialog(constant.repo_initialized);
          } else {
               app.dialogs.showInfoDialog(constant.repo_already_initialized);
          }
     } catch (error) {
          app.dialogs.showErrorDialog(error.message);
     }

}

async function _gitAddRemote() {

     let isRepo = await git(_mdirname).checkIsRepo();
     if (!isRepo) {
          app.dialogs.showErrorDialog(constant.init_repo_first);
          return;
     }
     let resAddRemote = await app.dialogs.showInputDialog(constant.enter_remote_url);
     if (resAddRemote.buttonId == 'ok') {
          if (resAddRemote.returnValue) {
               try {
                    await git(_mdirname).addRemote('origin', resAddRemote.returnValue);
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

     let isRepo = await git(_mdirname).checkIsRepo();
     if (!isRepo) {
          app.dialogs.showErrorDialog(constant.init_repo_first);
          return;
     }
     let StatusSummary = await git(_mdirname).status();
     console.log("StatusSummary", StatusSummary);
     if (StatusSummary.files.length == 0) {
          app.dialogs.showInfoDialog(constant.file_change_not_found_msg);
          return;
     }

     let user = await git(_mdirname).raw([
          'config',
          'user.name'
     ]);
     console.log("User", user);

     let email = await git(_mdirname).raw([
          'config',
          'user.email'
     ]);
     console.log("Email", email);

     if (user == null || email == null) {
          app.dialogs.showInfoDialog(constant.add_credential);
          return;
     }

     let resCommit = await app.dialogs.showTextDialog(constant.enter_commit_msg, "");
     if (resCommit.buttonId == "ok") {
          if (resCommit.returnValue) {
               try {
                    let result = await git(_mdirname).add('./*');
                    let commit = await git(_mdirname).commit(resCommit.returnValue);
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
          let isRepo = await git(_mdirname).checkIsRepo();

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

                              git(_mdirname).addConfig('user.name', _username);
                              git(_mdirname).addConfig('user.email', _email);

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

          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }


          let result = await git(_mdirname).raw([
               'config',
               '--list'
          ]);
          console.log(result);
          let buttons = [{
               id: 1,
               text: "ok"
          }];
          app.dialogs.showInfoDialog(result);
     } catch (error) {
          console.log(error);
     }


}

async function _gitPush() {
     try {
          let isRepo = await git(_mdirname).checkIsRepo();

          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          let result = await git(_mdirname).push(['-u', 'origin', 'master'])
          app.dialogs.showInfoDialog(result);
          console.log(result);
     } catch (error) {
          app.dialogs.showErrorDialog(error.message);
     }
}



async function _gitSaveChanges() {
     try {

          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }
          let result = await git(_mdirname).add('./*');
          console.log("save changes",result);
          app.dialogs.showInfoDialog(constant.changes_saved);
     } catch (error) {
          console.log(error);
     }
}

function _getDirectory(){
     return _mdirname;
}
module.exports.getInit = _gitInit;
module.exports.getAddRemote = _gitAddRemote;
module.exports.getCommit = _gitCommit;
module.exports.getAddConfig = _gitAddConfig;
module.exports.getSaveChanges = _gitSaveChanges;
module.exports.getConfigList = _gitConfigList;
module.exports.getPush = _gitPush;
module.exports.projectLoaded = _projectLoaded;
module.exports.getDirectory = _getDirectory;