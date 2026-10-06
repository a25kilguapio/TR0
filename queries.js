const pool = require('./db_conexion');

function agruparPreguntes(preguntesRows, respostesRows) {
    const respostesPerPregunta = new Map();

    for (const r of respostesRows) {
        if (!respostesPerPregunta.has(r.pregunta_id)) {
            respostesPerPregunta.set(r.pregunta_id, []);
        }
        respostesPerPregunta.get(r.pregunta_id).push(r);
    }

    return preguntesRows.map(p => {
        const respostes = (respostesPerPregunta.get(p.id) || []).sort((a, b) => a.ordre - b.ordre);
        const correcta = respostes.find(r => r.es_correcta);

        return {
            id: p.id,
            pregunta: p.pregunta,
            imatge: p.imatge,
            respostes: respostes.map(r => ({ id: r.ordre, etiqueta: r.etiqueta })),
            resposta_correcta: correcta ? correcta.ordre : null
        };
    });
}

async function getAllQuestions() {
    const [preguntesRows] = await pool.query('SELECT id, pregunta, imatge FROM preguntes ORDER BY id');
    const [respostesRows] = await pool.query('SELECT id, pregunta_id, ordre, etiqueta, es_correcta FROM respostes ORDER BY pregunta_id, ordre');
    return agruparPreguntes(preguntesRows, respostesRows);
}

async function getQuestionById(id) {
    const [preguntesRows] = await pool.query('SELECT id, pregunta, imatge FROM preguntes WHERE id = ?', [id]);
    if (preguntesRows.length === 0) return null;

    const [respostesRows] = await pool.query('SELECT id, pregunta_id, ordre, etiqueta, es_correcta FROM respostes WHERE pregunta_id = ? ORDER BY ordre', [id]);
    return agruparPreguntes(preguntesRows, respostesRows)[0];
}

async function createQuestion({ pregunta, imatge, respostes, resposta_correcta }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query('INSERT INTO preguntes (pregunta, imatge) VALUES (?, ?)', [pregunta, imatge || null]);
        const preguntaId = result.insertId;

        for (let i = 0; i < respostes.length; i++) {
            const ordre = i + 1;
            const etiqueta = typeof respostes[i] === 'string' ? respostes[i] : respostes[i].etiqueta;
            await conn.query(
                'INSERT INTO respostes (pregunta_id, ordre, etiqueta, es_correcta) VALUES (?, ?, ?, ?)',
                [preguntaId, ordre, etiqueta, ordre === resposta_correcta]
            );
        }

        await conn.commit();
        return getQuestionById(preguntaId);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function updateQuestion(id, { pregunta, imatge, respostes, resposta_correcta }) {
    const existent = await getQuestionById(id);
    if (!existent) return null;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query('UPDATE preguntes SET pregunta = ?, imatge = ? WHERE id = ?', [pregunta, imatge || null, id]);

        if (Array.isArray(respostes)) {
            await conn.query('DELETE FROM respostes WHERE pregunta_id = ?', [id]);

            for (let i = 0; i < respostes.length; i++) {
                const ordre = i + 1;
                const etiqueta = typeof respostes[i] === 'string' ? respostes[i] : respostes[i].etiqueta;
                await conn.query(
                    'INSERT INTO respostes (pregunta_id, ordre, etiqueta, es_correcta) VALUES (?, ?, ?, ?)',
                    [id, ordre, etiqueta, ordre === resposta_correcta]
                );
            }
        }

        await conn.commit();
        return getQuestionById(id);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function deleteQuestion(id) {
    const [result] = await pool.query('DELETE FROM preguntes WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion
};
