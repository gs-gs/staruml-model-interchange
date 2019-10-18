var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var mEntity = require('./entity');
var mEvent = require('./event');
const fs = require('fs');
const CircularJSON = require('circular-json');
var path = require('path');

function addAggregationToImport(objRelationship,entity, attr) {
    /* UMLAssociation (aggregation) */
    console.log("-----aggregation", entity.name);

    // objRelationship._id="";
    objRelationship._type = 'UMLAssociation';
    objRelationship.name = attr.name;
    objRelationship.documentation = attr.description;

    /* Source */
    let objEnd1 = {};
    objRelationship.end1 = objEnd1;
    objEnd1._type = 'UMLAssociationEnd';
    objEnd1.aggregation = 'shared';

    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    let refEnd1 = app.repository.search(source.name);

    let fRefEnd1 = refEnd1.filter(function (item) {
        return item.name == source.name;
    });

    let objReferenceEnd1 = {}
    /* if(fRefEnd1.length>0){
        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    } */
    /* target */
    let objEnd2 = {};
    objEnd2._type = 'UMLAssociationEnd';
    objRelationship.end2 = objEnd2;
    objEnd2.aggregation = 'none';

    let target = attr.target;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return item.name == target.name;
    });

    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    } else {
        objRelationship = null;
    }
    return objRelationship;
}

function addCompositionToImport(objRelationship,entity, attr) {
    /* UMLAssociation (composition) */
    console.log("-----composition", entity.name);


    objRelationship._type = 'UMLAssociation';
    objRelationship.name = attr.name;
    objRelationship.documentation = attr.description;

    /* Source */
    let objEnd1 = {};
    objRelationship.end1 = objEnd1;
    objEnd1._type = 'UMLAssociationEnd';
    objEnd1.aggregation = 'composite';

    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    let refEnd1 = app.repository.search(source.name);

    let fRefEnd1 = refEnd1.filter(function (item) {
        return item.name == source.name;
    });

    let objReferenceEnd1 = {}
    /* if(fRefEnd1.length>0){
        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    } */
    /* target */
    let objEnd2 = {};
    objEnd2._type = 'UMLAssociationEnd';
    objRelationship.end2 = objEnd2;
    objEnd2.aggregation = 'none';

    let target = attr.target;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return item.name == target.name;
    });

    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    }

    return objRelationship;
}

function addGeneralizationToImport(objRelationship,entity, attr) {
    console.log("-----generalization", entity.name);


    objRelationship._type = 'UMLGeneralization';
    objRelationship.name = attr.name;
    objRelationship.documentation = attr.description;

    /* Source */
    let objEnd1 = {};
    objRelationship.source = objEnd1;
    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    let refEnd1 = app.repository.search(source.name);

    let fRefEnd1 = refEnd1.filter(function (item) {
        return item.name == source.name;
    });


    if (fRefEnd1.length > 0) {
        objEnd1['$ref'] = fRefEnd1[0]._id;
    }
    /* target */
    let objEnd2 = {};
    objEnd2._type = 'UMLClass';
    objRelationship.target = objEnd2;

    let target = attr.target;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return item.name == target.name;
    });

    if (fRefEnd2.length > 0) {
        objEnd2['$ref'] = fRefEnd2[0]._id;
    }

    return objRelationship;
}

function addInterfaceRealizationToImport(objRelationship,entity, attr) {
    console.log("-----interfaceRealization", entity.name);

    objRelationship._type = 'UMLInterfaceRealization';
    objRelationship.name = attr.name;
    objRelationship.documentation = attr.description;

    /* Source */
    let objEnd1 = {};
    objRelationship.source = objEnd1;
    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    let refEnd1 = app.repository.search(source.name);

    let fRefEnd1 = refEnd1.filter(function (item) {
        return item.name == source.name;
    });


    if (fRefEnd1.length > 0) {
        objEnd1['$ref'] = fRefEnd1[0]._id;
    }
    /* target */
    let objEnd2 = {};
    objEnd2._type = 'UMLClass';
    objRelationship.target = objEnd2;

    let target = attr.target;
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return item.name == target.name;
    });

    if (fRefEnd2.length > 0) {
        objEnd2['$ref'] = fRefEnd2[0]._id;
    }

    return objRelationship;
}

function addInterfaceToImport(objRelationship, entity, attr) {
    console.log("-----aggregation", entity.name);

    objRelationship._type = 'UMLAssociation';
    objRelationship.name = attr.name;
    objRelationship.documentation = attr.description;

    /* Source */
    let objEnd1 = {};
    objRelationship.end1 = objEnd1;
    objEnd1._type = 'UMLAssociationEnd';
    objEnd1.aggregation = 'none';

    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    let refEnd1 = app.repository.search(source.name);

    let fRefEnd1 = refEnd1.filter(function (item) {
        return item.name == source.name;
    });

    let objReferenceEnd1 = {}
    /* if(fRefEnd1.length>0){
        objReferenceEnd1['$ref']=fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    } */
    /* target */
    let objEnd2 = {};
    objEnd2._type = 'UMLAssociationEnd';
    objRelationship.end2 = objEnd2;
    objEnd2.aggregation = 'none';

    let target = attr.target;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return item.name == target.name;
    });

    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    }

    return objRelationship;
}

function bindRelationshipToImport(entity, attr) {
    let objRelationship = {};
    if (attr.type == fields.aggregation) {

        objRelationship = addAggregationToImport(objRelationship,entity, attr);
        if (objRelationship != null) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            //TODO
            //objRelationship.type=attr.DataType.type;
            // objRelationship.multiplicity=attr.cardinality;
            //ownedElements.push(rel);
            let mResult = app.engine.addItem(entity, 'ownedElements', rel);
            console.log("mResult", mResult);
        }
    } else if (attr.type == fields.composition) {

        objRelationship = addCompositionToImport(objRelationship,entity, attr);

        let rel = app.repository.readObject(objRelationship);
        rel._parent = entity;
        console.log("rel", rel);
        //TODO
        //objRelationship.type=attr.DataType.type;
        // objRelationship.multiplicity=attr.cardinality;
        //ownedElements.push(rel);
        let mResult = app.engine.addItem(entity, 'ownedElements', rel);
        console.log("mResult", mResult);
    } else if (attr.type == fields.generalization) {
        /* UMLGeneralization (generalization) */

        objRelationship = addGeneralizationToImport(objRelationship,entity, attr)

        let rel = app.repository.readObject(objRelationship);
        rel._parent = entity;
        console.log("rel", rel);
        //TODO
        //objRelationship.type=attr.DataType.type;
        // objRelationship.multiplicity=attr.cardinality;
        //ownedElements.push(rel);
        let mResult = app.engine.addItem(entity, 'ownedElements', rel);
        console.log("mResult", mResult);
    } else if (attr.type == fields.interfaceRealization) {
        /* UMLInterfaceRealization (interfaceRealization) */

        objRelationship = addInterfaceRealizationToImport(objRelationship,entity, attr);

        let rel = app.repository.readObject(objRelationship);
        rel._parent = entity;
        console.log("rel", rel);
        //TODO
        //objRelationship.type=attr.DataType.type;
        // objRelationship.multiplicity=attr.cardinality;
        //ownedElements.push(rel);
        let mResult = app.engine.addItem(entity, 'ownedElements', rel);
        console.log("mResult", mResult);
    } else if (attr.type == fields.interface) {

        /* UMLAssociation (aggregation) */
        objRelationship = addInterfaceToImport(objRelationship,entity, attr);

        let rel = app.repository.readObject(objRelationship);
        rel._parent = entity;
        console.log("rel", rel);
        //TODO
        //objRelationship.type=attr.DataType.type;
        // objRelationship.multiplicity=attr.cardinality;
        //ownedElements.push(rel);
        let mResult = app.engine.addItem(entity, 'ownedElements', rel);
        console.log("mResult", mResult);

    }
}

function addRelationship(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        let mSubObject = XMIData[entity.name];

        let entityString = app.repository.writeObject(entity);
        let entityJson = JSON.parse(entityString, null, 4);


        /* ownElements ( Relationship ) */
        let ownedElements = [];
        entityJson.ownedElements = ownedElements;

        forEach(mSubObject.Relationship, function (attr) {
            bindRelationshipToImport(entity, attr);
        });
    });
}
module.exports.addAggregationToImport = addAggregationToImport;
module.exports.addCompositionToImport = addCompositionToImport;
module.exports.addGeneralizationToImport = addGeneralizationToImport;
module.exports.addInterfaceRealizationToImport = addInterfaceRealizationToImport;
module.exports.addInterfaceToImport = addInterfaceToImport;
module.exports.bindRelationshipToImport = bindRelationshipToImport;
module.exports.addRelationship = addRelationship;