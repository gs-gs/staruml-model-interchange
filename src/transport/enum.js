var fields = require('./fields');
var utils = require('./utils');
var forEach = require('async-foreach').forEach;
/**
 * @function addEnumFields
 * @description Bind enumeration fields to enumObj from enume (UMLEnumeration)
 * @param {Object} enumObj
 * @param {UMLEnumeration} enume
 */
function addEnumFields(enumObj, enume) {
    enumObj[fields.name] = enume.name;
    enumObj[fields.type] = utils.getElementType(enume);
    enumObj[fields.isAbstract] = enume.isAbstract;
    enumObj[fields.description] = enume.documentation;
}
/**
 * @function addEnumProperty
 * @description Bind enumeration property array field in enumObj from enume attributes (UMLAttribute)
 * @param {Object} enumObj
 * @param {UMLEnumeration} enume
 */
function addEnumProperty(enumObj, enume) {
    let enumArr = [];
    enumObj[fields.Property] = enumArr;
    let attribute = enume.attributes;
    forEach(attribute, function (attr) {
        let propertyObj = {};
        propertyObj[fields.name] = attr.name;

        propertyObj[fields.description] = attr.documentation;

        propertyObj[fields.isID] = attr.isID;

        propertyObj[fields.cardinality] = attr.multiplicity;

        propertyObj[fields.defaultValue] = attr.defaultValue
        /* Property DataType binding */
        utils.addDatatype(propertyObj, attr);

        enumArr.push(propertyObj);
    });
}
/**
 * @function addEnumLiterals
 * @description Bind enumeration literals in enumObj from enume literals (UMLEnumerationLiteral)
 * @param {Object} enumObj
 * @param {UMLEnumeration} enume
 */
function addEnumLiterals(enumObj, enume) {
    let enumArr = [];
    enumObj[fields.Enum] = enumArr;
    let literals = enume.literals;
    forEach(literals, function (literal) {
        let literalObj = {};
        literalObj[fields.name] = literal.name;
        literalObj[fields.description] = literal.documentation;
        literalObj[fields.tags] = utils.getTagsToExport(literal);
        enumArr.push(literalObj);
    });
}
/**
 * @function bindEnumToExport
 * @description Bind enumeration fields, properties, literals in enumObj from enume (UMLEnumeration)
 * @param {UMLPackage} mPackage
 * @param {Object} jsonProcess
 */
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
/**
 * @function bindEnumToImport
 * @description Bind enumeration fields in enumeObject from mSubObject
 * @param {Object} enumeObject
 * @param {Object} mSubObject
 */
function bindEnumToImport(enumeObject, mSubObject) {
    /* UMLEnumeration fields */
    enumeObject._type = 'UMLEnumeration';
    enumeObject.name = mSubObject.name;
    enumeObject[fields.isAbstract] = mSubObject.isAbstract;
    /* #12 Type check for the properties  */
    if(utils.isString(mSubObject.description)){
        enumeObject.documentation = mSubObject.description;
    }
    else{
        enumeObject.documentation = "";
    }

}
/**
 * @function bindEnumAttributesToImport
 * @description Bind enumeration properties array field in enumeObject from mSubObject
 * @param {Object} enumeObject
 * @param {Object} mSubObject
 */
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

    forEach(mSubObject[fields.Enum], function (attr) {
        let objAttr = {};
        objAttr._type = 'UMLEnumerationLiteral';
        objAttr.name = attr.name;
        objAttr.documentation = attr.description;
        literals.push(objAttr);
    });

}

/**
 * @function addNewEnumeration
 * @description Add new UMLEnumeration in model 
 * @param {Object} XMIData
 * @param {UMLEnumeration} result
 */
function addNewEnumeration(XMIData,result) {
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        let mSname = key;
        if (mSubObject instanceof Object && mSubObject.type == fields.Enum) {
            /* UMLEnumeration */
            let enumObject = {};

            /* Binding Enum fields, attribute, literals */
            bindEnumToImport(enumObject, mSubObject);

            let searchedEnum = app.repository.search(mSname);
            let searchedEnumRes = searchedEnum.filter(function (item) {
                return (item instanceof type.UMLEnumeration && item.name == mSname);
            });

            if (searchedEnumRes.length == 0) {
                let newAdded = app.repository.readObject(enumObject);
                newAdded._parent = result;
                let mResult = app.engine.addItem(result, fields.ownedElements, newAdded);
                utils.addNewAddedElement(newAdded);
            }
        }
    });
}

/**
 * @function updateEnumeration
 * @description update existing UMLEnumeration in model 
 * @param {Object} XMIData
 */
function updateEnumeration(XMIData) {
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        /* UMLClass */
        let mSname = key;
        if (mSubObject instanceof Object && mSubObject.type == fields.Enum) {

            /* UMLEnumeration */
            let enumObject = {};

            /* Binding Enum fields, attribute, literals */
            bindEnumToImport(enumObject, mSubObject);
            let searchedEnum = app.repository.search(mSname);
            let searchedEnumRes = searchedEnum.filter(function (item) {
                return (item instanceof type.UMLEnumeration && item.name == mSname);
            });

            if (searchedEnumRes.length > 0) {
                forEach(searchedEnumRes, function (ety) {

                    if (ety instanceof type.UMLEnumeration) {
                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                        app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                    }
                });
            }
        }
    });
}
module.exports.addEnumFields = addEnumFields;
module.exports.addEnumProperty = addEnumProperty;
module.exports.addEnumLiterals = addEnumLiterals;
module.exports.bindEnumToExport = bindEnumToExport;
module.exports.bindEnumToImport = bindEnumToImport;
module.exports.addNewEnumeration = addNewEnumeration;
module.exports.updateEnumeration = updateEnumeration;