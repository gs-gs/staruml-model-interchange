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

function getPackageWiseUMLAssociation(package) {
    let associations = app.repository.select("@UMLAssociation");
    filteredAssociation = [];
    forEach(associations, (item) => {
        findParentPackage(package, item, item);
    });
    return filteredAssociation;
}
let filteredAssociation = [];

function findParentPackage(package, ele, item) {
    // return new Promise((resolve, reject) => {
    if (ele instanceof type.UMLPackage) {
        if (ele != null && ele.name == 'Movements' /* openAPI.getUMLPackage().name */ ) {
            // console.log("ele",ele);
            // console.log("item",item);
            filteredAssociation.push(item);
            // return item;
        }

        // resolve(assocItem);
    } else if (ele.hasOwnProperty('_parent') && ele._parent != null) {
        findParentPackage(package, ele._parent, item);
    }
    // return null;
}

function getAbstractClassView(umlPackage, uniqueAbstractArr) {
    let abstractClassViewList = [];

    let umlClassDiagram = app.repository.select(umlPackage.name + "::@UMLClassDiagram")[0];

    forEach(umlClassDiagram.ownedViews, (ownedViews) => {
        if (ownedViews instanceof type.UMLClassView) {
            forEach(uniqueAbstractArr, (absClass) => {
                if (absClass._id == ownedViews.model._id) {
                    abstractClassViewList.push(ownedViews);
                }
            });
        }
    });

    return abstractClassViewList;
}

function importDataToModel(XMIData) {

    let mainOwnedElements = []
    let Package = {
        '_type': 'UMLPackage',
        'name': XMIData.name,
        'ownedElements': mainOwnedElements
    };

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
                    // let arrViewDiagram=result.ownedElements.filter(function(fItem){
                    //     return fItem instanceof type.UMLClassDiagram;
                    // });
                    // let viewDiagram=null;
                    // if(arrViewDiagram.length == 1){
                    //     viewDiagram=arrViewDiagram[0];
                    //     let mClassView=viewDiagram.ownedViews.filter(function(oView){
                    //         return (oView instanceof type.UMLClassView && oView.model.name=='TransportMovement');
                    //     });
                    //     console.log("MYClass View",mClassView);
                    //    /*  if(mClassView.length==1){
                    //         var options = {
                    //             model: mClassView.model,
                    //             diagram: mClassView._parent,
                    //             x: 500,
                    //             y: 500,
                    //           }
                    //           app.factory.createViewOf(options)
                              
                    //     } */
                    //     var classView = {
                    //         id: "UMLClass",
                    //         parent: viewDiagram._parent,
                    //         diagram: viewDiagram,
                    //         x1: 100,
                    //         y1: 100,
                    //         x2: 200,
                    //         y2: 200
                    //       }
                    //       let resClassView=app.factory.createModelAndView(classView);

                    //       let mPkg=app.repository.search('Movement')[5];
                    //       let attribute=mPkg.ownedElements[5].attributes[0];

                    //       var attributeView = {
                    //         id: "UMLAttribute",
                    //         parent: resClassView.nameCompartment,
                    //         diagram: viewDiagram,
                    //         viewInitializer: function (tag) {
                    //             tag.name = "Tag1";
                    //             //tag.kind = type.Tag.TK_STRING; // or TK_BOOLEAN, TK_NUMBER, TK_REFERENCE, TK_HIDDEN
                    //             //tag.value = "String Value...";
                    //             // tag.checked = true; // for TK_BOOLEAN
                    //             // tag.number = 100; // for TK_NUMBER
                    //             // tag.reference = ...; // for TK_REFERENCE
                    //           },
                    //         model:attribute
                    //       }
                    //       let resAttrView=app.factory.createModelAndView(attributeView);
                    // } 
                    // return;
                   
                    /* Update Enumeration */
                    console.log("steps----------1");
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


                            // let selectedEnum = app.repository.select(mSname);
                            // let selectedEnum = app.repository.select(mSname);
                            let searchedEnum = app.repository.search(mSname);
                            let searchedEnumRes=searchedEnum.filter(function(item){
                                return (item instanceof type.UMLEnumeration && item.name == mSname);
                            });
                            if (searchedEnumRes.length > 0) {
                                forEach(searchedEnumRes, function (ety) {
                                    console.log("Updated : Enum : ", ety.name);

                                    if (ety instanceof type.UMLEnumeration) {
                                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                                        app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                                        /* enumObject['_id']=ety._id;
                                        let mResult = app.repository.readObject(enumObject)

                                        app.engine.setProperty(mResult, fields.name, mSubObject.name);
                                        app.engine.setProperty(mResult, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(mResult, fields.documentation, mSubObject.description); */

                                    }
                                });
                            } else {

                                let newAdded = app.repository.readObject(enumObject);
                                console.log("New Enum Added-1: ", newAdded);
                                newAdded._parent = result;
                                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                                console.log("New Enum Added-2", mResult);

                            }

                            //mainOwnedElements.push(enumObject);


                        }
                    });
                    console.log("steps----------2");
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
                            let searchedEntityRes=searchedEntity.filter(function(item){
                                return (item instanceof type.UMLClass && item.name == mSname);
                            });
                            if (searchedEntityRes.length > 0) {
                                forEach(searchedEntityRes, function (ety) {
                                    console.log("Updated : Entity : ", ety.name);

                                    if (ety instanceof type.UMLClass) {
                                        /* entityObject['_id']=ety._id;
                                        entityObject[fields.name]= mSubObject.name
                                        entityObject[fields.isAbstract]= mSubObject.isAbstract
                                        entityObject[fields.documentation]= mSubObject.description
                                        mResult = app.repository.readObject(entityObject) */
                                        //app.engine.setProperties(ety, mResult);
                                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                                        app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                                        //app.engine.setProperty(ety, 'attributes', []);
                                        //app.engine.setProperty(ety, 'ownedElements', []);
                                        // app.engine.setProperties(ety, mResult);
                                        /* let prpr = app.engine.setProperties(ety, mResult);
                                        console.log("prpr", prpr); */

                                    }
                                });
                            } else {

                                let newAdded = app.repository.readObject(entityObject);
                                console.log("New Entity Added-1: ", newAdded);
                                newAdded._parent = result;
                                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                                console.log("New Entity Added-2", mResult);

                            }
                            //mainOwnedElements.push(entityObject);

                        }
                    });

                    console.log("steps----------3");
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
                            let searchedEventRes=searchedEvent.filter(function(item){
                                return (item instanceof type.UMLInterface && item.name == mSname);
                            });
                            if (searchedEventRes.length > 0) {
                                forEach(searchedEventRes, function (ety) {

                                    if (ety instanceof type.UMLInterface) {
                                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                                        //app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                                        /* interfaceObject['_id']=ety._id;
                                        let mResult = app.repository.readObject(interfaceObject);
                                        app.engine.setProperty(mResult, fields.name, mSubObject.name);
                                        app.engine.setProperty(mResult, fields.documentation, mSubObject.description); */
                                        // let prpr2 = app.engine.setPropert(mResult,fields.isAbstract,mSubObject.isAbstract);
                                        // console.log("prpr2", prpr2);

                                        /* let prpr = app.engine.setProperties(evt, mResult);
                                        console.log("prpr", prpr); */
                                    }
                                });
                            } else {

                                let newAdded = app.repository.readObject(interfaceObject);
                                console.log("New Event Added-1 : ", newAdded);
                                newAdded._parent = result;
                                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                                console.log("New Event Added-2", mResult);

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

            // try {

            let res = await processImport(MainXMIData);
            if (res != null && res.success) {
                vDialog.close();
                app.modelExplorer.rebuild();
                /* var selected = app.selections.getSelected();
                if(!selected){
                    selected=app.project.getProject()[0];
                }
                console.log("Get selected",selected); */
                setTimeout(function () {
                    // app.modelExplorer.expand(selected);
                    app.dialogs.showInfoDialog(constant.mi_msg_success);
                    
                });
            }
            // } catch (error) {
            //     console.log("importModel", error.message);
            // };
        });
        // }catch(error){
        //     console.error(error.message);
        // }
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
                    /*  
                        CircularJSON.stringify : 
                        Dealing with "TypeError: Converting circular structure to JSON" 
                        on JavaScript JavaScript structures that include circular references can't be 
                        serialized with a"plain" JSON.stringify. 
                    */
                    setTimeout(function () {
                        fs.writeFile(fName, CircularJSON.stringify(jsonProcess, null, 4) /* JSON.stringify(jsonProcess,null,4) */ , 'utf-8', function (err) {
                            if (err) {
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