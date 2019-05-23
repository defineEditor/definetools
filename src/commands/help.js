const {Command} = require('@oclif/command')

class HelpCommand extends Command {
  async run() {
    const {flags} = this.parse(HelpCommand)
    const name = flags.name || 'world'
      this.log(`
      getattrs - extract dataset attributes
      `)
  }
}

HelpCommand.description = `Help`

module.exports = HelpCommand
