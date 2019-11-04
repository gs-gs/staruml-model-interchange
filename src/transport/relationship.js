var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var utils = require('./utils');
var mEntity = require('./entity');
var mEvent = require('./event');
const fs = require('fs');
const CircularJSON = require('circular-json');
var path = require('path');
var constant = require('../constant');
//const Mustache = require('mustache')
//const Core = require('../core/core')
// const _ = require('lodash')
// const {
//     EventEmitter
// } = require('events')

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
    objEnd1.multiplicity = source.cardinality;
    objEnd1.navigable = source.navigable;
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
    objEnd2.multiplicity = target.cardinality;
    objEnd2.navigable = target.navigable;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });

    let eleType = utils.getElementType(entity);
    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;

    } else if (fRefEnd1.length == 0) {
        throw new Error(constant.source + ' ' + eleType + ' \'' + source.name + constant.ref_not_found);
    } else if (fRefEnd2.length == 0) {
        throw new Error(constant.target + ' ' + eleType + ' \'' + target.name + constant.ref_not_found);
    }
    return objRelationship;
}

function updateAggregationToImport(entity, attr, _id) {
    /* UMLAssociation (aggregation) */
    let UMLAssociation = app.repository.get(_id);

    // console.log("-----aggregation", entity.name);

    // objRelationship._id="";
    // objRelationship._type = 'UMLAssociation';
    // objRelationship.name = attr.name;
    // objRelationship.documentation = attr.description;
    app.engine.setProperty(UMLAssociation, 'name', attr.name);
    app.engine.setProperty(UMLAssociation, 'documentation', attr.description);

    /* Source */
    let objEnd1 = {};
    // objRelationship.end1 = objEnd1;
    objEnd1._type = 'UMLAssociationEnd';
    objEnd1.aggregation = 'shared';

    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    objEnd1.multiplicity = source.cardinality;
    objEnd1.navigable = source.navigable;
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
    // objRelationship.end2 = objEnd2;
    objEnd2.aggregation = 'none';

    let target = attr.target;
    objEnd2.multiplicity = target.cardinality;
    objEnd2.navigable = target.navigable;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });

    let eleType = utils.getElementType(entity);
    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;

        app.engine.setProperty(UMLAssociation, 'end1', app.repository.readObject(objEnd1));
        app.engine.setProperty(UMLAssociation, 'end2', app.repository.readObject(objEnd2));
        return UMLAssociation;

    } else if (fRefEnd1.length == 0) {
        throw new Error(constant.source + ' ' + eleType + ' \'' + source.name + constant.ref_not_found);
    } else if (fRefEnd2.length == 0) {
        throw new Error(constant.target + ' ' + eleType + ' \'' + target.name + constant.ref_not_found);
    }
    // return objRelationship;
    return UMLAssociation;
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
    objEnd1.multiplicity = source.cardinality;
    objEnd1.navigable = source.navigable;
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
    objEnd2.multiplicity = target.cardinality;
    objEnd2.navigable = target.navigable;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });
    let eleType = utils.getElementType(entity);
    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    } else if (fRefEnd1.length == 0) {
        throw new Error(constant.source + ' ' + eleType + ' \'' + source.name + constant.ref_not_found);
    } else if (fRefEnd2.length == 0) {
        throw new Error(constant.target + ' ' + eleType + ' \'' + target.name + constant.ref_not_found);
    }

    return objRelationship;
}

function updateCompositionToImport(entity, attr, _id) {
    /* UMLAssociation (composition) */

    let UMLAssociation = app.repository.get(_id);


    // objRelationship._type = 'UMLAssociation';
    // objRelationship.name = attr.name;
    // objRelationship.documentation = attr.description;
    app.engine.setProperty(UMLAssociation, 'name', attr.name);
    app.engine.setProperty(UMLAssociation, 'documentation', attr.description);

    /* Source */
    let objEnd1 = {};
    // objRelationship.end1 = objEnd1;
    objEnd1._type = 'UMLAssociationEnd';
    objEnd1.aggregation = 'composite';

    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    objEnd1.multiplicity = source.cardinality;
    objEnd1.navigable = source.navigable;
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
    // objRelationship.end2 = objEnd2;
    objEnd2.aggregation = 'none';

    let target = attr.target;
    objEnd2.multiplicity = target.cardinality;
    objEnd2.navigable = target.navigable;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });
    let eleType = utils.getElementType(entity);
    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;

        app.engine.setProperty(UMLAssociation, 'end1', app.repository.readObject(objEnd1));
        app.engine.setProperty(UMLAssociation, 'end2', app.repository.readObject(objEnd2));
        return UMLAssociation;

    } else if (fRefEnd1.length == 0) {
        throw new Error(constant.source + ' ' + eleType + ' \'' + source.name + constant.ref_not_found);
    } else if (fRefEnd2.length == 0) {
        throw new Error(constant.target + ' ' + eleType + ' \'' + target.name + constant.ref_not_found);
    }

    // return objRelationship;
    return UMLAssociation;
}

function addGeneralizationToImport(objRelationship, entity, attr) {
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
    objEnd1.multiplicity = source.cardinality;
    objEnd1.navigable = source.navigable;
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
    objEnd2.multiplicity = target.cardinality;
    objEnd2.navigable = target.navigable;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });
    let eleType = utils.getElementType(entity);
    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;

        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;
    } else if (fRefEnd1.length == 0) {
        throw new Error(constant.source + ' ' + eleType + ' \'' + source.name + constant.ref_not_found);
    } else if (fRefEnd2.length == 0) {
        throw new Error(constant.target + ' ' + eleType + ' \'' + target.name + constant.ref_not_found);
    }

    return objRelationship;
}

function updateInterfaceToImport(entity, attr, _id) {
    let UMLAssociation = app.repository.get(_id);
    // objRelationship._type = 'UMLAssociation';
    // objRelationship.name = attr.name;
    // objRelationship.documentation = attr.description;
    app.engine.setProperty(UMLAssociation, 'name', attr.name);
    app.engine.setProperty(UMLAssociation, 'documentation', attr.description);
    /* Source */
    let objEnd1 = {};
    // objRelationship.end1 = objEnd1;
    objEnd1._type = 'UMLAssociationEnd';
    objEnd1.aggregation = 'none';

    /* Reference to UMLClass or UMLInterface */

    let source = attr.source;
    objEnd1.multiplicity = source.cardinality;
    objEnd1.navigable = source.navigable;
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
    // objRelationship.end2 = objEnd2;
    objEnd2.aggregation = 'none';

    let target = attr.target;
    objEnd2.multiplicity = target.cardinality;
    objEnd2.navigable = target.navigable;
    let objReferenceEnd2 = {}
    let refEnd2 = app.repository.search(target.name);

    let fRefEnd2 = refEnd2.filter(function (item) {
        return (item instanceof type.UMLClass || item instanceof type.UMLInterface) && item.name == target.name;
    });
    let eleType = utils.getElementType(entity);
    if (fRefEnd2.length > 0 && fRefEnd1.length > 0) {
        objReferenceEnd2['$ref'] = fRefEnd2[0]._id;
        objEnd2.reference = objReferenceEnd2;


        objReferenceEnd1['$ref'] = fRefEnd1[0]._id;
        objEnd1.reference = objReferenceEnd1;


        app.engine.setProperty(UMLAssociation, 'end1', app.repository.readObject(objEnd1));
        app.engine.setProperty(UMLAssociation, 'end2', app.repository.readObject(objEnd2));
        return UMLAssociation;

    } else if (fRefEnd1.length == 0) {
        throw new Error(constant.source + ' ' + eleType + ' \'' + source.name + constant.ref_not_found);
    } else if (fRefEnd2.length == 0) {
        throw new Error(constant.target + ' ' + eleType + ' \'' + target.name + constant.ref_not_found);
    }
    return UMLAssociation;
}

function bindRelationshipToImport(entity, attr) {
    let objRelationship = {};
    if (attr.type == fields.aggregation) {

        /* UMLAssociation (aggregation) */
        let mAssoc = utils.isAssociationExist(entity, attr);
        if (mAssoc.isExist) {
            objRelationship._id = mAssoc.assoc._id;
            return updateAggregationToImport(entity, attr, mAssoc.assoc._id);
        } else {

            objRelationship = addAggregationToImport(objRelationship, entity, attr);
            if (objRelationship != null || Object.keys(objRelationship).length == 0) {
                let rel = app.repository.readObject(objRelationship);
                rel._parent = entity;
                console.log("rel", rel);
                return rel;
            } else {
                return null;
            }
        }
    } else if (attr.type == fields.composition) {

        /* UMLAssociation (composition) */
        let mAssoc = utils.isAssociationExist(entity, attr);
        if (mAssoc.isExist) {
            objRelationship._id = mAssoc.assoc._id;
            return updateCompositionToImport(entity, attr, mAssoc.assoc._id);
        } else {

            objRelationship = addCompositionToImport(objRelationship, entity, attr);
            if (objRelationship != null || Object.keys(objRelationship).length == 0) {
                let rel = app.repository.readObject(objRelationship);
                rel._parent = entity;
                console.log("rel", rel);
                return rel;
            }
        }
    } else if (attr.type == fields.generalization) {
        /* UMLGeneralization (generalization) */

        let mAssoc = utils.isGeneralizationExist(entity, attr);
        if (mAssoc.isExist) {
            objRelationship._id = mAssoc.assoc._id;
        }
        objRelationship = addGeneralizationToImport(objRelationship, entity, attr)
        if (objRelationship != null || Object.keys(objRelationship).length == 0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            let mObj = {
                rel: rel,
                isNew: !mAssoc.isExist
            };
            return mObj;
        }
    } else if (attr.type == fields.interfaceRealization) {
        /* UMLInterfaceRealization (interfaceRealization) */

        let mAssoc = utils.isInterfaceRealizationExist(entity, attr);
        if (mAssoc.isExist) {
            objRelationship._id = mAssoc.assoc._id;
        }
        objRelationship = addInterfaceRealizationToImport(objRelationship, entity, attr);
        if (objRelationship != null || Object.keys(objRelationship).length == 0) {
            let rel = app.repository.readObject(objRelationship);
            rel._parent = entity;
            console.log("rel", rel);
            return rel;
        }
    } else if (attr.type == fields.interface) {

        /* UMLAssociation (interface) */
        let mAssoc = utils.isAssociationExist(entity, attr);
        if (mAssoc.isExist) {
            // objRelationship._id = mAssoc.assoc._id;
            return updateInterfaceToImport(entity, attr, mAssoc.assoc._id);

        } else {
            objRelationship = addInterfaceToImport(objRelationship, entity, attr);
            if (objRelationship != null || Object.keys(objRelationship).length == 0) {
                let rel = app.repository.readObject(objRelationship);
                rel._parent = entity;
                console.log("rel", rel);
                return rel;
            }
        }
    } else if (attr.type == fields.associationClassLink) {

        /* UMLAssociation (associationClassLink) */
        let mAssoc = utils.isAssociationClassLinkExist(entity, attr);
        if (mAssoc.isExist) {
            objRelationship._id = mAssoc.assoc._id;
        }
        objRelationship = addAssociationClassLink(objRelationship, entity, attr);
        if (objRelationship != null || Object.keys(objRelationship).length == 0) {
            try {
                let rel = app.repository.readObject(objRelationship);
                rel._parent = entity;
                console.log("rel", rel);
                return rel;
            } catch (error) {
                console.error("Error : ", error.message);
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

            let newElements = [];
            forEach(mSubObject.Relationship, function (relationship) {
                try {
                    if (
                        relationship.type == fields.aggregation ||
                        relationship.type == fields.composition ||
                        relationship.type == fields.generalization ||
                        relationship.type == fields.interface ||
                        relationship.type == fields.interfaceRealization ||
                        relationship.type == fields.associationClassLink
                    ) {
                        let rel = bindRelationshipToImport(entity, relationship);

                        if (relationship.type == fields.generalization) {
                            if (rel.isNew) {
                                newElements.push(rel.rel);
                            }
                            if (rel.rel != null) {
                                ownedElements.push(rel.rel);
                            }
                        } else {
                            //let mElement = app.repository.get(rel._id);

                            if (rel != null) {
                                ownedElements.push(rel);
                            }
                        }
                        //app.engine.setProperty(entity,'ownedElements',ownedElements);
                        /*
                         let resExist=existElement.filter(function(item){
                            return rel._id==item._id;
                        });
                        if(resExist.length>0){
                            console.log("Exist")
                            forEach(resExist,function(rmIte){
                                //app.engine.removeItem(entity,'ownedElements',rmIte);
                            });
                        } */
                        //app.engine.addItem(entity, 'ownedElements', rel);
                    }
                } catch (error) {
                    console.error("Error : " + mSubObject.name, error.message);
                    app.dialogs.showErrorDialog(error.message);
                }
            });
            //app.engine.addItem(entity, 'ownedElements', ownedElements);
            //entity.ownedElements=ownedElements;
            //app.engine.removeItem(entity,'ownedElements',[]);
            // app.engine.setProperties(entity,entity);
            // app.engine.setProperties(entity.ownedElements,ownedElements);

            let resRel = app.engine.setProperty(entity, 'ownedElements', ownedElements);
            //app.modelExplorer.update(entity);
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