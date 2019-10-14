var fields = require('./fields');
var utils = require('./utils');
var forEach = require('async-foreach').forEach;
var datatype = require('./datatype');

function addEntityFields(entityObj, entity) {
    entityObj[fields.type] = utils.getElementType(entity);
    entityObj[fields.name] = entity.name;
    entityObj[fields.description] = entity.documentation;
    entityObj[fields.version] = '';
    entityObj[fields.status] = '';
}

function addEntityRequiredFields(entityObj, entity) {
    let requiredArr = [];
    entityObj[fields.Required] = requiredArr;
    let attributeForRequired = entity.attributes;
    forEach(attributeForRequired, function (attrForRequired) {
        if (attrForRequired.multiplicity == "1" || attrForRequired.multiplicity == "1..*") {
            requiredArr.push(attrForRequired.name);
        }
    });
}

function addEntityPropertyFields(entityObj, entity) {
    let propertyArr = [];
    entityObj[fields.Property] = propertyArr;
    let attribute = entity.attributes;
    forEach(attribute, function (attr) {
        let propertyObj = {};
        propertyObj[fields.name] = attr.name;

        propertyObj[fields.description] = attr.documentation;

        // if (attr.isID) {
        propertyObj[fields.isID] = attr.isID;
        // }

        propertyObj[fields.status] = '';
        
        propertyObj[fields.cardinality] = attr.multiplicity;

        /* Property DataType binding */
        utils.addDatatype(propertyObj,attr);


        propertyArr.push(propertyObj);
    });
}

function addEntityRelationshipFields(entityObj, entity) {
    let Relationship = [];
    entityObj[fields.Relationship] = Relationship;
    forEach(entity.ownedElements, function (element) {
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

            /* adding relationship type 'generalization' */
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
module.exports.addEntityFields = addEntityFields;
module.exports.addEntityRequiredFields = addEntityRequiredFields;
module.exports.addEntityPropertyFields = addEntityPropertyFields;
module.exports.addEntityRelationshipFields = addEntityRelationshipFields;