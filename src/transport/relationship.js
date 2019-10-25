var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var utils = require('./utils');
var mEntity = require('./entity');
var mEvent = require('./event');
const fs = require('fs');
const CircularJSON = require('circular-json');
var path = require('path');

function addAggregationToImport(objRelationship, entity, attr) {
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == source.name;
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
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

function addCompositionToImport(objRelationship, entity, attr) {
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == source.name;
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });

    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    }

    return objRelationship;
}
function addGeneralizationToImport(objRelationship, entity, attr) {
    console.log("-----generalization", entity.name);

    

    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLGeneralization) {
            if (aggr.name == attr.name &&
                aggr.source.name == attr.source.name && utils.getElementType(aggr.source) == attr.source.type &&
                aggr.target.name == attr.target.name && utils.getElementType(aggr.target) == attr.target.type
            ) {
                console.log("Update Generalization");
                objRelationship._id=aggr._id;
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
                    return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == source.name;
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
                    return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
                });

                if (fRefEnd2.length > 0) {
                    objEnd2['$ref'] = fRefEnd2[0]._id;
                }
            }
        }
    });


    return objRelationship;
}

function addInterfaceRealizationToImport(objRelationship, entity, attr) {
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == source.name;
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });

    if (fRefEnd2.length > 0) {
        objEnd2['$ref'] = fRefEnd2[0]._id;
    }

    return objRelationship;
}
/* {
    "_type": "UMLAssociationClassLink",
    "_id": "AAAAAAFq4gfdu/f05+0=",
    "_parent": {
      "$ref": "AAAAAAFq4gfduvfwBwA="
    },
    "classSide": {
      "$ref": "AAAAAAFq4gfduvfwBwA="
    },
    "associationSide": {
      "$ref": "AAAAAAFq4gfduvfx+cQ="
    }
} */
function addAssociationClassLink(objRelationship, entity, attr) {
    console.log("-----interface", entity.name);

    objRelationship._type = 'UMLAssociationClassLink';
    objRelationship.name = attr.name;
    objRelationship.documentation = attr.description;
    /* associationSide */
    let associationSide = {};
    let bindAssos = bindRelationshipToImport(entity, attr.association);
    //let associationSide=app.repository.writeObject(bindAssos);
    if (bindAssos && bindAssos.hasOwnProperty('_id')) {
        associationSide['$ref'] = bindAssos._id;
    }
    objRelationship.associationSide = associationSide; //JSON.parse(associationSide);
    /* classSide */
    let classSide = {};
    objRelationship.classSide = classSide;
    let mClass = attr.class;
    let refClass = app.repository.search(mClass.name);
    let fRefClass = refClass.filter(function (item) {
        return item.name == mClass.name;
    });

    if (fRefClass.length > 0) {
        classSide['$ref'] = refClass[0]._id;
    }
    return objRelationship;
}

function addInterfaceToImport(objRelationship, entity, attr) {
    console.log("-----interface", entity.name);

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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == source.name;
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
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
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

        /* UMLAssociation (aggregation) */
        let mAssoc=utils.isAssociationExist(entity,attr);
        if(mAssoc.isExist)
        {
            objRelationship._id=mAssoc.assoc._id;
        }
        objRelationship = addAggregationToImport(objRelationship, entity, attr);
        if (objRelationship  != null || Object.keys(objRelationship).length==0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            return rel;
        }else{
            return null;
        }
    } else if (attr.type == fields.composition) {

        /* UMLAssociation (composition) */
        let mAssoc=utils.isAssociationExist(entity,attr);
        if(mAssoc.isExist)
        {
            objRelationship._id=mAssoc.assoc._id;
        }
        objRelationship = addCompositionToImport(objRelationship, entity, attr);
        if (objRelationship  != null || Object.keys(objRelationship).length==0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            return rel;
        }
    } else if (attr.type == fields.generalization) {
        /* UMLGeneralization (generalization) */

        let mAssoc=utils.isGeneralizationExist(entity,attr);
        if(mAssoc.isExist)
        {
            objRelationship._id=mAssoc.assoc._id;
        }
        objRelationship = addGeneralizationToImport(objRelationship, entity, attr)
        if (objRelationship  != null || Object.keys(objRelationship).length==0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            return rel;
        }
    } else if (attr.type == fields.interfaceRealization) {
        /* UMLInterfaceRealization (interfaceRealization) */

        let mAssoc=utils.isInterfaceRealizationExist(entity,attr);
        if(mAssoc.isExist)
        {
            objRelationship._id=mAssoc.assoc._id;
        }
        objRelationship = addInterfaceRealizationToImport(objRelationship, entity, attr);
        if (objRelationship  != null || Object.keys(objRelationship).length==0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            return rel;
        }
    } else if (attr.type == fields.interface) {

        /* UMLAssociation (interface) */
        let mAssoc=utils.isAssociationExist(entity,attr);
        if(mAssoc.isExist)
        {
            objRelationship._id=mAssoc.assoc._id;
        }
        objRelationship = addInterfaceToImport(objRelationship, entity, attr);
        if (objRelationship  != null || Object.keys(objRelationship).length==0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            return rel;
        }
    } else if (attr.type == fields.associationClassLink) {

        /* UMLAssociation (associationClassLink) */
        let mAssoc=utils.isAssociationClassLinkExist(entity,attr);
        if(mAssoc.isExist)
        {
            objRelationship._id=mAssoc.assoc._id;
        }
        objRelationship = addAssociationClassLink(objRelationship, entity, attr);
        if (objRelationship  != null || Object.keys(objRelationship).length==0) {
            try {
                let rel = app.repository.readObject(objRelationship);
                rel._parent = entity;
                console.log("rel", rel);
                return rel;
            } catch (error) {
                app.dialogs.showErrorDialog(error.message);
            }
        }
    }
}

function setRelationship(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLClass || entity instanceof type.UMLInterface) {
            let mSubObject = XMIData[entity.name];

            // let entityString = app.repository.writeObject(entity);
            // let entityJson = JSON.parse(entityString, null, 4);


            /* ownElements ( Relationship ) */
            let ownedElements = [];
            // entityJson.ownedElements = ownedElements;

            forEach(mSubObject.Relationship, function (attr) {
                try {
                    if (
                        attr.type == fields.aggregation ||
                        attr.type == fields.composition ||
                        attr.type == fields.generalization ||
                        attr.type == fields.interface ||
                        attr.type == fields.interfaceRealization //||
                        // attr.type == fields.associationClassLink
                        ) {

                    let rel = bindRelationshipToImport(entity, attr);
                    if(rel !=null){
                        ownedElements.push(rel);
                    }
                    }
                } catch (error) {
                    app.dialogs.showErrorDialog(error.message);
                }
            });
            let resRel = app.engine.setProperty(entity, 'ownedElements', ownedElements);
            console.log("resRel", resRel);
        }
    });
}

module.exports.addAggregationToImport = addAggregationToImport;
module.exports.addCompositionToImport = addCompositionToImport;
module.exports.addGeneralizationToImport = addGeneralizationToImport;
module.exports.addInterfaceRealizationToImport = addInterfaceRealizationToImport;
module.exports.addInterfaceToImport = addInterfaceToImport;
module.exports.addAssociationClassLink = addAssociationClassLink;
module.exports.bindRelationshipToImport = bindRelationshipToImport;
module.exports.setRelationship = setRelationship;