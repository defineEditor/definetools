const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const { getDescription } = require('../utils/defineStructureUtils.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const json2csv = require('json2csv');

const writeFile = promisify(fs.writeFile);

class getDatasets extends Command {
    async run () {
        const { flags, argv } = this.parse(getDatasets);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : 'attrs.csv');

        // Read-in and parse XML
        let xmlData = await readXml(inputFile);
        let odm = parseDefine(xmlData);
        let attributes = getAttributes(odm, flags);

        // Handle flags
        if (flags.verbose) {
            this.log(`Found metadata for ${attributes.length} datasets.`);
        }

        if (flags.filter) {
            let filter = flags.filter;
            if (/^('.*'|".*")$/.test(filter)) {
                filter.replace(/^(['"])(.*)\1$/, '$2');
            }
            let regexFilter;
            try {
                regexFilter = new RegExp(filter, 'i');
            } catch (error) {
                this.log(`Invalid filter value. ${error}`);
            }

            attributes.forEach((attr, index) => {
                let datasetName = attr.name.toLowerCase();
                if (!regexFilter.test(datasetName)) {
                    attributes.splice(index, 1, 'toDelete');
                }
            });
            attributes = attributes.filter(attr => (attr !== 'toDelete'));
        }
        if (flags.stdout) {
            // Unite into one array
            this.log(json2csv.parse(attributes));
        } else {
            await writeFile(outputFile, json2csv.parse(attributes));
        }
    }
}

getDatasets.description = `Extract dataset attributes from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, attrs.csv will be used.
`;

getDatasets.args = [
    { name: 'Define-XML 2.0 file', required: true },
    { name: 'Output file' },
];

getDatasets.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    extended: flags.boolean({ char: 'e', description: 'Show extended attributes' }),
    filter: flags.string({ description: "Regex used to specify datasets to output. Use --filter='^(ae|cm|lb)$' to select AE, CM, and LB datasets." }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
};

function getAttributes (odm, flags) {
    let result = [];
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        Object.values(mdv.itemGroups).forEach(itemGroup => {
            const { name, domain, datasetName, repeating, isReferenceData, purpose, structure, datasetClass } = itemGroup;
            if (flags.extended) {
                // Show extended attributes
                result.push({
                    name,
                    label: getDescription(itemGroup),
                    domain,
                    sasDatasetName: datasetName,
                    repeating,
                    isReferenceData,
                    purpose,
                    structure,
                    datasetClass: datasetClass.name,
                });
            } else {
                // Show only basic attributes
                result.push({
                    name,
                    label: getDescription(itemGroup),
                    domain,
                });
            }
        });
    }
    return result;
}

module.exports = getDatasets;
