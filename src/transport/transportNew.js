var path = require('path');
const fs = require('fs');
const fields = require('../transport/fields');
const constant = require('../constant');
let otherResources = [];
async function exportNewModel() {


    otherResources = [];
    app.dialogs.showSelectDropdownDialog(constant.msg_file_select, constant.fileOptions).then(function ({
        buttonId,
        returnValue
    }) {
        if (buttonId === 'ok') {
            let mMainObject = {};
            /* Adding resources */
            /* Working with resources */
            let arrResources = [];
            mMainObject[fields.resources] = arrResources;

            if (returnValue == "1") {
                /* Export all package */
                let packages = app.repository.select("@UMLPackage");
                let dataTypes = app.repository.select("DataTypes");
                if (dataTypes.length == 1) {
                    let dataTypePkgId = dataTypes[0]._id;
                    let filterPackages = packages.filter(pkg => {
                        return pkg._id != dataTypePkgId;
                    })

                    /* Adding Resources */
                    filterPackages.forEach(pkg => {

                        let exportElement = pkg;
                        let varSel = exportElement.getClassName();
                        let valPackagename = type.UMLPackage.name;

                        if (varSel == valPackagename) {

                            addResources(arrResources, exportElement);

                        }

                    });

                    /* Adding Datatype */
                    addDatatype(mMainObject);

                    /* Save Generated File */
                    saveFile(mMainObject)
                }

            } else if (returnValue == "2") {
                /* Export single package */
                /* Open element picker dialog to pick package */
                app.elementPickerDialog
                    .showDialog(constant.DIALOG_MSG_PICKERDIALOG, null, null) /* type.UMLPackage */
                    .then(function ({
                        buttonId,
                        returnValue
                    }) {
                        if (buttonId === "ok") {

                            let exportElement = returnValue;
                            let varSel = exportElement.getClassName();
                            let valPackagename = type.UMLPackage.name;

                            if (varSel == valPackagename) {

                                otherResources = [];
                                /* Adding Resources */
                                addResources(arrResources, exportElement);

                                /* Adding Other resources recursively */
                                addResourcesRecursively(otherResources, arrResources);

                                /* Adding Datatype */
                                addDatatype(mMainObject);

                                /* Save Generated File */
                                saveFile(mMainObject)

                            } else {
                                app.toast.info("Please select package only");
                            }
                        }
                    });
            }

        } else {
            console.log("Dialog cancelled")
        }
    });

}

function addResourcesRecursively(oResources, arrResources) {
    let newOtherResources = oResources; //JSON.parse(JSON.stringify(oResources));
    if (newOtherResources.length > 0) {
        let newOtherResource = [];
        newOtherResources.forEach(oResource => {
            let result = newOtherResource.filter(element => {
                return oResource._id == element._id
            });
            if (result.length == 0) {
                newOtherResource.push(oResource);
            }
        });

        console.log("newOtherResource ", newOtherResource);
        /* Adding new Other Resources */
        newOtherResource.forEach(pkg => {

            let exportElement = pkg;
            let varSel = exportElement.getClassName();
            let valPackagename = type.UMLPackage.name;

            if (varSel == valPackagename) {
                otherResources = [];
                let result = arrResources.filter(fResource => {
                    return fResource.name == exportElement.name;
                });

                if (result.length == 0) {
                    addResources(arrResources, exportElement);
                    addResourcesRecursively(otherResources, arrResources);
                }
            }

        });
    }
}
const JSON_FILE_FILTERS = [{
    name: 'JSON File',
    extensions: ['json']
}];

function saveFile(mMainObject) {
    /* select repository path where you want to create new repository */
    const basePath = app.dialogs.showSaveDialog(constant.msg_export_file, null, JSON_FILE_FILTERS);
    // let dirPath = path.dirname(basePath);
    if (basePath == null) {
        return;
    }

    let fileName = path.basename(basePath);
    let createNewDirecoty = path.dirname(basePath);
    /* create repository directory if not exist */
    if (!fs.existsSync(createNewDirecoty)) {
        fs.mkdirSync(createNewDirecoty);
    }
    createNewDirecoty = createNewDirecoty + path.sep + fileName;
    setTimeout(function () {
        fs.writeFile(createNewDirecoty, JSON.stringify(mMainObject, null, 4), 'utf-8', function (err) {
            if (err) {
                console.error("Error : ", err.message);
                app.dialogs.showErrorDialog(err.message);
                return;
            } else {
                app.dialogs.showInfoDialog("File exported to path " + createNewDirecoty);
                return;
            }
        });
    }, 10);
}


function addResources(arrResources, exportElement) {
    let selPackage = exportElement;

    /* Adding Entities */
    let umlEntities = app.repository.select(selPackage.name + "::@UMLClass");
    if (umlEntities.length == 0) {
        return;
    }

    let objResource = {};
    arrResources.push(objResource);
    objResource[fields.name] = selPackage.name;

    let entitiesArr = [];
    objResource[fields.entities] = entitiesArr;


    umlEntities.forEach(entity => {
        let objEntity = {};
        entitiesArr.push(objEntity);
        objEntity[fields.name] = entity.name;

        /* Adding Properties */
        if (entity.attributes.length > 0) {

            let propertiesArr = [];
            objEntity[fields.properties] = propertiesArr;
            entity[fields.attributes].forEach(property => {
                let propertyObj = {};
                propertiesArr.push(propertyObj);
                /* Adding property 'name' */
                propertyObj[fields.name] = property.name;

                /* Adding property 'status' */
                addPropertyStatus(property, propertyObj);

                /* Adding property 'dataType */
                if (property.type != null) {
                    propertyObj[fields.dataType] = property.type.name;
                }

                /* Adding property 'minCardinality' & 'maxCardinality' */
                addPropertyCardinality(property, propertyObj);


            });
        }

        /* Adding Relationship */
        let relationshipsArr = [],
            relArrEnd1 = [],
            relArrEnd2 = [],
            relArrEnd3 = [],
            relArrGeneralization = [];

        /* Add relationship that end1 have 'composition','share' and end2 have 'none' */
        relArrEnd1 = addRelationshipTargettingEnd1(entity, selPackage);

        /* Add relationship that end2 have 'composition','share' and end1 have 'none' */
        relArrEnd2 = addRelationshipTargettingEnd2(entity, selPackage);

        /* TODO Add relationship that end1 have 'none' and end2 have 'none' */
        // relArrEnd3 = addRelationshipTargettingEndNone(entity, selPackage);

        /* Add generalization relationship */
        relArrGeneralization = addRelationshipGeneralization(entity, selPackage);

        relationshipsArr = relArrEnd1.concat(relArrEnd2, relArrEnd3, relArrGeneralization);
        if (relationshipsArr.length > 0) {
            objEntity[fields.relationships] = relationshipsArr;
        }

    });
}

function addDatatype(mMainObject) {
    /* Working with dataTypes */
    let dataTypes = app.repository.select(constant.datatype_pkg_name);
    if (dataTypes.length > 0) {
        dataTypes.forEach(element => {
            let dataTypeClasses = app.repository.select(element.name + "::@UMLClass");
            let arrDataTypesClasses = [];
            mMainObject[fields.dataTypes] = arrDataTypesClasses;
            if (dataTypeClasses.length > 0) {
                dataTypeClasses.forEach(element => {
                    let dataTypeClassObject = {};
                    dataTypeClassObject[fields.name] = element.name;
                    let tags = element.tags;
                    if (tags.length > 0) {
                        let tag = tags[0];
                        if (tag.reference != null) {
                            dataTypeClassObject[tag.name] = tag.reference.name;
                        }
                    }
                    arrDataTypesClasses.push(dataTypeClassObject);
                });
            }
        });
    }
}

function addRelationshipTargettingEndNone(entity, selPackage) {
    let relationshipsArr = [];
    let umlRelationship = app.repository.select("@UMLAssociation");
    let classRelationship = umlRelationship.filter(rel => {
        return entity._id == rel.end2.reference._id;
    });
    if (classRelationship.length > 0) {
        classRelationship.forEach(rel => {
            let relationshipObj = {};
            let type = '';
            if (rel.end2.aggregation == 'shared' && rel.end1.aggregation == 'none') {
                type = 'references';
            } else if (rel.end2.aggregation == 'composite' && rel.end1.aggregation == 'none') {
                type = 'contains';
            } else {
                return;
            }

            /* Adding relationship 'name' */
            relationshipObj[fields.name] = rel.name;

            /* Adding relationship 'description' */
            if (rel.documentation != "") {
                relationshipObj[fields.description] = rel.documentation;
            }
            /* Adding relationship 'status' */
            addPropertyStatus(rel, relationshipObj);

            /* Adding relationship 'type */
            relationshipObj[fields.type] = type;

            /* Adding relationship 'minCardinality' & 'maxCardinality' */
            addPropertyCardinality(rel.end1, relationshipObj);

            /* Addint relationship 'target */
            let target = {};
            relationshipObj.target = target;
            target[fields.name] = rel.end1.reference.name;
            if (rel.end1.reference._parent._id != selPackage._id) {
                target[fields.resource] = rel.end1.reference._parent.name;
            }

            relationshipsArr.push(relationshipObj);
        });

    }
    return relationshipsArr;
}

function addRelationshipGeneralization(entity, selPackage) {
    let relationshipsArr = [];
    let umlRelationship = app.repository.select("@UMLGeneralization");
    let classRelationship = umlRelationship.filter(rel => {
        return entity._id == rel.source._id;
    });
    if (classRelationship.length > 0) {
        classRelationship.forEach(rel => {
            let relationshipObj = {};
            let type = 'typeOf';

            /* Adding relationship 'name' */
            relationshipObj[fields.name] = rel.name;

            /* Adding relationship 'description' */
            if (rel.documentation != "") {
                relationshipObj[fields.description] = rel.documentation;
            }
            /* Adding relationship 'status' */
            addPropertyStatus(rel, relationshipObj);

            /* Adding relationship 'type */
            relationshipObj[fields.type] = type;

            /* Adding relationship 'minCardinality' & 'maxCardinality' */
            addPropertyCardinality(rel.target, relationshipObj);

            /* Addint relationship 'target */
            let target = {};
            relationshipObj.target = target;
            target[fields.name] = rel.target.name;
            if (rel.target._parent._id != selPackage._id) {
                target[fields.resource] = rel.target._parent.name;
                otherResources.push(rel.target._parent);
            }

            relationshipsArr.push(relationshipObj);
        });
    }
    return relationshipsArr;
}

function addRelationshipTargettingEnd2(entity, selPackage) {
    let relationshipsArr = [];
    let umlRelationship = app.repository.select("@UMLAssociation");
    let classRelationship = umlRelationship.filter(rel => {
        return entity._id == rel.end2.reference._id;
    })
    if (classRelationship.length > 0) {
        classRelationship.forEach(rel => {
            let relationshipObj = {};
            let type = '';
            if (rel.end2.aggregation == 'shared' && rel.end1.aggregation == 'none') {
                type = 'references';
            } else if (rel.end2.aggregation == 'composite' && rel.end1.aggregation == 'none') {
                type = 'contains';
            } else {
                return;
            }

            /* Adding relationship 'name' */
            relationshipObj[fields.name] = rel.name;

            /* Adding relationship 'description' */
            if (rel.documentation != "") {
                relationshipObj[fields.description] = rel.documentation;
            }

            /* Adding relationship 'status' */
            addPropertyStatus(rel, relationshipObj);

            /* Adding relationship 'type */
            relationshipObj[fields.type] = type;

            /* Adding relationship 'minCardinality' & 'maxCardinality' */
            addPropertyCardinality(rel.end1, relationshipObj);

            /* Addint relationship 'target */
            let target = {};
            relationshipObj.target = target;
            target[fields.name] = rel.end1.reference.name;
            if (rel.end1.reference._parent._id != selPackage._id) {
                target[fields.resource] = rel.end1.reference._parent.name;
                otherResources.push(rel.end1.reference._parent);
            }

            relationshipsArr.push(relationshipObj);
        });

    }
    return relationshipsArr;
}

function addRelationshipTargettingEnd1(entity, selPackage) {
    let relationshipsArr = [];
    let umlRelationship = app.repository.select("@UMLAssociation");
    let classRelationship = umlRelationship.filter(rel => {
        return entity._id == rel.end1.reference._id;
    })
    if (classRelationship.length > 0) {

        classRelationship.forEach(rel => {
            let relationshipObj = {};
            let type = '';
            if (rel.end1.aggregation == 'shared' && rel.end2.aggregation == 'none') {
                type = 'references';
            } else if (rel.end1.aggregation == 'composite' && rel.end2.aggregation == 'none') {
                type = 'contains';
            } else {
                return;
            }

            /* Adding relationship 'name' */
            relationshipObj[fields.name] = rel.name;

            /* Adding relationship 'description' */
            if (rel.documentation != "") {
                relationshipObj[fields.description] = rel.documentation;
            }

            /* Adding relationship 'status' */
            addPropertyStatus(rel, relationshipObj);

            /* Adding relationship 'type */
            relationshipObj[fields.type] = type;

            /* Adding relationship 'minCardinality' & 'maxCardinality' */
            addPropertyCardinality(rel.end2, relationshipObj);

            /* Addint relationship 'target */
            let target = {};
            relationshipObj.target = target;
            target[fields.name] = rel.end2.reference.name;
            if (rel.end2.reference._parent._id != selPackage._id) {
                target[fields.resource] = rel.end2.reference._parent.name;
                otherResources.push(rel.end2.reference._parent);
            }

            relationshipsArr.push(relationshipObj);
        });

    }
    return relationshipsArr;
}

function addPropertyStatus(property, propertyObj) {
    let tags = property.tags;
    if (tags.length > 0) {
        let tag = tags[0];
        if (tag.reference != null) {
            propertyObj[tag.name] = tag.reference.name;
        }
    }

    // Do not remove this code this will be raised as seperate ticket later : https://edi3.slack.com/archives/DJ9KBLSPL/p1586776587005900
    /* 
    if (tags.length == 1) {
        let tag = tags[0];
        propertyObj[tag.name] = tag.reference.name;
    } else if (tags.length > 1) {
        let objExtra = {};
        propertyObj[fields.extra] = objExtra;
        
        let tagsArr = [];
        objExtra[fields.tags] = j;
        tags.forEach((tag, index) => {
            if (index == 0) {
                propertyObj[tag.name] = tag.reference.name;
            } else {

                let tagObj = {};
                tagObj[tag.name] = tag.reference.name;
                tagsArr.push(tagObj);

            }
        }); 
    }
     */
}

function addPropertyCardinality(property, propertyObj) {
    let minCardinality = '-1',
        maxCardinality = '-1';
    let multiplicity = property.multiplicity;
    /* '0..1', '1', '0..*', '1..*', '*' */
    if (multiplicity == '0..1') {
        minCardinality = 0;
        maxCardinality = 1;
    } else if (multiplicity == '1') {
        minCardinality = 1;
        maxCardinality = 1;
    } else if (multiplicity == '0..*') {
        minCardinality = 0;
    } else if (multiplicity == '1..*') {
        minCardinality = 1;
    }
    if (minCardinality != '-1') {
        propertyObj[fields.minCardinality] = minCardinality;
    }
    if (maxCardinality != '-1') {
        propertyObj[fields.maxCardinality] = maxCardinality;
    }
}

function isDatatypePkgAvail() {
    let project = app.project.getProject();
    let rootPackages = app.repository.select(project.name + "::@UMLPackage");
    let dataTypePkgResult = rootPackages.filter(pkg => {
        return pkg.name == constant.datatype_pkg_name;
    });
    if (dataTypePkgResult.length == 1) {
        return true;
    } else {
        return false;
    }
}

function importNewModel() {
    var mFiles = app.dialogs.showOpenDialog('Import file As JSON (.json)', null, JSON_FILE_FILTERS)
    if (mFiles == null) {
        return;
    }
    finalPath = mFiles[0];
    let filePath = finalPath;
    var contentStr = fs.readFileSync(filePath, 'utf8');
    var content = JSON.parse(contentStr);
    console.log("File Data : ", content);
    let dataTypesContent = content.dataTypes;

    if (!isStatusCodeAvail()) {
        addStatusCodeEnum();
    }

    if (!isDatatypePkgAvail()) {
        addDataTypePackage(dataTypesContent);
    } else {
        updateDataTypePackage(dataTypesContent);
    }


    app.modelExplorer.rebuild();
}

function addStatusCodeEnum() {
    let project = app.project.getProject();
    let createStatusCodeEnume = {};
    let mainOwnedElements = [];

    createStatusCodeEnume[fields._type] = 'UMLEnumeration';
    createStatusCodeEnume[fields.name] = constant.status_code_enum_name;
    createStatusCodeEnume[fields.ownedElements] = mainOwnedElements;
    createStatusCodeEnume[fields._parent] = {
        '$ref': project._id
    }
    let enumStatusCode = app.repository.readObject(createStatusCodeEnume);
    app.engine.addItem(project, 'ownedElements', enumStatusCode);

    let literals = ['active', 'deleted', 'deprecated', 'proposed'];
    literals.forEach(literal => {
        let createUMLLiteral = {};
        createUMLLiteral[fields._type] = 'UMLEnumerationLiteral';
        createUMLLiteral[fields.name] = literal;
        createUMLLiteral[fields._parent] = {
            '$ref': enumStatusCode._id
        }

        let enumLiteral = app.repository.readObject(createUMLLiteral);
        app.engine.addItem(enumStatusCode, 'literals', enumLiteral);
    });


    app.modelExplorer.rebuild();
}

function isStatusCodeAvail() {
    let result = app.repository.select(constant.status_code_enum_name);
    result = result.filter(mEnum => {
        return mEnum instanceof type.UMLEnumeration;
    });
    if (result.length == 1) {
        return true;
    } else {
        return false;
    }
}

function updateDataTypePackage(dataTypesContent) {
    // 'active', 'deleted', 'deprecated', 'proposed'
    let statusCodeEnum = app.repository.select(constant.status_code_enum_name)
    statusCodeEnum = statusCodeEnum.filter(cEnum => {
        return cEnum instanceof type.UMLEnumeration;
    });
    if (statusCodeEnum.length == 1) {
        statusCodeEnum = statusCodeEnum[0];
    }
    let enumStatusLiterals = statusCodeEnum.literals;

    let project = app.project.getProject();
    let rootPackages = app.repository.select(project.name + "::@UMLPackage");
    let dataTypePkgResult = rootPackages.filter(pkg => {
        return pkg.name == constant.datatype_pkg_name;
    });

    
    if (dataTypePkgResult.length == 1) {
        let dataTypePackage = dataTypePkgResult[0];
        let dataTypeClasses = app.repository.select(dataTypePackage.name + "::@UMLClass");

        let needToCreateType = [];
        dataTypesContent.forEach(dtPr => {
            let resFlter =  dataTypeClasses.filter(res => {
                return dtPr.name == res.name;
            });     
            if(resFlter.length == 0){
                needToCreateType.push(dtPr);
            }
        });

        /* Update -> datatype class, Creat/Update -> tag */
        if (dataTypeClasses.length > 0) {
            dataTypeClasses.forEach(dataTypeClass => {

                console.log("Updated datatype : ",dataTypeClass.name);
                let result = dataTypesContent.filter(contentClass => {
                    return contentClass.name == dataTypeClass.name;
                });

                if (result.length != 0) {
                    let contentClass = result[0];

                    let contentClassKeys = Object.keys(contentClass);

                    contentClassKeys.forEach(key => {
                        if (dataTypeClass.hasOwnProperty(key)) {
                            app.engine.setProperty(dataTypeClass, key, dataTypeClass[key]);
                        }

                        let tags = dataTypeClass.tags;
                        if (key == 'status' && tags.length > 0) {

                            tags.filter(tag => {
                                if (tag.name == key) {

                                    let statusName = contentClass[key];
                                    console.log("Updated status: ", statusName);
                                    let resStatus = enumStatusLiterals.filter(statusLiteral => {
                                        return statusLiteral.name == statusName;
                                    });
                                    if (resStatus.length == 1) {
                                        app.engine.setProperty(tag, 'reference', resStatus[0]);
                                    }
                                }
                            });
                        } else if (key == 'status' && tags.length == 0) {
                            console.log("Created status : ", contentClass[key]);
                            createStatusTag(contentClass,dataTypeClass);
                        }
                    });
                   
                }
            });
        }

        /* Create -> datatype class, Create -> tag */
        createDataType(needToCreateType,dataTypePackage);
    }
}

function addDataTypePackage(dataTypesContent) {
    let project = app.project.getProject();
    let createDataTypePackage = {};
    let mainOwnedElements = [];

    createDataTypePackage[fields._type] = 'UMLPackage';
    createDataTypePackage[fields.name] = constant.datatype_pkg_name;
    createDataTypePackage[fields.ownedElements] = mainOwnedElements;
    createDataTypePackage[fields._parent] = {
        '$ref': project._id
    }
    let pkg = app.repository.readObject(createDataTypePackage);
    app.engine.addItem(project, 'ownedElements', pkg);

    createDataType(dataTypesContent,pkg);

    app.modelExplorer.rebuild();
}
function createDataType(dataTypesContent,parent){
    dataTypesContent.forEach(contentClass => {
        console.log("Created datatype : ",contentClass.name);
        let createClass = [];
        createClass[fields.name] = contentClass.name;
        createClass[fields._type] = 'UMLClass';
        let dtClass = app.repository.readObject(createClass);
        app.engine.addItem(parent, 'ownedElements', dtClass);

        if (contentClass.hasOwnProperty('status')) {
            createStatusTag(contentClass,dtClass);
        }
    });
}
function createStatusTag(contentClass,dtClass) {
    let statusName = contentClass.status;
    let arrTag = [];

    let createTag = {};
    createTag[fields._type] = 'Tag';
    createTag[fields.name] = 'status';
    createTag[fields.kind] = 'reference';
    createTag[fields._parent] = {
        '$ref': dtClass._id
    }
    let resultReference = app.repository.select(statusName);
    resultReference = resultReference.filter(refe => {
        return refe instanceof type.UMLEnumerationLiteral;
    });

    if (resultReference.length > 0) {
        createTag[fields.reference] = {
            '$ref': resultReference[0]._id
        }
    }
    let cTag = app.repository.readObject(createTag);
    arrTag.push(cTag);
    app.engine.setProperty(dtClass, 'tags', arrTag);

    /*  
    "_type": "Tag",
     "_id": "AAAAAAFxXx3BFEbB/xo=",
     "_parent": {
         "$ref": "AAAAAAFxXxLWFT56jMo="
     },
     "name": "status",
     "kind": "reference",
     "reference": {
         "$ref": "AAAAAAFxXxijZUC75JM="
     } 
     */
}
module.exports.exportNewModel = exportNewModel;
module.exports.importNewModel = importNewModel;