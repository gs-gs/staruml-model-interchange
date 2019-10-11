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

        if (attr.isID) {
            propertyObj[fields.isID] = attr.isID;
        }

        /* Property DataType binding */
        let dType = {};
        if (utils.isString(attr.type)) {
            if (attr.type == datatype.url) {
                dType[fields.pattern] = constant.regex_email;
            }

            dType.type = attr.type;
            propertyObj[fields.DataType] = dType;
            dType[fields.name] = attr.name;
            dType[fields.cardinality] = attr.multiplicity;
        } else if (attr.type instanceof type.UMLClass) {
            propertyObj[fields.DataType] = dType;
            dType.type = utils.getElementType(attr.type);
            dType[fields.name] = attr.type.name;
            dType[fields.cardinality] = attr.multiplicity;
        } else if (attr.type instanceof type.UMLEnumeration) {
            propertyObj[fields.DataType] = dType;
            dType.type = utils.getElementType(attr.type);
            dType[fields.name] = attr.type.name;
            dType[fields.cardinality] = attr.multiplicity;

            /* binding literals  */
            let arrliterals = [];
            dType[fields.enum] = arrliterals;
            let literals = attr.type.literals;
            forEach(literals, function (itemLiterals) {
                arrliterals.push(itemLiterals.name);
            });

            dType[fields.cardinality] = attr.multiplicity;
        }

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
module.exports.addEventFields = addEventFields;
module.exports.addEventRequiredFields = addEventRequiredFields;
module.exports.addEventPropertyFields = addEventPropertyFields;
module.exports.addEventRelationshipFields = addEventRelationshipFields;