var constant = require('../constant');
var forEach = require('async-foreach').forEach;
var fields = require('./fields');
var viewfields = require('./viewfields');
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
        return fields.Enum;
    } else {
        return 'UN_DEFINED';
    }

}

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

function getDatatype(attr) {
    let dType = {};
    if (attr.type == fields.Entity) {
        let res = app.repository.search(attr.name);
        forEach(res, function (item) {
            if (item instanceof type.UMLClass) {
                dType['$ref'] = item._id;
            }
        });
        return dType;

    } else if (attr.type == fields.Event) {
        let res = app.repository.search(attr.name);
        forEach(res, function (item) {
            if (item instanceof type.UMLInterface) {
                dType['$ref'] = item._id;
            }
        });
        return dType;

    } else if (attr.type == fields.Enum) {

        let res = app.repository.search(attr.name);
        forEach(res, function (item) {
            if (item instanceof type.UMLEnumeration) {
                dType['$ref'] = item._id;
            }
        });
        return dType;
    } else if (isString(attr.type)) {
        return attr.type
    }
}

function setProperty(ownedElements, XMIData) {

    forEach(ownedElements, function (element) {
        if (element instanceof type.UMLClass || element instanceof type.UMLEnumeration || element instanceof type.UMLInterface) {
            let mSubObject = XMIData[element.name];
            let entityString = app.repository.writeObject(element);
            let entityJson = JSON.parse(entityString, null, 4);

            /* Check for new properties to be added */
            let newProps = [];
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
                        // forEach(atbts, function (mItem) {
                        newProps.push(item);
                        // });
                    } else if (atbts.length == 1) {
                        existProps.push(atbts[0]);
                    }
                }
            });
            /*  */

            /* attribute ( Property ) */
            let attributes = [];
            entityJson.attributes = attributes;
            forEach(mSubObject.Property, function (attr) {
                let chkNew = newProps.filter(function (nItem) {
                    return attr.name == nItem.name
                });

                let objProp = bindProperty(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = element
                    console.log("rel", rel);
                    attributes.push(rel);
                }
            });
            let resRel = app.engine.setProperty(element, 'attributes', attributes);
            console.log("setProperty", resRel);
        }
    });
}

function setLiterals(ownedElements, XMIData) {
    forEach(ownedElements, function (entity) {
        if (entity instanceof type.UMLEnumeration) {
            let mSubObject = XMIData[entity.name];
            let entityString = app.repository.writeObject(entity);
            let entityJson = JSON.parse(entityString, null, 4);


            /* attribute ( Property ) */
            let literals = [];
            entityJson.literals = literals;

            forEach(mSubObject[fields.Enum], function (attr) {
                let objProp = bindLiterals(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    literals.push(rel);
                }
            });
            let resRel = app.engine.setProperty(entity, 'literals', literals);
            //let resRel=app.engine.setProperty(entity,'literals',literals);
            // app.modelExplorer.update(entity)
            console.log("setLiterals", resRel);
        }
    });
}

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

            forEach(mSubObject.Operation, function (attr) {
                let objProp = bindOperation(attr);
                if (objProp != null) {
                    let rel = app.repository.readObject(objProp);
                    rel._parent = entity;
                    console.log("rel", rel);
                    // let mResult = app.engine.addItem(entity, 'operations', rel);
                    // console.log("mResult", mResult);
                    operations.push(rel);
                }
            });
            let resRel = app.engine.setProperty(entity, 'operations', operations);
            console.log("setOperation", resRel);
        }
    });
}

function bindLiterals(attr) {
    /* UMLAttribute */
    let objAttr = {};
    objAttr._type = 'UMLEnumerationLiteral';
    objAttr.name = attr.name;
    objAttr.documentation = attr.description;
    let tags = attr.tags;
    let arrTags = [];
    objAttr.tags = arrTags;
    /* Tag */
    forEach(tags, function (tag) {
        let objTag = {};
        objTag._type = 'Tag';
        objTag.name = tag.name;
        objTag.kind = tag.kind
        objTag.value = tag.value;

        arrTags.push(objTag);
    });
   return objAttr;
}

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

    let tagArr = [];
    objAttr[fields.tags] = tagArr;
    let tags = attr.tags;
    forEach(tags, function (tag) {
            let tagObj = {};
            tagObj._type = 'Tag';
            tagObj[fields.name] = tag.name;
            tagObj[fields.value] = tag.value;
            tagObj[fields.kind] = tag.kind;
            tagArr.push(tagObj);
        });
    //attribute.push(objAttr);
    return objAttr;
}

function bindOperation(attr) {
    /* UMLAttribute */
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
        // objAttr.type = dType;
        objParam.type = dType //param.DataType.type;
        objParam.isID = param.isID;
        objParam.multiplicity = param.cardinality;

        arrParam.push(objParam);
    });
    return objOpr;
}

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

function isGeneralizationExist(entity, attr) {
    let isExist = false;
    let assoc = null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLGeneralization) {
            if (/* aggr.name == attr.name && */ /* Do not remove this commnet. Need to confirm */
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

function isInterfaceRealizationExist(entity, attr) {
    let isExist = false;
    let assoc = null;
    forEach(entity.ownedElements, function (aggr) {
        if (aggr instanceof type.UMLInterfaceRealization) {
            if (/* aggr.name == attr.name && */ /* Do not remove this commnet. Need to confirm */
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
    lastMaxView = maxLeft;
    pX = lastMaxView.left + lastMaxView.width + (incrementValue / 2);
    pY = lastMaxView.top;

    let lastView = {
        pX: pX,
        pY: pY
    }
    return lastView;
}

function getXY() {
    return {
        pX: pX,
        pY: pY
    }
}

function getInterfaceRealizationView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var directedView = diagram.getViewOf(model)
    var sourceView = diagram.getViewOf(model.source)
    var targetView = diagram.getViewOf(model.target)
    if (directedView) {
        editor.selectView(directedView)
        editor.selectAdditionalView(sourceView)
        editor.selectAdditionalView(targetView)
        app.dialogs.showAlertDialog('Relationship View is already existed in this Diagram.')
    } else {
        if (!targetView) {
            app.factory.createViewAndRelationships(editor, x, y, model.target)
        }
        if (!sourceView) {
            app.factory.createViewAndRelationships(editor, x, y + 100, model.source)
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

function getGeneralizationView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var directedView = diagram.getViewOf(model)
    var sourceView = diagram.getViewOf(model.source)
    var targetView = diagram.getViewOf(model.target)
    if (directedView) {
        editor.selectView(directedView)
        editor.selectAdditionalView(sourceView)
        editor.selectAdditionalView(targetView)
        app.dialogs.showAlertDialog('Relationship View is already existed in this Diagram.')
    } else {
        if (!targetView) {
            app.factory.createViewAndRelationships(editor, x, y, model.target)
        }
        if (!sourceView) {
            app.factory.createViewAndRelationships(editor, x, y + 100, model.source)
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

function getAssociationView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var undirectedView = diagram.getViewOf(model)
    var end1View = diagram.getViewOf(model.end1.reference)
    var end2View = diagram.getViewOf(model.end2.reference)
    if (undirectedView) {
        editor.selectView(undirectedView)
        editor.selectAdditionalView(end1View)
        editor.selectAdditionalView(end2View)
        app.dialogs.showAlertDialog('Relationship View is already existed in this Diagram.')
    } else {
        if (!end2View) {
            app.factory.createViewAndRelationships(editor, x, y, model.end2.reference)
        }
        if (!end1View) {
            app.factory.createViewAndRelationships(editor, x, y + 100, model.end1.reference)
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

function getAssociationClasslinkView(model, diagram, options) {
    let editor = app.diagrams.getEditor();
    var directedView = diagram.getViewOf(model)
    var sourceView = diagram.getViewOf(model.classSide)
    var targetView = diagram.getViewOf(model.associationSide)
    if (directedView) {
        editor.selectView(directedView)
        editor.selectAdditionalView(sourceView)
        editor.selectAdditionalView(targetView)
        app.dialogs.showAlertDialog('Relationship View is already existed in this Diagram.')
    } else {
        if (!targetView) {
            let x=10,y=10;
            let classView=diagram.getViewOf(model.associationSide);
            if(classView!=null){
                x=classView.left;
                y=classView.top;
            }
            app.factory.createViewAndRelationships(editor, x, y, model.associationSide)
        }
        if (!sourceView) {
            let x=10,y=10;
            let assoView=diagram.getViewOf(model.classSide);
            if(assoView!=null){
                x=assoView.left;
                y=assoView.top;
            }
            app.factory.createViewAndRelationships(editor,x,y + 100, model.classSide)
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

            console.log("ReturnedView", returnedView);


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
    // app.engine.setProperty(UMLInterfaceView, viewfields.selected, true);
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
    // app.engine.setProperty(UMLEnumerationView, viewfields.selected, true);
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
    // app.engine.setProperty(UMLClassView, viewfields.selected, true);
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

function addNewAddedElement(element) {
    newElements.push(element);
}

function getNewAddedElement() {
    return newElements;
}

function resetNewAddedElement() {
    newElements = [];
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
module.exports.calculateXY = calculateXY;
module.exports.addNewAddedElement = addNewAddedElement;
module.exports.getNewAddedElement = getNewAddedElement;
module.exports.resetNewAddedElement = resetNewAddedElement;
module.exports.getXY = getXY;
module.exports.recreateView = recreateView;
module.exports.recreateViewForRelationship = recreateViewForRelationship;