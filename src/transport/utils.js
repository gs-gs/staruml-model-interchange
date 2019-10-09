function getElementType(element){
    if(element instanceof type.UMLClass){
        return "Entity";
    }else if(element instanceof type.UMLInterface){
        return "Event"
    }else if(element instanceof type.UMLInterfaceRealization){
        return 'interfaceRealization';
    }else if(element instanceof type.UMLGeneralization){
        return 'generalization';
    }else if(element instanceof type.UMLAssociationClassLink){
        return 'associationClassLink';
    }else if(element instanceof type.UMLEnumeration){
        return 'enum'
    }
    else{
        return 'UN_DEFINED';
    }
    
}
function isString(s) {
    return typeof(s) === 'string' || s instanceof String;
}
module.exports.getElementType=getElementType;
module.exports.isString=isString;