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
definetools [command] [flags] [arguments]
```
# Commands
## getvars
Extract variable attributes from a Define-XML file. See **definetools getvars --help** for more details.
```
definetools getvars [flags] xmlFile [output file]
```
## getdatasets
Extract daaset attributes from a Define-XML file. See **definetools getdatasets --help** for more details.
```
definetools getdatasets [flags] xmlFile [output file]
```
# Examples
Extract an extended list of attributes into attrs.csv file
```
definetools getvars -e define.xml
```
Print basic attributes to STDOUT
```
definetools getvars --stdout define.xml
```
