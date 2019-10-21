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
        let res=app.repository.search(attr.name);
        forEach(res,function(item){
            if(item instanceof type.UMLClass){
                dType['$ref']=item._id;
            }
        });
        return dType;
        
    } else if (attr.type == fields.Event) {
        let res=app.repository.search(attr.name);
        forEach(res,function(item){
            if(item instanceof type.UMLInterface){
                dType['$ref']=item._id;
            }
        });
        return dType;
        
    } else if (attr.type == fields.Enum) {
        
        let res=app.repository.search(attr.name);
        forEach(res,function(item){
            if(item instanceof type.UMLEnumeration){
                dType['$ref']=item._id;
            }
        });
        return dType;
    } else if (isString(attr.type)) {
        /* if (attr.type == datatype.url) {
            dType[fields.pattern] = constant.regex_email;
        }
        dType.type = attr.type;
        propertyObj[fields.DataType] = dType;
        dType[fields.name] = attr.name; */
        // dType=attr.type;
        return attr.type
    } 
}
function addProperty(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLClass || entity instanceof type.UMLEnumeration || entity instanceof type.UMLInterface) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let attributes = [];
            entityJson.attributes = attributes;

            forEach(mSubObject.Property, function (attr) {
                let objProp=bindEntityProperty(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'attributes', rel);
                    console.log("mResult", mResult);
                }
            });
        }
    });
}
function updateProperty(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLClass || entity instanceof type.UMLEnumeration || entity instanceof type.UMLInterface) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let attributes = [];
            entityJson.attributes = attributes;

            forEach(mSubObject.Property, function (attr) {
                let objProp=bindEntityProperty(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    attributes.push(rel);
                    //let mResult = app.engine.addItem(entity, 'attributes', rel);
                    //console.log("mResult", mResult);
                }
            });
            app.engine.setProperty(entity,'attributes',attributes);
        }
    });
}
function addLiterals(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLEnumeration) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let literals = [];
            entityJson.literals = literals;

            forEach(mSubObject[fields.Enum], function (attr) {
                let objProp=bindLiterals(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'literals', rel);
                    console.log("mResult", mResult);
                }
            });
        }
    });
}
function updateLiterals(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLEnumeration) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let literals = [];
            entityJson.literals = literals;

            forEach(mSubObject[fields.Enum], function (attr) {
                let objProp=bindLiterals(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    // let mResult = app.engine.addItem(entity, 'literals', rel);
                    //console.log("mResult", mResult);
                    literals.push(rel);
                }
            });
            app.engine.setProperty(entity,'literals',literals);

        }
    });
}
function addOperation(ownedElements, XMIData) {
   
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
                let objProp=bindOperation(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    let mResult = app.engine.addItem(entity, 'operations', rel);
                    console.log("mResult", mResult);
                }
            });
        }
    });
}
function updateOperation(ownedElements, XMIData) {
   
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
                let objProp=bindOperation(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    //TODO
                    //objRelationship.type=attr.DataType.type;
                    // objRelationship.multiplicity=attr.cardinality;
                    //ownedElements.push(rel);
                    // let mResult = app.engine.addItem(entity, 'operations', rel);
                    // console.log("mResult", mResult);
                    operations.push(rel);
                }
            });
            app.engine.setProperty(entity,'operations',operations);
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
function bindEntityProperty(attr) {
    /* UMLAttribute */
    let objAttr = {};
    objAttr._type = 'UMLAttribute';
    objAttr.name = attr.name;

    //if(attr.DataType.type == utils.isString)
    let dType=getDatatype(attr.DataType);//attr.DataType.type;
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
        let dType=getDatatype(param.DataType);//attr.DataType.type;
        // objAttr.type = dType;
        objParam.type=dType//param.DataType.type;
        objParam.isID = param.isID;
        objParam.multiplicity = param.cardinality;

        arrParam.push(objParam);
    });
    return objOpr;
}
module.exports.getElementType = getElementType;
module.exports.isString = isString;
module.exports.getRelationshipType = getRelationshipType;
module.exports.addDatatype = addDatatype;
module.exports.getDatatype=getDatatype;
module.exports.addProperty = addProperty;
module.exports.bindEntityProperty = bindEntityProperty;
module.exports.addOperation = addOperation;
module.exports.bindOperation = bindOperation;
module.exports.addLiterals = addLiterals;
module.exports.bindLiterals = bindLiterals;
module.exports.updateProperty = updateProperty;
module.exports.updateLiterals = updateLiterals;
module.exports.updateOperation = updateOperation;
