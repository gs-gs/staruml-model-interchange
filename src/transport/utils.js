function getElementType(element) {
    if (element instanceof type.UMLClass) {
        return "Entity";
    } else if (element instanceof type.UMLInterface) {
        return "Event"
    } else if (element instanceof type.UMLInterfaceRealization) {
        return 'interfaceRealization';
    } else if (element instanceof type.UMLGeneralization) {
        return 'generalization';
    } else if (element instanceof type.UMLAssociationClassLink) {
        return 'associationClassLink';
    } else if (element instanceof type.UMLEnumeration) {
        return 'enum';
    } else {
        return 'UN_DEFINED';
    }

}

function getRelationshipType(end1, end2) {
    if (end1.aggregation == 'shared' && end2.aggregation == 'none') {
        /* aggregation */
        return 'aggregation';
    } else if (end1.aggregation == 'composite' && end2.aggregation == 'none') {
        /* composition */
        return 'composition';
    } else if (end1.aggregation == 'none' && end2.aggregation == 'none') {
        /* event (interface) : when relationship between interface to interface */
        return 'interface';
    }
}

function isString(s) {
    return typeof (s) === 'string' || s instanceof String;
}
module.exports.getElementType = getElementType;
module.exports.isString = isString;
module.exports.getRelationshipType = getRelationshipType;