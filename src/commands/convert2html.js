const { Command, flags } = require('@oclif/command');
const { xsltProcess, xmlParse } = require('xslt-processor');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

class Convert2html extends Command {
    async run () {
        const { flags, argv } = this.parse(Convert2html);

        // Paths
        const currentFolder = process.cwd();
        let inputFile = path.resolve(currentFolder, argv[0]);
        let outputFile = path.resolve(currentFolder, argv.length > 1 ? argv[1] : (path.basename(argv[0], 'xml') + '.html'));

        let result = await convert(inputFile, flags, this.error);

        // If there were no erros, exit the validation
        if (flags.verbose) {
            this.log('File was converted to HTML.');
        }

        if (flags.stdout) {
            this.log(result);
        } else {
            await writeFile(outputFile, result);
        }
    }
}

Convert2html.description = `Convert Define-XML to HTML using a stylesheet.
A file created using Define-XML 2.0 or 2.1 standard is expected as an input.
`;

Convert2html.args = [
    { name: 'Define-XML file', required: true },
    { name: 'Output file' },
];

Convert2html.flags = {
    verbose: flags.boolean({ char: 'v', description: 'Show additional information during the execution' }),
    stdout: flags.boolean({ description: 'Print results to STDOUT' }),
    stylesheet: flags.string({ char: 's', description: 'Path to a custom stylesheet' }),
    encoding: flags.string({ description: 'Input file encoding.', default: 'utf8' }),
};

async function convert (pathToFile, flags, onError) {
    let defineData = await readFile(pathToFile, flags.encoding);
    // Get the version of Define-XML
    let defineVersion;
    if (flags.defineVersion) {
        defineVersion = flags.defineVersion;
    } else {
        defineVersion = defineData.match(/def:DefineVersion\s*=\s*"(.*?)"/)[0].replace(/.*"(.*)"/, '$1') || '2.0.0';
    }

    let pathToStylesheet;
    if (defineVersion === '2.1.0') {
        pathToStylesheet = path.join(path.dirname(require.main.filename), '../static/stylesheets/2.1/define2-1.xsl');
    } else if (defineVersion === '2.0.0') {
        pathToStylesheet = path.join(path.dirname(require.main.filename), '../static/stylesheets/2.0/define2-0.xsl');
    } else {
        onError(new Error(`Unsupported version of Define-XML used: ${defineVersion}`));
    }
    let stylesheetData = await readFile(pathToStylesheet, 'utf8');

    return xsltProcess(xmlParse(defineData), xmlParse(stylesheetData));
}

module.exports = Convert2html;
