const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const json2csv = require('json2csv');

const writeFile = promisify(fs.writeFile);

class getCodeLists extends Command {
    async run () {
        const { flags, argv } = this.parse(getCodeLists);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : 'codelists.csv');

        // Read-in and parse XML
        let xmlData = await readXml(inputFile);
        let odm = parseDefine(xmlData);
        let attributes = fetchData(odm, flags);

        // Handle filter
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
            let message = `Found ${attributes.length} codelists.` + (attributes.length === 0
                ? (flags.stdout ? `` : ` ${outputFile} was not updated.`)
                : (flags.stdout ? ` Here they are:` : ` The codelists were written to ${outputFile}`)
            );
            this.log(message);
        }

        // report
        if (attributes.length > 0) {
            if (flags.stdout) {
                this.log(json2csv.parse(attributes));
            } else {
                await writeFile(outputFile, json2csv.parse(attributes));
            }
        }
    }
}

getCodeLists.description = `Extract variable attributes from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, attrs.csv will be used.
`;

getCodeLists.args = [
    { name: 'Define-XML 2.0 file' },
    { name: 'Output file' },
];

getCodeLists.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    extended: flags.boolean({ char: 'e', description: 'Show extended codelist attributes' }),
    filter: flags.string({ description: "Regex used to specify datasets to output. Use --filter='^(ae|cm|lb)$' to select AE, CM, and LB datasets." }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
};

function fetchData (odm, flags) {
    let codeListList = [];
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        codeListList = Object.values(mdv.codeLists).map((codeList) => {
            if (flags.extended) {
                return {
                    name: codeList.name,
                    dataType: codeList.dataType,
                    codeListType: codeList.codeListType,
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

module.exports = getCodeLists;
