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

class ListClProducts extends Command {
    async run () {
        const { flags, argv } = this.parse(ListClProducts);

        // Paths
        const currentFolder = process.cwd();
        let outputFile = path.resolve(currentFolder, argv.length > 0 ? argv[0] : ('products.' + flags.format));

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

        if (flags.long) {
            output = await cl.getProductDetails({ type: flags.long ? 'long' : 'short', format: flags.format });
        } else {
            let products = await cl.getProductList();
            output = products.join('\n');
        }

        if (flags.verbose) {
            let message = chalk.blue('Traffic used: ' + chalk.bold(cl.getTrafficStats()));
            this.log(chalk.blue(message));
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

ListClProducts.description = `get a list of Products from the CDISC API Library.
If the output file is not specified, products.csv will be used.
`;

ListClProducts.args = [
    { name: 'Output file' },
];

ListClProducts.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json'], default: 'csv' }),
    long: flags.boolean({ char: 'l', description: 'Use long listing output' }),
};

module.exports = ListClProducts;
