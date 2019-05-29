const { Command, flags } = require('@oclif/command');
const parseDefine = require('../parsers/parseDefine.js');
const readXml = require('../utils/readXml.js');
const { getDecode } = require('../utils/defineStructureUtils.js');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const json2csv = require('json2csv');

const writeFile = promisify(fs.writeFile);

class GetCodes extends Command {
    async run () {
        const { flags, argv } = this.parse(GetCodes);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : ('codes.' + flags.format));

        // Read-in and parse XML
        let xmlData = await readXml(inputFile);
        let odm = parseDefine(xmlData);
        let attributes = getCodesData(odm, flags);

        // Handle flags
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

            Object.keys(attributes).forEach(codeListOid => {
                let codeListAttrs = attributes[codeListOid];
                let codeListName = codeListAttrs[0].codeList.toLowerCase();
                if (!regexFilter.test(codeListName)) {
                    delete attributes[codeListOid];
                }
            });
        }

        if (flags.verbose) {
            let numItems = Object.values(attributes).reduce((acc, items) => (acc + items.length), 0);
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
            Object.keys(attributes).forEach(codeListOid => {
                unitedAttrs = unitedAttrs.concat(attributes[codeListOid]);
            });
            if (flags.format === 'csv') {
                this.log(json2csv.parse(unitedAttrs));
            } else {
                this.log(JSON.stringify(unitedAttrs, null, 2));
            }

            return;
        }
        if (flags.separate) {
            await Promise.all(Object.keys(attributes).map(async (codeListOid) => {
                let codeListAttrs = attributes[codeListOid];
                let codeListName = codeListAttrs[0].codeList.toLowerCase();
                if (flags.format === 'csv') {
                    await writeFile(path.resolve(currentFolder, codeListName.replace(/[\s-/\\]/g, '_') + '.' + flags.format), json2csv.parse(codeListAttrs));
                } else {
                    await writeFile(path.resolve(currentFolder, codeListName.replace(/[\s-/\\]/g, '_') + '.' + flags.format), JSON.stringify(codeListAttrs, null, 2));
                }
            }));
        } else {
            // Unite into one array
            let unitedAttrs = [];
            Object.keys(attributes).forEach(codeListOid => {
                unitedAttrs = unitedAttrs.concat(attributes[codeListOid]);
            });
            if (flags.format === 'csv') {
                await writeFile(outputFile, json2csv.parse(unitedAttrs));
            } else {
                await writeFile(outputFile, JSON.stringify(unitedAttrs, null, 2));
            }
        }
    }
}

GetCodes.description = `extract variable attributes from a Define-XML file.
A file created using Define-XML 2.0 standard is expected as an input.
If the output file is not specified, codes.csv will be used.
`;

GetCodes.args = [
    { name: 'Define-XML 2.0 file', required: true },
    { name: 'Output file' },
];

GetCodes.flags = {
    separate: flags.boolean({ char: 's', description: 'Create a separate file for each codelist' }),
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    extended: flags.boolean({ char: 'e', description: 'Show an extended list of attributes' }),
    filter: flags.string({ description: "Regex used to filter the output. Use --filter='^(arm|lbtest|aeout)$' to select ARM, LBTEST, and AEOUT codelists." }),
    stdout: flags.boolean({ description: 'Print results to STDOUT', exclusive: ['separate'] }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json'], default: 'csv' }),
    hideExternal: flags.boolean({ description: 'Do not print external codelist information' }),
};

function getCodesData (odm, flags) {
    let result = {};
    if (odm && odm.study && odm.study.metaDataVersion) {
        const mdv = odm.study.metaDataVersion;
        Object.values(mdv.codeLists).map((codeList) => {
            let cdlAttributes = [];
            let codes;
            if (codeList.codeListType === 'enumerated') {
                codes = codeList.enumeratedItems;
            } else if (codeList.codeListType === 'decoded') {
                codes = codeList.codeListItems;
            }
            if (codes) {
                Object.values(codes).forEach(code => {
                    let decode;
                    if (codeList.codeListType === 'decoded') {
                        decode = getDecode(code);
                    }
                    if (flags.extended) {
                        let alias;
                        if (codeList.alias) {
                            alias = codeList.alias.name;
                        }
                        cdlAttributes.push({
                            codeList: codeList.name,
                            codedValue: code.codedValue,
                            decode,
                            rank: parseInt(code.rank),
                            alias,
                            extendedValue: code.extendedValue,
                        });
                    } else {
                        cdlAttributes.push({
                            codeList: codeList.name,
                            codedValue: code.codedValue,
                            decode,
                        });
                    }
                });
            }
            if (codeList.codeListType === 'external' && !flags.hideExternal) {
                cdlAttributes.push({ ...codeList.externalCodeList });
            }
            result[codeList.oid] = cdlAttributes;
        });
    }
    return result;
}

module.exports = GetCodes;
