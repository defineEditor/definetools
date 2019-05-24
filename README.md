definetools
===========
CLI tools for Define-XML 2.0. For interactive review and editing of Define-XML files see [Visual Define-XML Editor](http://defineeditor.com).

# Installation
To use definetools, you need to have [Node.JS](https://nodejs.org/en/download/) installed. Once installed, run
```
npm install -g definetools
```
# Usage
```
definetools [command] [options] [arguments]
```
# Commands
## getvars
Extract variable attributes from a Define-XML file. See **definetools getvars --help** for more details.
```
definetools getvars [options] xmlFile [output file]
```
#### Options
```
  -e, --extended   Show an extended list of attributes
  -f, --format=csv|json  [default: csv] Output format
  -s, --separate   Create a separate CSV file for each dataset
  -v, --verbose    Show additional information during the execution
  --filter=filter  Regex used to specify datasets to output. Use --filter='^(ae|cm|lb)$' to select AE, CM, and LB datasets.
  --stdout         Print results to STDOUT
```
## getdatasets
Extract daaset attributes from a Define-XML file. See **definetools getdatasets --help** for more details.
```
definetools getdatasets [options] xmlFile [output file]
```
#### Options
```
  -e, --extended   Show an extended list of attributes
  -f, --format=csv|json  [default: csv] Output format
  -v, --verbose    Show additional information during the execution
  --filter=filter  Regex used to specify datasets to output. Use --filter='^(ae|cm|lb)$' to select AE, CM, and LB datasets.
  --stdout         Print results to STDOUT
```
### validate
Validate Define-XML file against XSD schema.
```
definetools validate [options] xmlFile [output file]
```
#### Options
```
  -e, --extended  Show an extended list of attributes
  -f, --format=csv|json  [default: csv] Output format
  -v, --verbose   Show additional information during the execution
  --stdout        Print results to STDOUT
  --v21           Use Define-XML 2.1 schema validation
```

# Examples
Print an extended list of variable attributes into vars.csv.
```
definetools getvars -e define.xml
```
Print basic dataset attributes to STDOUT
```
definetools getdatasets --stdout define.xml
```
Validate against XSD schema and save to issues.txt in JSON format.
```
definetools validate define.xml issues.txt --format=json
```