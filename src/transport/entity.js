var fields = require('./fields');
var utils = require('./utils');
var forEach = require('async-foreach').forEach;
var datatype = require('./datatype');
/**
 * @function addEntityFields
 * @description Bind basic entity fields in entityObj
 * @param {Object} entityObj
 * @param {UMLClass} entity
 */
function addEntityFields(entityObj, entity) {
    entityObj[fields.type] = utils.getElementType(entity);
    entityObj[fields.name] = entity.name;
    entityObj[fields.isAbstract] = entity.isAbstract;
    entityObj[fields.description] = entity.documentation;
    entityObj[fields.version] = '';
    entityObj[fields.status] = '';
}
/**
 * @function addEntityRequired
 * @description Bind required array field in entityObj
 * @param {Object} entityObj
 * @param {UMLClass} entity
 */
function addEntityRequired(entityObj, entity) {
    let requiredArr = [];
    entityObj[fields.Required] = requiredArr;
    let attributeForRequired = entity.attributes;
    forEach(attributeForRequired, function (attrForRequired) {
        if (attrForRequired.multiplicity == "1" || attrForRequired.multiplicity == "1..*") {
            requiredArr.push(attrForRequired.name);
        }
    });
}
/**
 * @function addEntityProperty 
 * @description Bind property array field in entityObj
 * @param {Object} entityObj
 * @param {UMLClass} entity
 */
function addEntityProperty(entityObj, entity) {
    let propertyArr = [];
    entityObj[fields.Property] = propertyArr;
    let attribute = entity.attributes;
    forEach(attribute, function (attr) {
        let propertyObj = {};
        propertyObj[fields.name] = attr.name;

        propertyObj[fields.description] = attr.documentation;

        propertyObj[fields.isID] = attr.isID;

        propertyObj[fields.status] = '';

        propertyObj[fields.cardinality] = attr.multiplicity;

        propertyObj[fields.tags] = utils.getTagsToExport(attr);

        propertyObj[fields.defaultValue] = attr.defaultValue

        /* Property DataType binding */
        utils.addDatatype(propertyObj, attr);


        propertyArr.push(propertyObj);
    });
}
/**
 * @function addEntityRelationship
 * @description Bind relationship array field in entityObj
 * @param {*} entityObj
 * @param {*} entity
 */
function addEntityRelationship(entityObj, entity) {
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

            let relationType = utils.getRelationshipType(end1, end2);
            objRelationship[fields.type] = relationType;

            /* adding 'source' object */
            let objSource = {};
            let source = end1.reference;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);
            objSource[fields.cardinality] = end1.multiplicity;
            objSource[fields.navigable] = end1.navigable;
            objSource[fields.package] = end1.reference._parent.name;

            /* adding 'target' object */
            let objTarget = {};
            let target = end2.reference;
            objRelationship[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);
            objTarget[fields.cardinality] = end2.multiplicity;
            objTarget[fields.navigable] = end2.navigable;
            objTarget[fields.package] = end2.reference._parent.name;

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
            if (element.associationSide != null) {
                /* check if diagram not exist and abstract class will not available */

                let end1 = element.associationSide.end1;
                let end2 = element.associationSide.end2;
                objAssociation[fields.name] = element.associationSide.name;
                objAssociation[fields.description] = element.associationSide.documentation;
                objAssociation[fields.type] = utils.getRelationshipType(end1, end2);

                /* adding 'source' object */
                let objSource = {};
                let source = end1.reference;
                objAssociation[fields.source] = objSource;
                objSource[fields.name] = source.name;
                objSource[fields.type] = utils.getElementType(source);
                objSource[fields.cardinality] = end1.multiplicity;
                objSource[fields.navigable] = end1.navigable;

                /* adding 'target' object */
                let objTarget = {};
                let target = end2.reference;
                objAssociation[fields.target] = objTarget;
                objTarget[fields.name] = target.name;
                objTarget[fields.type] = utils.getElementType(target);
                objTarget[fields.cardinality] = end2.multiplicity;
                objTarget[fields.navigable] = end2.navigable;

            }
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
    });
}
/**
 * @function bindEntityToExport
 * @description Bind entity field, required array, property array and relationship array in jsonProcess
 * @param {UMLPackage} mPackage
 * @param {Object} jsonProcess
 */
function bindEntityToExport(mPackage, jsonProcess) {
    let allEntities = app.repository.select(mPackage.name + '::@UMLClass');
    forEach(allEntities, function (entity) {

        let entityObj = {};
        jsonProcess[entity.name] = entityObj;

        /* Entity property fields binding */
        addEntityFields(entityObj, entity)

        /* Entity Required fields properties binding */
        addEntityRequired(entityObj, entity);

        /* Entity Properties array binding */
        addEntityProperty(entityObj, entity);

        /* Entity Relationship array binding */
        addEntityRelationship(entityObj, entity);

    });
}
/**
 * @function bindAbstractEntityToExport
 * @description Bind abstract entity field, required array, property array and relationship in jsonProcess
 * @param {UMLPackage} mPackage
 * @param {Object} jsonProcess
 */
function bindAbstractEntityToExport(mPackage, jsonProcess) {
    //let allEntities = app.repository.select(mPackage.name + '::@UMLClass');
    forEach(mPackage.ownedElements /* allEntities */ , function (entity) {

        if (entity instanceof type.UMLClass) {


            let entityObj = {};
            jsonProcess[entity.name] = entityObj;

            /* Entity property fields binding */
            addEntityFields(entityObj, entity)

            /* Entity Required fields properties binding */
            addEntityRequired(entityObj, entity);

            /* Entity Properties array binding */
            addEntityProperty(entityObj, entity);

            /* Entity Relationship array binding */
            addEntityRelationship(entityObj, entity);

        }
    });
}
/**
 * @function bindEntityToExport
 * @description Bind entity fields from mSubObject in entityObject to parse UMLClass
 * @param {Object} entityObject
 * @param {Object} mSubObject
 */
function bindEntityToImport(entityObject, mSubObject) {
    /* UMLClass fields */
    entityObject._type = 'UMLClass';
    entityObject.name = mSubObject.name;
    entityObject[fields.isAbstract] = mSubObject.isAbstract;
    /* #12 Type check for the properties  */
    if(utils.isString(mSubObject.description)){
        entityObject.documentation = mSubObject.description;
    }
    else{
        entityObject.documentation = "";
    }

}
/**
 * @function addNewEntity
 * @description Add new UMLClass in model 
 * @param {Object} XMIData
 * @param {UMLClass} result
 */
function addNewEntity(XMIData,result) {
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        /* UMLClass */
        let mSname = key;
        if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {

            let entityObject = {};
            /* Binding Entity fields and attribute */
            bindEntityToImport(entityObject, mSubObject);

            let searchedEntity = app.repository.search(mSname);
            let searchedEntityRes = searchedEntity.filter(function (item) {
                return (item instanceof type.UMLClass && item.name == mSname);
            });
            if (searchedEntityRes.length == 0) {
                let newAdded = app.repository.readObject(entityObject);
                newAdded._parent = result;
                let mResult = app.engine.addItem(result, 'ownedElements', newAdded);
                utils.addNewAddedElement(newAdded);
            }
        }
    });
}

/**
 * @function updateEntity
 * @description update existing UMLClass in model 
 * @param {Object} XMIData
 */
function updateEntity(XMIData) {
    Object.keys(XMIData).forEach(function eachKey(key) {
        let mSubObject = XMIData[key];
        /* UMLClass */
        let mSname = key;
        if (mSubObject instanceof Object && mSubObject.type == fields.Entity) {

            let entityObject = {};
            /* Binding Entity fields and attribute */
            bindEntityToImport(entityObject, mSubObject);

            let searchedEntity = app.repository.search(mSname);
            let searchedEntityRes = searchedEntity.filter(function (item) {
                return (item instanceof type.UMLClass && item.name == mSname);
            });
            if (searchedEntityRes.length > 0) {
                forEach(searchedEntityRes, function (ety) {

                    if (ety instanceof type.UMLClass) {
                        app.engine.setProperty(ety, fields.name, mSubObject.name);
                        app.engine.setProperty(ety, fields.isAbstract, mSubObject.isAbstract);
                        app.engine.setProperty(ety, fields.documentation, mSubObject.description);
                    }
                });
            }
        }
    });
}
module.exports.addEntityFields = addEntityFields;
module.exports.addEntityRequired = addEntityRequired;
module.exports.addEntityProperty = addEntityProperty;
module.exports.addEntityRelationship = addEntityRelationship;
module.exports.bindEntityToExport = bindEntityToExport;
module.exports.bindEntityToImport = bindEntityToImport;
module.exports.bindAbstractEntityToExport = bindAbstractEntityToExport;
module.exports.addNewEntity = addNewEntity;
module.exports.updateEntity = updateEntity;