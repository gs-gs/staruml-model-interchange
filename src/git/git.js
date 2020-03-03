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
               fs.readdir(_mdirname, function (err, files) {
               });
          }
     }

}
/**
 * @function _gitInit
 * @description Initialize git in git directory
 */
async function _gitInit() {

     if (!_fname && !_mdirname) {
          app.dialogs.showInfoDialog(constant.project_not_found);
          return;
     }
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
          if (statusSummery == null || statusSummery =='') {
               app.dialogs.showErrorDialog(constant.summary_not_available);
               return;
          }
          if (statusSummery != null || statusSummery !='') {
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

/**
 * @function _getDirectory
 * @description returns git directory path whence model file is loaded
 * @returns {string}  
 */
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