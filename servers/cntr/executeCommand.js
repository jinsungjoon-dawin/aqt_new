import express from 'express';
import { Client } from 'ssh2';
import pool from '../db/dbconn.js';

const router = express.Router();
const connections = {}; // 활성 SSH 연결을 저장하는 캐시

/**
 * SSH 연결을 가져오거나 새로 생성하여 반환합니다.
 * @param {object} connInfo - 연결 정보 (host, port, username, password)
 * @returns {Promise<Client>} SSH 클라이언트 인스턴스
 */
function getSshConnection({ host, port = 22, username, password }) {
  const connKey = `${username}@${host}:${port}`;
  if (connections[connKey]) {
    return Promise.resolve(connections[connKey]);
  }

  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      connections[connKey] = conn;
      resolve(conn);
    }).on('error', (err) => {
      reject(err);
    }).on('close', () => {
      delete connections[connKey];
    }).connect({
      host,
      port,
      username,
      password,
      readyTimeout: 20000,
    });
  });
}

/**
 * SSH 연결을 통해 명령어를 실행하고 결과를 반환합니다.
 * @param {Client} sshConn - SSH 클라이언트 인스턴스
 * @param {string} command - 실행할 명령어
 * @returns {Promise<{output: string, code: number, signal: any}>} 명령어 실행 결과
 */
function executeSshCommand(sshConn, command) {
  return new Promise((resolve, reject) => {
    sshConn.exec(command, (err, stream) => {
      if (err) return reject(err);

      let output = '';
      stream.on('close', (code, signal) => {
        resolve({ output, code, signal });
      }).on('data', (data) => {
        output += data.toString();
      }).stderr.on('data', (data) => {
        output += data.toString();
      });
    });
  });
}

/**
 * find 명령어 출력의 한 줄을 파싱하여 파일 상세 정보 객체로 변환합니다.
 * @param {string} line - find 명령어 출력 중 한 줄
 * @returns {object|null} 파싱된 파일 정보 객체 또는 null
 */
function parseFindOutputLine(line) {
  if (!line) return null;

  // 하나 이상의 연속된 공백(탭 포함)을 기준으로 문자열을 분리합니다.
  const parts = line.trim().split(/\s+/);
  if (parts.length < 10) {
    console.warn('잘못된 형식의 라인 건너뛰기:', line);
    return null;
  }

  const modTimeStr = parts[2];
  // YYYYMMDDHHMMSS 형식의 문자열을 Date 객체로 변환
  let modTime = null;
  if (modTimeStr && modTimeStr.length === 14) {
    const year = modTimeStr.substring(0, 4);
    const month = modTimeStr.substring(4, 6) - 1; // JS 월은 0부터 시작
    const day = modTimeStr.substring(6, 8);
    const hour = modTimeStr.substring(8, 10);
    const minute = modTimeStr.substring(10, 12);
    const second = modTimeStr.substring(12, 14);
    modTime = new Date(year, month, day, hour, minute, second);
  }

  const result = {
    file_path: parts[0],
    file_type: parts[1],
    mod_time: modTime,
    file_size: isNaN(parseInt(parts[3], 10)) ? null : parseInt(parts[3], 10),
    owner_name: parts[4],
    owner_uid: isNaN(parseInt(parts[5], 10)) ? null : parseInt(parts[5], 10),
    group_name: parts[6],
    group_gid: isNaN(parseInt(parts[7], 10)) ? null : parseInt(parts[7], 10),
    permissions: parts[8], // permissions
    crc_value: isNaN(parseInt(parts[9], 10)) ? null : parseInt(parts[9], 10), // crc -> crc_value
  };

  return result;
}

/**
 * 파싱된 파일 정보를 데이터베이스에 저장합니다.
 * @param {string} jobId - 사용자가 입력한 작업 ID
 * @param {string} jobDescription - 사용자가 입력한 작업 설명
 * @param {Array<object>} fileDetails - 파싱된 파일 상세 정보 객체 배열
 */
async function saveFileInfoToDb(jobId, jobDescription, fileDetails, tableName) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const insertJobQuery = `INSERT INTO jobs (job_id, job_description , table_id ) VALUES (?, ?, (select id from table_info where table_name = ? ))`;
    const jobResult = await conn.query(insertJobQuery, [jobId, jobDescription, tableName]);
    const jobPkId = jobResult.insertId;

    if (fileDetails && fileDetails.length > 0) {
      // 데이터베이스에서 테이블의 컬럼 정보를 동적으로 가져옵니다.
      const columnsQuery = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`;
      const tableColumnsResult = await conn.query(columnsQuery, [tableName]);
      const tableColumns = tableColumnsResult.map(col => col.COLUMN_NAME);

      // 파싱된 데이터의 키와 테이블 컬럼을 비교하여 INSERT할 컬럼 목록을 결정합니다.
      const fileDetailKeys = Object.keys(fileDetails[0]);
      const insertableColumns = fileDetailKeys.filter(key => tableColumns.includes(key));

      // job_pk_id는 항상 포함하고, 자동 증가하는 id 컬럼은 제외합니다.
      const allColumns = ['job_pk_id', ...insertableColumns.filter(c => c.toLowerCase() !== 'id')];

      // 각 행에 대한 플레이스홀더 (?, ?, ...)를 동적으로 생성합니다.
      const placeholders = fileDetails.map(() => `(${allColumns.map(() => '?').join(',')})`).join(',');

      const insertFileDetailQuery = `INSERT INTO ${tableName} (${allColumns.join(', ')}) VALUES ${placeholders};`;

      // 2차원 배열을 1차원 배열로 평탄화합니다.
      const values = fileDetails.flatMap(fd => [jobPkId, ...insertableColumns.map(col => fd[col] || null)]);

      await conn.query(insertFileDetailQuery, values);
    }

    await conn.commit();
  } catch (dbError) {
    if (conn) await conn.rollback();
    console.error('DB 오류 (파일 정보 저장 중):', dbError);
    // 오류를 다시 던져서 API 핸들러에서 처리하도록 함
    throw dbError;
  } finally {
    if (conn) conn.release();
  }
}

/**
 * 명령어 주입 공격을 방지하기 위해 사용자 입력을 검증합니다.
 * 허용된 문자/패턴 외에는 모두 차단합니다.
 * @param {string} arg - 사용자가 입력한 programArg
 * @returns {boolean} - 유효하면 true, 아니면 false
 */
function isValidProgramArg(arg) {
  // 허용할 문자: 영숫자, 공백, 슬래시(/), 대시(-), 점(.), 별표(*), 작은따옴표('), 큰따옴표(")
  // 위험한 문자(;, |, &, $, <, >, ` 등)는 포함되지 않도록 합니다.
  const allowedPattern = /^[a-zA-Z0-9\s\/\-.*'"_]+$/;
  return allowedPattern.test(arg);
}


//--- 라우트 핸들러 ---

/**
 * POST /
 * 일반 SSH 명령어를 실행합니다.
 */
router.post('/', async (req, res) => {
  const { host, port, username, password, command } = req.body;
  if (!host || !username || !password || !command) {
    return res.status(400).json({ error: '필수 파라미터(host, username, password, command)가 누락되었습니다.' });
  }

  try {
    const sshConn = await getSshConnection(req.body);
    const { output, code, signal } = await executeSshCommand(sshConn, command);
    res.json({ output, code, signal });
  } catch (error) {
    res.status(500).json({ error: `명령어 실행 중 오류 발생: ${error.message}` });
  }
});

/**
 * POST /disconnect
 * 활성 SSH 연결을 종료합니다.
 */
router.post('/disconnect', (req, res) => {
  const { host, port = 22, username } = req.body;
  if (!host || !username) {
    return res.status(400).json({ error: '필수 파라미터(host, username)가 누락되었습니다.' });
  }

  const connKey = `${username}@${host}:${port}`;
  const existingConn = connections[connKey];

  if (existingConn) {
    existingConn.end();
    res.json({ message: '연결 종료가 시작되었습니다.' });
  } else {
    res.status(404).json({ error: '종료할 활성 연결을 찾을 수 없습니다.' });
  }
});

/**
 * POST /save
 * 명령어 실행 기록을 데이터베이스에 저장합니다.
 */
router.post('/save', async (req, res) => {
  const { userId, targetHost, targetPort, command, output, exitCode } = req.body;
  if (!userId || !targetHost || !targetPort || command === undefined) {
    return res.status(400).json({ message: '히스토리 저장을 위한 필수 필드가 누락되었습니다.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      INSERT INTO command_history (user_id, target_host, target_port, command, output, exit_code)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    const params = [userId, targetHost, targetPort, command, output, exitCode];
    const result = await conn.query(query, params);
    res.status(201).json({ message: '명령어 히스토리가 성공적으로 저장되었습니다.', insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: '명령어 히스토리 저장에 실패했습니다.', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /save-file-info
 * 원격지 파일 정보를 찾아 데이터베이스에 저장합니다.
 */
router.post('/save-file-info', async (req, res) => {
  const { host, username, password, jobId, jobDescription, programArg, tableSelect } = req.body;
  if (!host || !username || !password || !jobId || !jobDescription || !programArg || !tableSelect) {
    return res.status(400).json({ error: '필수 파라미터(host, username, password, jobId, jobDescription, programArg, tableSelect)가 누락되었습니다.' });
  }

  // 명령어 주입 방지를 위한 입력값 검증
  if (!isValidProgramArg(programArg)) {
    return res.status(400).json({ error: 'Program Arguments에 허용되지 않는 문자가 포함되어 있습니다.' });
  }

  // SQL 인젝션 방지를 위해 테이블 이름 화이트리스트 검사
  // const allowedTables = ['file_details', 'file_details_2'];
  // if (!allowedTables.includes(tableSelect)) {
  //   return res.status(400).json({ error: '허용되지 않은 테이블 이름입니다.' });
  // }

  // Job ID 중복 검사
  let conn;
  try {
    conn = await pool.getConnection();

    const checkQuery = "SELECT job_id FROM jobs WHERE job_id = ?";
    const rows = await conn.query(checkQuery, [jobId]);
    console.log(jobId , [rows].length, rows);
    if (rows.length > 0) {
      return res.status(409).json({ error: '이미 등록된 Job ID입니다. 다른 Job ID를 사용하세요.' });
    }

    // 요청받은 programArg를 사용하여 스크립트 실행 명령어를 구성합니다.
    const findCommand = `${programArg}`;

    const sshConn = await getSshConnection(req.body);
    const { output, code } = await executeSshCommand(sshConn, findCommand);

    if (code !== 0) {
      // 이 경우 500 대신 400번대 코드가 더 적절할 수 있습니다.
      return res.status(422).json({ error: `find 명령어 실행 실패 (종료 코드: ${code})`, output });
    }

    const lines = output.trim() ? output.trim().split('\n') : [];
    const fileDetails = lines.map(parseFindOutputLine).filter(Boolean); // null인 항목 제거

    await saveFileInfoToDb(jobId, jobDescription, fileDetails, tableSelect);
    res.status(201).json({ message: '파일 정보가 성공적으로 저장되었습니다.', output: output });
  } catch (error) {
    res.status(500).json({ message: '파일 정보 저장 중 오류가 발생했습니다.', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /jobs/ids
 * 저장된 모든 고유 job_id 목록을 반환합니다.
 */
router.get('/jobs/ids', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT DISTINCT j.job_id, ti.table_name
      FROM jobs j
      JOIN table_info ti ON j.table_id = ti.id
      ORDER BY j.job_id;
    `;
    const results = await conn.query(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Job ID 목록 조회 중 오류 발생', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /jobs/dates
 * 특정 job_id에 대한 실행 날짜 목록(id 포함)을 반환합니다.
 */
router.get('/jobs/dates', async (req, res) => {
  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ message: 'jobId 파라미터가 필요합니다.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT id, execution_date FROM jobs WHERE job_id = ? ORDER BY execution_date DESC;", [jobId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: '실행 날짜 조회 중 오류 발생', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * 두 경로 배열에서 가장 긴 공통 상위 경로를 찾습니다.
 * @param {string[]} paths1 - 첫 번째 경로 배열
 * @param {string[]} paths2 - 두 번째 경로 배열
 * @returns {string} - 공통 상위 경로
 */
function findLongestCommonPrefix(paths1, paths2) {
  if (!paths1.length || !paths2.length) return '';

  const allPaths = [...paths1, ...paths2];
  let prefix = '';
  if (allPaths.length > 0) {
    // 모든 경로를 정렬하면, 첫 번째와 마지막 경로의 공통 부분만 찾으면 됩니다.
    allPaths.sort();
    const first = allPaths[0];
    const last = allPaths[allPaths.length - 1];
    for (let i = 0; i < first.length; i++) {
      if (first[i] === last[i]) {
        prefix += first[i];
      } else {
        break;
      }
    }
  }
  // 마지막 슬래시까지만 공통 경로로 인정합니다.
  return prefix.substring(0, prefix.lastIndexOf('/') + 1);
}

/**
 * GET /jobs/compare
 * 두 job 실행(jobId1, jobId2) 간의 파일 변경 사항을 비교합니다.
 */
router.get('/jobs/compare', async (req, res) => {
  const { jobId1, tableSelect1, jobId2, tableSelect2 } = req.query;
  if (!jobId1 || !tableSelect1 || !jobId2 || !tableSelect2) {
    return res.status(400).json({ message: '비교할 두 개의 job ID와 각각의 테이블 이름(jobId1, tableSelect1, jobId2, tableSelect2)이 필요합니다.' });
  }

  // SQL 인젝션 방지를 위해 테이블 이름 화이트리스트 검사 (필요 시 확장)
  // const allowedTables = ['file_details', 'file_details_2'];
  // if (!allowedTables.includes(tableSelect)) {
  //   return res.status(400).json({ error: '허용되지 않은 테이블 이름입니다.' });
  // }

  let conn;
  try {
    conn = await pool.getConnection();

    // 각 job에 대한 쿼리를 생성하고 실행합니다.
    // pool.escapeId와 pool.escape를 사용하여 SQL 인젝션을 방지합니다.
    const query1 = `SELECT fd.file_path, fd.file_size, fd.mod_time, fd.crc_value, fd.permissions, fd.owner_name, fd.group_name FROM ${pool.escapeId(tableSelect1)} AS fd JOIN (SELECT id FROM jobs WHERE job_id = ${pool.escape(jobId1)} ORDER BY execution_date DESC LIMIT 1) AS latest_job ON fd.job_pk_id = latest_job.id`;
    const query2 = `SELECT fd.file_path, fd.file_size, fd.mod_time, fd.crc_value, fd.permissions, fd.owner_name, fd.group_name FROM ${pool.escapeId(tableSelect2)} AS fd JOIN (SELECT id FROM jobs WHERE job_id = ${pool.escape(jobId2)} ORDER BY execution_date DESC LIMIT 1) AS latest_job ON fd.job_pk_id = latest_job.id`;

    const [files1, files2] = await Promise.all([
      conn.query(query1),
      conn.query(query2)
    ]);

    res.json({ files1, files2 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: '파일 비교 중 오류 발생', error: error.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /get-file-content
 * 원격 서버의 파일 내용을 가져옵니다.
 */
router.post('/get-file-content', async (req, res) => {
  const { host, port, username, password, filePath } = req.body;
  if (!host || !username || !password || !filePath) {
    return res.status(400).json({ error: '필수 파라미터(host, username, password, filePath)가 누락되었습니다.' });
  }

  // 보안을 위해 filePath에 ../ 같은 경로 조작 문자가 있는지 확인
  if (filePath.includes('..')) {
    return res.status(400).json({ error: '잘못된 파일 경로입니다.' });
  }

  try {
    const sshConn = await getSshConnection(req.body);
    const { output, code } = await executeSshCommand(sshConn, `cat "${filePath}"`);
    if (code !== 0) throw new Error(`파일 내용을 읽는 데 실패했습니다 (종료 코드: ${code}).`);
    res.json({ content: output });
  } catch (error) {
    res.status(500).json({ error: `파일 내용 조회 중 오류 발생: ${error.message}` });
  }
});

export default router;
