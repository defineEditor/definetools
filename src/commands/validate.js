const { Command, flags } = require('@oclif/command');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const chalk = require('chalk');
const libxmljs = require('libxmljs');
const json2csv = require('json2csv');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

class Validate extends Command {
    async run () {
        const { flags, argv } = this.parse(Validate);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : ('validation.' + flags.format));

        let result = await validate(inputFile, flags, this.error);

        // If there were no erros, exit the validation
        if (flags.verbose) {
            if (result.valid) {
                this.log(chalk.green('Schema validation passed.'));
            } else {
                this.log(chalk.yellow(`Issues found during the validation. Number of issues: ${result.details.length}`));
            }
        }
        if (result.valid) {
            return;
        }

        if (flags.stdout) {
            if (flags.format === 'csv') {
                this.log(json2csv.parse(result.details));
            } else {
                this.log(JSON.stringify(result.details, null, 2));
            }
        } else {
            if (flags.format === 'csv') {
                await writeFile(outputFile, json2csv.parse(result.details));
            } else {
                await writeFile(outputFile, JSON.stringify(result.details, null, 2));
            }
        }
    }
}

Validate.description = `Validate Define-XML file against XSD schema.
A file created using Define-XML 2.0 or 2.1 standard is expected as an input.
If the output file is not specified, validation.csv will be used.
`;

Validate.args = [
    { name: 'Define-XML file', required: true },
    { name: 'Output file' },
];

Validate.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    extended: flags.boolean({ char: 'e', description: 'Show an extended list of attributes' }),
    defineVersion: flags.string({ description: 'Version of the Define-XML schema used for validation.', options: ['2.0.0', '2.1.0'] }),
    format: flags.string({ char: 'f', description: 'Output format', options: ['csv', 'json'], default: 'csv' }),
    encoding: flags.string({ description: 'Input file encoding.', default: 'utf8' }),
};

async function validate (pathToFile, flags, onError) {
    let defineData = await readFile(pathToFile, flags.encoding);
    // Get the version of Define-XML
    let defineParsed = libxmljs.parseXml(defineData);
    let defineVersion;
    if (flags.defineVersion) {
        defineVersion = flags.defineVersion;
    } else {
        defineVersion = defineData.match(/def:DefineVersion\s*=\s*"(.*?)"/)[0].replace(/.*"(.*)"/, '$1') || '2.0.0';
    }

    let pathToSchema;
    if (defineVersion === '2.1.0') {
        pathToSchema = path.join(path.dirname(require.main.filename), '../static/schemas/2.1/cdisc-arm-1.0/arm1-0-0.xsd');
    } else if (defineVersion === '2.0.0') {
        pathToSchema = path.join(path.dirname(require.main.filename), '../static/schemas/2.0/cdisc-arm-1.0/arm1-0-0.xsd');
    } else {
        onError(new Error(`Unsupported version of Define-XML used: ${defineVersion}`));
    }
    let schemaData = await readFile(pathToSchema);
    let schemaParsed = libxmljs.parseXml(schemaData);

    let details;
    let valid;
    // Change path to the schemas folder
    const cwd = process.cwd();
    try {
        process.chdir(path.dirname(pathToSchema));

        valid = defineParsed.validate(schemaParsed);
        details = defineParsed.validationErrors;
    } catch (e) {
        throw e;
    } finally {
        process.chdir(cwd);
    }

    // Remove message about namespace
    details = details.filter(detail => (!(typeof detail.file === 'string' && detail.file.endsWith('.xsd'))));
    if (flags.extended) {
        let updatedDetails = [];
        details.forEach(detail => {
            let message = detail.toString();
            // Remove extra new line at the end
            message = message.replace(/[\r\n]*$/, '');
            updatedDetails.push({ message, ...detail });
        });
        return { valid, details: updatedDetails };
    } else {
        let updatedDetails = [];
        details.forEach(detail => {
            let message = detail.toString();
            message = message.replace(/[\r\n]*$/, '');
            updatedDetails.push({ message });
        });
        return { valid, details: updatedDetails };
    }
}

module.exports = Validate;
