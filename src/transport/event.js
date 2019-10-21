var fields = require('./fields');
var utils = require('./utils');
var forEach = require('async-foreach').forEach;
var datatype = require('./datatype');

function addEventFields(eventObj, event) {
    eventObj[fields.type] = utils.getElementType(event);
    eventObj[fields.name] = event.name;
    eventObj[fields.description] = event.documentation;
    let objFrom = {};
    let objTo = {};
    eventObj[fields.from] = objFrom;
    eventObj[fields.to] = objTo;
}

function addEventRequiredFields(eventObj, event) {
    let requiredArr = [];
    eventObj[fields.Required] = requiredArr;
    let attributeForRequired = event.attributes;
    forEach(attributeForRequired, function (attrForRequired) {
        if (attrForRequired.multiplicity == "1" || attrForRequired.multiplicity == "1..*") {
            requiredArr.push(attrForRequired.name);
        }
    });
}

function addEventPropertyFields(eventObj, event) {
    let propertyArr = [];
    eventObj[fields.Property] = propertyArr;
    let attribute = event.attributes;
    forEach(attribute, function (attr) {
        let propertyObj = {};
        propertyObj[fields.name] = attr.name;

        propertyObj[fields.description] = attr.documentation;

        // if (attr.isID) {
        propertyObj[fields.isID] = attr.isID;
        // }
        propertyObj[fields.cardinality] = attr.multiplicity;
        /* Property DataType binding */
        utils.addDatatype(propertyObj, attr);

        propertyArr.push(propertyObj);
    });
}

function addEventRelationshipFields(eventObj, event) {
    let Relationship = [];
    eventObj[fields.Relationship] = Relationship;
    forEach(event.ownedElements, function (element) {
        let objRelationship = {};

        objRelationship[fields.name] = element.name;
        objRelationship[fields.description] = element.documentation;

        if (element instanceof type.UMLAssociation) {

            /* adding relationship type 'aggregation', 'composition', 'interface' */
            let end1 = element.end1;
            let end2 = element.end2;
            objRelationship[fields.type] = utils.getRelationshipType(end1, end2);

            /* adding 'source' object */
            let objSource = {};
            let source = end1.reference;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);

            /* adding 'target' object */
            let objTarget = {};
            let target = end2.reference;
            objRelationship[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);

        } else if (element instanceof type.UMLGeneralization) {

            /* adding relationship type 'generation' */
            objRelationship[fields.type] = utils.getElementType(element);

            /* adding 'source' object */
            let objSource = {};
            let source = element.source;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);

            /* adding 'target' object */
            let objTarget = {};
            let target = element.target;
            objRelationship[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);

        } else if (element instanceof type.UMLAssociationClassLink) {

            /* adding relationship type 'associationClassLink' */
            objRelationship[fields.type] = utils.getElementType(element);
            let objAssociation = {};
            /* association binding */
            objRelationship[fields.association] = objAssociation;


            /* adding relationship type 'aggregation', 'composition', 'interface' */
            let end1 = element.associationSide.end1;
            let end2 = element.associationSide.end2;
            objAssociation[fields.type] = utils.getRelationshipType(end1, end2);

            /* adding 'source' object */
            let objSource = {};
            let source = end1.reference;
            objAssociation[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);

            /* adding 'target' object */
            let objTarget = {};
            let target = end2.reference;
            objAssociation[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);

            /* class side association binding */
            let objClass = {};
            let classSide = element.classSide;
            objRelationship[fields.class] = objClass;

            objClass[fields.name] = classSide.name
            objClass[fields.type] = utils.getElementType(classSide);


        } else if (element instanceof type.UMLInterfaceRealization) {
            /* adding relationship type 'interfaceRealization' */
            objRelationship[fields.type] = utils.getElementType(element);

            /* adding 'source' object */
            let objSource = {};
            let source = element.source;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);

            /* adding 'target' object */
            let objTarget = {};
            let target = element.target;
            objRelationship[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);
        }
        Relationship.push(objRelationship);
    })
}

function addEventOperationFields(eventObj, event) {
    let Operations = [];
    eventObj[fields.Operation] = Operations;
    forEach(event.operations, function (element) {
        let objOperation = {};
        objOperation[fields.name] = element.name;
        let arrParameters = [];
        objOperation[fields.Parameter] = arrParameters;
        forEach(element.parameters, function (params) {
            let objParam = {};;
            objParam[fields.name] = params.name;
            objParam[fields.description] = params.documentation;
            objParam[fields.status] = '';

            /* Property DataType binding */
            utils.addDatatype(objParam, params);


            arrParameters.push(objParam);
        });

        Operations.push(objOperation);
    })
}

function bindEventToExport(mPackage, jsonProcess) {
    let allEvents = app.repository.select(mPackage.name + '::@UMLInterface');
    forEach(allEvents, function (event) {

        let eventObj = {};
        jsonProcess[event.name] = eventObj;

        /* Event property fields binding */
        addEventFields(eventObj, event)

        /* Event Required fields properties binding */
        addEventRequiredFields(eventObj, event);

        /* Event Properties array binding */
        addEventPropertyFields(eventObj, event);

        /* Event Relationship array binding */
        addEventRelationshipFields(eventObj, event);

        /* Event Operation array binding */
        addEventOperationFields(eventObj, event);

    });
}
function bindAbstractEventToExport(mPackage, jsonProcess) {
    //let allEvents = app.repository.select(mPackage.name + '::@UMLInterface');
    forEach(mPackage.ownedElements, function (event) {
        if(event instanceof type.UMLInterface){

            let eventObj = {};
            jsonProcess[event.name] = eventObj;
            
            /* Event property fields binding */
            addEventFields(eventObj, event)
            
            /* Event Required fields properties binding */
            addEventRequiredFields(eventObj, event);
            
            /* Event Properties array binding */
            addEventPropertyFields(eventObj, event);
            
            /* Event Relationship array binding */
            addEventRelationshipFields(eventObj, event);
            
            /* Event Operation array binding */
            addEventOperationFields(eventObj, event);
        }

    });
}

function bindEventToImport(interfaceObject, mSubObject) {
    /* UMLInterface fields */
    interfaceObject._type = 'UMLInterface';
    interfaceObject.name = mSubObject.name;
    console.log("Event", mSubObject.name);
    interfaceObject.documentation = mSubObject.description;

    /* UMLAttribute */
    /* let attributes = [];
    interfaceObject.attributes = attributes;

    forEach(mSubObject.Property, function (attr) {
        let objAttr = {};
        objAttr._type = 'UMLAttribute';
        objAttr.name = attr.name;
        objAttr.type=attr.DataType.type;
        objAttr.isID = attr.isID;
        objAttr.multiplicity = attr.cardinality;
        attributes.push(objAttr);
    }); */

    /* UMLOperation */
    // let operations = [];
    // interfaceObject.operations = operations;

    // forEach(mSubObject.Operation, function (attr) {
    //     let objOpr = {};
    //     objOpr._type = 'UMLOperation';
    //     objOpr.name = attr.name;


    //     let params = attr.Parameter;
    //     let arrParam = [];
    //     objOpr.parameters = arrParam;
    //     /* UMLParameter */
    //     forEach(params, function (param) {
    //         let objParam = {};
    //         objParam._type = 'UMLParameter';
    //         objParam.name = param.name;
    //         //TODO : Remove below comment and resolve issue
    //         // objParam.type=param.DataType.type;
    //         objParam.isID = param.isID;
    //         objParam.multiplicity = param.cardinality;

    //         arrParam.push(objParam);
    //     });

    //     operations.push(objOpr);
    // });
}
module.exports.addEventFields = addEventFields;
module.exports.addEventRequiredFields = addEventRequiredFields;
module.exports.addEventPropertyFields = addEventPropertyFields;
module.exports.addEventRelationshipFields = addEventRelationshipFields;
module.exports.addEventOperationFields = addEventOperationFields;
module.exports.bindEventToExport = bindEventToExport;
module.exports.bindEventToImport = bindEventToImport;
module.exports.bindAbstractEventToExport = bindAbstractEventToExport;
