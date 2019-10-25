var constant = require('../constant');
var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var datatype = require('./datatype');

function getElementType(element) {
    if (element instanceof type.UMLClass) {
        return fields.Entity;
    } else if (element instanceof type.UMLInterface) {
        return fields.Event;
    } else if (element instanceof type.UMLInterfaceRealization) {
        return fields.interfaceRealization;
    } else if (element instanceof type.UMLGeneralization) {
        return fields.generalization;
    } else if (element instanceof type.UMLAssociationClassLink) {
        return fields.associationClassLink;
    } else if (element instanceof type.UMLEnumeration) {
        return fields.Enum;
    } else {
        return 'UN_DEFINED';
    }

}

function getRelationshipType(end1, end2) {
    if (end1.aggregation == 'shared' && end2.aggregation == 'none') {
        /* aggregation */
        return fields.aggregation;
    } else if (end1.aggregation == 'composite' && end2.aggregation == 'none') {
        /* composition */
        return fields.composition;
    } else if (end1.aggregation == 'none' && end2.aggregation == 'none') {
        /* event (interface) : when relationship between interface to interface */
        return fields.interface;
    }
}

function isString(s) {
    return typeof (s) === 'string' || s instanceof String;
}

function addDatatype(propertyObj, attr) {
    let dType = {};
    if (isString(attr.type)) {
        if (attr.type == datatype.url) {
            dType[fields.pattern] = constant.regex_email;
        }
        dType.type = attr.type;
        propertyObj[fields.DataType] = dType;
        dType[fields.name] = attr.name;
    } else if (attr.type instanceof type.UMLClass) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;
    } else if (attr.type instanceof type.UMLInterface) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;
    } else if (attr.type instanceof type.UMLEnumeration) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;

        /* binding literals  */
        let arrliterals = [];
        dType[fields.Enum] = arrliterals;
        let literals = attr.type.literals;
        forEach(literals, function (itemLiterals) {
            arrliterals.push(itemLiterals.name);
        });

    }
}

function getDatatype(attr) {
    let dType = {};
    if (attr.type == fields.Entity) {
        let res = app.repository.search(attr.name);
        forEach(res, function (item) {
            if (item instanceof type.UMLClass) {
                dType['$ref'] = item._id;
            }
        });
        return dType;

    } else if (attr.type == fields.Event) {
        let res = app.repository.search(attr.name);
        forEach(res, function (item) {
            if (item instanceof type.UMLInterface) {
                dType['$ref'] = item._id;
            }
        });
        return dType;

    } else if (attr.type == fields.Enum) {

        let res = app.repository.search(attr.name);
        forEach(res, function (item) {
            if (item instanceof type.UMLEnumeration) {
                dType['$ref'] = item._id;
            }
        });
        return dType;
    } else if (isString(attr.type)) {
        return attr.type
    }
}

function setProperty(ownedElements, XMIData) {



    forEach(ownedElements, function (entity) {
        let diagram=null;
        if (entity instanceof type.UMLClassDiagram) {
            diagram=entity;
        }
        if (entity instanceof type.UMLClass || entity instanceof type.UMLEnumeration || entity instanceof type.UMLInterface) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);

            /* Check for new properties to be added */
            let newProps = [];
            let existProps = [];
            forEach(mSubObject.Property, function (item) {
                let chkForDuplicate = newProps.filter(function (mFltr) {
                    return mFltr.name == item.name
                });
                if (chkForDuplicate.length == 0) {


                    let atbts = entity.attributes.filter(function (fItem) {
                        return item.name == fItem.name
                    });
                    if (atbts.length == 0) {
                        // forEach(atbts, function (mItem) {
                        newProps.push(item);
                        // });
                    } else if (atbts.length == 1) {
                        existProps.push(atbts[0]);
                    }
                }
            });
            /*  */


            /* attribute ( Property ) */
            let attributes = [];
            entityJson.attributes = attributes;
            forEach(mSubObject.Property, function (attr) {
                let chkNew=newProps.filter(function(nItem){
                    return attr.name==nItem.name
                });
                

                let objProp = bindProperty(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    attributes.push(rel);
                }
            });
            let resRel = app.engine.setProperty(entity, 'attributes', attributes);
            console.log("setProperty", resRel);
        }
    });
}

function setLiterals(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLEnumeration) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let literals = [];
            entityJson.literals = literals;

            forEach(mSubObject[fields.Enum], function (attr) {
                let objProp = bindLiterals(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    literals.push(rel);
                }
            });
            let resRel = app.engine.setProperty(entity, 'literals', literals);
            //let resRel=app.engine.setProperty(entity,'literals',literals);
            // app.modelExplorer.update(entity)
            console.log("setLiterals", resRel);
        }
    });
}

function setOperation(ownedElements, XMIData) {

    /* UMLOperation */
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLInterface) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* operations ( Operation ) */
            let operations = [];
            entityJson.operations = operations;

            forEach(mSubObject.Operation, function (attr) {
                let objProp = bindOperation(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    // let mResult = app.engine.addItem(entity, 'operations', rel);
                    // console.log("mResult", mResult);
                    operations.push(rel);
                }
            });
            let resRel = app.engine.setProperty(entity, 'operations', operations);
            console.log("setOperation", resRel);
        }
    });
}

function bindLiterals(attr) {
    /* UMLAttribute */
    let objAttr = {};
    objAttr._type = 'UMLEnumerationLiteral';
    objAttr.name = attr;
    return objAttr;
}

function bindProperty(attr) {
    /* UMLAttribute */
    let objAttr = {};
    objAttr._type = 'UMLAttribute';
    objAttr.name = attr.name;

    //if(attr.DataType.type == utils.isString)
    let dType = getDatatype(attr.DataType); //attr.DataType.type;
    objAttr.type = dType;
    objAttr.isID = attr.isID;
    objAttr.multiplicity = attr.cardinality;
    objAttr.documentation = attr.description;
    //attribute.push(objAttr);
    return objAttr;
}

function bindOperation(attr) {
    /* UMLAttribute */
    let objOpr = {};
    objOpr._type = 'UMLOperation';
    objOpr.name = attr.name;


    let params = attr.Parameter;
    let arrParam = [];
    objOpr.parameters = arrParam;
    /* UMLParameter */
    forEach(params, function (param) {
        let objParam = {};
        objParam._type = 'UMLParameter';
        objParam.name = param.name;
        //TODO : Remove below comment and resolve issue
        let dType = getDatatype(param.DataType); //attr.DataType.type;
        // objAttr.type = dType;
        objParam.type = dType //param.DataType.type;
        objParam.isID = param.isID;
        objParam.multiplicity = param.cardinality;

        arrParam.push(objParam);
    });
    return objOpr;
}
function isAssociationExist(entity,attr){
    let isExist=false;
    let assoc=null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLAssociation) {
            if (aggr.name == attr.name &&
                aggr.end1.reference.name == attr.source.name && getElementType(aggr.end1.reference) == attr.source.type &&
                aggr.end2.reference.name == attr.target.name && getElementType(aggr.end2.reference) == attr.target.type
            ) {
                isExist=true;
                assoc=aggr;
                return;
            }
        }
    });
    let val={
        isExist:isExist,
        assoc:assoc
    };
    return val;
}
function isGeneralizationExist(entity,attr){
    let isExist=false;
    let assoc=null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLGeneralization) {
            if (aggr.name == attr.name &&
                aggr.source.name == attr.source.name && getElementType(aggr.source) == attr.source.type &&
                aggr.target.name == attr.target.name && getElementType(aggr.target) == attr.target.type
            ) {
                isExist=true;
                assoc=aggr;
                return;
            }
        }
    });
    let val={
        isExist:isExist,
        assoc:assoc
    };
    return val;
}
function isInterfaceRealizationExist(entity,attr){
    let isExist=false;
    let assoc=null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLInterfaceRealization) {
            if (aggr.name == attr.name &&
                aggr.source.name == attr.source.name && getElementType(aggr.source) == attr.source.type &&
                aggr.target.name == attr.target.name && getElementType(aggr.target) == attr.target.type
            ) {
                isExist=true;
                assoc=aggr;
                return;
            }
        }
    });
    let val={
        isExist:isExist,
        assoc:assoc
    };
    return val;
}
function isAssociationClassLinkExist(entity,attr){
    let isExist=false;
    let assoc=null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLAssociationClassLink) {

                let associationSide=isAssociationExist(entity,attr.association);

            if (aggr.name == attr.name &&
                aggr.classSide.name == attr.class.name && getElementType(aggr.classSide) == attr.class.type &&
                associationSide.isExist
            ) {
                isExist=true;
                assoc=aggr;
                return;
            }
        }
    });
    let val={
        isExist:isExist,
        assoc:assoc
    };
    return val;
}
module.exports.getElementType = getElementType;
module.exports.isString = isString;
module.exports.getRelationshipType = getRelationshipType;
module.exports.addDatatype = addDatatype;
module.exports.getDatatype = getDatatype;
module.exports.setProperty = setProperty;
module.exports.bindProperty = bindProperty;
module.exports.setOperation = setOperation;
module.exports.bindOperation = bindOperation;
module.exports.setLiterals = setLiterals;
module.exports.bindLiterals = bindLiterals;
module.exports.isAssociationExist = isAssociationExist;
module.exports.isGeneralizationExist = isGeneralizationExist;
module.exports.isInterfaceRealizationExist = isInterfaceRealizationExist;
module.exports.isAssociationClassLinkExist = isAssociationClassLinkExist;