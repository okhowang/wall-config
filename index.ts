import {join, relative, sep} from "path";
import {readFileSync, writeFileSync} from "fs";
import {render} from "ejs";
import {sync as rimraf} from "rimraf";
import {sync as mkdirp} from "mkdirp";
import {walkSync} from "walk";
import config from "./config";
import * as _ from "lodash";
import ejsLint = require("ejs-lint");

const dist = `${__dirname}${sep}dist`;
const src = `${__dirname}${sep}template`;

rimraf(dist);
walkSync(src, {
    listeners: {
        file: (base, stat, next) => {
            if (!stat.name.endsWith(".ejs")) return next();
            const dir = relative(src, base);
            mkdirp(join(dist, dir));
            const srcFile = join(base, stat.name);
            const template = readFileSync(srcFile).toString();
            const error = ejsLint(template);
            if (error) throw error;
            const destFile = join(dist, dir, stat.name.replace(/\.ejs$/, ''));
            const text = render(template, {config, _, btoa: v => Buffer.from(v).toString('base64')});
            writeFileSync(destFile, text);
            console.log(`done ${srcFile}`);
            next();
        },
        errors: (base, stats, next) => {
            console.log(stats.map(stat => `error when process ${join(base, stat.name)}: ${stat.error}`).join("\n"));
            next();
        }
    }
});
