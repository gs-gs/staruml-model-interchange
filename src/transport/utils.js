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
        return fields.enum;
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
        /* dType[fields.cardinality] = attr.multiplicity; */
    } else if (attr.type instanceof type.UMLClass) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;
        /* dType[fields.cardinality] = attr.multiplicity; */
    } else if (attr.type instanceof type.UMLEnumeration) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;
        /* dType[fields.cardinality] = attr.multiplicity; */

        /* binding literals  */
        let arrliterals = [];
        dType[fields.enum] = arrliterals;
        let literals = attr.type.literals;
        forEach(literals, function (itemLiterals) {
            arrliterals.push(itemLiterals.name);
        });

        /* dType[fields.cardinality] = attr.multiplicity; */
    }
}
module.exports.getElementType = getElementType;
module.exports.isString = isString;
module.exports.getRelationshipType = getRelationshipType;
module.exports.addDatatype = addDatatype;