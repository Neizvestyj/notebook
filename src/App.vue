
<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import axios from 'axios';
const openAccardion = ref(null);
const openDetails = ref(null);
const flagBtn = ref(false);
const nameExer = ref("");
const flagAccardion = ref(false);
const users = ref([]);
const user = ref({});

const email = ref('');
const password = ref('');
const isLoginMode = ref(true);
const userId = ref(null);
const exercises = ref([]);
//const userId = ref(null);
const items = ref([]);
const status = ref(false);
const itemss = ref([
  {
    id: 1,
    name: "Тяга блока в горизонтале",
    exercise: [
      {
        date: new Date().toLocaleDateString(),
        logs: []
      }
    ]

  },
  {
    id: 2,
    name: "Вертикальна тяга блока",
    exercise: [
      {
        date: new Date().toLocaleDateString(),
        logs: []
      }
    ]
  },
  {
    id: 3,
    name: "Подьем штанги на бицепс",
    exercise: [
      {
        date: new Date().toLocaleDateString(),
        logs: []
      }
    ]
  },
]);
const currentEmail = ref('');
onMounted(() => {
  // loadingExercise();
  fetchUsers();
});
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value; // Переключаем режим
};
const fetchUserExercises = async () => {
  if (!userId.value) {
    console.error('userId не установлен. Запрос не будет выполнен.');
    return; // Не выполняем запрос, если userId равен null
  }
  try {
    const response = await axios.get(`http://localhost:3000/api/exercises?userId=${userId.value}`);
    exercises.value = response.data; // Сохраняем упражнения
    console.log('Полученные упражнения:', response.data); // Для отладки
  } catch (error) {
    console.error('Ошибка при получении упражнений:', error);
  }
};

const addUser = async () => {
  console.log('Функция addUser вызвана'); // Это поможет понять, вызывается ли функция
  console.log('Email:', email.value); // Логируем email
  console.log('Пароль:', password.value); // Логируем пароль

  if (!email.value || !password.value) {
    console.log('Email или пароль пустые'); // Добавьте это
    alert("Пожалуйста, заполните все поля.");
    return;
  }
  try {
    const response = await axios.post('http://localhost:3000/api/users/register', {
      email: email.value,
      password: password.value,

    });
    if (response && response.data) {
      console.log('Пользователь успешно зарегистрирован:', response.data);
      user.value = response.data.user; // Получаем пользователя с сервера
      userId.value = user.value._id; // Или user.value.<i>id, в зависимости от ответа сервера
      await fetchUserExercises();
    } else {
      console.error('Ответ от сервера не содержит данных:', response);
    }

    email.value = "";
    password.value = "";
  } catch (error) {
    if (error.response && error.response.status === 400) {
      alert("Этот email уже зарегистрирован. Пожалуйста, войдите в систему.");
    } else {
      alert("Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.");
    }
    console.error('Ошибка регистрации:', error.response.data);
  }
  fetchUsers();
};



const loginUser = async () => {
  console.log('Функция loginUser вызвана'); // Это поможет понять, вызывается ли функция
  console.log('Email:', email.value); // Логируем email
  // Не логируем пароль для безопасности

  try {
    const response = await axios.post('http://localhost:3000/api/users/login', {
      email: email.value,
      password: password.value
    });

    console.log('Ответ сервера:', response.data); // Логируем ответ от сервера

    // Проверяем ответ от сервера
    if (response && response.data) {
      console.log('Успешный вход:', response.data);
      user.value = response.data; // Получаем пользователя с сервера
      userId.value = user.value._id; // Устанавливаем userId
      await fetchUserExercises(); // Получаем упражнения для данного пользователя
      console.log('Упражнения:', userId.value); // Логируем userId
      // Сохраняем токен и обновляем email
      localStorage.setItem('token', response.data.token); // Сохраняем токен
      currentEmail.value = email.value;

      // Очищаем поля ввода
      email.value = '';
      password.value = '';
    } else {
      console.error('Проблема с данными пользователя:', response.data);
      alert('Не удалось получить данные пользователя. Пожалуйста, попробуйте снова.');
    }
  } catch (error) {
    alert('Неверный email или пароль. Пожалуйста, попробуйте снова.');
    console.error('Ошибка входа:', error.response ? error.response.data : error);
  }
};


const fetchUsers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/users'); // Запрос на получение всех пользователей
    users.value = response.data; // Сохраняем всех пользователей в массив
    console.log(users.value)
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
  }
};


const filteredItems = computed(() => {
  console.log('Фильтруемые упражнения:', exercises.value);
  console.log('Текущий userId:', userId.value);

  return exercises.value.filter(item => {
    if (!item.userId) {
      console.warn('userId отсутствует в упражнении:', item);
      return false;
    }

    // Проверка типов и нормализация
    console.log('Типы:', typeof item.userId, typeof userId.value);
    const match = item.userId.toString().trim().toLowerCase() === userId.value.toString().trim().toLowerCase();
    console.log(`Фильтрация: item.userId = ${item.userId}, userId = ${userId.value}, match = ${match}`);
    return match;
  });
});
const toggleAccardion = (_id) => {
  openAccardion.value = openAccardion.value === _id ? null : _id;
};

const fixLog = async (item, exIndex) => {
  console.log('Before fixLog:', item);
  //item.logs.unshift({ weight: item.weight, reps: item.reps })
  // если нет тренировок, создаём новую
  if (!Array.isArray(item.exercise) || item.exercise.length === 0) {
    item.exercise = [{ date: new Date().toISOString().slice(0, 10), logs: [] }];
  }
  const session = item.exercise[item.exercise.length - 1];
  const w = item.weight != null ? item.weight : 0;
  const r = item.reps != null ? item.reps : 0;
  console.log('Current session:', session);
  session.logs.push({ weight: w, reps: r });

  const exerciseData = {
    ...item,
    _id: item._id,
    name: item.name,
    exercise: item.exercise,
    // Убедитесь, что вы добавляете <i>id для обновления
  };
  console.log('Переданные данные для обновления:', exerciseData);
  if (!exerciseData._id) {
    throw new Error("ID упражнения не задан"); // Выбросьте ошибку раньше, чтобы избежать дальнейших проблем
  }
  await updateExercise(exerciseData);
  //saveExercise(item)
};
const updateExercise = async (exerciseData) => {
  console.log('Переданные данные для обновления:', exerciseData);
  if (!exerciseData._id) {
    throw new Error("ID упражнения не задан");
  }
  try {
    const response = await axios.put(`http://localhost:3000/api/exercises/${exerciseData._id}`, exerciseData);
    console.log('Упражнение успешно обновленоoo:', response.data);
  } catch (error) {
    console.error('Ошибка при обновлении на сервере', error.message, error.stack);
    console.error('Ошибка при обновлении на сервере', error.response.data);
  }
};

/*const addExercise = async (item) => {
  // Проверяем, существует ли массив exercise
  if (!Array.isArray(item.exercises)) {
    item.exercises = [];
  }
  // Добавляем новое упражнение с текущей датой
  const newSession = {
    date: new Date().toISOString(),
    logs: []
  };
  console.log(JSON.stringify(newSession, null, 2))

  item.exercises.push(newSession); // Добавляем новое упражнение в массив

  // Открываем аккордеон, если нужно
  openAccardion.value = item._id;
  console.log(JSON.stringify(item, null, 2))
  try {
    // Сохраняем новое упражнение на сервере
    // const response = await axios.post(`/api/exercises/${item._id}/sessions`, newSession);
    const response = await axios.post(`http://localhost:3000/api/exercises/${item._id}`, {
      exercises: [newSession]
    });

    console.log('Занятие успешно добавлено:', response.data);
    await fetchUserExercises(); // Обновите список упражнений, если это необходимо
    // const response = await saveExercise(item);
    console.log('Упражнение успешно добавлено:', response.data);
  } catch (error) {
    console.error('Ошибка при добавлении упражнения:', error.message);
  }

  // Закрываем детали и устанавливаем флаг
  openDetails.value = 0;
  flagBtn.value = true;

};
*/
const addExercise = async (item) => {
  // Проверяем, существует ли массив sessions
  if (!Array.isArray(item.exercises)) {
    item.exercises = [];
  }

  // Создаем новую сессию упражнения
  const newSession = {
    date: new Date().toISOString(),
    logs: []
  };

  // Добавляем новую сессию к нужному упражнению
  if (Array.isArray(item.exercises)) {
    const targetExercise = item.exercises.find(ex => ex.name === nameExer.value); // Найдите нужное упражнение
    if (targetExercise) {
      if (!Array.isArray(targetExercise.sessions)) {
        targetExercise.sessions = [];
      }
      targetExercise.sessions.push(newSession); // Добавляем новую сессию
    }
  }
  // Логируем новую сессию
  console.log(JSON.stringify(newSession, null, 2));
  // Открываем аккордеон, если нужно
  openAccardion.value = item._id;
  try {
    // Сохраняем новое упражнение на сервере
    const response = await axios.post(`http://localhost:3000/api/exercises/${item._id}/sessions`, newSession);

    console.log('Занятие успешно добавлено:', response.data);
    await fetchUserExercises(); // Обновите список упражнений, если это необходимо
  } catch (error) {
    console.error('Ошибка при добавлении упражнения:', error.message);
  }
  // Закрываем детали и устанавливаем флаг
  openDetails.value = 0;
  flagBtn.value = true;
};

const del = async (userId, exerciseId) => {
  console.log("Deleting exercise with ID:", exerciseId); // Выводим ID
  try {
    await axios.delete(`http://localhost:3000/api/exercises/${userId}/${exerciseId}`);
    items.value = items.value.filter(item => item._id !== exerciseId); // Обновляем список
    fetchUserExercises(); // Обновляем список упражнений
  } catch (e) {
    alert("Ошибка при удалении данных с сервера");
    console.error("Ошибка при удалении данных с сервера", e);
  }
};

const addNewExercise = async () => {
  if (nameExer.value !== "") {
    const newExercise = {
      userId: userId.value,
      email: currentEmail.value,
      exercises: [{
        name: nameExer.value,
        date: new Date(),//.toLocaleDateString(),
        logs: []
      }]
    };

    try {
      const response = await saveExercise(newExercise); // Сохраняем на сервере
      console.log('Упражнение успешно добавлено:', response);
      nameExer.value = ""; // Сбрасываем поле ввода
      flagAccardion.value = false; // Закрываем аккордеон
      await fetchUserExercises();
    } catch (error) {
      console.error('Ошибка при добавлении нового упражнения:', error);
    }
  }
};
console.log('Фильтрованные элементы:', filteredItems.value);
const saveExercise = async (exerciseData) => {
  try {
    const response = await axios.post('http://localhost:3000/api/exercises', exerciseData);
    console.log('Упражнение успешно сохранено:', response.data);
  } catch (error) {
    console.error('Ошибка при сохранении на сервере', error.response.data);
  }
};

</script>

<template>
  <div v-if="exercises.length === 0">Нет доступных упражнений.</div>


  <div>
    <h1>Управление пользователями</h1>
    <ul>
      <li v-for="user in users" :key="user.id">{{ user.email }}</li>
    </ul>
  </div>
  <div>
    <button @click="del()">del</button>
    <span class="status" v-if="status">&#128994;</span>
    <span class="status" v-else>&#128308;</span>

    <div>
      <h2>{{ isLoginMode ? 'Login' : 'Sign up for an account' }}</h2>

      <form @submit.prevent="isLoginMode ? loginUser() : addUser()">
        <button @click="addUser(e, p)">addUser</button>
        <button @click="loginUser()">loginUser</button>
        <div>
          <label for="email">Email</label>
          <input id="email" type="email" v-model="email" />
        </div>
        <div>
          <label for="password">Password</label>
          <input id="password" type="password" v-model="password" />
        </div>
        <div>
          <button type="submit">{{ isLoginMode ? 'Login' : 'Sign up' }}</button>

        </div>
      </form>

    </div>
    <button @click="toggleMode">{{ isLoginMode ? 'Switch to Sign up' : 'Switch to Login' }}</button>


    <div>
      <h2>User: {{ user.email }}</h2>
    </div>

    <div>
      <h2>Users</h2>
      <ul v-for="(u, index) in users" :key="index">
        <li>
          <span>{{ u.email }}</span>
        </li>
      </ul>
    </div>

    <div class="list-wrapper">
      <draggable v-model="items"
        :options="{ handle: '.drag-handle', scroll: true, scrollSensitivity: 40, scrollSpeed: 10 }" animation="150"
        :ghost-class="'ghost'" tag="ul" class="list">

        <div v-for="   item    in    exercises   " :key="item._id">
          <div :class="['accordion', { open: openAccardion === item._id }]">
            <div @click="toggleAccardion(item._id)" class="head">
              <span>{{ item.name }}</span>
              <span class="icon drag-handle">☰</span>
              <button @click.stop="del(userId, item._id)">del</button>
            </div>

            <div v-if="openAccardion === item._id" class="body">

              <div class="section">
                <div class="selectName box">
                  <span>ВЕС В КГ</span>

                  <select v-model.number="item.weight">
                    <option v-for="   n    in    100   " :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>

                <div class="selectName box">
                  <span>ПОВТОРЕНИЯ</span>
                  <select v-model.number="item.reps">
                    <option v-for="   n    in    49   " :key="n" :value="n">{{ n }}</option>
                  </select>
                </div>

                <div class="btnGrop">
                  <div>
                    <button @click="fixLog(item, exIndex)" class="btn" id="fixLog">FIX</button>
                  </div>

                  <div>
                    <button @click="addExercise(item)" class="btn btnRigt" id="btnStart">{{ flagBtn ? "END" : "NEW"
                    }}</button>
                  </div>
                </div>
              </div>

              <div class="exercise">
                <ul>
                  <li v-for="(   session, sessionIndex   ) in    item.sessions.slice().reverse()   " :key="sessionIndex">

                    <details :open="openDetails === sessionIndex" class="first-details">

                      <summary class="dateOfexer">{{ item.sessions.length - sessionIndex }} {{ new
                        Date(session.date).toLocaleDateString() }}

                        <span v-if="session.logs.length > 0">{{ Math.max(...session.logs.map(log => log.weight || 0)) }}
                          {{ Math.max(...session.logs.map(log => log.reps || 0)) }}</span>
                      </summary>


                      <div class="building_2">
                        <div class="logsss">
                          <ul>


                            <div class="logs-grid">
                              <div class="grid-header">
                                <div>#</div>
                                <div>Вес</div>
                                <div>Повт.</div>
                              </div>

                              <div class="grid-row "
                                v-for="(   log, logIndex   ) in    session.logs.slice().reverse().filter(l => l.weight != null && l.reps != null)   "
                                :key="logIndex">

                                <div>{{ session.logs.length - logIndex }}</div>
                                <div>{{ log.weight }}</div>
                                <div>{{ log.reps }}</div>
                              </div>

                              <div v-if="session.logs.length === 0" class="no-logs">Логов нет</div>
                            </div>

                          </ul>
                        </div>
                      </div>


                    </details>
                  </li>
                </ul>
              </div>


            </div>
          </div>
        </div>



      </draggable>
    </div>

    <div :class="['accordion', { open: flagAccardion }]">
      <div class="head" @click="flagAccardion = !flagAccardion">
        <span>Открыть панель</span>
        <span class="icon">+</span>
      </div>

      <div v-if="flagAccardion" class="body">
        <p>Введите названия упражнения</p>
        <input v-model="nameExer">
        <button @click="addNewExercise()">Добавить упражнение</button>
      </div>
    </div>

  </div>
</template>






