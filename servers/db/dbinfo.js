export default {
    local: { // localhost
      host: process.env.AQTDBIP  ?? 'localhost',
      port: process.env.AQTDBPORT  ||'3306',
      user: process.env.AQTDBUSER || 'madmin',
      password: process.env.AQTDBPASS || 'Dawinit1!',
      database: process.env.AQTDBNAME || 'mondb'
    },
    real: { // real server db info
      host: process.env.AQTDBIP  ?? 'localhost',
      port: process.env.AQTDBPORT  ||'3306',
      user: process.env.AQTDBUSER || 'madmin',
      password: process.env.AQTDBPASS || 'Dawinit1!',
      database: process.env.AQTDBNAME || 'mondb'
    },
    dev: { // dev server db info
      host: process.env.AQTDBIP  ?? '192.168.0.10',
      port: process.env.AQTDBPORT  ||'3306',
      user: process.env.AQTDBUSER || 'madmin',
      password: process.env.AQTDBPASS || 'Dawinit1!',
      database: process.env.AQTDBNAME || 'mondb'
    }
  }


