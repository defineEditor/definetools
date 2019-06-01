function flagChecks (flags, onError) {
    if (flags.stdout === true && flags.format === 'xlsx') {
        onError('--format=xlsx cannot also be provided when using --stdout=');
    }
}

module.exports = flagChecks;
