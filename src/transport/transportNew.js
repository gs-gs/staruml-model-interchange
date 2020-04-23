var forEach = require('async-foreach').forEach;
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
                    forEach(filterPackages, pkg => {

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
        forEach(newOtherResources, oResource => {
            let result = newOtherResource.filter(element => {
                return oResource._id == element._id
            });
            if (result.length == 0) {
                newOtherResource.push(oResource);
            }
        });

        console.log("newOtherResource ", newOtherResource);
        /* Adding new Other Resources */
        forEach(newOtherResource, pkg => {

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


    forEach(umlEntities, entity => {
        let objEntity = {};
        entitiesArr.push(objEntity);
        objEntity[fields.name] = entity.name;

        /* Adding Properties */
        if (entity.attributes.length > 0) {

            let propertiesArr = [];
            objEntity[fields.properties] = propertiesArr;
            forEach(entity[fields.attributes], property => {
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
        forEach(dataTypes, element => {
            let dataTypeClasses = app.repository.select(element.name + "::@UMLClass");
            let arrDataTypesClasses = [];
            mMainObject[fields.dataTypes] = arrDataTypesClasses;
            if (dataTypeClasses.length > 0) {
                forEach(dataTypeClasses, element => {
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
        forEach(classRelationship, rel => {
            let relationshipObj = {};
            let type = '';
            if (rel.end2.aggregation == 'shared' && rel.end1.aggregation == 'none') {
                type = fields.references;
            } else if (rel.end2.aggregation == 'composite' && rel.end1.aggregation == 'none') {
                type = fields.contains;
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
        forEach(classRelationship, rel => {
            let relationshipObj = {};
            let type = fields.typeOf;

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
        forEach(classRelationship, rel => {
            let relationshipObj = {};
            let type = '';
            if (rel.end2.aggregation == 'shared' && rel.end1.aggregation == 'none') {
                type = fields.references;
            } else if (rel.end2.aggregation == 'composite' && rel.end1.aggregation == 'none') {
                type = fields.contains;
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

        forEach(classRelationship, rel => {
            let relationshipObj = {};
            let type = '';
            if (rel.end1.aggregation == 'shared' && rel.end2.aggregation == 'none') {
                type = fields.references;
            } else if (rel.end1.aggregation == 'composite' && rel.end2.aggregation == 'none') {
                type = fields.contains;
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
        forEach(tags,(tag, index) => {
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

    /* Adding Status Code Enum */
    if (!isStatusCodeAvail()) {
        addStatusCodeEnum();
    }

    /* Adding / Updating Data Type Package */
    if (!isDatatypePkgAvail()) {
        addDataTypePackage(dataTypesContent);
    } else {
        updateDataTypePackage(dataTypesContent);
    }


    let statusCodes = app.repository.select(constant.status_code_enum_name)[0];
    statusCodes = statusCodes.literals;

    let dataTypes = app.repository.select(constant.datatype_pkg_name)[0];
    dataTypes = app.repository.select(dataTypes.name + '::@UMLClass');

    /* Updating Context -> Class, Properties */
    updateContext(statusCodes, dataTypes, content);

    app.modelExplorer.rebuild();
}

function updatingProperties(mClass, entity, dataTypes, statusCodes) {
    let mClassProperties = mClass.attributes;
    let entityProperties = entity[fields.properties];
    if (entity.hasOwnProperty(fields.properties)) {

        if (entityProperties != null && entityProperties.length > 0) {

            forEach(entityProperties, entityProp => {
                let cProp = mClassProperties.filter(cProp => {
                    return entityProp.name == cProp.name;
                });
                if (cProp.length != 0) {
                    cProp = cProp[0];

                    let name = '';
                    name = entityProp[fields.name];

                    /* Updating datatype */
                    if (entityProp.hasOwnProperty(fields.dataType)) {

                        let dataType = '';
                        dataType = entityProp[fields.dataType];

                        let resDType = dataTypes.filter(dType => {
                            return dType.name == dataType;
                        });

                        if (resDType.length != 0) {
                            resDType = resDType[0];
                        }

                        app.engine.setProperty(cProp, fields.type, resDType);
                    }

                    /* Updating status */
                    if (entityProp.hasOwnProperty(fields.status)) {

                        updateStatus(entityProp, cProp, statusCodes);

                    }

                    /* Updating multiplicity */
                    if (entityProp.hasOwnProperty(fields.minCardinality) || entityProp.hasOwnProperty(fields.maxCardinality)) {

                        updateMultiplicity(cProp, entityProp);

                    }

                }
            });

        }
    }
}

function updateMultiplicity(cProp, entityProp) {
    let minCardinality = '-1',
        maxCardinality = '-1';
    if (entityProp.hasOwnProperty(fields.minCardinality)) {
        minCardinality = entityProp[fields.minCardinality];
    }
    if (entityProp.hasOwnProperty(fields.maxCardinality)) {
        maxCardinality = entityProp[fields.maxCardinality];
    }

    let multiplicity = '';
    if (minCardinality == 0 && maxCardinality == 1) {
        multiplicity = '0..1';
    } else if (minCardinality == 1 && maxCardinality == 1) {
        multiplicity = '1';
    } else if (minCardinality == 0 && maxCardinality == '-1') {
        multiplicity = '0..*';
    } else if (minCardinality == 1 && maxCardinality == '-1') {
        multiplicity = '1..*';
    }

    app.engine.setProperty(cProp, fields.multiplicity, multiplicity);

    /* 
    '0..1'  =   minCardinality = 0, maxCardinality = 1;
    '1'     =   minCardinality = 1, maxCardinality = 1;
    '0..*   =   minCardinality = 0
    '1..*'  =   minCardinality = 1
    */
}

function updateContext(statusCodes, dataTypes, content) {
    let resourceContent = content.resources;

    /* Updating class and properties */
    forEach(resourceContent, resource => {
        let resourcePackage = app.repository.select(resource.name);
        resourcePackage = resourcePackage.filter(res => {
            return res instanceof type.UMLPackage;
        });
        if (resourcePackage.length != 0) {
            let rPackage = resourcePackage[0];
            console.log("---------------Package to update : " + rPackage.name + "---------------");
            let entities = resource[fields.entities];
            let classesFromPackage = app.repository.select(rPackage.name + "::@UMLClass");
            forEach(entities, entity => {
                let resClass = classesFromPackage.filter(mClass => {
                    return mClass.name == entity.name;
                });
                if (resClass.length != 0) {
                    let mClass = resClass[0];
                    console.log("---------------Classes to update : " + mClass.name);

                    updatingProperties(mClass, entity, dataTypes, statusCodes);


                }
            });
        }
    });

    /* Updating Relationship */
    console.log("Relationship");
    forEach(resourceContent, resource => {
        let resourcePackage = app.repository.select(resource.name);
        resourcePackage = resourcePackage.filter(res => {
            return res instanceof type.UMLPackage;
        });
        if (resourcePackage.length != 0) {
            let rPackage = resourcePackage[0];
            console.log("---------------Package to update : " + rPackage.name + "---------------");
            let entities = resource[fields.entities];
            let classesFromPackage = app.repository.select(rPackage.name + "::@UMLClass");
            forEach(entities, entity => {
                let resClass = classesFromPackage.filter(mClass => {
                    return mClass.name == entity.name;
                });
                if (resClass.length != 0) {
                    let mClass = resClass[0];
                    console.log("---------------Classe : " + mClass.name);

                    if (entity.hasOwnProperty(fields.relationships)) {


                        let entityRelationships = entity[fields.relationships];


                        entityRelationships.filter(eRelationship => {

                            /* Reletionship fields */
                            /* 'name' */
                            /* 'description' */
                            /* 'status' */
                            /* 'type  */
                            /* 'minCardinality', 'maxCardinality */
                            /* 'target  */

                            if (eRelationship.type == fields.references) {
                                let foundRelationship = app.repository.select("@UMLAssociation[name=" + eRelationship.name + "]");

                                if (foundRelationship.length != 0) {
                                    foundRelationship = foundRelationship[0];
                                    console.log("found relationship : ", foundRelationship);

                                    if (isRelationshipValid(eRelationship, foundRelationship, mClass)) {


                                        /* Updating relationship description */
                                        if (eRelationship.hasOwnProperty(fields.description)) {

                                            app.engine.setProperty(foundRelationship, fields.documentation, eRelationship.description);

                                        }

                                        /* Updating relationship multiplicity */
                                        if (eRelationship.hasOwnProperty(fields.minCardinality) || eRelationship.hasOwnProperty(fields.maxCardinality)) {

                                            let sourceEnd, targetEnd;
                                            if (foundRelationship.end1.aggregation == 'shared' && foundRelationship.end2.aggregation == 'none') {
                                                // target is end2 
                                                sourceEnd = foundRelationship.end1;
                                                targetEnd = foundRelationship.end2;
                                            } else if (foundRelationship.end2.aggregation == 'shared' && foundRelationship.end1.aggregation == 'none') {
                                                // target is end1
                                                sourceEnd = foundRelationship.end2;
                                                targetEnd = foundRelationship.end1;
                                            }

                                            updateMultiplicity(targetEnd, eRelationship);

                                        }

                                        /* Updating relationship status */

                                        if (eRelationship.hasOwnProperty(fields.status)) {

                                            updateStatus(eRelationship, foundRelationship, statusCodes);

                                        }
                                    }
                                }
                            } else if (eRelationship.type == fields.contains) {
                                let foundRelationship = app.repository.select("@UMLAssociation[name=" + eRelationship.name + "]");

                                if (foundRelationship.length != 0) {
                                    foundRelationship = foundRelationship[0];
                                    console.log("found relationship : ", foundRelationship);

                                    if (isRelationshipValid(eRelationship, foundRelationship, mClass)) {
                                        /* Updating relationship description */
                                        if (eRelationship.hasOwnProperty(fields.description)) {

                                            app.engine.setProperty(foundRelationship, fields.documentation, eRelationship.description);

                                        }

                                        /* Updating relationship multiplicity */
                                        if (eRelationship.hasOwnProperty(fields.minCardinality) || eRelationship.hasOwnProperty(fields.maxCardinality)) {

                                            let targetEnd;
                                            if (foundRelationship.end1.aggregation == 'composite' && foundRelationship.end2.aggregation == 'none') {
                                                // target is end2 
                                                targetEnd = foundRelationship.end2;
                                            } else if (foundRelationship.end2.aggregation == 'composite' && foundRelationship.end1.aggregation == 'none') {
                                                // target is end1
                                                targetEnd = foundRelationship.end1;
                                            }

                                            updateMultiplicity(targetEnd, eRelationship);

                                        }

                                        /* Updating relationship status */

                                        if (eRelationship.hasOwnProperty(fields.status)) {

                                            updateStatus(eRelationship, foundRelationship, statusCodes);

                                        }
                                    }


                                }
                            } else if (eRelationship.type == fields.typeOf) {
                                let foundRelationship = app.repository.select("@UMLGeneralization[name=" + eRelationship.name + "]");
                                if (foundRelationship.length != 0) {
                                    foundRelationship = foundRelationship[0];
                                    console.log("found relationship : ", foundRelationship);

                                    if (isRelationshipValid(eRelationship, foundRelationship, mClass)) {

                                        /* Updating relationship description */

                                        if (eRelationship.hasOwnProperty(fields.description)) {

                                            app.engine.setProperty(foundRelationship, fields.documentation, eRelationship.description);

                                        }

                                        /* Updating relationship status */

                                        if (eRelationship.hasOwnProperty(fields.status)) {

                                            updateStatus(eRelationship, foundRelationship, statusCodes);

                                        }

                                    }

                                }
                            }

                        });
                    }

                }
            });
        }
    });
}

function isRelationshipValid(eRelationship, foundRelationship, mClass) {
    let resourceLocation = null;
    if (eRelationship.target.hasOwnProperty(fields.resource)) {
        resourceLocation = eRelationship.target.resource;
    }

    if (eRelationship.type == fields.references) {

        let sourceEnd, targetEnd;
        if (foundRelationship.end1.aggregation == 'shared' && foundRelationship.end2.aggregation == 'none') {
            // target is end2 
            sourceEnd = foundRelationship.end1;
            targetEnd = foundRelationship.end2;
        } else if (foundRelationship.end2.aggregation == 'shared' && foundRelationship.end1.aggregation == 'none') {
            // target is end1
            sourceEnd = foundRelationship.end2;
            targetEnd = foundRelationship.end1;
        }

        if (resourceLocation == null) {
            if (sourceEnd.reference._parent.name == mClass._parent.name &&
                targetEnd.reference._parent.name == mClass._parent.name) {
                return true;
            }
        } else {
            if (sourceEnd.reference._parent.name == mClass._parent.name &&
                targetEnd.reference._parent.name == resourceLocation) {
                return true;
            }
        }
    } else if (eRelationship.type == fields.contains) {

        let sourceEnd, targetEnd;
        if (foundRelationship.end1.aggregation == 'composite' && foundRelationship.end2.aggregation == 'none') {
            // target is end2 
            sourceEnd = foundRelationship.end1;
            targetEnd = foundRelationship.end2;
        } else if (foundRelationship.end2.aggregation == 'composite' && foundRelationship.end1.aggregation == 'none') {
            // target is end1
            sourceEnd = foundRelationship.end2;
            targetEnd = foundRelationship.end1;
        }

        if (resourceLocation == null) {
            if (sourceEnd.reference._parent.name == mClass._parent.name &&
                targetEnd.reference._parent.name == mClass._parent.name) {
                return true;
            }
        } else {
            if (sourceEnd.reference._parent.name == mClass._parent.name &&
                targetEnd.reference._parent.name == resourceLocation) {
                return true;
            }
        }
    } else if (eRelationship.type == fields.typeOf) {

        let sourceEnd, targetEnd;

        sourceEnd = foundRelationship.source;
        targetEnd = foundRelationship.target;


        if (resourceLocation == null) {
            if (sourceEnd._parent.name == mClass._parent.name &&
                targetEnd._parent.name == mClass._parent.name) {
                return true;
            }
        } else {
            if (sourceEnd._parent.name == mClass._parent.name &&
                targetEnd._parent.name == resourceLocation) {
                return true;
            }
        }
    }
    return false;
}

function updateStatus(sObject, tElement, statusCodes) {
    let status = '';
    status = sObject[fields.status];
    let cTags = tElement.tags;
    let resTags = cTags.filter(tag => {
        return tag.name == [fields.status];
    });
    if (resTags.length != 0) {
        let mTag = resTags[0];
        let resSCode = statusCodes.filter(literal => {
            return literal.name == status;
        });
        if (resSCode.length != 0) {
            resSCode = resSCode[0];
            app.engine.setProperty(mTag, fields.reference, resSCode);
        }
    }
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
    forEach(literals, literal => {
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
        forEach(dataTypesContent, dtPr => {
            let resFlter = dataTypeClasses.filter(res => {
                return dtPr.name == res.name;
            });
            if (resFlter.length == 0) {
                needToCreateType.push(dtPr);
            }
        });

        /* Update -> datatype class, Creat/Update -> tag */
        if (dataTypeClasses.length > 0) {
            forEach(dataTypeClasses, dataTypeClass => {

                console.log("Updated datatype : ", dataTypeClass.name);
                let result = dataTypesContent.filter(contentClass => {
                    return contentClass.name == dataTypeClass.name;
                });

                if (result.length != 0) {
                    let contentClass = result[0];

                    let contentClassKeys = Object.keys(contentClass);

                    forEach(contentClassKeys, key => {
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
                            createStatusTag(contentClass, dataTypeClass);
                        }
                    });

                }
            });
        }

        /* Create -> datatype class, Create -> tag */
        createDataType(needToCreateType, dataTypePackage);
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

    createDataType(dataTypesContent, pkg);

    app.modelExplorer.rebuild();
}

function createDataType(dataTypesContent, parent) {
    forEach(dataTypesContent, contentClass => {
        console.log("Created datatype : ", contentClass.name);
        let createClass = [];
        createClass[fields.name] = contentClass.name;
        createClass[fields._type] = 'UMLClass';
        let dtClass = app.repository.readObject(createClass);
        app.engine.addItem(parent, 'ownedElements', dtClass);

        if (contentClass.hasOwnProperty('status')) {
            createStatusTag(contentClass, dtClass);
        }
    });
}

function createStatusTag(contentClass, dtClass) {
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

}
module.exports.exportNewModel = exportNewModel;
module.exports.importNewModel = importNewModel;