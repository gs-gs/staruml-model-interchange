const path = require('path');

let fileName = '';
let ext = '';
function initialize() {

    let basePath = app.project.filename;
    let base = path.parse(basePath).base;
    let res=base.split(".");
    if(res.length==2){
        fileName = res[0];
        ext = res [1];
    }

}

function getFileName(){
    return fileName;
}

function getExtension(){
    return ext;
}


function getStore(){
    const store = require('data-store')({
        path: process.cwd() + '/.' + getFileName() + '_' + getExtension() + '.json'
    });
    return store;
}
module.exports.initialize = initialize;
module.exports.getStore = getStore;