# @commander-lol/tiny-captain

A very specific portfolio generator for [@tiny_captain](https://twitter.com/tiny_captain)

## Requirements

- Node.js version 10 or higher
- Some git client

## Usage

**This hasn't been published yet, so this is speculative**

1. Install the package `npm i -g @commander-lol/tiny-captain`
2. Generate a new project `portfolio init my/directory`
    - Answer the questions it asks
3. Create a git repo in your target folder `cd my/directory && git init`
    - Add a git remote as well, while you're at it `git remote add origin my/remote`
4. Generate your site `portfolio generate`
5. Commit everything to git `git add -A && git commit -m "I changed  a thing"`
6. Push everything to your remote `git push origin master`

If you're using github pages, you can configure it to deploy the `dist` folder on your master branch