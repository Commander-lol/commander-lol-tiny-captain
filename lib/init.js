const inquirer = require('inquirer')
const responseCodes = require('./errors/codes')
const clrs = require('colors/safe')
const fs = require('fs-jetpack')
const hbs = require('handlebars')

async function processDir(directory) {
    const files = directory.list()
    if (files.length === 0) {
        // Dir is empty, we're good to continue
        return null
    }

    console.log(clrs.red.bold('The chosen directory is not empty'))
    console.log(clrs.red.bold(`Continuing will delete everything inside "${ directory.cwd() }"`))

    const result = await inquirer.prompt({
        type: 'confirm',
        name: 'target_not_empty',
        message: 'Do you want to continue?',
        default: false,
    })

    if (result.target_not_empty === false) {
        return responseCodes.TARGET_IS_NOT_EMPTY
    }

    return null
}

function getOpts() {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'site_name',
            message: 'What is the name of your site? This will appear in the browser tab',
            validate(value) {
                return value.trim().length > 0 ? true : 'You must provide a site name'
            },
        },
        {
            type: 'input',
            name: 'site_desc',
            message: 'Write a short description of your site. This will be displayed at the top of each page'
        },
        {
            type: 'input',
            name: 'site_author',
            message: 'Who should copyright be attributed to? This is usually your name'
        }
    ])
}

async function recursivelyCopyTemplates(target, sources, options) {
    for (const file of sources) {
        if (file.type !== 'file') {
            continue
        }
        const content = fs.read(file.absolutePath, 'utf8')
        target.file(file.relativePath, { content: hbs.compile(content)(options) })
    }

    return responseCodes.SUCCESS
}

function flatten(root) {
    if (root.children) {
        return [root].concat(...root.children.map(child => flatten(child)))
    } else {
        return [root]
    }
}

module.exports = async function initSite(directory) {
    const stat = directory.exists('.')
    if (stat !== false) {
        switch (stat) {
            case "file": {
                console.log("Chosen directory is a file. Can not continue.")
                return responseCodes.TARGET_IS_FILE
            }
            case "dir": {
                const result = await processDir(directory)
                if (result !== null) {
                    return result
                }
                break;
            }
            default: {
                console.log("Chosen directory is neither a directory nor a file. Can not continue.")
                return responseCodes.TARGET_IS_OTHER
            }
        }
    }

    directory.dir('.', { empty: true })

    const opts = await getOpts()
    const templateDir = fs.cwd(fs.path(__dirname, '..', 'templates', 'project'))
    const templates = flatten(templateDir.inspectTree('.', { relativePath: true }))
        .filter(item => item.type === 'file')
        .map(file => ({ ...file, absolutePath: templateDir.path(file.relativePath) }))

    return recursivelyCopyTemplates(directory, templates, { ...opts, year: (new Date()).getUTCFullYear() })
}
