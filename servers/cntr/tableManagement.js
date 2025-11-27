import express from 'express';
import pool from '../db/dbconn.js';

const router = express.Router();
const connections = {}; // 활성 SSH 연결을 저장하는 캐시


/**
 * =================================================================
 * MariaDB 테이블 관리 API
 * =================================================================
 */

/**
 * GET /
 * table_info 테이블에서 관리되는 테이블 목록을 가져옵니다.
 * 실제 호출 경로: GET /tables
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 'table_info' 테이블에서 테이블 이름 목록을 조회합니다.
    const rows = await conn.query("SELECT table_name,table_description FROM table_info ORDER BY table_name ASC");
    // rows는 [{ table_name: 'table1' }, { table_name: 'table2' }] 형태입니다.
    // 이를 문자열 배열로 변환합니다.
    // const tableNames = rows.map(row => row.table_name);
    res.json(rows);
  } catch (err) {
    console.error('테이블 목록 조회 오류:', err);
    res.status(500).json({ error: '데이터베이스 조회에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /:tableName
 * 특정 테이블의 구조(스키마)를 가져옵니다.
 * 실제 호출 경로: GET /tables/:tableName
 */
router.get('/:tableName', async (req, res) => {
  let conn;
  const { tableName } = req.params;
  // 기본적인 SQL Injection 방지를 위해 테이블 이름에 허용된 문자만 있는지 확인합니다.
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '잘못된 테이블 이름입니다.' });
  }

  try {
    conn = await pool.getConnection();
    // 백틱(`)으로 테이블 이름을 감싸서 예약어와 충돌을 방지합니다.
    const columns = await conn.query(`DESCRIBE \`${tableName}\``);
    res.json(columns);
  } catch (err) {
    console.error(`'${tableName}' 테이블 구조 조회 오류:`, err);
    res.status(500).json({ error: '데이터베이스 조회에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /
 * 새 테이블을 생성합니다.
 * 실제 호출 경로: POST /tables
 */
router.post('/', async (req, res) => {
  let conn;
  const { tableName, description, columns } = req.body;

  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName) || !columns || columns.length === 0) {
    return res.status(400).json({ error: '테이블 생성을 위한 입력값이 올바르지 않습니다.' });
  }

  // CREATE TABLE SQL 문을 동적으로 생성합니다.
  const columnDefinitions = columns.map(col => {
    // isPk는 마지막에 별도로 처리하므로 여기서는 제외합니다.
    const { name, type, length, isNull, autoIncrement } = col;
    let definition = `\`${name}\` ${type.toUpperCase()}`;
    if (length) definition += `(${length})`;
    definition += isNull ? ' NULL' : ' NOT NULL';
    if (autoIncrement) definition += ' AUTO_INCREMENT';
    return definition;
  }).join(', ');

  const primaryKeys = columns.filter(c => c.isPk).map(c => `\`${c.name}\``).join(', '); // PK 컬럼들을 모아서 별도로 정의합니다.
  const sql = `CREATE TABLE \`${tableName}\` (${columnDefinitions}${primaryKeys ? `, PRIMARY KEY (${primaryKeys})` : ''})`;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction(); // 트랜잭션 시작

    // 1. 메인 테이블 생성
    await conn.query(sql);

    // 2. table_info 관리 테이블에 정보 기록
    await conn.query(
      "INSERT INTO table_info (table_name, table_description) VALUES (?, ?)",
      [tableName, description]
    );

    await conn.commit(); // 트랜잭션 커밋

    res.status(201).json({ message: `테이블 '${tableName}'이(가) 성공적으로 생성되었습니다.` });
  } catch (err) {
    if (conn) await conn.rollback(); // 오류 발생 시 롤백
    console.error(`테이블 '${tableName}' 생성 오류:`, err);
    res.status(500).json({ error: '테이블 생성에 실패했습니다.', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * DELETE /:tableName
 * 테이블을 삭제합니다. (DROP TABLE)
 * 실제 호출 경로: DELETE /tables/:tableName
 */
router.delete('/:tableName', async (req, res) => {
  let conn;
  const { tableName } = req.params;

  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '잘못된 테이블 이름입니다.' });
  }

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction(); // 트랜잭션 시작

    // 1. table_info 관리 테이블에서 정보 삭제
    await conn.query("DELETE FROM table_info WHERE table_name = ?", [tableName]);

    // 2. 실제 테이블 삭제
    await conn.query(`DROP TABLE \`${tableName}\``);

    await conn.commit(); // 트랜잭션 커밋

    res.status(200).json({ message: `테이블 '${tableName}'이(가) 성공적으로 삭제되었습니다.` });
  } catch (err) {
    if (conn) await conn.rollback(); // 오류 발생 시 롤백
    console.error(`테이블 '${tableName}' 삭제 오류:`, err);
    res.status(500).json({ error: '테이블 삭제에 실패했습니다.', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /:tableName/columns
 * 기존 테이블에 컬럼을 추가합니다.
 * 실제 호출 경로: POST /tables/:tableName/columns
 */
router.post('/:tableName/columns', async (req, res) => {
  let conn;
  const { tableName } = req.params;
  const { name, type, length, isNull } = req.body;

  if (!/^[a-zA-Z0-9_]+$/.test(tableName) || !name || !/^[a-zA-Z0-9_]+$/.test(name) || !type) {
    return res.status(400).json({ error: '컬럼 추가를 위한 입력값이 올바르지 않습니다.' });
  }

  let columnDefinition = `\`${name}\` ${type.toUpperCase()}`;
  if (length) columnDefinition += `(${length})`;
  columnDefinition += isNull ? ' NULL' : ' NOT NULL';

  const sql = `ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDefinition}`;

  try {
    conn = await pool.getConnection();
    await conn.query(sql);
    res.status(200).json({ message: `컬럼 '${name}'이(가) '${tableName}' 테이블에 성공적으로 추가되었습니다.` });
  } catch (err) {
    console.error(`'${tableName}' 테이블에 컬럼 추가 오류:`, err);
    res.status(500).json({ error: '컬럼 추가에 실패했습니다.', details: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /info/:tableName
 * table_info 테이블에서 특정 테이블의 관리 정보를 가져옵니다.
 * 실제 호출 경로: GET /tables/info/:tableName
 */
router.get('/info/:tableName', async (req, res) => {
  let conn;
  const { tableName } = req.params;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '잘못된 테이블 이름입니다.' });
  }

  try {
    conn = await pool.getConnection();
    const [info] = await conn.query("SELECT table_description FROM table_info WHERE table_name = ?", [tableName]);
    res.json(info || {});
  } catch (err) {
    console.error(`'${tableName}' 테이블 정보 조회 오류:`, err);
    res.status(500).json({ error: '데이터베이스 조회에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * PUT /info/:tableName
 * table_info 테이블에서 특정 테이블의 설명을 수정합니다.
 * 실제 호출 경로: PUT /tables/info/:tableName
 */
router.put('/info/:tableName', async (req, res) => {
  let conn;
  const { tableName } = req.params;
  const { description } = req.body;

  try {
    conn = await pool.getConnection();
    await conn.query("UPDATE table_info SET table_description = ? WHERE table_name = ?", [description, tableName]);
    res.status(200).json({ message: '테이블 설명이 성공적으로 수정되었습니다.' });
  } catch (err) {
    console.error(`'${tableName}' 테이블 정보 수정 오류:`, err);
    res.status(500).json({ error: '데이터베이스 업데이트에 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});



export default router;
