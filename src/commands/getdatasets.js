const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const { getDescription } = require('../utils/defineStructureUtils.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const chalk = require('chalk');
const convertToFormat = require('../utils/convertToFormat.js');
const flagChecks = require('../utils/flagChecks.js');

const writeFile = promisify(fs.writeFile);

class GetDatasets extends Command {
    async run () {
        const { flags, argv } = this.parse(GetDatasets);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : ('datasets.' + flags.format));

        // Read-in and parse XML
        let xmlData = await readXml(inputFile);
        let odm = parseDefine(xmlData);
        let attributes = getDatasetData(odm, flags);

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

            attributes.forEach((attr, index) => {
                let datasetName = attr.name.toLowerCase();
                if (!regexFilter.test(datasetName)) {
                    attributes.splice(index, 1, 'toDelete');
                }
            });
            attributes = attributes.filter(attr => (attr !== 'toDelete'));
        }

        if (flags.verbose) {
            let numItems = attributes.length;
            let message = `Found ${chalk.bold(numItems)} items.` + (numItems === 0
                ? (flags.stdout ? `` : ` Nothing to print to ${outputFile}.`)
                : (flags.stdout ? ` Printing to STDOUT.` : ` Printing to ${outputFile}.`)
            );
            this.log(chalk.blue(message));
        }

        // Nothing to report
        if (Object.keys(attributes).length === 0) {
            return;
        }

        if (flags.stdout) {
            this.log(convertToFormat(attributes, flags.format));
        } else {
            await writeFile(outputFile, convertToFormat(attributes, flags.format));
        }
    }
}

GetDatasets.description = `extract dataset attributes from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, datasets.csv will be used.
`;

GetDatasets.args = [
    { name: 'Define-XML 2.0 file', required: true },
    { name: 'Output file' },
];

GetDatasets.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    extended: flags.boolean({ char: 'e', description: 'Show an extended list of attributes' }),
    filter: flags.string({ description: "Regex used to specify datasets to output. Use --filter='^(ae|cm|lb)$' to select AE, CM, and LB datasets." }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json', 'xlsx'], default: 'csv' }),
};

function getDatasetData (odm, flags) {
    let result = [];
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        Object.values(mdv.itemGroups).forEach(itemGroup => {
            const { name, domain, datasetName, repeating, isReferenceData, purpose, structure, datasetClass, commentOid } = itemGroup;
            if (flags.extended) {
                let comment;
                if (commentOid) {
                    comment = getDescription(mdv.comments[commentOid]);
                }
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
                    comment,
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

module.exports = GetDatasets;
