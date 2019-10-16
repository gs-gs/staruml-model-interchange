var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var mEntity = require('./entity');
var mEvent = require('./event');
const fs = require('fs');
const CircularJSON = require('circular-json');
var path = require('path');

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
            let associations=getPackageWiseUMLAssociation(umlPackage);
            forEach(associations, (itemGen) => {
                if (itemGen.end2.aggregation=='none' && itemGen.end2.reference.isAbstract == true) {
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
         filteredAssociation=[];
         forEach(associations,  (item) => {
              findParentPackage(package,item,item);
         });
         return filteredAssociation;
}
let filteredAssociation = [];
function findParentPackage(package,ele,item) {
    // return new Promise((resolve, reject) => {
    if (ele instanceof type.UMLPackage) {
         if (ele != null && ele.name == 'Movements'/* openAPI.getUMLPackage().name */) {
              // console.log("ele",ele);
              // console.log("item",item);
              filteredAssociation.push(item);
              // return item;
         }
         
         // resolve(assocItem);
    } else if (ele.hasOwnProperty('_parent') && ele._parent != null) {
         findParentPackage(package,ele._parent,item);
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

function importMovement() {

    
    ///home/vi109/Faizan-Vahevaria/StarUML/samplemodel.json
    let filePath = '/home/vi109/Faizan-Vahevaria/StarUML/EXI-FILES/Movementsabs.json';
    // let filePath='/home/vi109/Faizan-Vahevaria/StarUML/Package1.json';
    var contentStr = fs.readFileSync(filePath, 'utf8');
    var content = JSON.parse(contentStr);
    var XMIData = content;


    let mainOwnedElements = []
    let Package = {
        '_type': 'UMLPackage',
        'name': 'Movements',
        'ownedElements': mainOwnedElements
    };
    console.log("XMIData", XMIData);

    if (XMIData.type == fields.package) {
        // let mPackage=XMIData[key];
        /* Adding Entity & Interface*/
        Object.keys(XMIData).forEach(function eachKey(key) {
            let mSubObject = XMIData[key];
            /* UMLClass */
            if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {
                let entityObject = {};

                /* UMLClass fields */
                entityObject._type = 'UMLClass';
                entityObject.name = mSubObject.name;
                entityObject.documentation = mSubObject.description;

                /* UMLAttribute */
                let attributes = [];
                entityObject.attributes = attributes;

                forEach(mSubObject.Property, function (attr) {
                    let objAttr = {};
                    objAttr._type = 'UMLAttribute';
                    objAttr.name = attr.name;
                    objAttr.type = attr.DataType.type;
                    objAttr.isID = attr.isID;
                    objAttr.multiplicity = attr.cardinality;
                    attributes.push(objAttr);
                });



                mainOwnedElements.push(entityObject);

            }
            else if(mSubObject instanceof Object && mSubObject.type==fields.Event){

                let interfaceObject={};

                /* UMLInterface fields */
                interfaceObject._type='UMLInterface';
                interfaceObject.name=mSubObject.name;
                console.log("Event",mSubObject.name);
                interfaceObject.documentation=mSubObject.description;

                /* UMLAttribute */
                let attributes=[];
                interfaceObject.attributes=attributes;

                forEach(mSubObject.Property,function(attr){
                    let objAttr={};
                    objAttr._type='UMLAttribute';
                    objAttr.name=attr.name;
                    // objAttr.type=attr.DataType.type;
                    objAttr.isID=attr.isID;
                    objAttr.multiplicity=attr.cardinality;
                    attributes.push(objAttr);
                });

                /* UMLOperation */
                let operations=[];
                interfaceObject.operations=operations;

                forEach(mSubObject.Operation,function(attr){
                    let objOpr={};
                    objOpr._type='UMLOperation';
                    objOpr.name=attr.name;


                    let params=attr.Parameter;
                    let arrParam=[];
                    objOpr.parameters=arrParam;
                    /* UMLParameter */
                    forEach(params,function(param){
                        let objParam={};
                        objParam._type='UMLParameter';
                        objParam.name=param.name;
                        //TODO : Remove below comment and resolve issue
                        // objParam.type=param.DataType.type;
                        objParam.isID=param.isID;
                        objParam.multiplicity=param.cardinality;

                        arrParam.push(objParam);
                    });

                    operations.push(objOpr);
                });
                mainOwnedElements.push(interfaceObject);
            }
        });

        let mProject = app.project.getProject();
        let result = app.project.importFromJson(mProject, Package);
        console.log("result", result);

        /* Adding Relationship */
        forEach(result.ownedElements, function (entity) {
            let mSubObject = XMIData[entity.name];

            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* ownElements ( Relationship ) */
            let ownedElements = [];
            entityJson.ownedElements = ownedElements;

            forEach(mSubObject.Relationship, function (attr) {
                let objRelationship = {};
                if (attr.type == fields.aggregation) {
                    /* UMLAssociation (aggregation) */
                    console.log("-----aggregation", entity.name);

                    // objRelationship._id="";
                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'shared';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if (attr.type == fields.composition) {
                    /* UMLAssociation (composition) */
                    console.log("-----composition", entity.name);


                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'composite';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.generalization) {
                    /* UMLGeneralization (generalization) */
                    console.log("-----generalization", entity.name);


                    objRelationship._type = 'UMLGeneralization';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.source = objEnd1;
                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });
                    
                    
                    if(fRefEnd1.length>0){
                        objEnd1['$ref']=fRefEnd1[0]._id;
                    }
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLClass';
                    objRelationship.target = objEnd2;

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0) {
                        objEnd2['$ref'] = fRefEnd2[0]._id;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.interfaceRealization){
                    /* UMLInterfaceRealization (interfaceRealization) */
                    console.log("-----interfaceRealization", entity.name);


                    objRelationship._type = 'UMLInterfaceRealization';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.source = objEnd1;
                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });
                    
                    
                    if(fRefEnd1.length>0){
                        objEnd1['$ref']=fRefEnd1[0]._id;
                    }
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLClass';
                    objRelationship.target = objEnd2;

                    let target = attr.target;
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0) {
                        objEnd2['$ref'] = fRefEnd2[0]._id;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.interface){

                    /* UMLAssociation (aggregation) */
                    console.log("-----aggregation", entity.name);


                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'none';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                
                }
            });


        });
    }
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
        /* Adding Entity & Interface*/
        Object.keys(XMIData).forEach(function eachKey(key) {
            let mSubObject = XMIData[key];
            /* UMLClass */
            if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {
                let entityObject = {};

                /* UMLClass fields */
                entityObject._type = 'UMLClass';
                entityObject.name = mSubObject.name;
                entityObject.documentation = mSubObject.description;

                /* UMLAttribute */
                let attributes = [];
                entityObject.attributes = attributes;

                forEach(mSubObject.Property, function (attr) {
                    let objAttr = {};
                    objAttr._type = 'UMLAttribute';
                    objAttr.name = attr.name;
                    objAttr.type = attr.DataType.type;
                    objAttr.isID = attr.isID;
                    objAttr.multiplicity = attr.cardinality;
                    attributes.push(objAttr);
                });



                mainOwnedElements.push(entityObject);

            }
            else if(mSubObject instanceof Object && mSubObject.type==fields.Event){

                let interfaceObject={};

                /* UMLInterface fields */
                interfaceObject._type='UMLInterface';
                interfaceObject.name=mSubObject.name;
                console.log("Event",mSubObject.name);
                interfaceObject.documentation=mSubObject.description;

                /* UMLAttribute */
                let attributes=[];
                interfaceObject.attributes=attributes;

                forEach(mSubObject.Property,function(attr){
                    let objAttr={};
                    objAttr._type='UMLAttribute';
                    objAttr.name=attr.name;
                    // objAttr.type=attr.DataType.type;
                    objAttr.isID=attr.isID;
                    objAttr.multiplicity=attr.cardinality;
                    attributes.push(objAttr);
                });

                /* UMLOperation */
                let operations=[];
                interfaceObject.operations=operations;

                forEach(mSubObject.Operation,function(attr){
                    let objOpr={};
                    objOpr._type='UMLOperation';
                    objOpr.name=attr.name;


                    let params=attr.Parameter;
                    let arrParam=[];
                    objOpr.parameters=arrParam;
                    /* UMLParameter */
                    forEach(params,function(param){
                        let objParam={};
                        objParam._type='UMLParameter';
                        objParam.name=param.name;
                        //TODO : Remove below comment and resolve issue
                        // objParam.type=param.DataType.type;
                        objParam.isID=param.isID;
                        objParam.multiplicity=param.cardinality;

                        arrParam.push(objParam);
                    });

                    operations.push(objOpr);
                });
                mainOwnedElements.push(interfaceObject);
            }
        });

        let mProject = app.project.getProject();
        let result = app.project.importFromJson(mProject, Package);
        console.log("result", result);

        /* Adding Relationship */
        forEach(result.ownedElements, function (entity) {
            let mSubObject = XMIData[entity.name];

            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* ownElements ( Relationship ) */
            let ownedElements = [];
            entityJson.ownedElements = ownedElements;

            forEach(mSubObject.Relationship, function (attr) {
                let objRelationship = {};
                if (attr.type == fields.aggregation) {
                    /* UMLAssociation (aggregation) */
                    console.log("-----aggregation", entity.name);

                    // objRelationship._id="";
                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'shared';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if (attr.type == fields.composition) {
                    /* UMLAssociation (composition) */
                    console.log("-----composition", entity.name);


                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'composite';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.generalization) {
                    /* UMLGeneralization (generalization) */
                    console.log("-----generalization", entity.name);


                    objRelationship._type = 'UMLGeneralization';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.source = objEnd1;
                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });
                    
                    
                    if(fRefEnd1.length>0){
                        objEnd1['$ref']=fRefEnd1[0]._id;
                    }
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLClass';
                    objRelationship.target = objEnd2;

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0) {
                        objEnd2['$ref'] = fRefEnd2[0]._id;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.interfaceRealization){
                    /* UMLInterfaceRealization (interfaceRealization) */
                    console.log("-----interfaceRealization", entity.name);


                    objRelationship._type = 'UMLInterfaceRealization';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.source = objEnd1;
                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });
                    
                    
                    if(fRefEnd1.length>0){
                        objEnd1['$ref']=fRefEnd1[0]._id;
                    }
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLClass';
                    objRelationship.target = objEnd2;

                    let target = attr.target;
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0) {
                        objEnd2['$ref'] = fRefEnd2[0]._id;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.interface){

                    /* UMLAssociation (aggregation) */
                    console.log("-----aggregation", entity.name);


                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'none';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                
                }
            });


        });
    }
}


function importModel() {

    var mFiles = app.dialogs.showOpenDialog('Import package As JSON (.json)', null, JSON_FILE_FILTERS)
    if (mFiles && mFiles.length > 0) {
        try {
            /* Main XMIData */
            let filePath = mFiles[0];
            var contentStr = fs.readFileSync(filePath, 'utf8');
            var content = JSON.parse(contentStr);
            var MainXMIData = content;
            console.log("Main XMIData",MainXMIData);

            if(MainXMIData.hasOwnProperty(fields.dependent) && MainXMIData.dependent.length>0){
                let absFiles=MainXMIData.dependent;
                if(absFiles.length>0){
                    forEach(absFiles,function(AbstractXMIData){

                        /* Abstract file XMIData */
                        importParty(AbstractXMIData);
                    });
                }
            }

            importParty(MainXMIData);

        }catch(error){
            console.error(error.message);
        }
    }

    return;

    importParty();
    importMovement();

    return;
    ///home/vi109/Faizan-Vahevaria/StarUML/samplemodel.json
    let filePath = '/home/vi109/Faizan-Vahevaria/StarUML/tempImport.json';
    // let filePath='/home/vi109/Faizan-Vahevaria/StarUML/Package1.json';
    var contentStr = fs.readFileSync(filePath, 'utf8');
    var content = JSON.parse(contentStr);
    var XMIData = content;


    let mainOwnedElements = []
    let Package = {
        '_type': 'UMLPackage',
        'name': 'TempImport',
        'ownedElements': mainOwnedElements
    };
    console.log("XMIData", XMIData);

    if (XMIData.type == fields.package) {
        // let mPackage=XMIData[key];
        /* Adding Entity & Interface*/
        Object.keys(XMIData).forEach(function eachKey(key) {
            let mSubObject = XMIData[key];
            /* UMLClass */
            if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {
                let entityObject = {};

                /* UMLClass fields */
                entityObject._type = 'UMLClass';
                entityObject.name = mSubObject.name;
                entityObject.documentation = mSubObject.description;

                /* UMLAttribute */
                let attributes = [];
                entityObject.attributes = attributes;

                forEach(mSubObject.Property, function (attr) {
                    let objAttr = {};
                    objAttr._type = 'UMLAttribute';
                    objAttr.name = attr.name;
                    objAttr.type = attr.DataType.type;
                    objAttr.isID = attr.isID;
                    objAttr.multiplicity = attr.cardinality;
                    attributes.push(objAttr);
                });



                mainOwnedElements.push(entityObject);

            }
            else if(mSubObject instanceof Object && mSubObject.type==fields.Event){

                let interfaceObject={};

                /* UMLInterface fields */
                interfaceObject._type='UMLInterface';
                interfaceObject.name=mSubObject.name;
                console.log("Event",mSubObject.name);
                interfaceObject.documentation=mSubObject.description;

                /* UMLAttribute */
                let attributes=[];
                interfaceObject.attributes=attributes;

                forEach(mSubObject.Property,function(attr){
                    let objAttr={};
                    objAttr._type='UMLAttribute';
                    objAttr.name=attr.name;
                    // objAttr.type=attr.DataType.type;
                    objAttr.isID=attr.isID;
                    objAttr.multiplicity=attr.cardinality;
                    attributes.push(objAttr);
                });

                /* UMLOperation */
                let operations=[];
                interfaceObject.operations=operations;

                forEach(mSubObject.Operation,function(attr){
                    let objOpr={};
                    objOpr._type='UMLOperation';
                    objOpr.name=attr.name;


                    let params=attr.Parameter;
                    let arrParam=[];
                    objOpr.parameters=arrParam;
                    /* UMLParameter */
                    forEach(params,function(param){
                        let objParam={};
                        objParam._type='UMLParameter';
                        objParam.name=param.name;
                        //TODO : Remove below comment and resolve issue
                        // objParam.type=param.DataType.type;
                        objParam.isID=param.isID;
                        objParam.multiplicity=param.cardinality;

                        arrParam.push(objParam);
                    });

                    operations.push(objOpr);
                });
                mainOwnedElements.push(interfaceObject);
            }
        });

        let mProject = app.project.getProject();
        let result = app.project.importFromJson(mProject, Package);
        console.log("result", result);

        /* Adding Relationship */
        forEach(result.ownedElements, function (entity) {
            let mSubObject = XMIData[entity.name];

            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* ownElements ( Relationship ) */
            let ownedElements = [];
            entityJson.ownedElements = ownedElements;

            forEach(mSubObject.Relationship, function (attr) {
                let objRelationship = {};
                if (attr.type == fields.aggregation) {
                    /* UMLAssociation (aggregation) */
                    console.log("-----aggregation", entity.name);

                    // objRelationship._id="";
                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'shared';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if (attr.type == fields.composition) {
                    /* UMLAssociation (composition) */
                    console.log("-----composition", entity.name);


                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'composite';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.generalization) {
                    /* UMLGeneralization (generalization) */
                    console.log("-----generalization", entity.name);


                    objRelationship._type = 'UMLGeneralization';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.source = objEnd1;
                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });
                    
                    
                    if(fRefEnd1.length>0){
                        objEnd1['$ref']=fRefEnd1[0]._id;
                    }
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLClass';
                    objRelationship.target = objEnd2;

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0) {
                        objEnd2['$ref'] = fRefEnd2[0]._id;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.interfaceRealization){
                    /* UMLInterfaceRealization (interfaceRealization) */
                    console.log("-----interfaceRealization", entity.name);


                    objRelationship._type = 'UMLInterfaceRealization';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.source = objEnd1;
                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });
                    
                    
                    if(fRefEnd1.length>0){
                        objEnd1['$ref']=fRefEnd1[0]._id;
                    }
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLClass';
                    objRelationship.target = objEnd2;

                    let target = attr.target;
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0) {
                        objEnd2['$ref'] = fRefEnd2[0]._id;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                } else if(attr.type == fields.interface){

                    /* UMLAssociation (aggregation) */
                    console.log("-----aggregation", entity.name);


                    objRelationship._type = 'UMLAssociation';
                    objRelationship.name = attr.name;
                    objRelationship.documentation = attr.description;

                    /* Source */
                    let objEnd1 = {};
                    objRelationship.end1 = objEnd1;
                    objEnd1._type = 'UMLAssociationEnd';
                    objEnd1.aggregation = 'none';

                    /* Reference to UMLClass or UMLInterface */

                    let source = attr.source;
                    let refEnd1 = app.repository.search(source.name);

                    let fRefEnd1 = refEnd1.filter(function (item) {
                        return item.name == source.name;
                    });

                    let objReferenceEnd1 = {}
                    /* if(fRefEnd1.length>0){
                        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    } */
                    /* target */
                    let objEnd2 = {};
                    objEnd2._type = 'UMLAssociationEnd';
                    objRelationship.end2 = objEnd2;
                    objEnd2.aggregation = 'none';

                    let target = attr.target;
                    let objReferenceEnd2 = {}
                    let refEnd2 = app.repository.search(target.name);

                    let fRefEnd2 = refEnd2.filter(function (item) {
                        return item.name == target.name;
                    });

                    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
                        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
                        objEnd2.reference = objReferenceEnd2;

                        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
                        objEnd1.reference = objReferenceEnd1;
                    }

                    let rel = app.repository.readObject(objRelationship);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'ownedElements', rel);
                    console.log("mResult", mResult);
                
                }
            });


        });
    }






    return;

    var mFiles = app.dialogs.showOpenDialog('Import package As JSON (.json)', null, JSON_FILE_FILTERS)
    if (mFiles && mFiles.length > 0) {
        try {
            console.log("mFiles : ", mFiles[0]);
            var contentStr = fs.readFileSync(mFiles[0], 'utf8');
            console.log("Temp log", contentStr);
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
                            let expandedIds = [];
                            let allPackages = app.repository.select("@UMLPackage");

                            forEach(XMIData, function (pkg) {

                                let flterPkg = allPackages.filter(function (mPkg) {
                                    return mPkg._id == pkg.package._id
                                });

                                if (flterPkg.length == 0) {
                                    let result = app.project.importFromJson(umlPackage, pkg.package)
                                    console.log("result", result);
                                    if (!pkg.isAbstract) {
                                        expandedIds.push(app.repository.get(pkg.package._id));
                                    }
                                }

                            });
                            app.modelExplorer.rebuild();
                            app.modelExplorer.expand(app.project.getProject());
                            forEach(expandedIds, function (expIds) {
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
}

function importModel1() {

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
                            let expandedIds = [];
                            let allPackages = app.repository.select("@UMLPackage");

                            forEach(XMIData, function (pkg) {

                                let flterPkg = allPackages.filter(function (mPkg) {
                                    return mPkg._id == pkg.package._id
                                });

                                if (flterPkg.length == 0) {
                                    let result = app.project.importFromJson(umlPackage, pkg.package)
                                    console.log("result", result);
                                    if (!pkg.isAbstract) {
                                        expandedIds.push(app.repository.get(pkg.package._id));
                                    }
                                }

                            });
                            app.modelExplorer.rebuild();
                            app.modelExplorer.expand(app.project.getProject());
                            forEach(expandedIds, function (expIds) {
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

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findVal(object, key, value) {
    var value;
    Object.keys(object).some(function (k) {
        if (k === key && object[k] == value) {

            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key, value);
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
                    let filename = umlPackage.name;
                    /* Export main package */
                    let jsonProcess={};
                    if (filename) {
                        console.log("Filename : ", filename);
                        jsonProcess[fields.type] = fields.package;
                        jsonProcess[fields.name] = umlPackage.name;
                        /* Entity binding--- */
                        mEntity.bindEntity(umlPackage, jsonProcess);

                        /* Event binding */
                        mEvent.bindEvent(umlPackage, jsonProcess);

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
                                package:item._parent,
                                [fields.isAbstract]:true
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
                    let dependent=[];
                    jsonProcess[fields.dependent]=dependent
                    forEach(expPackages, function (item) {

                        let mPackage=item.package;

                        let abstractJsonProcess = {};
                        abstractJsonProcess[fields.type] = fields.package;
                        abstractJsonProcess[fields.name] = mPackage.name;
                        abstractJsonProcess[fields.isAbstract] = item.isAbstract;
                        /* Entity binding--- */
                        mEntity.bindEntity(mPackage, abstractJsonProcess);

                        /* Event binding */
                        mEvent.bindEvent(mPackage, abstractJsonProcess);

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
                                app.dialogs.showInfoDialog("Package \'"+umlPackage.name+"\' is exported to path : " + fName);
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