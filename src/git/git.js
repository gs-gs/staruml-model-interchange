const transport = require('../transport/transport');
const nodeUtils = require('util');
const dataStore = require('../preference/datastore');
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
     dataStore.initialize();
     _mdirname = dataStore.getStore().get('repoPath');
     console.log("_mdirname", _mdirname);
     /* _fname = app.project.getFilename();
     if (_fname == null) {
          _fname = app.project.getProject().name;
     }
     let basefile = path.basename(_fname);
     let basefileName = path.parse(basefile).name;
     if (_fname) {
          _mdirname = path.dirname(_fname);
          _mdirname = _mdirname + path.sep + basefileName + '_git';

          if (!fs.existsSync(_mdirname)) {
               fs.mkdirSync(_mdirname);
               fs.readdir(_mdirname, function (err, files) {});
          }
     } */



}
/**
 * @function _gitInit
 * @description Initialize git in git directory
 */
async function _gitInit() {

     /* if (!_fname && !_mdirname) {
          app.dialogs.showInfoDialog(constant.project_not_found);
          return;
     } */
     try {
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               await git(_mdirname).init();
               app.dialogs.showInfoDialog(constant.repo_initialized);
          } else {
               app.dialogs.showInfoDialog(constant.repo_already_initialized);
          }
     } catch (error) {
          console.error(error.message);
          app.dialogs.showErrorDialog(error.message);
     }

}
/**
 * @function _gitAddRemote
 * @description Add remote address to git repository
 */
async function _gitAddRemote() {

     /* check for repository is exist or not */
     let isRepo = await git(_mdirname).checkIsRepo();
     if (!isRepo) {
          app.dialogs.showErrorDialog(constant.init_repo_first);
          return;
     }

     let resAddRemote = await app.dialogs.showInputDialog(constant.enter_remote_url);
     if (resAddRemote.buttonId == 'ok') {
          if (resAddRemote.returnValue) {
               try {
                    /* add remote repository in git config  */
                    await git(_mdirname).addRemote('origin', resAddRemote.returnValue);
                    app.dialogs.showInfoDialog(constant.repo_added_success);
               } catch (error) {
                    console.error(error.message);
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

     /* check for repository is exist or not */
     let isRepo = await git(_mdirname).checkIsRepo();
     if (!isRepo) {
          app.dialogs.showErrorDialog(constant.init_repo_first);
          return;
     }

     /* check for recent changes before commit. If no changes found, it will not go for commit. It will display alert */
     let StatusSummary = await git(_mdirname).status();
     if (StatusSummary.files.length == 0) {
          app.dialogs.showInfoDialog(constant.file_change_not_found_msg);
          return;
     }

     /* check for username is available or not before commit  */
     let user = await git(_mdirname).raw([
          'config',
          'user.name'
     ]);

     /* check for email is available or not before commit  */
     let email = await git(_mdirname).raw([
          'config',
          'user.email'
     ]);

     /* if username and email is not available, it will alert accordingly */
     if (user == null || email == null) {
          app.dialogs.showInfoDialog(constant.add_credential);
          return;
     }

     /* alert user to enter commit message */
     let resCommit = await app.dialogs.showTextDialog(constant.enter_commit_msg, "");
     if (resCommit.buttonId == "ok") {
          if (resCommit.returnValue) {
               try {
                    /* stage all files before commit */
                    let result = await git(_mdirname).add('./*');

                    /* commit changes */
                    let commit = await git(_mdirname).commit(resCommit.returnValue);
               } catch (error) {
                    console.error(error.message);
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
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();

          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          let _username = null,
               _email = null;

          /* alert user to enter username */
          let resUsername = await app.dialogs.showInputDialog(constant.enter_username);
          if (resUsername.buttonId == 'ok') {
               _username = resUsername.returnValue;
               if (_username) {
                    /* alert user to enter email */
                    let resPassword = await app.dialogs.showInputDialog(constant.enter_email);
                    if (resPassword.buttonId == 'ok') {
                         _email = resPassword.returnValue;
                         if (_email) {

                              /* add username into local git config */
                              git(_mdirname).addConfig('user.name', _username);

                              /* add email into local git config */
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
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          /* get all git local configuration */
          let result = await git(_mdirname).raw([
               'config',
               '--list'
          ]);
          app.dialogs.showInfoDialog(result);
     } catch (error) {
          console.error(error.message);
          app.dialogs.showErrorDialog(error.message);
     }


}
/**
 * @function _gitPush
 * @description Push all local commit to remote master repository
 */
async function _gitPush() {
     const mGit = git(_mdirname);

     try {
          /* check for repository is exist or not */
          let isRepo = await mGit.checkIsRepo();

          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }


          /* get local remote url  */
          let res = await git(_mdirname).getRemotes(true);
          if (res.length == 1) {
               let remote = res[0];
               let pushURL = remote.refs.push

               /* alert user to enter username  */
               let resUSER = await app.dialogs.showInputDialog(constant.enter_username);

               /* alert user to enter username  */
               let resPASS = await app.dialogs.showInputDialog(constant.enter_password);

               let USER = resUSER.returnValue;
               let PASS = resPASS.returnValue;


               const REPO = pushURL;
               let URL = url.parse(REPO)

               const gitPushUrl = URL.protocol + '//' + USER + ':' + PASS + '@' + URL.host + URL.path;

               let vDialog = app.dialogs.showModalDialog("", constant.title_import_mi, "Please wait until push successfull", [], true);
               /* push all commits to remote master branch  */
               mGit.push(gitPushUrl, 'master')
                    .then((success) => {
                         vDialog.close();

                         setTimeout(function () {
                              app.dialogs.showInfoDialog("Push Successfull");
                         });

                    }, (error) => {
                         console.error(error.message);
                         vDialog.close();
                         let eMsg = 'Push Failed' + '\n' + error.message;
                         app.dialogs.showErrorDialog(eMsg);
                    });
          } else {
               app.dialogs.showInfoDialog(constant.add_remote);
          }

     } catch (error) {
          console.error(error.message);
          app.dialogs.showErrorDialog(error.message);
     }
}

function isChangesAvailable() {
     return new Promise(async (resolve, reject) => {
          let result = {};
          try {
               /* check for repository is exist or not */
               let isRepo = await git(_mdirname).checkIsRepo();
               if (!isRepo) {

                    // app.dialogs.showErrorDialog(constant.init_repo_first);
                    result.result = false;
                    result.message = constant.init_repo_first;
                    resolve(result);
               }
          } catch (error) {
               console.error(error.message);
               // app.dialogs.showErrorDialog(error.message);
               result.result = false;
               result.message = error.message;
               resolve(result);
          }

          try {
               /* check existing file changes before pull data from remote repository */
               let StatusSummary = await git(_mdirname).status();
               if (StatusSummary.files.length > 0) {
                    // app.dialogs.showInfoDialog(constant.commit_changes);
                    // return true;
                    result.result = true;
                    result.message = constant.commit_changes;
                    resolve(result);
               } else {
                    result.result = false;
                    result.message = "No changes available";
                    resolve(result);
               }
          } catch (error) {
               console.error(error.message);
               // app.dialogs.showErrorDialog(error.message);
               result.result = false;
               result.message = error.message;
               resolve(result);
          }

     });

}

// async function isChangesAvailable() {
//      try {
//           /* check for repository is exist or not */
//           let isRepo = await git(_mdirname).checkIsRepo();
//           if (!isRepo) {
//                app.dialogs.showErrorDialog(constant.init_repo_first);
//                return;
//           }
//      } catch (error) {
//           console.error(error.message);
//           app.dialogs.showErrorDialog(error.message);
//      }

//      try {
//           /* check existing file changes before pull data from remote repository */
//           let StatusSummary = await git(_mdirname).status();
//           if (StatusSummary.files.length == 1) {
//                // app.dialogs.showInfoDialog(constant.commit_changes);
//                return true;
//           }
//      } catch (error) {
//           console.error(error.message);
//           app.dialogs.showErrorDialog(error.message);
//      }
//      return false;
// }
/**
 * @function _gitPull
 * @description Pull latest changes from remote master repository and override local content
 */
async function _gitPull() {

     try {
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }
     } catch (error) {
          console.error(error.message);
          app.dialogs.showErrorDialog(error.message);
     }

     try {
          /* check existing file changes before pull data from remote repository */
          let StatusSummary = await git(_mdirname).status();
          if (StatusSummary.files.length == 1) {
               app.dialogs.showInfoDialog(constant.commit_changes);
               return;
          }
     } catch (error) {
          console.error(error.message);
          app.dialogs.showErrorDialog(error.message);
     }

     /* pull data from remote repository  */
     let res = await git(_mdirname).getRemotes(true);
     if (res.length == 1) {
          let remote = res[0];
          let pushURL = remote.refs.fetch;

          let vDialog = null;
          try {

               vDialog = app.dialogs.showModalDialog("", constant.title_import_mi, "Please wait until pull successfull", [], true);
               let resFetch = await git(_mdirname).fetch();


               /* hard reset local data  */
               let mReset = await git(_mdirname).raw(
                    [
                         'reset',
                         '--hard',
                         'origin/master'
                    ]);

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
/**
 * @function readPullDirectory
 * @description read model-interchange json file from git directory and import that file
 */
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
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          /* display all commits in modal dialog */
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
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          /* get local file changes list  */
          let statusSummery = await git(_mdirname).status();
          if (statusSummery == null || statusSummery == '') {
               app.dialogs.showErrorDialog(constant.summary_not_available);
               return;
          }
          if (statusSummery != null || statusSummery != '') {
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

               if (not_added.length == 0 && modified.length == 0 && staged.length == 0) {
                    app.dialogs.showErrorDialog(constant.summary_not_available);
                    return;
               }
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
          /* check for repository is exist or not */
          let isRepo = await git(_mdirname).checkIsRepo();
          if (!isRepo) {
               app.dialogs.showErrorDialog(constant.init_repo_first);
               return;
          }

          /* get changes list */
          let diffSummery = await git(_mdirname).diff();
          if (diffSummery != '') {

               let strDiff = diffSummery.replace(/(?:\r\n|\r|\n)/g, '<br>');
               if (strDiff != null) {
                    app.dialogs.showModalDialog("", constant.title_import_mi_commit_diff, strDiff, [], true);
               }

          } else {
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

/**
 * @function _getDirectory
 * @description returns git directory path whence model file is loaded
 * @returns {string}  
 */
function _getDirectory() {
     return _mdirname;
}

async function _gitClone() {

     /* get local remote url  */
     let repoResult = await app.dialogs.showInputDialog(constant.enter_remote_url);
     let repoURL = repoResult.returnValue;

     if (repoURL == '') {
          return;
     }

     /* alert user to enter username  */
     let resUSER = await app.dialogs.showInputDialog(constant.enter_username);
     resUSER = resUSER.returnValue;
     if (resUSER == '') {
          return;
     }

     /* alert user to enter username  */
     let resPASS = await app.dialogs.showInputDialog(constant.enter_password);
     resPASS = resPASS.returnValue;
     if (resPASS == '') {
          return;
     }

     let USER = resUSER;
     let PASS = resPASS;


     const REPO = repoURL;
     let URL = url.parse(REPO)

     const cloneURL = URL.protocol + '//' + USER + ':' + PASS + '@' + URL.host + URL.path;

     let cloneFolderName = path.basename(cloneURL);
     const basePath = app.dialogs.showSaveDialog(constant.msg_clone_repository, null, null);
     if (basePath == null) {
          return;
     }
     // console.log(basePath);
     // Returns an array of paths of selected files

     if (!fs.existsSync(basePath)) {
          fs.mkdirSync(basePath);
     }


     let dm = app.dialogs;
     let mDialog = dm.showModalDialog("", constant.title_model_interchange, constant.clone_progress_msg, [], true);
     setTimeout(async function () {
          git(basePath).silent(true)
               .clone(cloneURL)
               .then(() => {
                    mDialog.close();
                    setTimeout(function () {

                         console.log('finished')
                         let clonePath = basePath + path.sep + cloneFolderName;
                         dataStore.getStore().set('repoPath', clonePath);
                         _mdirname = clonePath;
                         let cloneMsg = nodeUtils.format(constant.clone_successfull, clonePath, constant.msg_sync_changes);
                         app.dialogs.showInfoDialog(cloneMsg);
                         readPullDirectory(_mdirname);

                    }, 10);
               })
               .catch((error) => {
                    mDialog.close();
                    setTimeout(function () {
                         app.dialogs.showErrorDialog(error.message);
                    }, 10);
               });
     }, 0);


}
async function initClone() {
     console.log("initClone");
     _mdirname = dataStore.getStore().get('repoPath');

     let isDir = false;
     if (_mdirname != null && !fs.existsSync(_mdirname)) {
          fs.mkdirSync(_mdirname, {
               recursive: true
          });
     }

     let isRepo = await git(_mdirname).checkIsRepo();
     if (!isRepo) {
          let resultDialog = app.dialogs.showAlertDialog(constant.msg_repo_not_detected);
          console.log(resultDialog);
          _gitClone();

          /* app.dialogs.showSelectDropdownDialog(constant.msg_option_init_clone, constant.options_init_clone).then(function ({
               buttonId,
               returnValue
          }) {
               console.log("returnValue", returnValue);
               if (buttonId === 'ok') {

                    if (returnValue === constant.CREATE_REPO) {
                         console.log("create repo");
                         _gitCreateNewRepo();
                    } else if (returnValue === constant.CLONE_REPO) {
                         _gitClone();
                    } else if (returnValue === constant.ADD_REPO) {
                         console.log("add repo");
                    }

               } else {
                    console.log("User canceled")
               }
          }); */
     } else {
          app.dialogs.showInfoDialog(constant.msg_repo_already_exist);
     }


}
async function _sync() {
     const mGit = git(_mdirname);
     try {
          let isChanges = await isChangesAvailable();
          
          if (isChanges.result) {
               console.log("push...!");
               let res = await app.dialogs.showConfirmDialog("Would you like to push your changes?");
               if (res == "ok") {
                    /* check for username is available or not before commit  */
                    let user = await mGit.raw([
                         'config',
                         'user.name'
                    ]);

                    /* check for email is available or not before commit  */
                    let email = await mGit.raw([
                         'config',
                         'user.email'
                    ]);

                    /* if username and email is not available, it will alert accordingly */
                    if (user == null) {
                         /* alert user to enter username */
                         let resUsername = await app.dialogs.showInputDialog(constant.enter_username);
                         if (resUsername.buttonId == 'ok') {
                              user = resUsername.returnValue;

                         } else {
                              app.dialogs.showAlertDialog(constant.enter_username);
                              return;
                         }
                    }

                    if (email == null) {

                         /* alert user to enter email */
                         let resPassword = await app.dialogs.showInputDialog(constant.enter_email);
                         if (resPassword.buttonId == 'ok') {
                              email = resPassword.returnValue;

                         } else {
                              app.dialogs.showAlertDialog(constant.enter_email);
                              return;
                         }

                    }

                    user = user.trim();
                    email = email.trim();

                    if (user != null && email != null) {
                         /* add username into local git config */
                         mGit.addConfig('user.name', user);

                         /* add email into local git config */
                         mGit.addConfig('user.email', email);
                    }

                    /* alert user to enter commit message */
                    let resCommit = await app.dialogs.showTextDialog(constant.enter_commit_msg, "");
                    if (resCommit.buttonId == "ok") {
                         if (resCommit.returnValue) {
                              try {
                                   /* stage all files before commit */
                                   let result = await mGit.add('./*');

                                   /* commit changes */
                                   let commit = await mGit.commit(resCommit.returnValue);
                              } catch (error) {
                                   console.error(error.message);
                                   app.dialogs.showErrorDialog(error.message);
                              }
                         } else {
                              app.dialogs.showErrorDialog(constant.invalid_commit_msg);
                         }
                    }

                    /* get local remote url  */
                    let res = await mGit.getRemotes(true);
                    if (res.length == 1) {
                         let remote = res[0];
                         let pushURL = remote.refs.push

                         /* alert user to enter username  */
                         let resPASS = await app.dialogs.showInputDialog(constant.enter_password);

                         let USER = user
                         let PASS = resPASS.returnValue;


                         const REPO = pushURL;
                         let URL = url.parse(REPO)

                         const gitPushUrl = URL.protocol + '//' + USER + ':' + PASS + '@' + URL.host + URL.path;

                         let vDialog = app.dialogs.showModalDialog("", constant.title_import_mi, "Please wait until push successfull", [], true);
                         /* push all commits to remote master branch  */
                         mGit.push(gitPushUrl, 'master')
                              .then((success) => {
                                   vDialog.close();

                                   setTimeout(function () {
                                        app.dialogs.showInfoDialog("Push Successfull");
                                   });

                              }, (error) => {
                                   console.error(error.message);
                                   vDialog.close();
                                   let eMsg = 'Push Failed' + '\n' + error.message;
                                   app.dialogs.showErrorDialog(eMsg);
                              });
                    } else {
                         app.dialogs.showInfoDialog(constant.add_remote);
                    }

               }


          } else {
               console.log("pull...!");
          }
     } catch (error) {
          console.log(error.message);
          app.dialogs.showErrorDialog(error.message);
     }


     /* let res = await app.dialogs.showSelectDropdownDialog(constant.msg_option_sync, constant.options_sync);
     if (res != null && res.buttonId == 'ok') {
          if (res.returnValue == constant.FETCH_REPO) {
               console.log("fetch repo");
          } else if (res.returnValue == constant.PUSH_REPO) {
               console.log("push repo");
          }
     } */
}
async function _gitCreateNewRepo() {


     /* alert user to enter repository name  */
     let resRepoName = await app.dialogs.showInputDialog(constant.enter_repo_name);
     resRepoName = resRepoName.returnValue;
     if (resRepoName == '') {
          return;
     }

     /* select repository path where you want to create new repository */
     const basePath = app.dialogs.showSaveDialog(constant.msg_create_repository, null, null);
     if (basePath == null) {
          return;
     }

     let createNewDirecoty = basePath + path.sep + resRepoName;
     /* create repository directory if not exist */
     if (!fs.existsSync(createNewDirecoty)) {
          fs.mkdirSync(createNewDirecoty, {
               recursive: true
          });
     }

     _mdirname = createNewDirecoty;
     _gitInit();

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
module.exports.gitClone = _gitClone;
module.exports.initClone = initClone;
module.exports.sync = _sync;
module.exports.gitCreateNewRepo = _gitCreateNewRepo;