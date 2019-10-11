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

        if (attr.isID) {
            propertyObj[fields.isID] = attr.isID;
        }

        propertyObj[fields.status] = '';
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

function addEntityRelationshipFields(entityObj, entity) {
    let Relationship = [];
    entityObj[fields.Relationship] = Relationship;
    forEach(entity.ownedElements, function (element) {
        let objRelationship = {};

        objRelationship[fields.name] = element.name;
        objRelationship[fields.description] = element.documentation;

        if (element instanceof type.UMLAssociation) {

            let end1 = element.end1;
            let end2 = element.end2;
            if (end1.aggregation == 'shared' && end2.aggregation == 'none') {
                /* aggregation */
                objRelationship[fields.type] = 'aggregation';
            } else if (end1.aggregation == 'composite' && end2.aggregation == 'none') {
                /* composition */
                objRelationship[fields.type] = 'composition';
            }

            let objSource = {};
            let source = end1.reference;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);

            let objTarget = {};
            let target = end2.reference;
            objRelationship[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);

        } else if (element instanceof type.UMLGeneralization) {

            objRelationship[fields.type] = utils.getElementType(element);

            let objSource = {};
            let source = element.source;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);


            let objTarget = {};
            let target = element.target;
            objRelationship[fields.target] = objTarget;
            objTarget[fields.name] = target.name;
            objTarget[fields.type] = utils.getElementType(target);

        } else if (element instanceof type.UMLAssociationClassLink) {

            objRelationship[fields.type] = utils.getElementType(element);
            let objAssociation = {};
            /* association binding */
            objRelationship[fields.association] = objAssociation;

            let end1 = element.associationSide.end1;
            let end2 = element.associationSide.end2;
            if (end1.aggregation == 'shared' && end2.aggregation == 'none') {
                /* aggregation */
                objAssociation[fields.type] = 'aggregation';
            } else if (end1.aggregation == 'composite' && end2.aggregation == 'none') {
                /* composition */
                objAssociation[fields.type] = 'composition';
            }

            let objSource = {};
            let source = end1.reference;
            objAssociation[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);

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

            /* association class side properties */
            /* Property binding--- */
            /* 
            let propertyArr=[];
            objClass['Property']=propertyArr;
            let attribute=classSide.attributes;
            forEach(attribute,function(attr){
                let propertyObj={};
                propertyObj[fields.name]=attr.name;  

                propertyObj[fields.description]=attr.documentation;

                propertyObj['status']='';
                
                // DataType binding--- 
                let dType={};
                if(utils.isString(attr.type)){
                    dType.type=attr.type;
                    propertyObj[fields.DataType=dType;
                    dType[fields.name]=attr.name;
                    dType[fields.cardinality=attr.multiplicity;
                }else if(attr.type instanceof type.UMLClass){
                    propertyObj[fields.DataType=dType;
                    dType.type=utils.getElementType(attr.type);
                    dType[fields.name]=attr.type.name;
                    dType[fields.cardinality=attr.multiplicity;
                }else if(attr.type instanceof type.UMLEnumeration){
                    propertyObj[fields.DataType=dType;
                    dType.type=utils.getElementType(attr.type);
                    dType[fields.name]=attr.type.name;
                    dType[fields.cardinality=attr.multiplicity;
                    // binding literals  
                    let arrliterals=[];
                    dType[fields.enum]=arrliterals;
                    let literals=attr.type.literals;
                    forEach(literals,function(itemLiterals){
                        arrliterals.push(itemLiterals.name);
                    });
                    dType[fields.cardinality=attr.multiplicity;
                }
                propertyArr.push(propertyObj);
            });
                */
        } else if (element instanceof type.UMLInterfaceRealization) {
            objRelationship[fields.type] = utils.getElementType(element);
            let objSource = {};
            let source = element.source;
            objRelationship[fields.source] = objSource;
            objSource[fields.name] = source.name;
            objSource[fields.type] = utils.getElementType(source);
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