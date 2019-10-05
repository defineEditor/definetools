const { Command, flags } = require('@oclif/command');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { CdiscLibrary } = require('cla-wrapper');
const { promisify } = require('util');
const chalk = require('chalk');
const flagChecks = require('../utils/flagChecks.js');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

class ClGetCodelist extends Command {
    async run () {
        const { flags, argv } = this.parse(ClGetCodelist);

        // Paths
        const currentFolder = process.cwd();
        let codelistId = argv[0];
        let outputFile;
        if (flags.list) {
            outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : (flags.product + '-codelists.' + flags.format));
        } else {
            outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : (flags.product + '-' + codelistId + '.' + flags.format));
        }

        // Handle flags
        flagChecks(flags, this.error);
        let output;
        // Get credentials
        let config;
        try {
            let configData = await readFile(path.join(os.homedir(), '.definetools'), 'utf8');
            config = JSON.parse(configData);
        } catch (error) {
            console.log(error);
            return;
        }

        if (!(config && config.cdiscLibrary)) {
            this.error('CDISC credentials must be provided in a .definetools file located in a home folder. See github page for more details.');
            return;
        }
        let cl = new CdiscLibrary({ username: config.cdiscLibrary.username, password: config.cdiscLibrary.password });

        // Get the terminology high-level object
        let ct;
        let pcs = await cl.getProductClasses();
        let ctId = pcs.terminology.productGroups.packages.getProductNameByAlias(flags.product);
        if (ctId) {
            ct = pcs.terminology.productGroups.packages.products[ctId];
        } else {
            this.error(`CT ${flags.product} could not be found`);
            return;
        }

        if (!ct) {
            this.error(`Codelist ${flags.codelistId} could not be found`);
        }

        if (flags.list) {
            output = await ct.getCodeListList({ short: true, format: flags.format });
        } else {
            output = await ct.getCodeList(codelistId, { format: flags.format });
        }

        if (flags.verbose) {
            let message = chalk.blue('Traffic used: ' + chalk.bold(cl.getTrafficStats()));
            this.log(message);
        }

        // Nothing to report
        if (output === undefined) {
            return;
        }

        if (flags.stdout) {
            this.log(output);
        } else {
            await writeFile(outputFile, output);
        }
    }
}

ClGetCodelist.description = `get a codelist for a specific product from the CDISC Library.
If the output file is not specified, [codelistId].csv will be used.
`;

ClGetCodelist.args = [
    { name: 'CodelistID' },
    { name: 'Output file' },
];

ClGetCodelist.flags = {
    product: flags.string({ char: 'p', required: true, description: 'Terminology name and version. For example: adamct-2014-09-26, sdtmct20180330' }),
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    list: flags.boolean({ char: 'l', description: 'List all codelists for that product' }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json'], default: 'csv' }),
};

module.exports = ClGetCodelist;
