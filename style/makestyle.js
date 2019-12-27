'use strict';

const yaml = require('js-yaml');
const fs = require('fs');

if (process.argv[2]) {
    try {
        let doc = yaml.safeLoad(fs.readFileSync(process.argv[2], 'utf8'));
        let changed = false;
        if (process.env.PGPORT) {
            doc['_parts']['osm2pgsql']['port'] = process.env.PGPORT;
            changed = true;
        }
        if (process.env.PGHOST) {
            doc['_parts']['osm2pgsql']['host'] = process.env.PGHOST;
            changed = true;
        }
        if (process.env.PGDATABASE) {
            doc['_parts']['osm2pgsql']['dbname'] = process.env.PGDATABASE;
            changed = true;
        }
        if (process.env.PGUSER) {
            doc['_parts']['osm2pgsql']['user'] = process.env.PGUSER;
            changed = true;
        }
        if (process.env.PGPASSWORD) {
            doc['_parts']['osm2pgsql']['password'] = process.env.PGPASSWORD;
            changed = true;
        }
        if (changed) {
            fs.writeFileSync(`${process.argv[2]}`, yaml.safeDump(doc));
            console.log('DB connection changed.');
        }
    } catch (e) {
        console.log(e);
    }
}