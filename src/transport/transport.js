var forEach = require('async-foreach').forEach;
var path = require('path');
const fs = require('fs');
const CircularJSON = require('circular-json');
const utils=require('./utils');

const XMI_FILE_FILTERS = [{
        name: 'XMI Files',
        extensions: ['xmi']
    },
    {
        name: 'All Files',
        extensions: ['*']
    }
]
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

function importModel() {

    var files = app.dialogs.showOpenDialog('Import package As JSON (.json)', null, JSON_FILE_FILTERS)
    if (files && files.length > 0) {
        try {
            var contentStr = fs.readFileSync(files[0], 'utf8');
            var content = JSON.parse(contentStr);
            var XMIData = content;

            app.elementPickerDialog
                .showDialog("Select the package in which you want to import this package.", null, null) 
                .then(function ({
                    buttonId,
                    returnValue
                }) {
                    if (buttonId === "ok") {
                        let varSel = returnValue.getClassName();
                        let valPackagename = type.UMLPackage.name;
                        let valProjectname = type.Project.name;
                        if (varSel == valPackagename || varSel == valProjectname) {
                            umlPackage = returnValue;
                            // app.modelExplorer.collapse(app.project.getProject());
                            XMIData.reverse();
                            let expandedIds=[];
                            let allPackages=app.repository.select("@UMLPackage");

                            forEach(XMIData, function (pkg) {

                                let flterPkg=allPackages.filter(function(mPkg){
                                    return mPkg._id==pkg.package._id
                                });

                                if(flterPkg.length==0){
                                    let result = app.project.importFromJson(umlPackage, pkg.package)
                                    console.log("result", result);
                                    if(!pkg.isAbstract){
                                        expandedIds.push(app.repository.get(pkg.package._id));                                        
                                    }
                                }
                                
                            });
                            app.modelExplorer.rebuild();
                            app.modelExplorer.expand(app.project.getProject());
                            forEach(expandedIds,function(expIds){
                                app.modelExplorer.expand(expIds);
                            });
                            app.dialogs.showInfoDialog("Package is imported successfully please check in model exporer.");
                        } else {
                            app.dialogs.showErrorDialog("Please select a package");
                        }
                    }
                });
        } catch (err) {
            app.dialogs.showErrorDialog('Failed to load the file.', err)
            console.log(err)
        }
    }
    return;

    /* let uniqueAbstractArr = [];
    let abstractClassList=[];
    let package=app.project.getProject().ownedElements[0].ownedElements[2];
    forEach(package.ownedElements,(element)=>{
        if(element instanceof type.UMLClass){
             let generalization=app.repository.select(package.name+"::"+element.name+"::@UMLGeneralization");
             forEach(generalization,(itemGen)=>{
                  if(itemGen.target.isAbstract){
                       abstractClassList.push(itemGen.target);
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
    console.log("Abstrack Class",uniqueAbstractArr); */




    /* console.log("importModel");

    var contentStr = fs.readFileSync('/home/vi109/Desktop/uml_model.json', 'utf8');
    var content = JSON.parse(contentStr);
    console.log("content", content);
    app.project.importFromJson(app.project.getProject(), content); */
    // app.modelExplorer.expand(app.repository.get(content._id))

    // let project=content;
    // app.factory.createModel(project)


    // var filename = app.dialogs.showOpenDialog('Import package As JSON', _filename + '.json', JSON_FILE_FILTERS)
    
    let project = null;
    if (content._type == type.Project.name) {
        project = {
            id: content._type,
            parent: null,
            modelInitializer: function (elem) {
                elem.name = content.name
            }
        }
        // app.factory.createModel(project);
        project = app.repository.select("@Project")[0];
    }
    forEach(content.ownedElements, function (item) {
        //  || item._type == type.UMLPackage.name
        if (item._type == type.UMLModel.name) {
            let model = {
                id: item._type,
                parent: project,
                modelInitializer: function (elem) {
                    elem.name = item.name
                }
            };
            let mModel = app.factory.createModel(model);
            if (item.ownedElements.length > 0) {
                let ownedElements = item.ownedElements;
                forEach(ownedElements, function (objProperties) {
                    if (objProperties._type == type.UMLClass.name) {
                        let mClass = {
                            id: "UMLClass",
                            parent: mModel,
                            modelInitializer: function (elem) {
                                elem.name = objProperties.name;
                            }
                        }
                        let mMClass = app.factory.createModel(mClass);
                        // Adding attributes to class
                        if (objProperties.attributes != null && objProperties.attributes.length > 0) {
                            forEach(objProperties.attributes, function (fieldAttribute) {
                                let mAttr = {
                                    id: "UMLAttribute",
                                    parent: mMClass,
                                    field: "attributes",
                                    modelInitializer: function (elem) {
                                        elem.name = fieldAttribute.name;
                                    }
                                }
                                app.factory.createModel(mAttr);
                            });
                        }
                        // Adding ownElements to class
                        if (objProperties.ownedElements != null && objProperties.ownedElements.length > 0) {
                            forEach(objProperties.ownedElements, function (fieldOwnedElements) {
                                if (fieldOwnedElements._type == type.UMLAssociation.name) {
                                    let mAssociation = {
                                        id: "UMLAssociation",
                                        parent: mMClass,
                                        field: "ownedElements",
                                        modelInitializer: function (elem) {
                                            elem.name = fieldOwnedElements.name;
                                        }
                                    }
                                    app.factory.createModel(mAssociation);
                                }
                            });
                        }
                    }
                });
            }
        }
    });
    console.log(app.factory.getModelIds());
}
function replaceAll(str, term, replacement) {
    return str.replace(new RegExp(escapeRegExp(term), 'g'), replacement);
}
function escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function findVal(object, key, value) {
    var value;
    Object.keys(object).some(function(k) {
        if (k === key && object[k]==value) {
            
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key,value);
            return value !== undefined;
        }
    });
    return value;
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
                    let fileName = umlPackage.name;
                    /* Finds and return abstrack class from the selected package */
                    let absClass = getAbstractClass(umlPackage);
                    console.log("Abstrack Class", absClass);


                    /* Add all abstrack class in array */
                    forEach(absClass, function (item) {
                        if (item._parent instanceof type.UMLPackage) {
                            expPackages.push(item._parent);
                        }
                    });

                    

                    console.log("Total library packages", expPackages);
                    /* let absClassView=getAbstractClassView(umlPackage,absClass);
                    console.log("Abstrack View",absClassView); */



                    /* forEach(umlPackage.ownedElements,(ele)=>{
                         if(ele instanceof type.umlClassDiagram){
                         }

                    }); */

                    var _filename = fileName;
                    var filename = app.dialogs.showSaveDialog('Export Project As JSON', _filename + '.json', JSON_FILE_FILTERS)

                    if (filename) {
                        console.log("Filename : ", filename);
                        let packageString=app.repository.writeObject(umlPackage);
                        let allEntities=app.repository.select(umlPackage.name+'::@UMLClass')
                        let jsonProcess={
                            'type':'Package',
                            'name':umlPackage.name
                        };

                        forEach(allEntities,function(entity){

                            /* Entity binding--- */
                            let entityObj={};
                            jsonProcess[entity.name]=entityObj;
                            entityObj['type']=utils.getElementType(entity);
                            entityObj['name']=entity.name;
                            entityObj['description']=entity.documentation;
                            entityObj['version']='';
                            entityObj['status']='';

                            let requiredObj=[];
                            entityObj['required']=requiredObj;

                            /* Property binding--- */
                            let propertyArr=[];
                            entityObj['Property']=propertyArr;
                            let attribute=entity.attributes;
                            forEach(attribute,function(attr){
                                let propertyObj={};
                                propertyObj['name']=attr.name;  

                                propertyObj['description']=attr.documentation;

                                propertyObj['status']='';
                                
                                /* DataType binding--- */
                                let dType={};
                                if(utils.isString(attr.type)){

                                    dType.type=attr.type;
                                    propertyObj['DataType']=dType;
                                    dType['name']=attr.name;
                                    dType['cardinality']=attr.multiplicity;
                                }else if(attr.type instanceof type.UMLClass){
                                    propertyObj['DataType']=dType;
                                    dType.type=utils.getElementType(attr.type);
                                    dType['name']=attr.type.name;
                                    dType['cardinality']=attr.multiplicity;
                                }else if(attr.type instanceof type.UMLEnumeration){
                                    propertyObj['DataType']=dType;
                                    dType.type=utils.getElementType(attr.type);
                                    dType['name']=attr.type.name;
                                    dType['cardinality']=attr.multiplicity;

                                    /* binding literals  */
                                    let arrliterals=[];
                                    dType['enum']=arrliterals;
                                    let literals=attr.type.literals;
                                    forEach(literals,function(itemLiterals){
                                        arrliterals.push(itemLiterals.name);
                                    });

                                    dType['cardinality']=attr.multiplicity;
                                }
                                if(attr.name=='Type'){
                                    console.log("Type");
                                }
                                propertyArr.push(propertyObj);
                            });

                            /* Relationship binding */
                            let Relationship=[];
                            entityObj['Relationship']=Relationship;
                            forEach(entity.ownedElements,function(element){
                                let objRelationship={};
                                
                                objRelationship['name']=element.name;
                                objRelationship['description']=element.documentation;

                                if(element instanceof type.UMLAssociation){

                                    let end1=element.end1;
                                    let end2=element.end2;
                                    if(end1.aggregation=='shared' && end2.aggregation=='none'){
                                        /* aggregation */
                                        objRelationship['type']='aggregation';
                                    } else if(end1.aggregation=='composite' && end2.aggregation=='none'){
                                        /* composition */
                                        objRelationship['type']='composition';
                                    }

                                    let objSource={};
                                    let source=end1.reference;
                                    objRelationship['source']=objSource;
                                    objSource['name']=source.name;
                                    objSource['type']=utils.getElementType(source);

                                    let objTarget={};
                                    let target=end2.reference;
                                    objRelationship['target']=objTarget;
                                    objTarget['name']=target.name;
                                    objTarget['type']=utils.getElementType(target);

                                } else if(element instanceof type.UMLGeneralization){

                                    objRelationship['type']=utils.getElementType(element);

                                    let objSource={};
                                    let source=element.source;
                                    objRelationship['source']=objSource;
                                    objSource['name']=source.name;
                                    objSource['type']=utils.getElementType(source);


                                    let objTarget={};
                                    let target=element.target;
                                    objRelationship['target']=objTarget;
                                    objTarget['name']=target.name;
                                    objTarget['type']=utils.getElementType(target);

                                } else if(element instanceof type.UMLAssociationClassLink){

                                    objRelationship['type']=utils.getElementType(element);
                                    let objAssociation={};
                                    /* association binding */
                                    objRelationship['association']=objAssociation;

                                    let end1=element.associationSide.end1;
                                    let end2=element.associationSide.end2;
                                    if(end1.aggregation=='shared' && end2.aggregation=='none'){
                                        /* aggregation */
                                        objAssociation['type']='aggregation';
                                    } else if(end1.aggregation=='composite' && end2.aggregation=='none'){
                                        /* composition */
                                        objAssociation['type']='composition';
                                    }

                                    let objSource={};
                                    let source=end1.reference;
                                    objAssociation['source']=objSource;
                                    objSource['name']=source.name;
                                    objSource['type']=utils.getElementType(source);

                                    let objTarget={};
                                    let target=end2.reference;
                                    objAssociation['target']=objTarget;
                                    objTarget['name']=target.name;
                                    objTarget['type']=utils.getElementType(target);

                                    /* class side association binding */
                                    let objClass={};
                                    let classSide=element.classSide;
                                    objRelationship['class']=objClass;

                                    objClass['name']=classSide.name
                                    objClass['type']=utils.getElementType(classSide);

                                    /* association class side properties */
                                    /* Property binding--- */
                                    let propertyArr=[];
                                    objClass['Property']=propertyArr;
                                    let attribute=classSide.attributes;
                                    forEach(attribute,function(attr){
                                        let propertyObj={};
                                        propertyObj['name']=attr.name;  

                                        propertyObj['description']=attr.documentation;

                                        propertyObj['status']='';
                                        
                                        /* DataType binding--- */
                                        let dType={};
                                        if(utils.isString(attr.type)){

                                            dType.type=attr.type;
                                            propertyObj['DataType']=dType;
                                            dType['name']=attr.name;
                                            dType['cardinality']=attr.multiplicity;
                                        }else if(attr.type instanceof type.UMLClass){
                                            propertyObj['DataType']=dType;
                                            dType.type=utils.getElementType(attr.type);
                                            dType['name']=attr.type.name;
                                            dType['cardinality']=attr.multiplicity;
                                        }else if(attr.type instanceof type.UMLEnumeration){
                                            propertyObj['DataType']=dType;
                                            dType.type=utils.getElementType(attr.type);
                                            dType['name']=attr.type.name;
                                            dType['cardinality']=attr.multiplicity;

                                            /* binding literals  */
                                            let arrliterals=[];
                                            dType['enum']=arrliterals;
                                            let literals=attr.type.literals;
                                            forEach(literals,function(itemLiterals){
                                                arrliterals.push(itemLiterals.name);
                                            });

                                            dType['cardinality']=attr.multiplicity;
                                        }
                                        propertyArr.push(propertyObj);
                                    });
                                    /* ---- */





                                }else if(element instanceof type.UMLInterfaceRealization){
                                    objRelationship['type']=utils.getElementType(element);

                                    let objSource={};
                                    let source=element.source;
                                    objRelationship['source']=objSource;
                                    objSource['name']=source.name;
                                    objSource['type']=utils.getElementType(source);


                                    let objTarget={};
                                    let target=element.target;
                                    objRelationship['target']=objTarget;
                                    objTarget['name']=target.name;
                                    objTarget['type']=utils.getElementType(target);
                                }
                                Relationship.push(objRelationship);
                            })

                        });

                        /* let result=findVal(JSON.parse(replace),'type','EntityDiagram');
                        console.log("result",result); */
                        console.log('Json Processed',jsonProcess);
                        /*  
                            CircularJSON.stringify : 
                            Dealing with "TypeError: Converting circular structure to JSON" 
                            on JavaScript JavaScript structures that include circular references can't be 
                            serialized with a"plain" JSON.stringify. 
                        */
                        fs.writeFile(filename, CircularJSON.stringify(jsonProcess,null,4)/* JSON.stringify(jsonProcess,null,4) */, 'utf-8', function (err) {
                            if (err) {
                                app.dialogs.showErrorDialog(err.message);
                                return;
                            } else {
                                app.dialogs.showInfoDialog("Package is exported to path : " + filename);
                                return;
                            }
                        });
                        return ;

                        let package=JSON.parse(packageString);
                        let pkgArr=[];
                        let pkgobj={
                            package:package,
                            isAbstract:false
                        };

                        pkgArr.push(pkgobj);
                        console.log("package (Not Abstrackt)",package);


                        forEach(expPackages,function(item){
                            let itemPackageString=app.repository.writeObject(item);
                            let itemPackage=JSON.parse(itemPackageString);
                            let pkgobj={
                                package:itemPackage,
                                isAbstract:true
                            };

                            pkgArr.push(pkgobj);
                        });

                        console.log("package (All)",pkgArr);
                        

                        fs.writeFile(filename, JSON.stringify(pkgArr,null,4), 'utf-8', function (err) {
                            if (err) {
                                app.dialogs.showErrorDialog(err.message);
                            } else {
                                app.dialogs.showInfoDialog("Package is exported to path : " + filename);
                            }
                        });

                    } else {
                        console.log("Dialog cancelled");
                    }

                } else {
                    app.dialogs.showErrorDialog("Please select a package");
                }
            }
        });
}


module.exports.exportModel=exportModel;
module.exports.importModel=importModel;



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
