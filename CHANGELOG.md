### v0.2.2
* Added XLSX output format (it cannot be used together with --STDOUT)
* Added Name of the External codelists in the **getcodes** output
* Added **onlyExternal** option to the **getcodes** command
* Fixed a bug when the separate option could not be used for the getcodes command with Define-XML files containing external codelists
### v0.2.1
* Fixed a bug when the filter option could not be used for the getcodes command with Define-XML files containing external codelists
### v0.2.0
* Added getcodelists, getcodes commands
* Showing additional attributes (e.g., comment, method, etc.) to getvars, getdatasets
* Autodetecting Define-XML version for the validate command
* It is now possible to output data in JSON using the --format option
* Added "Did you mean" oclif plugin
* Adding encoding option for the validate command
* Other minor changes
