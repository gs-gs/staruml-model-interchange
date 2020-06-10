const prefs = {
    id: "mi",
    name: "model-interchange",
    schema: {
        "mi.label": {
            text: "Repository Location : ",
            description: "repository location ",
            type:'string',
            default:'',
            value:"fasdfafsdaf"
        },
        "mi.ndr": {
            text: "Apply NDR rules",
            description: "Apply NDR rules.",
            type: "check",
            default: false
        }
    }
}
module.exports = prefs;