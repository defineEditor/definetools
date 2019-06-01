const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const convertToFormat = require('../utils/convertToFormat.js');
const flagChecks = require('../utils/flagChecks.js');

const writeFile = promisify(fs.writeFile);

class GetCodeLists extends Command {
    async run () {
        const { flags, argv } = this.parse(GetCodeLists);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : ('codelists.' + flags.format));

        // Read-in and parse XML
        let xmlData = await readXml(inputFile);
        let odm = parseDefine(xmlData);
        let attributes = getCodeListData(odm, flags);

        // Handle filter
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
                this.log(`Invalid filter value. ${error}`);
            }

            attributes = attributes.filter(item => regexFilter.test(item.name));
        }

        // put log message
        if (flags.verbose) {
            let numItems = Object.values(attributes).reduce((acc, items) => (acc + items.length), 0);
            let message = `Found ${numItems} items.` + (numItems === 0
                ? (flags.stdout ? `` : ` Nothing to print to ${outputFile}.`)
                : (flags.stdout ? ` Printing to STDOUT.` : ` Printing to ${outputFile}.`)
            );
            this.log(message);
        }

        // report
        if (attributes.length > 0) {
            if (flags.stdout) {
                this.log(convertToFormat(attributes, flags.format));
            } else {
                await writeFile(outputFile, convertToFormat(attributes, flags.format));
            }
        }
    }
}

GetCodeLists.description = `extract codelists metadata from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, codelists.csv will be used.
`;

GetCodeLists.args = [
    { name: 'Define-XML 2.0 file' },
    { name: 'Output file' },
];

GetCodeLists.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    extended: flags.boolean({ char: 'e', description: 'Show extended codelist data' }),
    filter: flags.string({ description: "Regex used to filter the output. Use --filter='^(arm|lbtest|aeout)$' to select ARM, LBTEST, and AEOUT codelists." }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json', 'xlsx'], default: 'csv' }),
};

function getCodeListData (odm, flags) {
    let codeListList = [];
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        codeListList = Object.values(mdv.codeLists).map((codeList) => {
            if (flags.extended) {
                let alias;
                if (codeList.alias) {
                    alias = codeList.alias.name;
                }
                return {
                    name: codeList.name,
                    dataType: codeList.dataType,
                    codeListType: codeList.codeListType,
                    sasFormatName: codeList.formatName,
                    alias,
                };
            } else {
                return {
                    name: codeList.name,
                    dataType: codeList.dataType,
                    codeListType: codeList.codeListType,
                };
            }
        });
    }
    return codeListList;
}

module.exports = GetCodeLists;
