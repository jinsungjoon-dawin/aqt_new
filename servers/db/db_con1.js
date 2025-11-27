import mariadb from 'mariadb';
import { dev as config } from './dbinfo' ;
const connection = {
  supportBigNumbers: true,
  host: config.host,
  port: config.port,
  user: config.user,
  dateStrings : true ,
  password: config.password,
  database: config.database
} ;

export default mariadb.createConnection(connection) ;
  

