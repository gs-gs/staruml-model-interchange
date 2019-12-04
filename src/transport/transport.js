var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var mEntity = require('./entity');
var mEnum = require('./enum');
var mEvent = require('./event');
var mUtils = require('./utils');
var constant = require('../constant');
const fs = require('fs');
const CircularJSON = require('circular-json');
var path = require('path');
var mRelationship = require('./relationship');
// app.diagrams.getEditor().canvasElement.height
const JSON_FILE_FILTERS = [{
    name: 'JSON File',
    extensions: ['json']
}]

function getAbstractClass(umlPackage) {
    let uniqueAbstractArr = [];
    let abstractClassList = [];
    // let umlPackage=app.project.getProject().ownedElements[0].ownedElements[2];
    forEach(umlPackage.ownedElements, (element) => {
        if (element instanceof type.UMLClass) {
            let generalization = app.repository.select(umlPackage.name + "::" + element.name + "::@UMLGeneralization");
            forEach(generalization, (itemGen) => {
                if (itemGen.target.isAbstract) {
                    abstractClassList.push(itemGen.target);
                }
            });

        }
    });
    forEach(umlPackage.ownedElements, (element) => {
        if (element instanceof type.UMLClass) {
            // let associations = getPackageWiseUMLAssociation(umlPackage);
            let associations = getClasswiseAssociations(element);
            forEach(associations, (itemGen) => {
                if (itemGen.end2.aggregation == 'none' && itemGen.end2.reference.isAbstract == true) {
                    abstractClassList.push(itemGen.end2.reference);
                }
            });
        }
    });
    forEach(abstractClassList, function (item, index) {
        let filter = uniqueAbstractArr.filter(subItem => {
            return item.name == subItem.name;
        });
        if (filter.length == 0) {
            uniqueAbstractArr.push(item);
        }
    });

    return uniqueAbstractArr;
}

function getClasswiseAssociations(element) {
    let association = element.ownedElements.filter(function (item) {
        return item instanceof type.UMLAssociation
    });
    return association;
}

function importDataToModel(XMIData) {

    let mainOwnedElements = []
    let Package = {
        '_type': 'UMLPackage',
        'name': XMIData.name,
        'ownedElements': mainOwnedElements
    };
    mUtils.resetNewAddedElement();

    if (XMIData.type == fields.package) {
        // let mPackage=XMIData[key];
        let mProject = app.project.getProject();
        let searchedPackage = app.repository.select(Package.name);
        let result = null;
        /* Updating Enumeration, Entity and Event Elements */
        if (searchedPackage.length > 0) {
            forEach(searchedPackage, function (selPkg) {
                if (selPkg instanceof type.UMLPackage && selPkg.name == Package.name) {

                    result = selPkg;
                    mUtils.calculateXY();

                    /* Step - 1 : Add all elements first */
                    /* Add New Enumeration */
                    Object.keys(XMIData).forEach(function eachKey(key) {
                        let mSubObject = XMIData[key];
                        let mSname = key;
                        if (mSubObject instanceof Object && mSubObject.type == fields.Enum) {
                            /* UMLEnumeration */
                            let enumObject = {};

                            /* Binding Enum fields, attribute, literals */
                            mEnum.bindEnumToImport(enumObject, mSubObject);

                            let searchedEnum = app.repository.search(mSname);
                            let searchedEnumRes = searchedEnum.filter(function (item) {
                                return (item instanceof type.UMLEnumeration && item.name == mSname);
                            });

                            if (searchedEnumRes.length == 0) {
                                let newAdded = app.repository.readObject(enumObject);
                                console.log("New Enum Added-1: ", newAdded);
                                newAdded._parent = result;
                                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                                console.log("New Enum Added-2", mResult);
                                // newElements.push(newAdded);
                                mUtils.addNewAddedElement(newAdded);
                            }
                        }
                    });

                    /* Add New Entity */
                    Object.keys(XMIData).forEach(function eachKey(key) {
                        let mSubObject = XMIData[key];
                        /* UMLClass */
                        let mSname = key;
                        if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {

                            let entityObject = {};
                            /* Binding Entity fields and attribute */
                            mEntity.bindEntityToImport(entityObject, mSubObject);

                            // let selectedEntity = app.repository.select(mSname);

                            let searchedEntity = app.repository.search(mSname);
                            let searchedEntityRes = searchedEntity.filter(function (item) {
                                return (item instanceof type.UMLClass && item.name == mSname);
                            });
                            if (searchedEntityRes.length == 0) {
                                let newAdded = app.repository.readObject(entityObject);
                                console.log("New Entity Added-1: ", newAdded);
                                newAdded._parent = result;
                                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                                console.log("New Entity Added-2", mResult);
                                // newElements.push(newAdded);
                                mUtils.addNewAddedElement(newAdded);
                            }
                        }
                    });

                    /* Add New Event */
                    Object.keys(XMIData).forEach(function eachKey(key) {
                        let mSubObject = XMIData[key];
                        /* UMLClass */
                        let mSname = key;
                        if (mSubObject instanceof Object && mSubObject.type == fields.Event) {

                            let interfaceObject = {};
                            /* Binding Event fields, attribute, operation & parameters*/
                            mEvent.bindEventToImport(interfaceObject, mSubObject);
                            let searchedEvent = app.repository.search(mSname);
                            let searchedEventRes = searchedEvent.filter(function (item) {
                                return (item instanceof type.UMLInterface && item.name == mSname);
                            });
                            if (searchedEventRes.length == 0) {
                                let newAdded = app.repository.readObject(interfaceObject);
                                console.log("New Event Added-1 : ", newAdded);
                                newAdded._parent = result;
                                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                                console.log("New Event Added-2", mResult);
                                // newElements.push(newAdded);
                                mUtils.addNewAddedElement(newAdded);

                            }
                        }
                    });


                    /* Create view of all new added class, interface, enumeration */
                    let newElements = mUtils.getNewAddedElement();
                    let isFirstView = true;
                    forEach(newElements, function (newEle) {
                        mUtils.createViewOfElement(newEle);
                        if (isFirstView) {
                            app.diagrams.scrollTo(mUtils.getXY().pX, mUtils.getXY().pY);
                            isFirstView = false;
                        }
                    });

                    /* Reset new added class, interface, enumeration */
                    mUtils.resetNewAddedElement();

                    /* Step - 2 : Update all existing elements */
                    /* Update Enumeration*/
                    Object.keys(XMIData).forEach(function eachKey(key) {
                        let mSubObject = XMIData[key];
                        /* UMLClass */
                        let mSname = key;
                        if (mSubObject instanceof Object && mSubObject.type == fields.Enum) {

                            /* UMLEnumeration */
                            let enumObject = {};

                            /* Binding Enum fields, attribute, literals */
                            // enumObject[fields._parent] = result;
                            mEnum.bindEnumToImport(enumObject, mSubObject);
                            let searchedEnum = app.repository.search(mSname);
                            let searchedEnumRes = searchedEnum.filter(function (item) {
                                return (item instanceof type.UMLEnumeration && item.name == mSname);
                            });

                            if (searchedEnumRes.length > 0) {
                                forEach(searchedEnumRes, function (ety) {

                                    if (ety instanceof type.UMLEnumeration) {
                                        console.time("Updated : Enum : ");
                                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                                        app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                                        console.timeEnd();
                                        console.log("Updated : Enum : ", ety.name);
                                    }
                                });
                            }
                        }
                    });

                    /* Update Entity */
                    Object.keys(XMIData).forEach(function eachKey(key) {
                        let mSubObject = XMIData[key];
                        /* UMLClass */
                        let mSname = key;
                        if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {

                            let entityObject = {};
                            /* Binding Entity fields and attribute */
                            mEntity.bindEntityToImport(entityObject, mSubObject);

                            // let selectedEntity = app.repository.select(mSname);

                            let searchedEntity = app.repository.search(mSname);
                            let searchedEntityRes = searchedEntity.filter(function (item) {
                                return (item instanceof type.UMLClass && item.name == mSname);
                            });
                            if (searchedEntityRes.length > 0) {
                                forEach(searchedEntityRes, function (ety) {

                                    if (ety instanceof type.UMLClass) {
                                        console.time("Updated : Entity");
                                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                                        app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                                        console.log("Updated : Entity : ", ety.name);
                                        console.timeEnd();
                                    }
                                });
                            }
                        }
                    });

                    /* Update Event */
                    Object.keys(XMIData).forEach(function eachKey(key) {
                        let mSubObject = XMIData[key];
                        /* UMLClass */
                        let mSname = key;
                        if (mSubObject instanceof Object && mSubObject.type == fields.Event) {

                            let interfaceObject = {};
                            /* Binding Event fields, attribute, operation & parameters*/
                            mEvent.bindEventToImport(interfaceObject, mSubObject);
                            let searchedEvent = app.repository.search(mSname);
                            let searchedEventRes = searchedEvent.filter(function (item) {
                                return (item instanceof type.UMLInterface && item.name == mSname);
                            });
                            if (searchedEventRes.length > 0) {
                                forEach(searchedEventRes, function (ety) {

                                    if (ety instanceof type.UMLInterface) {
                                        console.time("Enum");
                                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                                        //app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                                        console.log("Updated : Event : ", ety.name);
                                        console.timeEnd("Enum");
                                    }
                                });
                            }
                        }
                    });

                }
            });

        }
        /* Adding Enumeration, Entity & Interface*/
        else {

            /* Bind referenct of parent element (UMLPackage) */
            let objParent = app.repository.readObject(Package);
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


            /* Import Enumeration, Entity & Event to our model */
            result = app.project.importFromJson(mProject, Package);
            console.log("result", result);


        }

        console.log("steps----------4");
        /* Setting Property to Entity, Event, Enum */
        mUtils.setProperty(result.ownedElements, XMIData);
        console.log("steps----------5");
        /* Setting Literals for Enum */
        mUtils.setLiterals(result.ownedElements, XMIData);
        console.log("steps----------6");
        /* Setting  Operation & params to Event */
        mUtils.setOperation(result.ownedElements, XMIData);
        console.log("steps----------7");
        /* Setting Relationship to Entity, Event*/
        mRelationship.setRelationship(result.ownedElements, XMIData);


        /* Create view of newaly added element */
        console.log("Total new added elements", mUtils.getNewAddedElement());
        let newElements = mUtils.getNewAddedElement();
        forEach(newElements, function (newEle) {
            mUtils.createViewOfElement(newEle);
        });
        
        app.diagrams.repaint();;




    }
}


async function importModel() {

    var mFiles = app.dialogs.showOpenDialog('Import package As JSON (.json)', null, JSON_FILE_FILTERS)
    if (mFiles && mFiles.length > 0) {
        // try {
        /* Main XMIData */
        let filePath = mFiles[0];
        var contentStr = fs.readFileSync(filePath, 'utf8');
        var content = JSON.parse(contentStr);
        var MainXMIData = content;
        console.log("Main XMIData", MainXMIData);

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
}

function processImport(MainXMIData) {
    return new Promise((resolve, reject) => {
        // try {

        var i = 1;
        // Import Abstract package first
        if (MainXMIData.hasOwnProperty(fields.dependent) && MainXMIData.dependent.length > 0) {
            let absFiles = MainXMIData.dependent;
            if (absFiles.length > 0) {
                forEach(absFiles, function (AbstractXMIData) {
                    console.log("steps----" + (i++) + "---Abstract---" + AbstractXMIData.name);

                    /* Abstract file XMIData */
                    importDataToModel(AbstractXMIData);
                });
            }
        }
        console.log("steps----" + (i++) + "---Main---" + MainXMIData.name);
        // Import main package second
        importDataToModel(MainXMIData);

        resolve({
            success: true,
            result: []
        });
        // } catch (error) {
        //     console.error("processImport", error.message);
        //     reject(error.message);
        // };
    });
}

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
                        console.log("Filename : ", filename);
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
                    let absClass = getAbstractClass(umlPackage);
                    console.log("Abstrack Class", absClass);

                    var _filename = filename;
                    var fName = app.dialogs.showSaveDialog('Export Project As JSON', _filename + '.json', JSON_FILE_FILTERS);

                    forEach(absClass, function (item) {
                        if (item._parent instanceof type.UMLPackage) {
                            expPackages.push({
                                package: item._parent,
                                [fields.isAbstract]: true
                            });
                        }
                    });



                    console.log("library packages", expPackages);
                    /* let absClassView=getAbstractClassView(umlPackage,absClass);
                    console.log("Abstrack View",absClassView); */



                    /* forEach(umlPackage.ownedElements,(ele)=>{
                         if(ele instanceof type.umlClassDiagram){
                         }

                    }); */
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
                        // mEntity.bindAbstractEntityToExport(mPackage, abstractJsonProcess);

                        /* Event binding */
                        mEvent.bindEventToExport(mPackage, abstractJsonProcess);
                        // mEvent.bindAbstractEventToExport(mPackage, abstractJsonProcess);

                        console.log('Json Processed', abstractJsonProcess);

                        dependent.push(abstractJsonProcess);


                    });
                   
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
                    }, 10)
                } else {
                    app.dialogs.showErrorDialog("Please select a package");
                }
            }
        });
}


module.exports.exportModel = exportModel;
module.exports.importModel = importModel;