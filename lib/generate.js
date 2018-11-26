const fs = require('fs-jetpack')
const Remarkable = require('remarkable')
const hbs = require('handlebars')
const { minify: minifier } = require('html-minifier')

const RE_EXTRA_PAGE = /^(\w)(.*)\.md$/
const RE_GALLERY_IMAGE = /^(\d+)_(.+)$/

const markdown = new Remarkable()

function minify(html) {
    return minifier(html, {
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
        collapseBooleanAttributes: true,
    })
}

function loadTemplate(path) {
    const content = fs.read(path, 'utf8')
    return hbs.compile(content)
}

function copyResource(descriptor) {
    fs.copy(descriptor.input, descriptor.output)
}

function renderExtraPage(descriptor) {
    fs.file(descriptor.output, { content: descriptor.html })
}

module.exports = async function generateSite(directory) {
    const config = require(directory.path('site.json'))
    const outputDir = directory.dir(config.output, { empty: true })
    const templates = {
        layout: loadTemplate(directory.path(config.template_layout)),
        header: loadTemplate(directory.path(config.template_header)),
        footer: loadTemplate(directory.path(config.template_footer)),
        navigation: loadTemplate(directory.path(config.template_navigation)),
        content: loadTemplate(directory.path(config.template_content)),
        gallery: loadTemplate(directory.path(config.template_gallery)),
    }

    const extraPagesDir = directory.dir(config.extra_pages)
    const galleryDir = directory.dir(config.gallery_path)

    const extraPages = extraPagesDir.list().map(page => {
        const [_, first, rest] = RE_EXTRA_PAGE.exec(page)
        const contents = extraPagesDir.read(page, 'utf8')
        const htmlFileName = page.replace(/\.md$/, '.html')
        return {
            output: outputDir.path(htmlFileName),
            href: `/${ htmlFileName }`,
            name: `${ first.toUpperCase() }${ rest }`,
            raw: contents,
            html: markdown.render(contents)
        }
    })

    const galleryImages = galleryDir.list().map(image => {
        const matches = RE_GALLERY_IMAGE.exec(image)
        if (matches == null) {
            return false
        }
        const [_, order, name] = matches
        return {
            input: galleryDir.path(image),
            output: outputDir.path('resources', name),
            src: `/resources/${ name }`,
            order: parseInt(order, 10),
            name,
        }
    })

    const navigationHtml = templates.navigation({
        ...config,
        pages: extraPages,
    })

    const headerHtml = templates.header(config)
    const footerHtml = templates.footer(config)

    const galleryHtml = templates.gallery({
        ...config,
        images: galleryImages,
    })

    const generate = content => templates.layout({
        ...config,
        $_page_header: headerHtml,
        $_page_footer: footerHtml,
        $_page_navigation: navigationHtml,
        $_page_content: content,
    })

    const indexHtml = generate(galleryHtml)

    outputDir.file('index.html', { content: minify(indexHtml) })

    copyResource({ input: directory.path(config.header_image), output: outputDir.path('resources', 'header.png') })
    copyResource({ input: directory.path(config.favicon), output: outputDir.path('resources', 'favicon.png') })

    const sorter = (a, b) => {
        if (a.order > b.order) {
            return 1
        }
        if (b.order > a.order) {
            return -1
        }
        return 0
    }
    galleryImages.sort(sorter).map(copyResource)
    extraPages.map(ep => ({ ...ep, html: minify(generate(ep.html)) })).map(renderExtraPage)
}
