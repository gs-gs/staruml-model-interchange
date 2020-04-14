var constant = require('../constant');
var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var viewfields = require('./viewfields');
var datatype = require('./datatype');
/**
 * @function getElementType
 * @description return element type in string from element object
 * @param {*} element
 * @returns {string}
 */
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
        return fields.Enum;
    } else {
        return 'UN_DEFINED';
    }

}
/**
 * @function getRelationshipType
 * @description returns type of relationship in string from end1 and end2 parameter which is UMLAssociation
 * @param {*} end1 
 * @param {*} end2
 * @returns {string}
 */
function getRelationshipType(end1, end2) {
    if (end1.aggregation == 'shared' && end2.aggregation == 'none') {
        /* aggregation */
        return fields.aggregation;
    } else if ((end1.aggregation == 'composite' && end2.aggregation == 'none') || (end1.aggregation == 'none' && end2.aggregation == 'composite')) {
        /* composition */
        return fields.composition;
    } else if (end1.aggregation == 'none' && end2.aggregation == 'none') {
        /* event (interface) : when relationship between interface to interface */
        return fields.interface;
    }
}
/**
 * @function isString
 * @description check object is string or not. If it is string then it returns true, returns false
 * @param {*} s
 * @returns
 */
function isString(s) {
    return typeof (s) === 'string' || s instanceof String;
}

/**
 * @function addDatatype
 * @description add datatype object in property object
 * @param {Object} propertyObj
 * @param {UMLAttribute} attr
 */
function addDatatype(propertyObj, attr) {
    let dType = {};
    if (isString(attr.type)) {
        if (attr.type == datatype.url) {
            dType[fields.pattern] = constant.regex_email;
        }
        dType.type = attr.type;
        propertyObj[fields.DataType] = dType;
        dType[fields.name] = attr.name;
    } else if (attr.type instanceof type.UMLClass) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;
    } else if (attr.type instanceof type.UMLInterface) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;
    } else if (attr.type instanceof type.UMLEnumeration) {
        propertyObj[fields.DataType] = dType;
        dType.type = getElementType(attr.type);
        dType[fields.name] = attr.type.name;

        /* binding literals  */
        let arrliterals = [];
        dType[fields.Enum] = arrliterals;
        let literals = attr.type.literals;
        forEach(literals, function (itemLiterals) {
            arrliterals.push(itemLiterals.name);
        });

    }
}
/**
 * @function getDatatype
 * @description returns datatype of property in string or ref if type is exist in model.
 * @param {*} attr
 * @returns {*}
 */
function getDatatype(attr) {
    let dType = {};
    if (attr.type == fields.Entity) {
        let item = app.repository.select("@UMLClass[name=" + attr.name + "]");
        if (item[0] === undefined) {
            console.error("Class for " + attr.name + " not found.")
            attr.type = attr.name;
            return attr.type
        } else {
            dType['$ref'] = item[0]._id;
        }
        return dType;

    } else if (attr.type == fields.Event) {
        let item = app.repository.select("@UMLInterface[name=" + attr.name + "]");
        if (item[0] === undefined) {
            console.error("Class for " + attr.name + " not found.")
            attr.type = attr.name;
            return attr.type
        } else {
            dType['$ref'] = item[0]._id;
        }
        return dType;

    } else if (attr.type == fields.Enum) {
        let item = app.repository.select("@UMLEnumeration[name=" + attr.name + "]");
        if (item[0] === undefined) {
            console.error("Class for " + attr.name + " not found.")
            attr.type = attr.name;
            return attr.type
        } else {
            dType['$ref'] = item[0]._id;
        }
        return dType;

    } else if (isString(attr.type)) {
        return attr.type
    }
}
/**
 * @function setProperty
 * @description set property in element
 * @param {Array} ownedElements
 * @param {Object} XMIData
 */
function setProperty(ownedElements, XMIData) {

    forEach(ownedElements, function (element) {
        if (element instanceof type.UMLClass || element instanceof type.UMLEnumeration || element instanceof type.UMLInterface) {
            let mSubObject = XMIData[element.name];
            let entityString = app.repository.writeObject(element);
            let entityJson = JSON.parse(entityString, null, 4);

            /* Check for new properties to be added */
            /* let newProps = [];
            let existProps = [];
            forEach(mSubObject.Property, function (item) {
                let chkForDuplicate = newProps.filter(function (mFltr) {
                    return mFltr.name == item.name
                });
                if (chkForDuplicate.length == 0) {


                    let atbts = element.attributes.filter(function (fItem) {
                        return item.name == fItem.name
                    });
                    if (atbts.length == 0) {
                        newProps.push(item);
                    } else if (atbts.length == 1) {
                        existProps.push(atbts[0]);
                    }
                }
            }); */
            /*  */

            /* attribute ( Property ) */
            let attributes = [];
            entityJson.attributes = attributes;
            if (mSubObject != null) {

                forEach(mSubObject.Property, function (attr) {
                    /* let chkNew = newProps.filter(function (nItem) {
                        return attr.name == nItem.name
                    }); */

                    let objProp = bindProperty(attr);
                    if (objProp != null) {
                        let rel = app.repository.readObject(objProp);
                        rel._parent = element
                        attributes.push(rel);
                    }
                });
                app.engine.setProperty(element, 'attributes', attributes);
            }
        }
    });
}
/**
 * @function setLiterals
 * @description set literals in UMLEnumeration
 * @param {Array} ownedElements
 * @param {Object} XMIData
 */
function setLiterals(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLEnumeration) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let literals = [];
            entityJson.literals = literals;

            if (mSubObject != null) {

                forEach(mSubObject[fields.Enum], function (attr) {
                    let objProp = bindLiterals(attr);
                    if (objProp != null) {
                        let rel = app.repository.readObject(objProp);
                        rel._parent = entity;
                        literals.push(rel);
                    }
                });
                app.engine.setProperty(entity, 'literals', literals);
            }
        }
    });
}
/**
 * @function setOperation
 * @description set operations in UMLInterface
 * @param {Array} ownedElements
 * @param {Object} XMIData
 */
function setOperation(ownedElements, XMIData) {

    /* UMLOperation */
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLInterface) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* operations ( Operation ) */
            let operations = [];
            entityJson.operations = operations;

            if (mSubObject != null) {

                forEach(mSubObject.Operation, function (attr) {
                    let objProp = bindOperation(attr);
                    if (objProp != null) {
                        let rel = app.repository.readObject(objProp);
                        rel._parent = entity;
                        operations.push(rel);
                    }
                });
                app.engine.setProperty(entity, 'operations', operations);
            }
        }
    });
}
/**
 * @function bindLiterals
 * @description bind literal fileds in objAttr and returns literal object
 * @param {*} attr
 * @returns {Object}
 */
function bindLiterals(attr) {
    /* UMLAttribute */
    let objAttr = {};
    objAttr._type = 'UMLEnumerationLiteral';
    objAttr.name = attr.name;
    objAttr.documentation = attr.description;
    objAttr.tags = getTagsToImport(attr);

    return objAttr;
}
/**
 * @function bindProperty
 * @description bind attribute fields in objAttr and returns attribute object 
 * @param {*} attr
 * @returns {Object}
 */
function bindProperty(attr) {
    /* UMLAttribute */
    let objAttr = {};
    objAttr._type = 'UMLAttribute';
    objAttr.name = attr.name;

    //if(attr.DataType.type == utils.isString)
    let dType = getDatatype(attr.DataType); //attr.DataType.type;
    objAttr.type = dType;
    objAttr.isID = attr.isID;
    objAttr.multiplicity = attr.cardinality;
    objAttr.documentation = attr.description;
    objAttr[fields.tags] = getTagsToImport(attr);
    objAttr[fields.defaultValue] = attr.defaultValue

    return objAttr;
}
/**
 * @function bindOperation
 * @description bind operation and parameter fields in objOpr and returns operation object
 * @param {*} attr
 * @returns {Object}
 */
function bindOperation(attr) {
    /* UMLOperation */
    let objOpr = {};
    objOpr._type = 'UMLOperation';
    objOpr.name = attr.name;


    let params = attr.Parameter;
    let arrParam = [];
    objOpr.parameters = arrParam;
    /* UMLParameter */
    forEach(params, function (param) {
        let objParam = {};
        objParam._type = 'UMLParameter';
        objParam.name = param.name;
        //TODO : Remove below comment and resolve issue
        let dType = getDatatype(param.DataType); //attr.DataType.type;
        /* objAttr.type = dType; */
        objParam.type = dType //param.DataType.type;
        objParam.isID = param.isID;
        objParam.multiplicity = param.cardinality;

        arrParam.push(objParam);
    });
    return objOpr;
}
/**
 * @function isAssociationExist
 * @description check UMLAssociation is exist in model and returns object with boolean and UMLAssociation
 * @param {*} entity
 * @param {*} attr
 * @returns {Object}
 */
function isAssociationExist(entity, attr) {
    let isExist = false;
    let assoc = null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLAssociation) {
            if (aggr.name == attr.name &&
                aggr.end1.reference.name == attr.source.name && getElementType(aggr.end1.reference) == attr.source.type &&
                aggr.end2.reference.name == attr.target.name && getElementType(aggr.end2.reference) == attr.target.type
            ) {
                isExist = true;
                assoc = aggr;
                return;
            }
        }
    });
    let val = {
        isExist: isExist,
        assoc: assoc
    };
    return val;
}
/**
 * @function isGeneralizationExist
 * @description check UMLGeneralization is exist in model and returns object with boolean and UMLGeneralization
 * @param {*} entity
 * @param {*} attr
 * @returns {Object}
 */
function isGeneralizationExist(entity, attr) {
    let isExist = false;
    let assoc = null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLGeneralization) {
            if ( /* aggr.name == attr.name && */ /* Do not remove this commnet. Need to confirm */
                aggr.source.name == attr.source.name && getElementType(aggr.source) == attr.source.type &&
                aggr.target.name == attr.target.name && getElementType(aggr.target) == attr.target.type
            ) {
                isExist = true;
                assoc = aggr;
                return;
            }
        }
    });
    let val = {
        isExist: isExist,
        assoc: assoc
    };
    return val;
}
/**
 * @function isInterfaceRealizationExist
 * @description check UMLInterfaceRealization is exist in model and returns object with boolean and UMLInterfaceRealization
 * @param {*} entity
 * @param {*} attr
 * @returns {Object}
 */
function isInterfaceRealizationExist(entity, attr) {
    let isExist = false;
    let assoc = null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLInterfaceRealization) {
            if ( /* aggr.name == attr.name && */ /* Do not remove this commnet. Need to confirm */
                aggr.source.name == attr.source.name && getElementType(aggr.source) == attr.source.type &&
                aggr.target.name == attr.target.name && getElementType(aggr.target) == attr.target.type
            ) {
                isExist = true;
                assoc = aggr;
                return;
            }
        }
    });
    let val = {
        isExist: isExist,
        assoc: assoc
    };
    return val;
}
/**
 * @function isAssociationClassLinkExist
 * @description check UMLAssociationClassLink is exist in model and returns object with boolean and UMLAssociationClassLink
 * @param {*} entity
 * @param {*} attr
 * @returns {Object}
 */
function isAssociationClassLinkExist(entity, attr) {
    let isExist = false;
    let assoc = null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLAssociationClassLink) {

            let associationSide = isAssociationExist(entity, attr.association);

            if (aggr.name == attr.name &&
                aggr.classSide.name == attr.class.name && getElementType(aggr.classSide) == attr.class.type &&
                associationSide.isExist
            ) {
                isExist = true;
                assoc = aggr;
                return;
            }
        }
    });
    let val = {
        isExist: isExist,
        assoc: assoc
    };
    return val;
}
let pX = 0;
let pY = 0;
let incrementValue = 100;

/**
 * @function calculateXY
 * @description find X, Y coordinate of last view displayed in diagramview
 * @returns {Object}
 */
function calculateXY() {
    let lastMaxView = null;
    let maxLeft;
    let enumView = app.diagrams.getEditor().diagram.ownedViews;
    let filterAllViews = enumView.filter(function (item) {
        return item instanceof type.View
    });
    if (filterAllViews.length > 0) {
        maxLeft = filterAllViews[0];
    }
    forEach(filterAllViews, function (item) {
        if (item.left >= maxLeft.left) {
            maxLeft = item;
        }
    });
    if (maxLeft == null) {
        return null;
    }
    lastMaxView = maxLeft;
    pX = lastMaxView.left + lastMaxView.width + (incrementValue / 2);
    pY = lastMaxView.top;

    let lastView = {
        pX: pX,
        pY: pY
    }
    return lastView;
}
/**
 * @function getXY
 * @description returns object of X, Y coordinate of view element
 * @returns {Object}
 */
function getXY() {
    return {
        pX: pX,
        pY: pY
    }
}
let XOIR = 10,
    YOIR = 10;
/**
 * @function getInterfaceRealizationView
 * @description returns UMLInterfaceRealizationView 
 * @param {*} model
 * @param {UMLClassDiagram} diagram
 * @param {Object} options
 * @returns {UMLInterfaceRealizationView}
 */
function getInterfaceRealizationView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var directedView = diagram.getViewOf(model)
    var sourceView = diagram.getViewOf(model.source)
    var targetView = diagram.getViewOf(model.target)
    if (directedView) {
        /* Relationship View is already existed in this Diagram. */
        editor.selectView(directedView)
        editor.selectAdditionalView(sourceView)
        editor.selectAdditionalView(targetView)
    } else {
        if (!targetView) {
            app.factory.createViewAndRelationships(editor, XOIR, YOIR, model.target)
        }
        if (!sourceView) {
            app.factory.createViewAndRelationships(editor, XOIR, YOIR + 100, model.source)
        }
        if (targetView && sourceView) {
            let typeName = null;

            var metaClass = global.meta["UMLInterfaceRealization"];
            if (metaClass) {
                typeName = metaClass.view || null
            }

            var DirectedViewType = typeName ? type[typeName] : null
            if (DirectedViewType) {
                directedView = new DirectedViewType()
                directedView.model = model
                directedView.tail = sourceView
                directedView.head = targetView
                directedView.initialize(null, directedView.tail.left, directedView.tail.top, directedView.head.left, directedView.head.top)
                if (options.viewInitializer) {
                    options.viewInitializer(directedView)
                }
                app.engine.addViews(diagram, [directedView])
                if (directedView) {
                    directedView = app.repository.get(directedView._id)
                }
                app.factory.triggerElementCreated(null, directedView)
                editor.selectView(directedView)
            }
        }

    }
    return directedView;
}
let XOG = 10,
    YOG = 10;
/**
 * @function getGeneralizationView
 * @description returns UMLGeneralizationView
 * @param {*} model
 * @param {UMLClassDiagram} diagram
 * @param {Object} options
 * @returns {UMLGeneralizationView}
 */
function getGeneralizationView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var directedView = diagram.getViewOf(model)
    var sourceView = diagram.getViewOf(model.source)
    var targetView = diagram.getViewOf(model.target)
    if (directedView) {
        /* Relationship View is already existed in this Diagram. */
        editor.selectView(directedView)
        editor.selectAdditionalView(sourceView);
        editor.selectAdditionalView(targetView);
    } else {
        if (!targetView) {
            app.factory.createViewAndRelationships(editor, XOG, YOG, model.target)
        }
        if (!sourceView) {
            app.factory.createViewAndRelationships(editor, XOG, YOG + 100, model.source)
        }
        if (targetView && sourceView) {
            let typeName = null;

            var metaClass = global.meta["UMLGeneralization"];
            if (metaClass) {
                typeName = metaClass.view || null
            }

            var DirectedViewType = typeName ? type[typeName] : null
            if (DirectedViewType) {
                directedView = new DirectedViewType()
                directedView.model = model
                directedView.tail = sourceView
                directedView.head = targetView
                directedView.initialize(null, directedView.tail.left, directedView.tail.top, directedView.head.left, directedView.head.top)
                if (options.viewInitializer) {
                    options.viewInitializer(directedView)
                }
                app.engine.addViews(diagram, [directedView])
                if (directedView) {
                    directedView = app.repository.get(directedView._id)
                }
                app.factory.triggerElementCreated(null, directedView)
                editor.selectView(directedView)
            }
        }

    }
    return directedView;
}
/**
 * @function getAssociationView
 * @description returns UMLAssociationView
 * @param {*} model
 * @param {UMLClassDiagram} diagram
 * @param {Object} options
 * @returns {UMLAssociationView}
 */
let XOA = 10,
    YOA = 10;

function getAssociationView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var undirectedView = diagram.getViewOf(model)
    var end1View = diagram.getViewOf(model.end1.reference)
    var end2View = diagram.getViewOf(model.end2.reference)

    if (undirectedView) {
        /* Relationship View is already existed in this Diagram. */
        editor.selectView(undirectedView)
        editor.selectAdditionalView(end1View)
        editor.selectAdditionalView(end2View)
    } else {
        if (!end2View) {
            app.factory.createViewAndRelationships(editor, XOA, YOA, model.end2.reference)
        }
        if (!end1View) {
            app.factory.createViewAndRelationships(editor, XOA, YOA + 100, model.end1.reference)
        }
        if (end1View && end2View) {
            let typeName = null;
            var metaClass = global.meta["UMLAssociation"];
            if (metaClass) {
                typeName = metaClass.view || null
            }
            var UndirectedViewType = typeName ? type[typeName] : null
            if (UndirectedViewType) {
                undirectedView = new UndirectedViewType()
                undirectedView.model = model
                undirectedView.tail = end1View
                undirectedView.head = end2View
                undirectedView.initialize(null, undirectedView.tail.left, undirectedView.tail.top, undirectedView.head.left, undirectedView.head.top)
                if (options.viewInitializer) {
                    options.viewInitializer(undirectedView)
                }
                app.engine.addViews(diagram, [undirectedView])
                if (undirectedView) {
                    undirectedView = app.repository.get(undirectedView._id)
                }
                editor.selectView(undirectedView)
            }
        }
        return undirectedView
    }
}
let XOACL = 10,
    YOACL = 10;
/**
 * @function getAssociationClasslinkView
 * @description returns UMLAssociationClasslinkView
 * @param {*} model
 * @param {UMLClassDiagram} diagram
 * @param {Object} options
 * @returns {UMLAssociationClasslinkView}
 */
function getAssociationClasslinkView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var directedView = diagram.getViewOf(model)
    var sourceView = diagram.getViewOf(model.classSide)
    var targetView = diagram.getViewOf(model.associationSide)
    if (directedView) {
        /* Relationship View is already existed in this Diagram. */
        editor.selectView(directedView)
        editor.selectAdditionalView(sourceView)
        editor.selectAdditionalView(targetView)
    } else {
        if (!targetView) {
            let x = 10,
                y = 10;
            let classView = diagram.getViewOf(model.associationSide);
            if (classView != null) {
                x = classView.left;
                y = classView.top;
                XOACL = x;
                YOACL = y;

            }
            app.factory.createViewAndRelationships(editor, XOACL, YOACL, model.associationSide)
        }
        if (!sourceView) {
            let x = 10,
                y = 10;
            let assoView = diagram.getViewOf(model.classSide);
            if (assoView != null) {
                x = assoView.left;
                y = assoView.top;
                XOACL = x;
                YOACL = y;
            }
            app.factory.createViewAndRelationships(editor, XOACL, YOACL + 100, model.classSide)
        }
        if (targetView && sourceView) {
            let typeName = null;

            var metaClass = global.meta["UMLAssociationClassLink"];
            if (metaClass) {
                typeName = metaClass.view || null
            }

            var DirectedViewType = typeName ? type[typeName] : null
            if (DirectedViewType) {
                directedView = new DirectedViewType()
                directedView.model = model
                directedView.tail = sourceView
                directedView.head = targetView
                directedView.initialize(null, directedView.tail.left, directedView.tail.top, directedView.head.left, directedView.head.top)
                if (options.viewInitializer) {
                    options.viewInitializer(directedView)
                }
                app.engine.addViews(diagram, [directedView])
                if (directedView) {
                    directedView = app.repository.get(directedView._id)
                }
                app.factory.triggerElementCreated(null, directedView)
                editor.selectView(directedView)
            }
        }

    }
    return directedView;
}
/**
 * @function createViewOfElement
 * @description create view of existing element in model explorer
 * @param {*} newAdded
 */
function createViewOfElement(newAdded) {
    try {
        var editor = app.diagrams.getEditor();
        var diagram = editor.diagram;
        var model = newAdded;

        var containerView = diagram.getViewAt(editor.canvas, getXY().pX, getXY().pY, true)

        var options = {
            diagram: diagram,
            editor: editor,
            x: getXY().pX,
            y: getXY().pY,
            model: model,
            containerView: containerView
        }
        let returnedView = null;
        if (newAdded instanceof type.UMLGeneralization) {
            returnedView = getGeneralizationView(model, diagram, options);
        } else if (newAdded instanceof type.UMLAssociation) {
            returnedView = getAssociationView(model, diagram, options);
        } else if (newAdded instanceof type.UMLInterfaceRealization) {
            returnedView = getInterfaceRealizationView(model, diagram, options);
        } else if (newAdded instanceof type.UMLAssociationClassLink) {
            returnedView = getAssociationClasslinkView(model, diagram, options)
        } else {
            returnedView = app.factory.createViewOf(options);
        }

        if (returnedView != null) {

            if (returnedView instanceof type.UMLInterfaceView) {
                setInterfaceViewAttributes(returnedView);
            } else if (returnedView instanceof type.UMLEnumerationView) {
                setEnumerationViewAttributes(returnedView);
            } else if (returnedView instanceof type.UMLClassView) {
                setClassViewAttributes(returnedView);
            }

            let width = 0,
                minWidth = 0;
            width = returnedView.width;
            minWidth = returnedView.minWidth;
            if (minWidth > width) {
                width = minWidth;
            }
            pX += width + (incrementValue / 2);
            pY = returnedView.top;
        }

    } catch (err) {
        console.error(err)
    }
}
/**
 * @function recreateView
 * @description recreate view for Class, Interface, Enumeration
 * @param {*} newAdded
 * @param {*} view
 */
function recreateView(newAdded, view) {
    try {
        var editor = app.diagrams.getEditor();
        var diagram = editor.diagram;
        var model = newAdded;


        var containerView = diagram.getViewAt(editor.canvas, view.left, view.top, true)

        var options = {
            diagram: diagram,
            editor: editor,
            x: view.left,
            y: view.top,
            model: model,
            containerView: containerView
        }
        let returnedView = app.factory.createViewOf(options);


        if (returnedView instanceof type.UMLInterfaceView) {
            setInterfaceViewAttributes(returnedView);
        } else if (returnedView instanceof type.UMLEnumerationView) {
            setEnumerationViewAttributes(returnedView);
        } else if (returnedView instanceof type.UMLClassView) {
            setClassViewAttributes(returnedView);
        }
    } catch (err) {
        console.error(err)
    }
}
/**
 * @function recreateViewForRelationship
 * @description recreate view for relationship 
 * @param {*} rel
 */
function recreateViewForRelationship(rel) {
    let rel_created_view = app.repository.getViewsOf(rel._parent)
    let newViews = []
    forEach(rel_created_view, function (view) {
        if (view instanceof type.UMLClassView) {
            let res = newViews.filter(function (viewItem) {
                return viewItem.model._id == view.model._id;
            });
            if (res == 0) {
                newViews.push(view);
            }

        }
    });
    forEach(newViews, function (nView) {
        app.engine.deleteElements([], [nView]);
        recreateView(nView.model, nView);
    });
}
/**
 * @function setInterfaceViewAttributes
 * @description set dafault property to UMLInterfaceView
 * @param {*} UMLInterfaceView
 */
function setInterfaceViewAttributes(UMLInterfaceView) {
    app.engine.setProperty(UMLInterfaceView, viewfields.autoResize, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.containerChangeable, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.containerExtending, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.enabled, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.fillColor, '#fff5d8');
    app.engine.setProperty(UMLInterfaceView, viewfields.fontColor, "#000000");
    app.engine.setProperty(UMLInterfaceView, viewfields.lineColor, "#000000");
    app.engine.setProperty(UMLInterfaceView, viewfields.minHeight, 100);
    app.engine.setProperty(UMLInterfaceView, viewfields.minWidth, 180);
    app.engine.setProperty(UMLInterfaceView, viewfields.movable, 3);
    app.engine.setProperty(UMLInterfaceView, viewfields.parentStyle, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.selectZIndex, 0);
    app.engine.setProperty(UMLInterfaceView, viewfields.selectable, 1);
    /* app.engine.setProperty(UMLInterfaceView, viewfields.selected, true); */
    app.engine.setProperty(UMLInterfaceView, viewfields.showMultiplicity, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.showNamespace, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.showOperationSignature, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.showProperty, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.showShadow, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.showType, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.showVisibility, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.sizable, 4);
    app.engine.setProperty(UMLInterfaceView, viewfields.stereotypeDisplay, 'label');
    app.engine.setProperty(UMLInterfaceView, viewfields.suppressAttributes, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.suppressOperations, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.suppressReceptions, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.visible, true);
    app.engine.setProperty(UMLInterfaceView, viewfields.wordWrap, false);
    app.engine.setProperty(UMLInterfaceView, viewfields.zIndex, 0);
}
/**
 * @function setEnumerationViewAttributes
 * @description set dafault property to UMLEnumerationView
 * @param {*} UMLEnumerationView
 */
function setEnumerationViewAttributes(UMLEnumerationView) {
    app.engine.setProperty(UMLEnumerationView, viewfields.autoResize, false);
    app.engine.setProperty(UMLEnumerationView, viewfields.containerChangeable, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.containerExtending, false);
    app.engine.setProperty(UMLEnumerationView, viewfields.enabled, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.fillColor, '#d8f2ff');
    app.engine.setProperty(UMLEnumerationView, viewfields.fontColor, "#000000");
    app.engine.setProperty(UMLEnumerationView, viewfields.lineColor, "#000000");
    app.engine.setProperty(UMLEnumerationView, viewfields.minHeight, 100);
    app.engine.setProperty(UMLEnumerationView, viewfields.minWidth, 180);
    app.engine.setProperty(UMLEnumerationView, viewfields.movable, 3);
    app.engine.setProperty(UMLEnumerationView, viewfields.parentStyle, false);
    app.engine.setProperty(UMLEnumerationView, viewfields.selectZIndex, 0);
    app.engine.setProperty(UMLEnumerationView, viewfields.selectable, 1);
    /* app.engine.setProperty(UMLEnumerationView, viewfields.selected, true); */
    app.engine.setProperty(UMLEnumerationView, viewfields.showMultiplicity, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.showNamespace, false);
    app.engine.setProperty(UMLEnumerationView, viewfields.showOperationSignature, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.showProperty, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.showShadow, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.showType, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.showVisibility, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.sizable, 4);
    app.engine.setProperty(UMLEnumerationView, viewfields.stereotypeDisplay, 'label');
    app.engine.setProperty(UMLEnumerationView, viewfields.suppressAttributes, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.suppressLiterals, false);
    app.engine.setProperty(UMLEnumerationView, viewfields.suppressOperations, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.suppressReceptions, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.visible, true);
    app.engine.setProperty(UMLEnumerationView, viewfields.wordWrap, false);
    app.engine.setProperty(UMLEnumerationView, viewfields.zIndex, 0);
}
/**
 * @function setClassViewAttributes
 * @description set dafault property to UMLClassView
 * @param {UMLClassView} UMLClassView
 */
function setClassViewAttributes(UMLClassView) {
    app.engine.setProperty(UMLClassView, viewfields.autoResize, false);
    app.engine.setProperty(UMLClassView, viewfields.containerChangeable, true);
    app.engine.setProperty(UMLClassView, viewfields.containerExtending, false);
    app.engine.setProperty(UMLClassView, viewfields.enabled, true);
    app.engine.setProperty(UMLClassView, viewfields.fillColor, '#ffffff');
    app.engine.setProperty(UMLClassView, viewfields.fontColor, "#000000");
    app.engine.setProperty(UMLClassView, viewfields.lineColor, "#000000");
    app.engine.setProperty(UMLClassView, viewfields.minHeight, 100);
    app.engine.setProperty(UMLClassView, viewfields.minWidth, 180);
    app.engine.setProperty(UMLClassView, viewfields.movable, 3);
    app.engine.setProperty(UMLClassView, viewfields.parentStyle, false);
    app.engine.setProperty(UMLClassView, viewfields.selectZIndex, 0);
    app.engine.setProperty(UMLClassView, viewfields.selectable, 1);
    /* app.engine.setProperty(UMLClassView, viewfields.selected, true); */
    app.engine.setProperty(UMLClassView, viewfields.showMultiplicity, true);
    app.engine.setProperty(UMLClassView, viewfields.showNamespace, true);
    app.engine.setProperty(UMLClassView, viewfields.showOperationSignature, true);
    app.engine.setProperty(UMLClassView, viewfields.showProperty, true);
    app.engine.setProperty(UMLClassView, viewfields.showShadow, true);
    app.engine.setProperty(UMLClassView, viewfields.showType, true);
    app.engine.setProperty(UMLClassView, viewfields.showVisibility, true);
    app.engine.setProperty(UMLClassView, viewfields.sizable, 4);
    app.engine.setProperty(UMLClassView, viewfields.stereotypeDisplay, 'label');
    app.engine.setProperty(UMLClassView, viewfields.suppressAttributes, false);
    app.engine.setProperty(UMLClassView, viewfields.suppressOperations, true);
    app.engine.setProperty(UMLClassView, viewfields.suppressReceptions, true);
    app.engine.setProperty(UMLClassView, viewfields.visible, true);
    app.engine.setProperty(UMLClassView, viewfields.wordWrap, false);
    app.engine.setProperty(UMLClassView, viewfields.zIndex, 0);
}
let newElements = [];
/**
 * @function addNewAddedElement
 * @description add element in newElements array
 * @param {*} element
 */
function addNewAddedElement(element) {
    newElements.push(element);
}
/**
 * @function getNewAddedElement
 * @description returns array of newElements
 * @returns {Array}
 */
function getNewAddedElement() {
    return newElements;
}
/**
 *@function resetNewAddedElement
 *@description reset newElements array
 */
function resetNewAddedElement() {
    newElements = [];
}
/**
 * @function getTagsToExport
 * @description bind Tag fields from attr tags and returns array of Tag to Export
 * @param {*} literal
 * @returns {Array}
 */
function getTagsToExport(literal) {
    let tagArr = [];
    if (literal.tags != null) {

        let tags = literal.tags;
        forEach(tags, function (tag) {
            let tagObj = {};
            tagObj[fields.name] = tag.name;
            tagObj[fields.value] = tag.value;
            tagObj[fields.kind] = tag.kind;
            tagArr.push(tagObj);
        });
    }
    return tagArr;
}
/**
 * @function getTagsToImport
 * @description bind Tag fields from attr tags and returns array of Tag to Import
 * @param {*} attr
 * @returns {Array}
 */
function getTagsToImport(attr) {
    let arrTags = [];
    if (attr.tags != null) {
        let tags = attr.tags;
        /* Tag */
        forEach(tags, function (tag) {
            let objTag = {};
            objTag._type = 'Tag';
            objTag.name = tag.name;
            objTag.kind = tag.kind
            objTag.value = tag.value;

            arrTags.push(objTag);
        });
    }
    return arrTags;
}

function createViewOfElements(newElements) {
    forEach(newElements, function (newEle) {
        createViewOfElement(newEle);
    });
}
let mOtherDependentClasses = [];

function addOtherDependentClass(element) {
    mOtherDependentClasses.push(element);
}

function getOtherDependentClass() {
    return mOtherDependentClasses;
}

function resetOtherDependentClass() {
    mOtherDependentClasses = [];
}

function findOtherElements(entity) {
    let entityParent = entity._parent;
    forEach(entity.ownedElements, function (oweEle) {
        if (oweEle instanceof type.UMLAssociation
            /* || 
                       oweEle instanceof type.UMLGeneralization || 
                           oweEle instanceof type.UMLInterfaceRealization */
        ) {

            // let end1Parent = oweEle.end1.reference._parent;
            // let end2Parent = oweEle.end2.reference._parent;

            // if (entityParent instanceof type.UMLPackage &&
            //     end1Parent instanceof type.UMLPackage &&
            //     entityParent.name != end1Parent.name) {
            addOtherDependentClass(oweEle.end1.reference);
            // }

            // if (entityParent instanceof type.UMLPackage &&
            //     end2Parent instanceof type.UMLPackage &&
            //     entityParent.name != end2Parent.name) {
            addOtherDependentClass(oweEle.end2.reference);
            // }

        }
    });
}
function isNewFileSaved(){
    return new Promise((resolve,reject)=>{
         let fileName = app.project.filename;
         if(fileName == null){
              let result = app.dialogs.showConfirmDialog(constant.save_file_before_operation);
              if(result == 'ok'){
                   let saveResult = app.commands.execute("project:save");  
                   console.log("Save Result",saveResult);
                   if(saveResult == null){
                        resolve(false);
                   }
                   else{
                        resolve(true);
                   }
              }
              else{
                   resolve(false);
              }
         }
         else{
              resolve(true);
         }
    });
    
}
module.exports.getElementType = getElementType;
module.exports.isString = isString;
module.exports.getRelationshipType = getRelationshipType;
module.exports.addDatatype = addDatatype;
module.exports.getDatatype = getDatatype;
module.exports.setProperty = setProperty;
module.exports.bindProperty = bindProperty;
module.exports.setOperation = setOperation;
module.exports.bindOperation = bindOperation;
module.exports.setLiterals = setLiterals;
module.exports.bindLiterals = bindLiterals;
module.exports.isAssociationExist = isAssociationExist;
module.exports.isGeneralizationExist = isGeneralizationExist;
module.exports.isInterfaceRealizationExist = isInterfaceRealizationExist;
module.exports.isAssociationClassLinkExist = isAssociationClassLinkExist;
module.exports.createViewOfElement = createViewOfElement;
module.exports.createViewOfElements = createViewOfElements;
module.exports.calculateXY = calculateXY;
module.exports.addNewAddedElement = addNewAddedElement;
module.exports.getNewAddedElement = getNewAddedElement;
module.exports.resetNewAddedElement = resetNewAddedElement;
module.exports.getXY = getXY;
module.exports.recreateView = recreateView;
module.exports.recreateViewForRelationship = recreateViewForRelationship;
module.exports.getTagsToExport = getTagsToExport;
module.exports.getTagsToImport = getTagsToImport;
module.exports.addOtherDependentClass = addOtherDependentClass;
module.exports.getOtherDependentClass = getOtherDependentClass;
module.exports.findOtherElements = findOtherElements;
module.exports.resetOtherDependentClass = resetOtherDependentClass;
module.exports.isNewFileSaved = isNewFileSaved;
