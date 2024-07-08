const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qq060606',
    database: 'user'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

app.post('/register', (req, res) => {
    const { email, username, password, question, answer } = req.body;

    // ���û���������ת��ΪСд�Խ��бȽ�
    const lowerCaseEmail = email.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    // ��������Ƿ��Ѿ�����
    const checkEmailQuery = 'SELECT * FROM user WHERE LOWER(EmailAddress) = ?';
    db.query(checkEmailQuery, [lowerCaseEmail], (err, emailResult) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'ע��ʧ��' });
        }
        if (emailResult.length > 0) {
            return res.status(400).json({ success: false, message: '�����Ѿ�����' });
        }

        // ����û����Ƿ��Ѿ�����
        const checkUsernameQuery = 'SELECT * FROM user WHERE LOWER(userName) = ?';
        db.query(checkUsernameQuery, [lowerCaseUsername], (err, usernameResult) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'ע��ʧ��' });
            }
            if (usernameResult.length > 0) {
                return res.status(400).json({ success: false, message: '�û����Ѿ�����' });
            }

            // �����û�����
            const insertUserQuery = 'INSERT INTO user (userName, EmailAddress, password, question, answer) VALUES (?, ?, ?, ?, ?)';
            db.query(insertUserQuery, [username, email, password, question, answer], (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'ע��ʧ��' });
                }
                res.status(200).json({ success: true, message: 'ע��ɹ�' });
            });
        });
    });
});

app.post('/login', (req, res) => {
    const { identifier, password } = req.body;
    const lowerCaseIdentifier = identifier.toLowerCase();

    // ��ʼ���ݿ�����
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: '��¼ʧ��' });
        }

        // ɾ�����м�¼
        const deleteCUserQuery = 'truncate table cuser';
        db.query(deleteCUserQuery, (err, deleteResult) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ success: false, message: '��¼ʧ��' });
                });
            }

            // ��ѯ�û����������Ƿ����
            const checkIdentifierQuery = 'SELECT * FROM user WHERE LOWER(userName) = ? OR LOWER(EmailAddress) = ?';
            db.query(checkIdentifierQuery, [lowerCaseIdentifier, lowerCaseIdentifier], (err, identifierResult) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ success: false, message: '��¼ʧ��' });
                    });
                }
                if (identifierResult.length === 0) {
                    return db.rollback(() => {
                        res.status(400).json({ success: false, message: '�û��������䲻����' });
                    });
                }

                // ��������Ƿ�ƥ��
                const user = identifierResult[0];
                if (user.password !== password) {
                    return db.rollback(() => {
                        res.status(400).json({ success: false, message: '�������' });
                    });
                }

                // �������û���Ϣ��cuser��
                const insertCUserQuery = 'INSERT INTO cuser (identifier, password) VALUES (?, ?)';
                db.query(insertCUserQuery, [lowerCaseIdentifier, password], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ success: false, message: '��¼ʧ��' });
                        });
                    }

                    // �ύ����
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ success: false, message: '��¼ʧ��' });
                            });
                        }
                        console.log('��¼�ɹ��������ύ�ɹ�');
                        res.status(200).json({ success: true, message: '��¼�ɹ�' });
                    });
                });
            });
        });
    });
});

app.post('/forgot-password', (req, res) => {
    const { email, securityAnswer, newPassword } = req.body;

    // ������ת��ΪСд�Խ��бȽ�
    const lowerCaseEmail = email.toLowerCase();

    // ��������Ƿ����
    const checkEmailQuery = 'SELECT * FROM user WHERE LOWER(EmailAddress) = ?';
    db.query(checkEmailQuery, [lowerCaseEmail], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: '����������' });
        }
        if (result.length === 0) {
            return res.status(400).json({ success: false, message: '���䲻����' });
        }

        const user = result[0];
        if (user.answer !== securityAnswer) {
            return res.status(400).json({ success: false, message: '�ܱ��𰸴���' });
        }

        // ��������
        const updatePasswordQuery = 'UPDATE user SET password = ? WHERE LOWER(EmailAddress) = ?';
        db.query(updatePasswordQuery, [newPassword, lowerCaseEmail], (err, updateResult) => {
            if (err) {
                return res.status(500).json({ success: false, message: '��������ʧ��' });
            }
            res.status(200).json({ success: true, message: '�������óɹ�' });
        });
    });
});

app.post('/fetch-security-question', (req, res) => {
    const { email } = req.body;

    // ������ת��ΪСд�Խ��бȽ�
    const lowerCaseEmail = email.toLowerCase();

    // ��������Ƿ����
    const checkEmailQuery = 'SELECT question FROM user WHERE LOWER(EmailAddress) = ?';
    db.query(checkEmailQuery, [lowerCaseEmail], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: '����������' });
        }
        if (result.length === 0) {
            return res.status(400).json({ success: false, message: '���䲻����' });
        }

        res.status(200).json({ success: true, question: result[0].question });
    });
});

app.get('/api/currentUser', (req, res) => {
    const query = 'SELECT identifier FROM cuser LIMIT 1';
    db.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: '��ȡ��ǰ�û���Ϣʧ��' });
        }
        if (result.length > 0) {
            return res.status(200).json({ identifier: result[0].identifier });
        } else {
            return res.status(404).json({ success: false, message: '��ǰ�û�������' });
        }
    });
});

// ��ȡ�û���Ϣ
app.get('/api/userInfo/:identifier', (req, res) => {
    const identifier = req.params.identifier.toLowerCase();
    const query = 'SELECT userName, EmailAddress, question, answer FROM user WHERE LOWER(userName) = ? OR LOWER(EmailAddress) = ?';
    db.query(query, [identifier, identifier], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: '��ȡ�û���Ϣʧ��' });
        }
        if (result.length > 0) {
            const userInfo = {
                username: result[0].userName,
                email: result[0].EmailAddress,
                question: result[0].question,
                answer: result[0].answer
            };
            return res.status(200).json(userInfo);
        } else {
            return res.status(404).json({ success: false, message: '�û�������' });
        }
    });
});

// �޸�����ӿ�
app.post('/api/change-password', (req, res) => {
    const { password, newPassword } = req.body;

    // ��ȡ��ǰ�û���ʶ
    const getCurrentUserQuery = 'SELECT identifier FROM cuser LIMIT 1';
    db.query(getCurrentUserQuery, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: '��ȡ��ǰ�û���Ϣʧ��' });
        }
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: '��ǰ�û�������' });
        }

        const identifier = result[0].identifier.toLowerCase();

        // ���������Ƿ���ȷ
        const checkPasswordQuery = 'SELECT password FROM user WHERE LOWER(userName) = ? OR LOWER(EmailAddress) = ?';
        db.query(checkPasswordQuery, [identifier, identifier], (err, passwordResult) => {
            if (err) {
                return res.status(500).json({ success: false, message: '�������ʧ��' });
            }
            if (passwordResult.length === 0) {
                return res.status(404).json({ success: false, message: '�û�������' });
            }

            const currentPassword = passwordResult[0].password;
            if (currentPassword !== password) {
                return res.status(400).json({ success: false, message: '���������' });
            }

            // ��������
            const updateUserPasswordQuery = `UPDATE user SET password = ? WHERE LOWER(userName) = ? OR LOWER(EmailAddress) = ?`;
            const updateCuserPasswordQuery = `UPDATE cuser SET password = ? WHERE LOWER(identifier) = ?`;

            db.query(updateUserPasswordQuery, [newPassword, identifier, identifier], (err, updateUserResult) => {
                if (err) {
                    return res.status(500).json({ success: false, message: '����user������ʧ��' });
                }

                db.query(updateCuserPasswordQuery, [newPassword, identifier], (err, updateCuserResult) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: '����cuser������ʧ��' });
                    }
                    res.status(200).json({ success: true, message: '�����޸ĳɹ�' });
                });
            });
        });
    });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});