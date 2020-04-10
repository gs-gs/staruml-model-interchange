const fields = require('../transport/fields');
async function exportNewModel() {

    app.elementPickerDialog
        .showDialog("Select the package or project to generate OpenAPI Specs.", null, null) /* type.UMLPackage */
        .then(async function ({
            buttonId,
            returnValue
        }) {
            if (buttonId === "ok") {
                let mMainObject = {};

                
                let varSel = returnValue.getClassName();
                let valPackagename = type.UMLPackage.name;
                if (varSel == valPackagename) {
                    console.log(returnValue);
                    let mPackages = app.repository.select(returnValue.name+"::@UMLPackage");
                    console.log("mPackages ",mPackages);
                    
                    /* Working with contexts */
                    if(mPackages.length>0){
                        let arrContexts = [];
                        mMainObject[fields.contexts] = arrContexts;
                        mPackages.forEach(element => {
                            let objContext = {};
                            arrContexts.push(objContext);
                        });
                    }

                    /* Working with dataTypes */
                    let dataTypes= app.repository.select("DataTypes");
                    if(dataTypes.length>0){
                        dataTypes.forEach(element => {
                            let dataTypeClasses = app.repository.select(element.name+"::@UMLClass");
                            let arrDataTypesClasses = [];
                            mMainObject[fields.dataTypes] = arrDataTypesClasses;
                            if(dataTypeClasses.length>0){
                                dataTypeClasses.forEach(element => {
                                    let dataTypeClassObject = {};
                                    dataTypeClassObject[fields.name]=element.name;
                                    let tags = element.tags;
                                    if(tags.length>0){
                                        dataTypeClassObject[fields.status] = tags[0].name;
                                    }
                                    arrDataTypesClasses.push(dataTypeClassObject);
                                });
                            }
                        });
                    }
                    console.log("MainObject ",mMainObject);



                } else {
                    app.dialogs.showErrorDialog("Please select a package");
                }
            }
        });
}
module.exports.exportNewModel = exportNewModel;