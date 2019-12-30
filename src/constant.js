const constant = {
    init_repo_first: "Repository not found. Please initialize repository first.",
    project_not_found: "Project not found. Please save your project before initialize repository.",
    repo_already_initialized: "Repository already initialized",
    repo_initialized: "Repository is initialized successfully, Please enter your git credential.",
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