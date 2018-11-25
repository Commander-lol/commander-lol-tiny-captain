#!/usr/bin/env node
const neodoc = require('neodoc')
const fs = require('fs-jetpack')

const USAGE = `
Portfolio Generator v1.0.0

It's a damn sight better than Wix

Usage:
    portfolio init [<PATH>]
    portfolio generate [<PATH>]
    portfolio [-h|--help]

Options:
    -h, --help    Show this help text
`

const args = neodoc.run(USAGE)

let prog = null
if (args.init) {
    prog = require('../lib/init')
} else if (args.generate) {
    prog = require('../lib/generate')
} else {
    prog = async () => console.log(USAGE)
}

prog(fs.cwd(args['<PATH>'] || '.'))
    .then(code => process.exit(code || 0))
    .catch(err => console.error(err) || process.exit(100))