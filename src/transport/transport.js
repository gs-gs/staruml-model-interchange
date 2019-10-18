var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var mEntity = require('./entity');
var mEvent = require('./event');
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
            let associations = getPackageWiseUMLAssociation(umlPackage);
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

function importParty(XMIData) {

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
        if (searchedPackage.length > 0) {
            /* Updating Entity and Event Elements */


            result = searchedPackage[0];

            Object.keys(XMIData).forEach(function eachKey(key) {
                let mSubObject = XMIData[key];
                /* UMLClass */
                let mSname = key;
                if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {

                    let entityObject = {};
                    /* Binding Entity fields and attribute */
                    mEntity.bindEntityToImport(entityObject, mSubObject);

                    let selectedEntity = app.repository.select(mSname);
                    if (selectedEntity.length > 0) {
                        forEach(selectedEntity, function (ety) {
                            console.log("Updated : Updated : ", ety.name);

                            if (ety instanceof type.UMLClass) {
                                let mResult = app.repository.readObject(entityObject)
                                app.engine.setProperties(ety, mResult);
                            }
                        });
                    } else {

                        let newAdded = app.repository.readObject(entityObject);
                        console.log("New Element : ", newAdded);
                        newAdded._parent = result;
                        //TODO
                        //objRelationship.type=attr.DataType.type;
                        // objRelationship.multiplicity=attr.cardinality;
                        //ownedElements.push(rel);
                        let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                        console.log("New Added Item", mResult);

                    }
                    //mainOwnedElements.push(entityObject);

                } else if (mSubObject instanceof Object && mSubObject.type == fields.Event) {

                    let interfaceObject = {};
                    /* Binding Event fields, attribute, operation & parameters*/
                    mEvent.bindEventToImport(interfaceObject, mSubObject);
                    let selectedEvent = app.repository.select(mSname);
                    if (selectedEvent.length > 0) {
                        forEach(selectedEvent, function (evt) {

                            if (evt instanceof type.UMLInterface) {
                                let mResult = app.repository.readObject(interfaceObject)
                                app.engine.setProperties(evt, mResult);
                            }
                        });
                    }

                }
            });

            /* Updating Relationship */
            mRelationship.addRelationship(result.ownedElements, XMIData);

        } else {
            /* Adding Entity & Interface*/

            Object.keys(XMIData).forEach(function eachKey(key) {
                let mSubObject = XMIData[key];
                /* UMLClass */
                if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {
                    let entityObject = {};

                    /* Binding Entity fields and attribute */
                    mEntity.bindEntityToImport(entityObject, mSubObject);
                    mainOwnedElements.push(entityObject);

                } else if (mSubObject instanceof Object && mSubObject.type == fields.Event) {

                    let interfaceObject = {};

                    /* Binding Event fields, attribute, operation & parameters*/
                    mEvent.bindEventToImport(interfaceObject, mSubObject);
                    mainOwnedElements.push(interfaceObject);
                }
            });

            /* Import Entity & Interface to out model */
            result = app.project.importFromJson(mProject, Package);
            console.log("result", result);

            /* Adding Relationship */
            mRelationship.addRelationship(result.ownedElements, XMIData);
        }

    }
}


function importModel() {

    var mFiles = app.dialogs.showOpenDialog('Import package As JSON (.json)', null, JSON_FILE_FILTERS)
    if (mFiles && mFiles.length > 0) {
        // try {
        /* Main XMIData */
        let filePath = mFiles[0];
        var contentStr = fs.readFileSync(filePath, 'utf8');
        var content = JSON.parse(contentStr);
        var MainXMIData = content;
        console.log("Main XMIData", MainXMIData);

        if (MainXMIData.hasOwnProperty(fields.dependent) && MainXMIData.dependent.length > 0) {
            let absFiles = MainXMIData.dependent;
            if (absFiles.length > 0) {
                forEach(absFiles, function (AbstractXMIData) {

                    /* Abstract file XMIData */
                    importParty(AbstractXMIData);
                });
            }
        }

        importParty(MainXMIData);

        // }catch(error){
        //     console.error(error.message);
        // }
    }
}

function exportModel() {

    /* let entityJourney=app.repository.select("Movements::Journey")[0];
    let generalization=entityJourney.ownedElements[0];
    app.engine.setProperty(generalization, 'name', 'Mayur');
    return; */
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

                    /* Add 'isAbstract' */
                    /* if(absClass.length>0){
                        mainPackage[fields.isAbstract]=true;
                    }else{
                        mainPackage[fields.isAbstract]=false;
                    } */

                    /* Add 'abstractFiles' paths */
                    /* let abstractFiles=[];
                    mainPackage[fields.abstractFiles]=abstractFiles; */

                    /* Add all abstrack class in array */
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
                        /* Entity binding--- */
                        mEntity.bindEntityToExport(mPackage, abstractJsonProcess);

                        /* Event binding */
                        mEvent.bindEventToExport(mPackage, abstractJsonProcess);

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



/* 
'_type','type'
'UMLClass','Entity'
'UMLAssociation','Relationship'
'UMLPackage','Package'
'UMLGeneralization','Generalization'
'UMLInterface','Event'
'UMLInterfaceRealization'
'UMLAssociationClassLink'



replace propert term with 'ownedElements'
remove '_id', '_parent', 'EntityDiagram', '$ref', 'end1', 'end2', 'attributes', 'documentation' */