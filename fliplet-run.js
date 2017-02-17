const _ = require('lodash');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const grunt = require('grunt');
const child_process = require('child_process');
const exec = child_process.exec;
var sass; // optionally required if theme

const gruntFile = require('./lib/gruntfile');
grunt.task.init = function() {};
gruntFile(grunt);

const folderPath = process.cwd();
const widgetPackagePath = path.join(folderPath, 'widget.json');
const themePackagePath = path.join(folderPath, 'theme.json');
const template = require('./lib/template');

var isTheme;

const assets = require(path.join(__dirname, 'lib', 'assets'));

var app = express();

var package;
var widgetInstanceData;

const widgetUUID = uuid();

const scriptTagsRegExp = /<script.+src=".+".+>/;
const scriptTagsError = [
  '<h2>Script tags to external files are not allowed</h2>',
  '<p>Script tags to external files cannot be placed in your templates. If you need to use reference some assets, ',
  'please reference them the "assets" array in the widget.json file.</p>'
].join('');

const idTagsRegExp = /<.+ id=".+".+>/;
const idTagsError = [
  '<h2>ID attributes are not allowed</h2>',
  '<p>HTML tags cannot contain the "id" attribute, because it might conflict if your widget ',
  'gets added twice to a page. Please consider using classes instead.</p>'
].join('');

try {
  package = require(widgetPackagePath);
  fs.statSync(widgetPackagePath);
} catch (e) {
  try {
    package = require(themePackagePath);
    fs.statSync(themePackagePath);
    isTheme = true;

    package.templates = _.filter(fs.readdirSync(folderPath), (file) => {
      return /\.html$/.test(file);
    });

    if (!package.templates.length) {
      log('Your theme has no templates.');
      process.exit();
    }

    const vars = [];
    (package.settings.configuration || []).forEach(function (section) {
      (section.variables || []).forEach(function (variable) {
        vars.push(`$${variable.name}: ${variable.default};`);
      });
    });

    package.scssConfig = vars.join("\r\n");

  } catch (e) {
    log('The definition file has not been found (or the JSON syntax is invalid).');
    log('Are you sure you are running this command from a Fliplet component folder?');
    process.exit();
  }
}

// Load packages for themes-only
if (isTheme) {
  sass = require('node-sass');
}

log('');
log('Please note: if you make any change to the package dependencies, the server needs to be restarted.')
log('Starting up package development server for', package.name, '(' + package.package + ')...');
log('');

// --------------------------------------------------------------------------
// Server configuration

app.use(express.static(folderPath, {
  maxage: 0,
  etag: false
}));
app.use(bodyParser.json({ limit: '10MB' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10MB' }));

// --------------------------------------------------------------------------
// AWS configuration

const runWidgetHtml = template.engine.compile(fs.readFileSync(path.join(__dirname, 'assets', `run-${isTheme ? 'theme' : 'widget'}.html`), 'utf8'));
app.get('/', function (req, res) {
  res.send(runWidgetHtml(package));
});

app.get('/build', function (req, res) {
  fs.readFile('./build.html', 'utf8', function (err, html) {
    if (err || typeof html !== 'string') {
      return res.send('The build.html file was not found');
    }

    if (html.match(scriptTagsRegExp)) {
      return res.send(scriptTagsError);
    }

    if (html.match(idTagsRegExp)) {
      return res.send(idTagsError);
    }

    template.compile({
      widgets: [{
        id: Date.now(),
        uuid: widgetUUID,
        html: html,
        dependencies: package.build.dependencies,
        assets: package.build.assets,
        data: widgetInstanceData
      }]
    }).then(function (html) {
      res.send(html);
    }, function (err) {
      res.send(err);
    });
  });
});

app.get('/interface', function (req, res) {
  fs.readFile('./interface.html', 'utf8', function (err, html) {
    if (!html) {
      return res.send('The interface.html file was not found');
    }

    if (html.match(scriptTagsRegExp)) {
      return res.send(scriptTagsError);
    }

    template.compile({
      interface: true,
      widgets: [{
        id: Date.now(),
        uuid: widgetUUID,
        html: html,
        dependencies: package.interface.dependencies,
        assets: package.interface.assets,
        data: widgetInstanceData
      }]
    }).then(function (html) {
      res.send(html);
    }, function (err) {
      res.send(err);
    });
  });
});

app.post('/save-widget-data', function (req, res) {
  widgetInstanceData = _.assign({}, widgetInstanceData, req.body);
  res.status(200).send();
});

app.get('/templates/:template', function (req, res) {
  const tpl = fs.readFileSync(path.join(folderPath, req.params.template), 'utf8');

  const assets = [`__scss.css?_=${Date.now()}`].concat(package.assets);

  template.compile({
    widgets: [{
      id: Date.now(),
      html: tpl,
      dependencies: package.dependencies,
      assets: assets.map((a) => {
        return `/${a.replace(/^\//, '')}`;
      })
    }]
  }).then(function (html) {
    res.send(html);
  }, function (err) {
    res.send(err);
  });
});

app.get('/__scss.css', function (req, res) {
  const files = _.filter(package.assets, (a) => { return /\.scss$/.test(a) });

  Promise.all(files.map(function (file) {
    return new Promise(function (resolve, reject) {
      var fileData = fs.readFileSync(path.join(folderPath, file), 'utf8');

      var dir = file.split('/');
      dir.pop();
      dir = path.join(folderPath, dir.join('/'));

      sass.render({
        data: `${package.scssConfig}\r\n${fileData}`,
        outputStyle: 'expanded',
        sourceMap: false,
        includePaths: [dir]
      }, function onSassCompiled(sassError, result) {
        if (sassError) {
          return reject(sassError);
        }

        resolve(`/* ${package.package}:${file} */\r\n${result.css.toString()}`);
      });
    });
  })).then(function (results) {
    res.type('text/css');
    res.send(results.join("\r\n"));
  }).catch(function (err) {
    console.error(err);
    res.send(`/* Error compiling scss: ${err} */`);
  });
})

// --------------------------------------------------------------------------
// Startup configuration

const host = 'http://localhost:3000';

app.listen(3000, function () {
  log('[' + package.name + '] development server is up on', host);

  if (process.argv.length > 2) {
    return;
  }

  grunt.tasks(['default']);

  setTimeout(function () {
    try {
      exec(['open', host].join(' '));
    } catch (e) {
      // nothing really
    }
  }, 500);
});

function log() {
  console.log.apply(this, arguments);
}

function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}