const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const { getDescription } = require('../utils/defineStructureUtils.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const json2csv = require('json2csv');

const writeFile = promisify(fs.writeFile);

class getAttrs extends Command {
    async run () {
        const { flags, argv } = this.parse(getAttrs);
        const currentFolder = process.cwd();
        let xmlData = await readXml(path.resolve(currentFolder, argv[0]));
        let outputFile = argv.length > 1 ? argv[1] : 'attrs.csv';
        let odm = parseDefine(xmlData);
        let attributes = getAttributes(odm, flags);
        if (flags.verbose) {
            this.log(`Found metadata for ${Object.keys(attributes).length} datasets.`);
        }
        if (flags.stdout) {
            // Unite into one array
            let unitedAttrs = [];
            Object.keys(attributes).forEach(itemGroupOid => {
                unitedAttrs = unitedAttrs.concat(attributes[itemGroupOid]);
            });
            this.log(json2csv.parse(unitedAttrs));

            return;
        }
        if (flags.separate) {
            await Promise.all(Object.keys(attributes).map(async (itemGroupOid) => {
                let itemGroupAttrs = attributes[itemGroupOid];
                let datasetName = itemGroupAttrs[0].dataset.toLowerCase();
                await writeFile(path.resolve(currentFolder, datasetName + '.csv'), json2csv.parse(itemGroupAttrs));
            }));
        } else {
            // Unite into one array
            let unitedAttrs = [];
            Object.keys(attributes).forEach(itemGroupOid => {
                unitedAttrs = unitedAttrs.concat(attributes[itemGroupOid]);
            });
            await writeFile(path.resolve(currentFolder, outputFile), json2csv.parse(unitedAttrs));
        }
    }
}

getAttrs.description = `Extract variable attributes from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, attrs.csv will be used.
`;

getAttrs.args = [
    { name: 'Define-XML 2.0 file' },
    { name: 'Output file' },
];

getAttrs.flags = {
    separate: flags.boolean({ char: 's', description: 'Create a separate CSV file for each dataset' }),
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    all: flags.boolean({ char: 'a', description: 'Show all attributes' }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
};

function getAttributes (odm, flags) {
    let result = {};
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        Object.values(mdv.itemGroups).forEach(itemGroup => {
            let dsAttributes = [];
            itemGroup.itemRefOrder.forEach(itemRefOid => {
                let itemRef = itemGroup.itemRefs[itemRefOid];
                let itemDef = mdv.itemDefs[itemRef.itemOid];
                let origin;
                if (itemDef.origins.length > 0) {
                    origin = getDescription(itemDef.origins[0]);
                }
                if (flags.all) {
                    // Show all attributes
                    dsAttributes.push({
                        dataset: itemGroup.name,
                        name: itemDef.name,
                        label: getDescription(itemDef),
                        length: itemDef.length,
                        dataType: itemDef.dataType,
                        origin,
                        mandatory: itemRef.mandatory,
                        role: itemRef.role,
                        roleCodeListOid: itemRef.roleCodeListOid,
                        sasFieldName: itemDef.fieldName,
                        displayFormat: itemDef.displayFormat,
                    });
                } else {
                    // Show only basic attributes
                    dsAttributes.push({
                        dataset: itemGroup.name,
                        name: itemDef.name,
                        label: getDescription(itemDef),
                        length: itemDef.length,
                        dataType: itemDef.dataType,
                        displayFormat: itemDef.displayFormat,
                    });
                }
            });
            result[itemGroup.oid] = dsAttributes;
        });
    }
    return result;
}

module.exports = getAttrs;
