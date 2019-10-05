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

class ClGetItemGroup extends Command {
    async run () {
        const { flags, argv } = this.parse(ClGetItemGroup);

        // Paths
        const currentFolder = process.cwd();
        let datasetName = argv[0];
        let outputFile;
        if (flags.list) {
            outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : (flags.product + '-datasets.' + flags.format));
        } else if (flags.all) {
            outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : (flags.product + '-all.' + flags.format));
        } else {
            outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : (flags.product + '-' + datasetName + '.' + flags.format));
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

        if (flags.list) {
            output = await cl.getItemGroups(flags.product, { short: true, format: flags.format });
        } else if (flags.all) {
            output = await cl.getItemGroups(flags.product, { format: flags.format });
        } else {
            let rawDataset = await cl.getItemGroup(datasetName, flags.product);
            output = rawDataset.getFormattedItems(flags.format);
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

ClGetItemGroup.description = `get a dataset/domain/dataStructure for a specific product from the CDISC API Library.
If the output file is not specified, [product]-[dataset].csv will be used.
`;

ClGetItemGroup.args = [
    { name: 'Dataset' },
    { name: 'Output file' },
];

ClGetItemGroup.flags = {
    product: flags.string({ char: 'p', required: true, description: 'Product name. For example: sdtmig-3-3, adam-1-1, cdashig-2-0' }),
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    list: flags.boolean({ char: 'l', description: 'List all datasets for that product' }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json'], default: 'csv' }),
    all: flags.boolean({ char: 'a', description: 'Get all datasets' }),
};

module.exports = ClGetItemGroup;
