
import mongoose from 'mongoose';
import cors from 'cors';
import express from 'express';
//import bcrypt from 'bcrypt';
const app = express();
app.use(cors());
app.use(express.json());



import auth from 'basic-auth';
import bcrypt from 'bcrypt'; // У вас уже подключен

// --- MIDDLEWARE ДЛЯ АУТЕНТИФИКАЦИИ ---
const authMiddleware = async (req, res, next) => {
        // Пропускаем маршруты регистрации и логина
        if (req.path === '/api/users/register' || req.path === '/api/users/login') {
                return next();
        }

        const credentials = auth(req);

        if (!credentials || !credentials.name || !credentials.pass) {
                res.set('WWW-Authenticate', 'Basic realm="Secure Area"');
                return res.status(401).send('Требуется авторизация');
        }

        try {
                const user = await UserExercise.findOne({ email: credentials.name });

                if (!user || !(await user.isValidPassword(credentials.pass))) {
                        res.set('WWW-Authenticate', 'Basic realm="Secure Area"');
                        return res.status(401).send('Неверный email или пароль');
                }

                // Если всё ок, записываем пользователя в запрос
                req.user = user;
                next();
        } catch (error) {
                console.error('Ошибка аутентификации:', error);
                res.status(500).send('Ошибка сервера');
        }
};

//app.use(authMiddleware);

//mongoose.connect('mongodb://localhost:27017/exercise');
mongoose.connect('mongodb://localhost:27017/exercise')
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => console.error('Ошибка подключения к MongoDB:', err));

const userExerciseSchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true }, // Email пользователя
        password: { type: String, required: true }, // Пароль
        status: { type: Boolean, required: true, default: false },
        exercises: [
                {
                        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Автоматически сгенерированный идентификатор
                        name: { type: String, required: true }, // Название упражнения
                        sessions: [
                                {
                                        date: { type: Date, required: true }, // Дата выполнения
                                        logs: [
                                                {
                                                        weight: { type: Number, required: true }, // Вес
                                                        reps: { type: Number, required: true } // Повторы
                                                }
                                        ]
                                }
                        ]
                }
        ]
});



// Хеширование пароля перед сохранением
userExerciseSchema.pre('save', async function () {
        // Запускаем только если пароль действительно изменился
        if (!this.isModified('password')) return;

        console.log('[PRE-SAVE] Обнаружено изменение пароля для:', this.email);

        // Защита от пустых строк и слишком коротких паролей
        if (!this.password || this.password.length < 4) {
                console.error('[PRE-SAVE] ОШИБКА: Пароль пустой или короче 4 символов!');
                // Прерываем сохранение, чтобы в базу не попал мусор
                throw new Error('Пароль должен быть не менее 4 символов');
        }

        try {
                const saltRounds = 10;
                console.log('[PRE-SAVE] Хешируем пароль...');
                this.password = await bcrypt.hash(this.password, saltRounds);
                console.log('[PRE-SAVE] Пароль успешно захеширован.');
        } catch (error) {
                console.error('[PRE-SAVE] Фатальная ошибка hash:', error.message);
                throw new Error('Ошибка шифрования');
        }
});


// Метод для проверки пароля
// Метод для проверки пароля
userExerciseSchema.methods.isValidPassword = async function (candidatePassword) {
        // Защита от вызова метода на несуществующем пользователе
        if (!this || !this.password) {
                return false;
        }

        try {
                const isMatch = await bcrypt.compare(candidatePassword, this.password);
                return isMatch;
        } catch (error) {
                console.error('Ошибка внутри compare:', error);
                return false; // Не падаем с ошибкой 500, просто говорим "неверный пароль"
        }
};


const UserExercise = mongoose.model('UserExercise', userExerciseSchema);

// Обработчик для регистрации
app.post('/api/users/register', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
                return res.status(400).json({ message: 'Email и пароль обязательны.' });
        }

        try {
                const existingUser = await UserExercise.findOne({ email }); // Точное соответствие полю схемы
                if (existingUser) {
                        return res.status(400).json({ message: 'Пользователь с таким email уже зарегистрирован.' });
                }

                const newUser = new UserExercise({
                        email: email.toLowerCase(), // Приводим к нижнему регистру для надежности
                        password: password,
                        status: false
                });

                await newUser.save();

                // Возвращаем данные БЕЗ пароля
                res.status(201).json({
                        message: 'Пользователь успешно зарегистрирован.',
                        user: { id: newUser._id, email: newUser.email }
                });
        } catch (error) {
                console.error('Ошибка при регистрации пользователя:', error);
                res.status(500).send('Ошибка сервера');
        }
});


/*
app.post('/api/users/login', async (req, res) => {
        const { email, password } = req.body;

        try {
                const user = await UserExercise.findOne({ email });
                if (!user || !(await user.isValidPassword(password))) {
                        return res.status(401).send('Неверный email или пароль');
                }

                res.send(user); // Возвращаем пользователя (или его токен)
        } catch (e) {
                console.error('Ошибка при входе:', e);
                res.status(500).send('Ошибка сервера');
        }
});
*/
/*app.post('/api/users/login', async (req, res) => {
        const { email, password } = req.body;

        try {
                // Сначала ищем пользователя
                const user = await UserExercise.findOne({ email }).select('-password');

                // Если пользователь не найден — сразу возвращаем 401
                if (!user) {
                        return res.status(401).json({ message: 'Неверный email или пароль' });
                }

                // Только если пользователь найден, проверяем пароль через наш исправленный метод
                const isMatch = await user.isValidPassword(password);

                if (!isMatch) {
                        return res.status(401).json({ message: 'Неверный email или пароль' });
                }

                // Вход успешен
                const token = 'temp-token-' + Date.now();
                res.json({ _id: user._id, email: user.email, status: user.status, token: token });

        } catch (e) {
                console.error('Ошибка при входе:', e);
                res.status(500).json({ message: 'Ошибка сервера' });
        }
});*/
app.post('/api/users/login', async (req, res) => {
        const { email, password } = req.body;
        const cleanEmail = email.trim();
        const cleanPass = password.trim();

        try {
                const user = await UserExercise.findOne({ email: cleanEmail }).select('+password'); // +password заставляет выгрузить скрытое поле

                if (!user) {
                        return res.status(401).json({ message: 'Неверный email или пароль' });
                }
                user.status = true;
                await user.save();
                // Логинимся ТОЛЬКО если статус true (если вы используете флаг блокировки)
                // if (!user.status) return res.status(403).json({ message: 'Аккаунт заблокирован' });

                console.log('[LOGIN DEBUG] Типы данных:', typeof cleanPass, typeof user.password);
                console.log('[LOGIN DEBUG] Длины:', cleanPass?.length, user.password?.length);

                if (!cleanPass || !user.password) {
                        return res.status(401).json({ message: 'Пустой пароль' });
                }

                const isMatch = await bcrypt.compare(cleanPass, user.password);

                if (!isMatch) {
                        return res.status(401).json({ message: 'Неверный email или пароль' });
                }

                const token = 'temp-token-' + Date.now();
                res.json({ _id: user._id, email: user.email, status: user.status, token: token });
                //res.json({ _id: user._id, email: user.email, status: user.status = true, token: token });
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Ошибка сервера' });
        }
});


app.get('/api/users', async (req, res) => {
        try {
                const users = await UserExercise.find(); // Получаем всех пользователей
                res.json(users);
        } catch (error) {
                console.error('Ошибка при получении пользователей:', error);
                res.status(500).json({ message: 'Ошибка сервера' });
        }
});
// Получение упражнений по userId
app.get('/api/exercises', async (req, res) => {
        const userId = req.query.userId;

        try {
                const user = await UserExercise.findById(userId);
                if (!user) {
                        return res.status(404).send('Пользователь не найден');
                }
                res.json(user.exercises);
        } catch (e) {
                console.error('Ошибка при получении упражнений:', e);
                res.status(500).send(e);
        }
});



app.delete('/api/exercises/:userId/:exerciseId', async (req, res) => {
        const { userId, exerciseId } = req.params;
        try {
                const user = await UserExercise.findById(userId);
                if (!user) {
                        return res.status(404).send('Пользователь не найден');
                }

                user.exercises = user.exercises.filter(exercise => exercise._id.toString() !== exerciseId);
                await user.save();

                res.status(200).send('Упражнение успешно удалено');
        } catch (e) {
                console.error("Ошибка при удалении упражнения:", e);
                res.status(500).send({ error: e.message });
        }
});

// API для создания нового упражнения
app.post('/api/exercises', async (req, res) => {
        const { email, exercise } = req.body; // <-- Теперь ищем 'exercise'

        if (!email || !exercise) {
                return res.status(400).json({ message: 'Email и данные упражнения обязательны.' });
        }

        // Проверяем структуру упражнения
        if (!exercise.name) {
                return res.status(400).json({ message: 'Название упражнения обязательно.' });
        }

        try {
                const user = await UserExercise.findOne({ email });
                if (!user) {
                        return res.status(404).send('Пользователь не найден.');
                }

                // Добавляем новое упражнение в массив user.exercises
                user.exercises.push({
                        name: exercise.name,
                        date: new Date(exercise.date),
                        sessions: [ // <-- ВАЖНО! В схеме у вас 'sessions', а не 'logs'
                                {
                                        date: new Date(exercise.date),
                                        logs: exercise.logs || [] // Если логи пришли, используем их
                                }
                        ]
                });
                await user.save();
                res.status(201).json({ message: 'Успех', exercise: user.exercises[user.exercises.length - 1] }); // Возвращаем созданное упражнение
        } catch (e) {
                console.error("Ошибка при сохранении упражнения:", e);
                res.status(400).send(e);
        }
});

// Обработка добавления новой сессии к упражнению
// --- НОВЫЙ ЭНДПОИНТ ДЛЯ ДОБАВЛЕНИЯ ЛОГА ---
app.post('/api/exercises/:id/sessions/log', async (req, res) => {
        const exerciseId = req.params.id;
        const { weight, reps } = req.body; // Получаем данные лога

        try {
                // Находим пользователя, у которого есть это упражнение
                const user = await UserExercise.findOne({ 'exercises._id': exerciseId });
                if (!user) {
                        return res.status(404).send('Упражнение или пользователь не найдены.');
                }

                const exercise = user.exercises.id(exerciseId);
                if (!exercise) {
                        return res.status(404).send('Упражнение не найдено.');
                }

                // Находим последнюю сессию упражнения
                const lastSession = exercise.sessions[exercise.sessions.length - 1];

                if (!lastSession) {
                        return res.status(400).send('У упражнения нет ни одной сессии для добавления лога.');
                }

                // Добавляем новый лог в последнюю сессию
                lastSession.logs.push({ weight, reps });

                await user.save();

                res.status(201).send({ message: 'Лог успешно добавлен' });

        } catch (e) {
                console.error("Ошибка при добавлении лога:", e);
                res.status(500).send('Произошла ошибка на сервере.');
        }
});


// Добавление новой сессии к упражнению пользователя
app.post('/api/exercises/:id/sessions', async (req, res) => {
        const exerciseId = req.params.id;
        const newSession = req.body; // { date: ..., logs: [] }

        try {
                // Находим пользователя, у которого есть это упражнение
                const user = await UserExercise.findOne({ 'exercises._id': exerciseId });
                if (!user) return res.status(404).send('Упражнение не найдено.');

                // Находим само упражнение в массиве
                const exercise = user.exercises.id(exerciseId);
                if (!exercise) return res.status(404).send('Упражнение не найдено.');

                // Добавляем новую сессию
                exercise.sessions.push(newSession);
                await user.save();

                res.status(201).send({ message: 'Сессия успешно добавлена' });
        } catch (e) {
                console.error(e);
                res.status(500).send('Ошибка сервера');
        }
});

import { ObjectId } from 'mongoose';

// --- ИСПРАВЛЕННЫЙ ОБРАБОТЧИК ДЛЯ ОБНОВЛЕНИЯ УПРАЖНЕНИЯ ---
app.put('/api/exercises/:exerciseId', async (req, res) => {
        console.log('PUT запрос на /api/exercises/:exerciseId');
        console.log('Тело запроса:', req.body); // Логируем данные для отладки

        const { exerciseId } = req.params;
        const { sessions } = req.body;

        // Проверка валидности ID упражнения
        if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
                return res.status(400).json({ message: 'Некорректный формат ID упражнения' });
        }

        // Проверка, что данные для обновления пришли
        if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
                return res.status(400).json({ message: 'Данные для обновления не предоставлены' });
        }

        try {
                // req.user доступен благодаря middleware!
                const userEmail = req.user.email;

                // Находим пользователя, у которого есть упражнение с нужным ID
                const user = await UserExercise.findOne({
                        email: userEmail,
                        'exercises._id': exerciseId
                });

                if (!user) {
                        return res.status(404).json({ message: 'Упражнение не найдено или нет доступа' });
                }

                // Получаем конкретное упражнение из массива
                const exercise = user.exercises.id(exerciseId);

                // Заменяем весь массив sessions на новый, пришедший с фронта
                // Это самый надежный способ обновить вложенный массив
                exercise.sessions = sessions;

                // Сохраняем обновленного пользователя
                await user.save();

                res.status(200).json({ message: 'Упражнение успешно обновлено' });

        } catch (error) {
                console.error('Ошибка при обновлении:', error);
                res.status(500).json({ message: 'Ошибка сервера', error: error.message });
        }
});

app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Что-то пошло не так!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`)
});