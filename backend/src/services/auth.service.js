const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_MINUTES = parseInt(process.env.JWT_EXPIRES_IN_MINUTES || '60');
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

function verifyAccessToken(token) {
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        throw Object.assign(new Error('Token verification failed'), { status: 401 });
    }
    const { user_id, session_id } = decoded;
    if (typeof user_id !== 'string' || typeof session_id !== 'string')
        throw Object.assign(new Error('Token payload is invalid'), { status: 401 });
    return { user_id, session_id };
}

async function ensureActiveSession({ user_id, session_id }) {
    const result = await db.query(`
        SELECT id FROM user_sessions
        WHERE id = $1 AND user_id = $2 AND revoked = FALSE AND expires_at > now()
        LIMIT 1;
    `, [session_id, user_id]);
    if (!result.rows.length)
        throw Object.assign(new Error('Session is invalid or expired'), { status: 401 });
}

function signAccessToken(user_id, session_id) {
    return jwt.sign({ user_id, session_id }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: `${JWT_EXPIRES_MINUTES}m`,
    });
}

async function createSession(client, user_id, user_agent) {
    const expires_at = new Date(Date.now() + JWT_EXPIRES_MINUTES * 60 * 1000);
    const result = await client.query(`
        INSERT INTO user_sessions (user_id, device_info, refresh_token, expires_at, last_used_at, revoked)
        VALUES ($1, $2, $3, $4, now(), FALSE)
        RETURNING id;
    `, [user_id, user_agent ?? 'unknown', randomUUID(), expires_at]);
    return result.rows[0];
}

async function register(email, username, password, user_agent) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const [emailRow, usernameRow] = await Promise.all([
            client.query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]),
            client.query('SELECT id FROM users WHERE lower(username) = lower($1) LIMIT 1', [username]),
        ]);
        if (emailRow.rows.length) throw Object.assign(new Error('Email is already in use'), { status: 409 });
        if (usernameRow.rows.length) throw Object.assign(new Error('Username is already in use'), { status: 409 });

        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const userResult = await client.query(`
            INSERT INTO users (email, username, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, email, username, created_at;
        `, [email.trim().toLowerCase(), username.trim(), password_hash]);
        const user = userResult.rows[0];

        const session = await createSession(client, user.id, user_agent);
        await client.query('COMMIT');

        return {
            access_token: signAccessToken(user.id, session.id),
            token_type: 'Bearer',
            expires_in_seconds: JWT_EXPIRES_MINUTES * 60,
            user: { id: user.id, email: user.email, username: user.username, created_at: user.created_at },
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function login(email, password, user_agent) {
    const client = await db.connect();
    try {
        const userResult = await client.query(`
            SELECT id, email, username, password_hash, created_at
            FROM users WHERE lower(email) = lower($1) LIMIT 1;
        `, [email.trim().toLowerCase()]);
        const user = userResult.rows[0];
        if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

        await client.query('BEGIN');
        const session = await createSession(client, user.id, user_agent);
        await client.query('COMMIT');

        return {
            access_token: signAccessToken(user.id, session.id),
            token_type: 'Bearer',
            expires_in_seconds: JWT_EXPIRES_MINUTES * 60,
            user: { id: user.id, email: user.email, username: user.username, created_at: user.created_at },
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function logout(user_id, session_id) {
    await db.query(`
        UPDATE user_sessions SET revoked = TRUE
        WHERE id = $1 AND user_id = $2;
    `, [session_id, user_id]);
}

module.exports = { verifyAccessToken, ensureActiveSession, signAccessToken, register, login, logout };