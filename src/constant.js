const constant = {
    init_repo_first: "Repository not found. Please initialize repository first.",
    project_not_found: "Project not found. Please save your project before initialize repository.",
    repo_already_initialized: "Repository already initialized",
    repo_initialized: "Repository is initialized successfully, Please enter your git credential.",
    msg_repo_not_detected: "The repository wasn't initialized or it just can't be detected. You must enter repository URL to clone",
    enter_remote_url: "Please enter your remote repository url",
    enter_username: "Enter username",
    enter_password: "Enter password",
    file_change_not_found_msg: "No changes to commit",
    commit_changes: "commit changes before pull",
    add_credential: "add credential to commit",
    add_remote: "add remote to push",
    repo_added_success: "Repository added successfully",
    invalid_repo_url: "Invalid repository url.",
    enter_commit_msg: "Enter commit message",
    invalid_commit_repo: "Invalid commit message.",
    enter_username: "Please enter username",
    enter_correct_un_pw: "\nPlease enter corrent username, email and password",
    enter_repo_name: "Please enter repository name",
    msg_repo_already_exist: "Repository already initialized or cloned",
    enter_email: "Please enter email",
    enter_valid_email: "Please enter valid email",
    enter_valid_username: "Please enter valid username",
    config_list: "Your repository",
    changes_saved: "Your changes has been saved successfully",
    getConfigMsg: configMessage,
    regex_email: "http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+",
    title_import_mi_1: "Please wait untill model interchange is being processed for the \'",
    title_import_mi_2: "\' package",
    title_import_mi: "Model Interchange",
    title_import_mi_commit_history: "Model Interchange - Commit History",
    title_import_mi_commit_diff: "Model Interchange - Diff",
    title_import_mi_commit_status: "Model Interchange - Status",
    mi_msg_success: "Package Imported",
    source: "Source",
    target: "Target",
    ref_not_found: '\' \'$ref\' not found',
    summary_not_available: 'summary not available',
    diff_not_available: 'no difference found',
    clone_successfull: 'Clone successfull at path : %s',
    clone_successfull: 'Clone successfull at path : %s',
    msg_sync_changes: 'Please go to tools -> Git -> Sync to sync changes',
    msg_clone_repository: 'Select folder where you want to clone repository',
    select_new_mdj_save_path: 'Select path to save your mdj file',
    msg_create_repository: 'Select folder where you want to create repository',
    msg_option_init_clone: 'Select one of the following options',
    save_file_before_operation: 'Please save file to perform model-interchange operations',
    include_string: 'Invalid username or password',
    CREATE_REPO: '0',
    CLONE_REPO: '1',
    ADD_REPO: '2',
    options_init_clone: [{
            text: "Clone",
            value: 1
        }, {
            text: "Create new repository",
            value: 0
        },
        {
            text: "Add local repository",
            value: 2
        }
    ],
    FETCH_REPO: '0',
    PUSH_REPO: '1',
    msg_option_sync: 'Select one of the following options',
    options_sync: [{
        text: "Fetch",
        value: 0
    }, {
        text: "Push",
        value: 1
    }],
    title_model_interchange: 'Model Interchange',
    clone_progress_msg: 'Please wait until git cloning is being processed',
    push_success_msg: 'Push Successfull',
    msg_file_select: 'Select one of the following type.',
    fileOptions: [{
        text: "Export all packages",
        value: 1
    }, {
        text: "Select one package",
        value: 2
    }],
    msg_file_saveas: 'Save File as...',
    msg_export_file:'Select path where you want to export',
    datatype_pkg_name:'DataTypes',
    status_code_enum_name:'StatusCode'
}
/**
 * @function configMessage
 * @description returns config message
 * @param {*} _username
 * @param {*} _email
 * @returns {string}
 */
function configMessage(_username, _email) {
    return "Your local configuration is\nuser.name : " + _username + "\nuser.email : " + _email;
}
module.exports = constant;