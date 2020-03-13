var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var mEntity = require('./entity');
var mEnum = require('./enum');
var mEvent = require('./event');
var mUtils = require('./utils');
var constant = require('../constant');
const fs = require('fs');
const CircularJSON = require('circular-json');
const git = require('../git/git');
var path = require('path');
var mRelationship = require('./relationship');
const JSON_FILE_FILTERS = [{
    name: 'JSON File',
    extensions: ['json']
}]

/**
 * @function findPackage
 * @description Find package recursively for dependent package which is abstract class reference and return that package
 * @param {*} element
 * @returns {*}
 */
function findPackage(element) {
    let elem = element._parent;
    if (elem != null && elem instanceof type.UMLPackage) {
        return elem;
    } else {
        findPackage(elem._parent);
    }
    return elem;
}

/**
 * @function checkToShowAlertForAbstract
 * @description show alert to user that class is dependent but not marked as abstract
 * @param {UMLGeneralization} itemGen
 * @param {UMLPackage} umlPackage
 * @param {Array} showAlertForAbstract
 */
function checkToShowAlertForAbstract(itemGen, umlPackage, showAlertForAbstract) {
    // let pkgName = '';
    let parentElement;
    let className = '';
    if (itemGen instanceof type.UMLGeneralization) {
        className = itemGen.target.name;
        parentElement = itemGen.target;
    } else if (itemGen instanceof type.UMLAssociation) {
        className = itemGen.end2.reference.name;
        parentElement = itemGen.end2.reference;
    }
    let pElement = findPackage(parentElement);
    // setTimeout(function(){
    if (pElement != null && pElement instanceof type.UMLPackage && pElement.name != umlPackage.name) {
        let strMsg = 'Class \'' + className + '\' in \'' + pElement.name + '\' Package';
        //pElement.name + "/" + className;
        let result = showAlertForAbstract.filter(function (item) {
            return item == strMsg;
        });
        if (result.length == 0 && (!parentElement.isAbstract)) {
            showAlertForAbstract.push(strMsg);
        }
    }
    // },5);
}

/**
 * @function getAbstractClass
 * @description Find abstract class reference and return abstract class array
 * @param {UMLPackage} umlPackage
 * @returns {uniqueAbstractArr}
 */
function getAbstractClass(umlPackage) {
    let uniqueAbstractArr = [];
    let abstractClassList = [];

    let showAlertForAbstract = [];

    forEach(umlPackage.ownedElements, (element) => {
        if (element instanceof type.UMLClass) {
            let generalization = app.repository.select(umlPackage.name + "::" + element.name + "::@UMLGeneralization");
            forEach(generalization, (itemGen) => {
                checkToShowAlertForAbstract(itemGen, umlPackage, showAlertForAbstract);
                if (itemGen.target.isAbstract) {
                    abstractClassList.push(itemGen.target);
                }
            });

        }
    });
    forEach(umlPackage.ownedElements, (element) => {
        if (element instanceof type.UMLClass) {
            let associations = getClasswiseAssociations(element);
            forEach(associations, (itemGen) => {
                checkToShowAlertForAbstract(itemGen, umlPackage, showAlertForAbstract);
                /* Adding abstract class from Aggregation, Composition, Association */
                if (itemGen.end1.aggregation == 'shared' && itemGen.end2.aggregation == 'none' && itemGen.end2.reference.isAbstract == true) {
                    abstractClassList.push(itemGen.end2.reference);
                } else if (itemGen.end1.aggregation == 'composite' && itemGen.end2.aggregation == 'none' && itemGen.end2.reference.isAbstract == true) {
                    abstractClassList.push(itemGen.end2.reference);
                } else if (itemGen.end1.aggregation == 'none' && itemGen.end2.aggregation == 'none' && itemGen.end2.reference.isAbstract == true) {
                    abstractClassList.push(itemGen.end2.reference);
                }
            });
        }
    });
    forEach(abstractClassList, function (item, index) {
        let filter = uniqueAbstractArr.filter(subItem => {
            return item._id == subItem._id;
        });
        if (filter.length == 0) {
            uniqueAbstractArr.push(item);
        }
    });

    let result = {};
    if (showAlertForAbstract.length > 0) {
        let strCls = 'class';
        if (showAlertForAbstract.length > 1) {
            strCls = 'classes'
        }
        let msgStr = 'Please make \'isAbstract\' attribute \'true\' in following ' + strCls + ' to export \n\n';
        forEach(showAlertForAbstract, function (item) {
            msgStr += item + '\n';
        });
        result.success = false;
        result.message = msgStr;
        result.abstractClasses = [];
        return result;

    }
    result.success = true;
    result.message = "Abstract class available";
    result.abstractClasses = uniqueAbstractArr;

    // return uniqueAbstractArr;
    return result;
}

/**
 * @function getClasswiseAssociations
 * @description Return array of association (UMLAssociation) from element (UMLClass)
 * @param {*} element
 * @returns {association}
 */
function getClasswiseAssociations(element) {
    let association = element.ownedElements.filter(function (item) {
        return item instanceof type.UMLAssociation
    });
    return association;
}

/**
 * @function importDataToModel
 * @description Import package from XMIData data. If package name not exist in StarUML, create new package. If package name exist in StarUML, Update or Create all existing elements like UMLClass, UMLInterface, UMLAttribute, UMLOperations, UMLParameter, UMLEnumeration, UMLEmumerationLiterals, UMLAssociation, UMLAssociationClassLink, UMLInterfaceRealization, UMLGeneralization based on its availibity in StarUML
 * @param {Object} XMIData
 */
function importDataToModel(XMIData) {

    let mainOwnedElements = []
    let Package = {
        '_type': 'UMLPackage',
        'name': XMIData.name,
        'ownedElements': mainOwnedElements
    };
    mUtils.resetNewAddedElement();

    if (XMIData.type == fields.package) {

        let searchedPackage = app.repository.select(Package.name);
        let nPkg = [];
        forEach(searchedPackage, function (pkg) {
            if (pkg instanceof type.UMLPackage) {
                nPkg.push(pkg);
            }
        });
        searchedPackage = nPkg;
        let result = null;
        let newClassesAdded = [];
        /* Updating Enumeration, Entity and Event Elements */
        if (searchedPackage.length > 0) {

            result = updatePackageInExplorer(result, searchedPackage, newClassesAdded, Package, XMIData);

        }
        /* Adding Enumeration, Entity & Interface*/
        else {

            let mProject = app.project.getProject();
            Package['_parent'] = {
                '$ref': mProject._id
            }
            result = addNewPackageInExplorer(Package, XMIData, mainOwnedElements);
            /* Step - 3 : Create view of all new added class, interface, enumeration */
            newClassesAdded = app.repository.select(result.name + '::@UMLClass');


        }


        /* Step - 5 : Setting Property to Entity, Event, Enum */
        mUtils.setProperty(result.ownedElements, XMIData);
        /* Step - 6 : Setting Literals for Enum */
        mUtils.setLiterals(result.ownedElements, XMIData);
        /* Step - 7 : Setting  Operation & params to Event */
        mUtils.setOperation(result.ownedElements, XMIData);
        /* Step - 8 : Setting Relationship to Entity, Event */
        mRelationship.setRelationship(result.ownedElements, XMIData);


        /* Step - 9 : Create view of newaly added element */
        let newElements = mUtils.getNewAddedElement();
        let uniqueNewElements = [];
        forEach(newElements, function (newEle) {
            let res = uniqueNewElements.filter(function (relationship) {
                return relationship._id == newEle._id
            });
            if (res.length == 0) {
                uniqueNewElements.push(newEle);
            }
        });
        /* #13 : The default class diagram shoudn't be generated for big projects  */
        let classDiagram = app.repository.select('@UMLClassDiagram');
        if (classDiagram.length > 0 && newClassesAdded.length <= 10) {

            console.log("newClasses", newClassesAdded.length);
            mUtils.createViewOfElements(newElements);
            app.diagrams.repaint();;

        }
    }
}

function updatePackageInExplorer(result, searchedPackage, newClassesAdded, Package, XMIData) {
    forEach(searchedPackage, function (selPkg) {
        if (selPkg instanceof type.UMLPackage && selPkg.name == Package.name) {

            result = selPkg;
            mUtils.calculateXY();

            /* Step - 1 : Add all elements first */
            /* Add New Enumeration */
            mEnum.addNewEnumeration(XMIData, result);


            /* Add New Entity */
            mEntity.addNewEntity(XMIData, result);


            /* Add New Event */
            mEvent.addNewEvent(XMIData, result);


            /* Step - 2 : Create views of all new added class, interface, enumeration */
            let newElements = mUtils.getNewAddedElement();
            console.log("new added elements - 1", newElements);
            newClassesAdded = newElements.filter(function (item) {
                return item instanceof type.UMLClass
            });

            /* let isFirstView = true;
            forEach(newElements, function (newEle) {
                mUtils.createViewOfElement(newEle);
                if (isFirstView) {
                    app.diagrams.scrollTo(mUtils.getXY().pX, mUtils.getXY().pY);
                    isFirstView = false;
                }
            }); */
            mUtils.createViewOfElements(newElements);

            /* Step - 3 : Reset new added class, interface, enumeration */
            mUtils.resetNewAddedElement();

            /* Step - 4 : Update all existing elements */
            /* Update Enumeration*/
            mEnum.updateEnumeration(XMIData);


            /* Update Entity */
            mEntity.updateEntity(XMIData);


            /* Update Event */
            mEvent.updateEvent(XMIData);


        }
    });
    return result;
}

/**
 * @function addnNewPackageInExplorer
 * @description add new package and element in model explorer and returns UMLPackage
 * @param {Object} Package
 * @param {Object} XMIData
 * @param {Array} mainOwnedElements
 * @returns {UMLPackage}
 */
function addNewPackageInExplorer(Package, XMIData, mainOwnedElements) {
    /* Bind referenct of parent element (UMLPackage) */
    let objParent = app.repository.readObject(Package);
    Package._id = objParent._id;
    let _parent = {};
    _parent['$ref'] = objParent._id;



    /* Process Enumeration */
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        /* UMLEnumeration */
        if (mSubObject instanceof Object && mSubObject.type == fields.Enum) {
            /* UMLEnumeration */
            let enumObject = {};

            /* Binding Enum fields, attribute, literals */
            enumObject[fields._parent] = _parent;
            mEnum.bindEnumToImport(enumObject, mSubObject);
            mainOwnedElements.push(enumObject);
        }
    });

    /* Process Entity */
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {
            /* UMLClass */
            let entityObject = {};

            /* Binding Entity fields and attribute */
            entityObject[fields._parent] = _parent;
            mEntity.bindEntityToImport(entityObject, mSubObject);
            mainOwnedElements.push(entityObject);

        }
    });

    /* Process Event */
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        if (mSubObject instanceof Object && mSubObject.type == fields.Event) {

            let interfaceObject = {};

            /* Binding Event fields, attribute, operation & parameters*/
            interfaceObject[fields._parent] = _parent;
            mEvent.bindEventToImport(interfaceObject, mSubObject);
            mainOwnedElements.push(interfaceObject);
        }
    });

    let mProject = app.project.getProject();
    /* Import Enumeration, Entity & Event to our model */

    result = app.project.importFromJson(mProject, Package);
    return result;
}



/**
 * @function importModel
 * @description if file is available, import json file into model. If file is not available, open file picker dialog for selecting model-interchange json file to import into model
 * @param {file} string
 */
async function importModel(file) {
    mRelationship.resetUnRefData();
    let finalPath = null;
    if (file) {
        finalPath = file;
    } else {

        var mFiles = app.dialogs.showOpenDialog('Import package As JSON (.json)', null, JSON_FILE_FILTERS)
        if (mFiles && mFiles.length > 0) {
            /* Main XMIData */
            finalPath = mFiles[0];
        }
    }

    let filePath = finalPath;
    var contentStr = fs.readFileSync(filePath, 'utf8');
    var content = JSON.parse(contentStr);
    var MainXMIData = content;

    let dm = app.dialogs;
    let vDialog = dm.showModalDialog("", constant.title_import_mi, constant.title_import_mi_1 + MainXMIData.name + constant.title_import_mi_2, [], true);
    setTimeout(async function () {

        let res = await processImport(MainXMIData);
        if (res != null && res.success) {
            vDialog.close();
            app.modelExplorer.rebuild();
            setTimeout(function () {
                app.dialogs.showInfoDialog(constant.mi_msg_success);
            });
        }
    });

}
/**
 * @function MainXMIData
 * @description Process to import and handle abstract and non abstrack package
 * @param {Object} MainXMIData
 * @returns {Promise}
 */
function processImport(MainXMIData) {
    return new Promise((resolve, reject) => {

        var i = 1;
        /*  Import Abstract package first */
        if (MainXMIData.hasOwnProperty(fields.dependent) && MainXMIData.dependent.length > 0) {
            let absFiles = MainXMIData.dependent;
            if (absFiles.length > 0) {
                forEach(absFiles, function (AbstractXMIData) {

                    /* Abstract file XMIData */
                    importDataToModel(AbstractXMIData);

                });
            }
        }

        /*  Import main package second */
        importDataToModel(MainXMIData);

        let unRefData = mRelationship.getUnRefData();
        console.log("UnReference Data", unRefData);
        /* forEach(unRefData,function(refData){
            try{

                mRelationship.bindRelationshipToImport(refData.entity,refData.relationship);
            }catch(error){
                console.error("New Error",error.message);
            }
        }); */
        resolve({
            success: true,
            result: []
        });

    });
}
/**
 * @function exportModel
 * @description Export the selected package in JSONSchema standars
 */
function exportModel() {

    app.elementPickerDialog
        .showDialog("Select the package or project to generate OpenAPI Specs.", null, null) /* type.UMLPackage */
        .then(function ({
            buttonId,
            returnValue
        }) {
            if (buttonId === "ok") {
                let varSel = returnValue.getClassName();
                let valPackagename = type.UMLPackage.name;
                if (varSel == valPackagename) {
                    let umlPackage = returnValue;
                    let expPackages = [];
                    let filename = umlPackage.name;
                    /* Export main package */
                    let jsonProcess = {};
                    if (filename) {
                        jsonProcess[fields.type] = fields.package;
                        jsonProcess[fields.name] = umlPackage.name;

                        /* Enum binding--- */
                        mEnum.bindEnumToExport(umlPackage, jsonProcess);

                        /* Entity binding--- */
                        mEntity.bindEntityToExport(umlPackage, jsonProcess);

                        /* Event binding */
                        mEvent.bindEventToExport(umlPackage, jsonProcess);

                    } else {
                        console.log("Dialog cancelled");
                        return
                    }

                    /* Finds and return abstrack class from the selected package */
                    let absResult = getAbstractClass(umlPackage);
                    if (!absResult.success) {
                        app.dialogs.showAlertDialog(absResult.message);
                        return;
                    }
                    let absClass = absResult.abstractClasses;

                    var _filename = filename;
                    var fName = git.getDirectory() + path.sep + _filename + '.json';

                    forEach(absClass, function (item) {
                        if (item._parent instanceof type.UMLPackage) {
                            expPackages.push({
                                package: item._parent,
                                [fields.isAbstract]: true
                            });
                        }
                    });



                    /* Export Abstract Packages */
                    let dependent = [];
                    jsonProcess[fields.dependent] = dependent
                    forEach(expPackages, function (item) {

                        let mPackage = item.package;

                        let abstractJsonProcess = {};
                        abstractJsonProcess[fields.type] = fields.package;
                        abstractJsonProcess[fields.name] = mPackage.name;
                        abstractJsonProcess[fields.isAbstract] = item.isAbstract;

                        /* Enum binding--- */
                        mEnum.bindEnumToExport(mPackage, abstractJsonProcess);

                        /* Entity binding--- */
                        mEntity.bindEntityToExport(mPackage, abstractJsonProcess);

                        /* Event binding */
                        mEvent.bindEventToExport(mPackage, abstractJsonProcess);

                        dependent.push(abstractJsonProcess);


                    });

                    /* Export json file at path */
                    setTimeout(function () {
                        fs.writeFile(fName, CircularJSON.stringify(jsonProcess, null, 4), 'utf-8', function (err) {
                            if (err) {
                                console.error("Error : ", err.message);
                                app.dialogs.showErrorDialog(err.message);
                                return;
                            } else {
                                app.dialogs.showInfoDialog("Package \'" + umlPackage.name + "\' is exported to path : " + fName);
                                return;
                            }
                        });
                    }, 10);
                } else {
                    app.dialogs.showErrorDialog("Please select a package");
                }
            }
        });
}


module.exports.exportModel = exportModel;
module.exports.importModel = importModel;