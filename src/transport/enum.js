var fields = require('./fields');
var utils = require('./utils');
var forEach = require('async-foreach').forEach;
var datatype = require('./datatype');

function addEnumFields(enumObj, enume) {
    enumObj[fields.name] = enume.name;
    enumObj[fields.type] = utils.getElementType(enume);
    enumObj[fields.isAbstract] = enume.isAbstract;
    enumObj[fields.description] = enume.documentation;
}

function addEnumProperty(enumObj, enume) {
    let enumArr = [];
    enumObj[fields.Property] = enumArr;
    let attribute = enume.attributes;
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

        enumArr.push(propertyObj);
    });
}

function addEnumLiterals(enumObj, enume) {
    let enumArr = [];
    enumObj[fields.Enum] = enumArr;
    let literals = enume.literals;
    forEach(literals, function (literal) {

        enumArr.push(literal.name);

    });
}

function bindEnumToExport(mPackage, jsonProcess) {
    let allEnumeration = app.repository.select(mPackage.name + '::@UMLEnumeration');
    forEach(allEnumeration, function (enume) {

        let enumObj = {};
        jsonProcess[enume.name] = enumObj;

        /* enume property fields binding */
        addEnumFields(enumObj, enume)

        /* enume Properties array binding */
        addEnumProperty(enumObj, enume);

        /* enume Literals array binding */
        addEnumLiterals(enumObj, enume);

    });
}

function bindEnumToImport(enumeObject, mSubObject) {
    /* UMLEnumeration fields */
    enumeObject._type = 'UMLEnumeration';
    enumeObject.name = mSubObject.name;
    enumeObject[fields.isAbstract] = mSubObject.isAbstract;
    enumeObject.documentation = mSubObject.description;

}

function bindEnumAttributesToImport(enumeObject, mSubObject) {
    /* UMLEnumeration fields */
    enumeObject._type = 'UMLEnumeration';
    enumeObject.name = mSubObject.name;
    enumeObject[fields.isAbstract] = mSubObject.isAbstract;
    enumeObject.documentation = mSubObject.description;

    /* UMLAttribute */
    let attributes = [];
    enumeObject.attributes = attributes;

    forEach(mSubObject[fields.Property], function (attr) {
        let objAttr = {};
        objAttr._type = 'UMLAttribute';
        objAttr.name = attr.name;
        objAttr.type = attr.DataType.type;
        objAttr.isID = attr.isID;
        objAttr.multiplicity = attr.cardinality;
        objAttr.documentation = attr.description;
        attributes.push(objAttr);
    });

    /* UMLEnumerationLiteral */
    let literals = [];
    enumeObject.literals = literals;

    forEach(mSubObject[fields.Enum], function (literal) {
        let objAttr = {};
        objAttr._type = 'UMLEnumerationLiteral';
        objAttr.name = literal;
        literals.push(objAttr);
    });

}
module.exports.addEnumFields = addEnumFields;
module.exports.addEnumProperty = addEnumProperty;
module.exports.addEnumLiterals = addEnumLiterals;
module.exports.bindEnumToExport = bindEnumToExport;
module.exports.bindEnumToImport = bindEnumToImport;