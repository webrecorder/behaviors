const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { markdown } = require('esdoc-publish-html-plugin/out/src/Builder/util');

const behaviorRelRootDir = './behaviors';
const functionsDocsRoot = 'docs/function/index.html';
const docFunNameSubstr = 'function-';

class WrBehaviorsPlugin {
  constructor() {
    /**
     * @type {Map<string, Object>}
     */
    this.behaviorsUnknownTags = new Map();
  }

  _isBehaviorFunction(doc) {
    return doc.kind === 'function' && doc.memberof.includes(behaviorRelRootDir);
  }

  _handleBehaviorUnknownTag(doc) {
    let i = 0;
    let length = doc.unknown.length;
    for (; i < length; ++i) {
      if (doc.unknown[i].tagName === '@steps') {
        this._addBehaviorUnknownTagValue(doc, 'Steps', doc.unknown[i].tagValue);
      }
    }
  }

  _addBehaviorUnknownTagValue(doc, tag, value) {
    let obj = this.behaviorsUnknownTags.get(doc.name);
    if (obj == null) {
      obj = {};
      this.behaviorsUnknownTags.set(doc.name, obj);
    }
    obj[tag] = value;
  }

  onHandleConfig(ev) {
    this._config = ev.data.config;
    this._option = ev.data.option || {};
    if (!('enable' in this._option)) this._option.enable = true;

    if (!this._option.enable) return;

    const srcPath = path.resolve(__dirname, 'externs.js');
    const outPath = path.resolve(this._config.source, '.externs.js');

    fs.copySync(srcPath, outPath);
  }

  onHandleDocs(ev) {
    const outPath = path.resolve(this._config.source, '.externs.js');
    fs.removeSync(outPath);
    const name =
      path.basename(path.resolve(this._config.source)) + '/.externs.js';
    let externsDocIndex;
    let i = 0;
    let length = ev.data.docs.length;
    let doc;
    for (; i < length; ++i) {
      doc = ev.data.docs[i];
      if (doc.unknown && this._isBehaviorFunction(doc)) {
        this._handleBehaviorUnknownTag(doc);
      }

      if (doc.kind === 'external' && doc.memberof === name) {
        doc.builtinExternal = true;
      } else if (doc.kind === 'file' && doc.name === name) {
        externsDocIndex = i;
      }
    }
    ev.data.docs.splice(externsDocIndex, 1);

    // return ev.data.docs;
  }

  onHandleContent(ev) {
    if (ev.data.fileName.includes(functionsDocsRoot)) {
      const $ = cheerio.load(ev.data.content);
      const stepsPlugin = this;
      $('div.detail').each(function() {
        const details = $(this);
        const h3 = details.find('h3[data-ice]');
        if (h3 == null) return;
        const id = h3.attr('id');
        if (id == null) return;
        const docFunName = id.substring(
          id.indexOf(docFunNameSubstr) + docFunNameSubstr.length
        );
        if (stepsPlugin.behaviorsUnknownTags.has(docFunName)) {
          const description = $('div[data-ice="description"]', details);
          const extraDocs = stepsPlugin.behaviorsUnknownTags.get(docFunName);
          let name;
          for (name in extraDocs) {
            description.append(`<b>${name}:</b>`);
            description.append(markdown(extraDocs[name]));
          }
        }
      });
      ev.data.content = $.html();
    }
  }
}

module.exports = new WrBehaviorsPlugin();
