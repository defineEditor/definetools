const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const { getDescription } = require('../utils/defineStructureUtils.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const convertToFormat = require('../utils/convertToFormat.js');
const flagChecks = require('../utils/flagChecks.js');

const writeFile = promisify(fs.writeFile);

class GetVars extends Command {
    async run () {
        const { flags, argv } = this.parse(GetVars);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : ('vars.' + flags.format));

        // Read-in and parse XML
        let xmlData = await readXml(inputFile);
        let odm = parseDefine(xmlData);
        let attributes = getVariableData(odm, flags);

        // Handle flags
        flagChecks(flags, this.error);
        if (flags.filter) {
            let filter = flags.filter;
            if (/^('.*'|".*")$/.test(filter)) {
                filter.replace(/^(['"])(.*)\1$/, '$2');
            }
            let regexFilter;
            try {
                regexFilter = new RegExp(filter, 'i');
            } catch (error) {
                this.error(`Invalid filter value. ${error}`);
            }

            Object.keys(attributes).forEach(itemGroupOid => {
                let itemGroupAttrs = attributes[itemGroupOid];
                let datasetName = itemGroupAttrs[0].dataset.toLowerCase();
                if (!regexFilter.test(datasetName)) {
                    delete attributes[itemGroupOid];
                }
            });
        }

        if (flags.verbose) {
            let numItems = Object.values(attributes).reduce((acc, dataset) => (acc + dataset.length), 0);
            let message = `Found ${numItems} items.` + (numItems === 0
                ? (flags.stdout ? `` : ` Nothing to print to ${outputFile}.`)
                : (flags.stdout ? ` Printing to STDOUT.` : ` Printing to ${flags.separate ? 'individual files' : outputFile}.`)
            );
            this.log(message);
        }

        // Nothing to report
        if (Object.keys(attributes).length === 0) {
            return;
        }

        if (flags.stdout) {
            // Unite into one array
            let unitedAttrs = [];
            Object.keys(attributes).forEach(itemGroupOid => {
                unitedAttrs = unitedAttrs.concat(attributes[itemGroupOid]);
            });
            this.log(convertToFormat(unitedAttrs, flags.format));
            return;
        }
        if (flags.separate) {
            await Promise.all(Object.keys(attributes).map(async (itemGroupOid) => {
                let itemGroupAttrs = attributes[itemGroupOid];
                let datasetName = '';
                if (itemGroupAttrs.length > 0) {
                    datasetName = itemGroupAttrs[0].dataset.toLowerCase();
                }
                await writeFile(path.resolve(currentFolder, datasetName + '.' + flags.format), convertToFormat(itemGroupAttrs, flags.format));
            }));
        } else {
            // Unite into one array
            let unitedAttrs = [];
            Object.keys(attributes).forEach(itemGroupOid => {
                unitedAttrs = unitedAttrs.concat(attributes[itemGroupOid]);
            });
            await writeFile(outputFile, await convertToFormat(unitedAttrs, flags.format));
        }
    }
}

GetVars.description = `extract variable attributes from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, vars.csv will be used.
`;

GetVars.args = [
    { name: 'Define-XML 2.0 file', required: true },
    { name: 'Output file' },
];

GetVars.flags = {
    separate: flags.boolean({ char: 's', description: 'Create a separate file for each dataset' }),
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    extended: flags.boolean({ char: 'e', description: 'Show an extended list of attributes' }),
    filter: flags.string({ description: "Regex used to specify datasets to output. Use --filter='^(ae|cm|lb)$' to select AE, CM, and LB datasets." }),
    stdout: flags.boolean({ description: 'Print results to STDOUT', exclusive: ['separate'] }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json', 'xlsx'], default: 'csv' }),
};

function getVariableData (odm, flags) {
    let result = {};
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        Object.values(mdv.itemGroups).forEach(itemGroup => {
            let dsAttributes = [];
            let codelist;
            itemGroup.itemRefOrder.forEach(itemRefOid => {
                let itemRef = itemGroup.itemRefs[itemRefOid];
                let itemDef = mdv.itemDefs[itemRef.itemOid];
                let comment;
                if (itemDef.commentOid) {
                    comment = getDescription(mdv.comments[itemDef.commentOid]);
                }
                let method;
                if (itemRef.methodOid) {
                    method = getDescription(mdv.methods[itemRef.methodOid]);
                }
                let origin;
                let originDescription;
                if (itemDef.origins.length > 0) {
                    origin = itemDef.origins[0].type;
                    if (itemDef.origins[0].descriptions.length > 0) {
                        originDescription = getDescription(itemDef.origins[0]);
                    }
                }
                if (itemDef.codeListOid) {
                    codelist = mdv.codeLists[itemDef.codeListOid].name;
                }
                let keySequence;
                if (itemGroup.keyOrder.includes(itemRefOid)) {
                    keySequence = itemGroup.keyOrder.indexOf(itemRefOid) + 1;
                }
                if (flags.extended) {
                    // Show extended attributes
                    dsAttributes.push({
                        dataset: itemGroup.name,
                        name: itemDef.name,
                        label: getDescription(itemDef),
                        length: itemDef.length,
                        dataType: itemDef.dataType,
                        origin,
                        originDescription,
                        method,
                        comment,
                        mandatory: itemRef.mandatory,
                        keySequence,
                        role: itemRef.role,
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
                        codelist,
                        keySequence,
                    });
                }
            });
            result[itemGroup.oid] = dsAttributes;
        });
    }
    return result;
}

module.exports = GetVars;
