const transport = require('../transport/transport');
var url = require('url');
var path = require('path');
const fs = require('fs');
const git = require('simple-git/promise');
const constant = require('../constant');
var _fname = null;
var _mdirname = null;
var junk = require('junk');
/**
 * @function _projectLoaded
 * @description setup directory structure for git directory when project loaded
 */
function _projectLoaded() {

     _fname = app.project.getFilename();
     if(_fname==null){
          _fname=app.project.getProject().name;
     }
     let basefile = path.basename(_fname);
     let basefileName = path.parse(basefile).name;
     if (_fname) {
          _mdirname = path.dirname(_fname);
          _mdirname = _mdirname + path.sep + basefileName + '_git';

          if (!fs.existsSync(_mdirname)) {
               fs.mkdirSync(_mdirname);
               /* git=gitP(__dirname); */
               fs.readdir(_mdirname, function (err, files) {
                    console.log(files.filter(junk.not));
               });
          }
          /* else{
               const git;
          }*/

     }

}
/**
 * @function _gitInit
 * @description Initialize git in git directory
 *
 */
async function _gitInit() {

     if (!_fname && !_mdirname) {
          app.dialogs.showInfoDialog(constant.project_not_found);
          return;
     }
     try {
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               await git(_mdirname).init();
               app.dialogs.showInfoDialog(constant.repo_initialized);
          } else {
               app.dialogs.showInfoDialog(constant.repo_already_initialized);
          }
     } catch (error) {
          app.dialogs.showErrorDialog(error.message);
     }

}
/**
 * @function _gitAddRemote
 * @description Add remote address to git repository
 */
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
/**
 * @function _gitCommit
 * @description Add commit to git repository
 */
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
     /* let result = await git(_mdirname).add('./*');
     let commit = await git(_mdirname).commit('1st');
     return; */

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
/**
 * @function _gitAddConfig
 * @description Add username and email to git local configuration
 */
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
/**
 * @function _gitConfigList
 * @description display local configuration list to modal dialog
 */
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
          app.dialogs.showInfoDialog(result);
     } catch (error) {
          console.log(error);
     }


}
/**
 * @function _gitPush
 * @description Push all local commit to remote master repository
 */
async function _gitPush() {
     const mGit = git(_mdirname);

     try {
          let isRepo = await mGit.checkIsRepo();

          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }


          let res = await git(_mdirname).getRemotes(true);
          if (res.length == 1) {
               let remote = res[0];
               let pushURL = remote.refs.push

               let resUSER = await app.dialogs.showInputDialog(constant.enter_username);
               let resPASS = await app.dialogs.showInputDialog(constant.enter_password);

               let USER = resUSER.returnValue;
               let PASS = resPASS.returnValue;


               const REPO = pushURL;
               let URL = url.parse(REPO)

               const gitPushUrl = URL.protocol + '//' + USER + ':' + PASS + '@' + URL.host + URL.path;
               console.log("Git Push url", gitPushUrl);

               let vDialog = app.dialogs.showModalDialog("", constant.title_import_mi, "Please wait until push successfull", [], true);
               mGit.push(gitPushUrl, 'master')
                    .then((success) => {
                         vDialog.close();

                         setTimeout(function () {
                              app.dialogs.showInfoDialog("Push Successfull");
                         });

                    }, (error) => {
                         vDialog.close();
                         let eMsg = 'Push Failed' + '\n' + error.message;
                         app.dialogs.showErrorDialog(eMsg);
                         console.error(error.message);
                    });
          } else {
               app.dialogs.showInfoDialog(constant.add_remote);
          }

     } catch (error) {
          app.dialogs.showErrorDialog(error.message);
     }
}
/**
 * @function _gitPull
 * @description Pull latest changes from remote master repository
 */
async function _gitPull() {


     try {

          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }
     } catch (error) {
          app.dialogs.showErrorDialog(error.message);
     }

     try {
          let StatusSummary = await git(_mdirname).status();
          console.log("StatusSummary", StatusSummary);
          if (StatusSummary.files.length == 1) {
               app.dialogs.showInfoDialog(constant.commit_changes);
               return;
          }
     } catch (error) {
          app.dialogs.showErrorDialog(error.message);
     }
     
     let res = await git(_mdirname).getRemotes(true);
     if (res.length == 1) {
          let remote = res[0];
          let pushURL = remote.refs.fetch;

          let vDialog = null;
          try {
             
               vDialog = app.dialogs.showModalDialog("", constant.title_import_mi, "Please wait until pull successfull", [], true);
               let resFetch = await git(_mdirname).fetch();
               console.log("fetch", resFetch);


               let mReset = await git(_mdirname).raw(
                    [
                         'reset',
                         '--hard',
                         'origin/master'
                    ]);


               console.log("mReset", mReset);
               vDialog.close();
               if (mReset == null) {
                    return;
               }
               app.toast.info("Pull Successfull");
                 readPullDirectory(_mdirname);
          } catch (error) {
               console.error(error.message);
               if (vDialog != null) {
                    vDialog.close()
               }
               setTimeout(function () {
                    app.dialogs.showErrorDialog(error.message);
               });
          }
     }
}

function readPullDirectory(_mdirname) {
     fs.readdir(_mdirname, function (err, files) {
          if (files && files.length > 0) {
               files.filter(junk.not);
               let filesList = files.filter(function (e) {
                    return path.extname(e).toLowerCase() === '.json'
               });
               if (filesList.length == 1) {
                    let mFile = filesList[0];
                    let finalPath = _mdirname + path.sep + mFile;
                    transport.importModel(finalPath);
               }
          } else if (err) {
               app.toast.error(err.message);
          }
     });
}
/**
 * @function _gitLog
 * @description display all local commits in modal dialog 
 * @returns
 */
async function _gitLog() {

     let vDialog = null;
     try {
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          let logSummery = await git(_mdirname).log();
          if (logSummery != null) {
               let strCommit = '';
               logSummery.all.forEach(commit => {
                    let cmt = 'Commit : ' + commit.message +
                         '<br>Email : ' + commit.author_email +
                         '<br>Name : ' + commit.author_name +
                         '<br>Date : ' + commit.date;
                    cmt += '<br><br>';
                    strCommit += cmt
               });
               app.dialogs.showModalDialog("", constant.title_import_mi_commit_history, strCommit, [], true);
          }

     } catch (error) {
          console.error(error.message);
          if (vDialog != null) {
               vDialog.close()
          }
          setTimeout(function () {
               app.dialogs.showErrorDialog(error.message);
          })
     }
}
/**
 * @function _gitStatus
 * @description display all file changes in modal dialog
 */
async function _gitStatus() {

     let vDialog = null;
     try {
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          let statusSummery = await git(_mdirname).status();
          if (statusSummery == null || statusSummery =='') {
               app.dialogs.showErrorDialog(constant.summary_not_available);
               return;
          }
          if (statusSummery != null || statusSummery !='') {
               console.log('statusSummery', statusSummery);

               let not_addedFiled = '------------------------------<br><b>Not added files</b><br>------------------------------';


               let not_added = statusSummery.not_added;
               not_added.forEach(nadded => {
                    not_addedFiled += '<br>' + nadded;
               });


               let modifiedFiles = '------------------------------<br><b>Modefied files</b><br>------------------------------';


               let modified = statusSummery.modified;
               modified.forEach(modified => {
                    modifiedFiles += '<br>' + modified;
               });

               let stagedFiles = '------------------------------<br><b>Staged files</b><br>------------------------------';

               let staged = statusSummery.staged;
               staged.forEach(staged => {
                    stagedFiles += '<br>' + staged;
               });

               let finalStatus = '';
               if (not_added != null && not_added.length > 0) {
                    finalStatus += not_addedFiled + '<br><br>';
               }

               if (modified != null && modified.length > 0) {
                    finalStatus += modifiedFiles + '<br><br>';
               }

               if (staged != null && staged.length > 0) {
                    finalStatus += stagedFiles + '<br><br>';
               }

               if(not_added.length==0 && modified.length==0 && staged.length==0){
                    app.dialogs.showErrorDialog(constant.summary_not_available);
                    return;
               }
               // let finalStatus = modifiedFiles + '<br><br>' + stagedFiles + '<br><br>';
               app.dialogs.showModalDialog("", constant.title_import_mi_commit_status, finalStatus, [], true);
          }

     } catch (error) {
          console.error(error.message);
          if (vDialog != null) {
               vDialog.close()
          }
          setTimeout(function () {
               app.dialogs.showErrorDialog(error.message);
          })
     }
}
/**
 * @function _gitDiff
 * @description Display all file difference in modal dialog
 * @returns
 */
async function _gitDiff() {
     let vDialog = null;
     try {
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          let diffSummery = await git(_mdirname).diff();
          if (diffSummery != '') {
               console.log('diffSummery', diffSummery);

               let strDiff = diffSummery.replace(/(?:\r\n|\r|\n)/g, '<br>');
               if (strDiff != null) {
                    app.dialogs.showModalDialog("", constant.title_import_mi_commit_diff, strDiff, [], true);
               }

          }else{
               app.dialogs.showErrorDialog(constant.diff_not_available);
          }

     } catch (error) {
          console.error(error.message);
          if (vDialog != null) {
               vDialog.close()
          }
          setTimeout(function () {
               app.dialogs.showErrorDialog(error.message);
          });
     }
}

function _getDirectory() {
     return _mdirname;
}
module.exports.getInit = _gitInit;
module.exports.getAddRemote = _gitAddRemote;
module.exports.getCommit = _gitCommit;
module.exports.getAddConfig = _gitAddConfig;
module.exports.getConfigList = _gitConfigList;
module.exports.getPush = _gitPush;
module.exports.getPull = _gitPull;
module.exports.getLog = _gitLog;
module.exports.getStatus = _gitStatus;
module.exports.getDiff = _gitDiff;
module.exports.projectLoaded = _projectLoaded;
module.exports.getDirectory = _getDirectory;