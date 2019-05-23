function getDescription (object, language) {
    if (object.descriptions.length === 1) {
        return object.descriptions[0].value;
    } else if (object.descriptions.length > 1) {
        let filtDesc = object.descriptions.filter(description => (description.lang === language));
        if (filtDesc.length >= 1) {
            return filtDesc[0].value;
        } else {
            return '';
        }
    } else {
        return '';
    }
}

function getDecode (object, language) {
    if (object.decodes.length === 1) {
        return object.decodes[0].value;
    } else {
        return undefined;
    }
}

module.exports = {
    getDescription,
    getDecode,
};
