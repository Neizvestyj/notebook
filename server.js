
import mongoose from 'mongoose';
import cors from 'cors';
import express from 'express';
import bcrypt from 'bcrypt';
const app = express();
app.use(cors());
app.use(express.json());

//mongoose.connect('mongodb://localhost:27017/exercise');
mongoose.connect('mongodb://localhost:27017/exercise')
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => console.error('Ошибка подключения к MongoDB:', err));

const userExerciseSchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true }, // Email пользователя
        password: { type: String, required: true }, // Пароль
        exercises: [
                {
                        name: { type: String, required: true }, // Название упражнения
                        sessions: [ // Добавляем поле для занятий
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
        if (this.isModified('password')) {
                const hashedPassword = await bcrypt.hash(this.password, 10); // Ждем окончания хэширования
                this.password = hashedPassword; // Устанавливаем захешированный пароль
        }
});



// Метод для проверки пароля
userExerciseSchema.methods.isValidPassword = async function (password) {
        return await bcrypt.compare(password, this.password);
};


const UserExercise = mongoose.model('UserExercise', userExerciseSchema);

// Обработчик для регистрации
app.post('/api/users/register', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
                return res.status(400).json({ message: 'Email и пароль обязательны.' });
        }

        try {
                const existingUser = await UserExercise.findOne({ email });
                if (existingUser) {
                        return res.status(400).json({ message: 'Пользователь с таким email уже зарегистрирован.' });
                }

                const newUser = new UserExercise({ email, password });
                await newUser.save();
                res.status(201).json({ message: 'Пользователь успешно зарегистрирован.', user: newUser });
        } catch (error) {
                console.error('Ошибка при регистрации пользователя:', error.stack);
                console.error('Ошибка при регистрации пользователя:', error);

                res.status(500).send('Ошибка сервера');
        }
});


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




//Сохранение упражнения по ID
app.put('/api/exercises/:id', async (req, res) => {
        console.log('Полученные данные для обновления:', req.body); // Логируем полученные данные
        try {

                const updatedExercise = await UserExercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
                // const updatedExercise = await Exercise.findOneAndUpdate({ id: req.params.id }, // Если id хранится как поле в документе
                //req.body, { new: true });

                if (!updatedExercise) {
                        return res.status(404).send('Упражнение не найдено');
                }

                res.json(updatedExercise)
        } catch (e) {
                console.error('Ошибка при обновлении:', e); // Добавьте логирование для отладки
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
        console.log("Полученные данные:", req.body); // Логируем входящие данные

        // Предполагается, что вы передаете email пользователя вместе с данными
        const { email, exercises } = req.body;

        try {
                // Находим пользователя по email
                const user = await UserExercise.findOne({ email });

                if (!user) {
                        return res.status(404).send('Пользователь не найден.');
                }
                // Проверка на наличие exercises и его длину
                if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
                        return res.status(400).send('Упражнения не указаны или неверный формат.');
                }

                // Добавляем новое упражнение в массив exercises
                user.exercises.push({
                        name: exercises[0].name,
                        date: new Date(exercises[0].date), // Убедитесь, что дата в правильном формате
                        logs: exercises[0].logs
                });

                // Сохраняем обновленного пользователя
                await user.save();
                res.status(201).send(user); // Возвращаем обновленного пользователя
        } catch (e) {
                console.error("Ошибка при сохранении упражнения:", e);
                res.status(400).send(e);
        }
});

// Обработка добавления новой сессии к упражнению
app.post('/api/exercises/:id/sessions', async (req, res) => {
        const exerciseId = req.params.id; // Получаем ID упражнения из параметров
        const { date, logs } = req.body; // Получаем дату и логи из тела запроса

        try {
                // Находим пользователя по email (или другим критериям)
                const user = await UserExercise.findOne({ 'exercises._id': exerciseId });

                if (!user) {
                        return res.status(404).send('Пользователь или упражнение не найдено.');
                }

                // Находим нужное упражнение по ID
                const exercise = user.exercises.id(exerciseId);
                if (!exercise) {
                        return res.status(404).send('Упражнение не найдено.');
                }

                // Создаем новую сессию
                const newSession = {
                        date: new Date(date), // Дата выполнения
                        logs: logs // Логи, которые пришли в запросе
                };

                // Добавляем новую сессию к упражнению
                exercise.sessions.push(newSession);

                // Сохраняем обновленного пользователя
                await user.save();
                res.status(201).send(user); // Возвращаем обновленного пользователя с добавленной сессией
        } catch (e) {
                console.error("Ошибка при добавлении сессии:", e);
                res.status(500).send('Произошла ошибка на сервере.');
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