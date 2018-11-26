const crypto = require('crypto')
const fs = require('fs-jetpack')

exports.hashPath = function createFileHash(path, algorithm = 'sha256', as = 'hex') {
    const checksum = crypto.createHash(algorithm)
    const stream = fs.createReadStream(path)
    const promise = new Promise((resolve, reject) => {
        stream.once('error', reject)
        stream.on('end', () => resolve(checksum.digest(as)))
    })

    stream.on('data', chunk => checksum.update(chunk))

    return promise
}
