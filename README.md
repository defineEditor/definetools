definetools
===========
CLI tools for Define-XML 2.0. For interactive review and editing of Define-XML files see [Visual Define-XML Editor](https://defineeditor.com).

# Installation
To use definetools, you need to have [https://nodejs.org/en/download/](Node.JS) installed. Once installed, run
```
npm install -g definetools
```
# Usage
```
definetools [command] [flags] [arguments]
```
# Commands
## getattrs
Extract variable attributes from a Define-XML file. See **definetools getattrs --help** for more details.
```
definetools getattrs [flags] xmlFile [output file]
```
# Examples
Extract an extended list of attributes into attrs.csv file
```
definetools getattrs -e define.xml
```
Print basic attributes to STDOUT
```
definetools getattrs --stdout define.xml
```
