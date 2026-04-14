
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

const email = ref('q@mail.ru');
const password = ref('1');
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
// Добавьте эту строку вместе с другими объявлениями ref
const currentUserId = ref(null);
onMounted(() => {
  // loadingExercise();
  fetchUsers();
});
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value; // Переключаем режим
};
/*
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
};*/

// Функция для получения заголовков Basic Auth
const getBasicAuthConfig = () => {
  // ВАЖНО: В реальном приложении хранить пароль в localStorage небезопасно.
  // Для локальной разработки это допустимо.
  const username = 'q@mail.ru'; // Ваш email
  const password = '1'; // Ваш пароль

  // Кодируем строку "email:password" в Base64
  const base64Credentials = btoa(`${username}:${password}`);

  return {
    headers: {
      'Authorization': `Basic ${base64Credentials}`
    }
  };
};
// Функция для получения заголовков авторизации
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  // Если токена нет, можно вернуть пустые заголовки или обработать это как ошибку
  return token ? { Authorization: `Bearer ${token}` } : {};
};
// Предположим, у вас есть переменные userEmail и userPassword или объект loggedInUser

const fetchUserExercises = async (userId) => {
  // Если userId не передан или пуст, просто очищаем список и выходим.
  // Это может произойти при выходе из аккаунта.
  if (!userId) {
    exercises.value = []; // Очищаем список упражнений
    return;
  }

  try {
    const response = await axios.get(`http://localhost:3000/api/exercises?userId=${userId}`, getBasicAuthConfig());
    exercises.value = response.data;
    console.log('Упражнения успешно загружены:', exercises.value);
  } catch (error) {
    console.error('Ошибка при получении упражнений:', error);
    // Если ошибка 401 (неавторизован), возможно, токен протух.
    // Очищаем список и, возможно, просим пользователя войти снова.
    if (error.response && error.response.status === 401) {
      exercises.value = [];
      alert('Сессия истекла. Пожалуйста, войдите снова.');
      // localStorage.removeItem('token'); // Можно удалить токен
    } else {
      // При других ошибках просто оставляем список пустым
      exercises.value = [];
    }
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
      await fetchUserExercises(userId.value); // Получаем упражнения для данного пользователя
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


/*const fetchUsers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/users'); // Запрос на получение всех пользователей
    users.value = response.data; // Сохраняем всех пользователей в массив
    console.log(users.value)
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
  }
};*/


// Замените вашу функцию fetchUsers на эту:
const fetchUsers = async () => {
  try {
    // Используем параметр auth. 
    // Введите свои реальные данные для входа на сервер.
    const response = await axios.get('http://localhost:3000/api/users', {
      auth: {
        username: 'q@mail.ru', // Ваш email пользователя, который зарегистрирован
        password: '1' // Его пароль
      }
    });
    users.value = response.data; // Сохраняем всех пользователей в массив
    console.log('Список пользователей получен:', users.value);
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
/*
const fixLog = async (item) => { // Убираем exIndex, он не используется
  console.log('Before fixLog:', item);

  // 1. Создаем глубокую копию объекта item, чтобы не мутировать оригинал
  const updatedItem = JSON.parse(JSON.stringify(item));

  // 2. Работаем с копией
  if (!Array.isArray(updatedItem.sessions)) {
    updatedItem.sessions = [];
  }

  if (updatedItem.sessions.length === 0) {
    // Создаем новую сессию в копии
    updatedItem.sessions.push({ date: new Date().toISOString().slice(0, 10), logs: [] });
  }

  const session = updatedItem.sessions[updatedItem.sessions.length - 1];
  const w = updatedItem.weight != null ? updatedItem.weight : 0;
  const r = updatedItem.reps != null ? updatedItem.reps : 0;

  // Добавляем лог в копию
  session.logs.push({ weight: w, reps: r });

  console.log('Данные для отправки (копия):', updatedItem);

  if (!updatedItem.name) {
    throw new Error("Название упражнения не задано");
  }

  // 3. Отправляем на сервер чистую копию
  //await updateExercise(updatedItem._id, updatedItem);
};
// Удалите или закомментируйте старую функцию updateExercise
// const updateExercise = async (...args) => { ... }
*/
const fixLog = async (item) => {
  // 1. Находим индекс текущего упражнения в основном массиве exercises.value
  const itemIndex = exercises.value.findIndex(ex => ex._id === item._id);

  if (itemIndex === -1) {
    console.error("Упражнение не найдено в локальном массиве.");
    return;
  }

  // 2. Получаем значения веса и повторений из формы
  const w = item.weight != null ? item.weight : 0;
  const r = item.reps != null ? item.reps : 0;

  // Если веса и повторы не указаны, нет смысла отправлять запрос
  if (w === 0 && r === 0) {
    console.warn("Вес и повторы равны нулю. Лог не добавлен.");
    return;
  }

  // 3. Создаем новый объект лога, который нужно отправить на сервер
  const newLog = { weight: w, reps: r };

  try {
    // --- ОТПРАВКА ЗАПРОСА НА СЕРВЕР ---
    // Мы отправляем только новый лог, а не весь объект упражнения.
    // Сервер сам добавит его в последнюю сессию.
    await axios.post(
      `http://localhost:3000/api/exercises/${item._id}/sessions/log`, // <-- НОВЫЙ ЭНДПОИНТ (см. ниже)
      newLog,
      getBasicAuthConfig()
    );

    // --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА (ТОЛЬКО ПОСЛЕ УСПЕХА!) ---
    // Находим последнюю сессию в локальном массиве и добавляем лог туда.
    // Это Vue-совместимый способ обновления.
    const sessions = exercises.value[itemIndex].sessions;
    const lastSessionIndex = sessions.length - 1;

    if (lastSessionIndex >= 0) {
      // Используем .push() для массива - это реактивно
      sessions[lastSessionIndex].logs.push(newLog);
    } else {
      console.error("Нет сессий для добавления лога.");
    }

    console.log('Лог успешно добавлен в интерфейс и на сервер.');

  } catch (error) {
    console.error('Ошибка при добавлении лога:', error.response ? error.response.data : error);
    alert("Не удалось сохранить результат. Проверьте консоль на наличие ошибок.");
  }
};
const updateExercise = async (exerciseId, exerciseData) => {
  console.log('Переданные данные для обновления:', exerciseData);

  try {
    // Исправлено: добавлены кавычки для URL
    const response = await axios.put(`http://localhost:3000/api/exercises/${exerciseId}`, exerciseData, getBasicAuthConfig());
    console.log('Упражнение успешно обновлено:', response.data);
  } catch (error) {
    console.error('Ошибка при обновлении на сервере', error.message, error.stack);
    console.error('Ошибка при обновлении на сервере', error.response ? error.response.data : error);
  }
};

const addExercise = async (item) => {
  // Находим индекс текущего упражнения в основном массиве exercises.value
  const itemIndex = exercises.value.findIndex(ex => ex._id === item._id);

  if (itemIndex === -1) return; // Защита, если элемент не найден

  // Создаем копию упражнения из основного массива
  const updatedItem = JSON.parse(JSON.stringify(exercises.value[itemIndex]));

  // Создаем новую сессию
  const newSession = {
    date: new Date().toISOString(),
    logs: []
  };

  // Добавляем сессию в копию упражнения
  if (!Array.isArray(updatedItem.sessions)) {
    updatedItem.sessions = [];
  }
  updatedItem.sessions.push(newSession);

  try {
    // Отправляем на сервер копию с новой сессией
    const response = await axios.post(
      `http://localhost:3000/api/exercises/${updatedItem._id}/sessions`,
      newSession,
      getBasicAuthConfig()
    );

    console.log('Занятие успешно добавлено:', response.data);

    // Обновляем основной массив exercises.value с помощью Vue-совместимого метода,
    // чтобы интерфейс отреагировал на изменение.
    exercises.value[itemIndex] = updatedItem;

    // Флаги для UI
    openAccardion.value = item._id;
    openDetails.value = exercises.value[itemIndex].sessions.length - 1; // Открываем последнюю сессию
    flagBtn.value = true;

  } catch (error) {
    console.error('Ошибка при добавлении упражнения:', error.message);
    // Если запрос упал, откатываем изменение в массиве или просто ничего не делаем.
    // fetchUserExercises(); // Можно перезагрузить данные с сервера для надежности
  }
};

const del = async (exerciseId) => {
  // userId берем из глобального состояния
  if (!userId.value) return;

  console.log("Deleting exercise with ID:", exerciseId);

  try {
    // Отправляем запрос на удаление на сервер
    await axios.delete(`http://localhost:3000/api/exercises/${userId.value}/${exerciseId}`, getBasicAuthConfig());

    // ТОЛЬКО ЕСЛИ ЗАПРОС УСПЕШЕН, мы обновляем интерфейс.
    // Самый надежный способ — просто перезагрузить данные с сервера.
    // Это гарантирует, что состояние UI и БД синхронизировано.
    await fetchUserExercises(userId.value);

    // Если вы хотите обновить массив вручную для мгновенного эффекта (оптимистично),
    // это нужно делать только ПОСЛЕ успешного ответа от сервера и с проверкой на ошибку.
    // Но перезагрузка через fetch проще и надежнее для начинающих.

    console.log('Упражнение успешно удалено. Список обновлен.');

  } catch (e) {
    // Если произошла ошибка, мы НЕ меняем интерфейс.
    // Пользователь увидит старое состояние и сообщение об ошибке.
    alert("Ошибка при удалении упражнения. Данные не были изменены.");
    console.error("Ошибка при удалении упражнения:", e.response ? e.response.data : e);

    // Не нужно здесь вызывать fetchUserExercises(), так как мы хотим оставить UI в прежнем состоянии.
  }
};

const addNewExercise = async () => {
  if (!userId.value) {
    alert("Пожалуйста, войдите в систему, чтобы добавить упражнение.");
    return;
  }
  if (nameExer.value.trim() !== "") {
    const payload = {
      email: currentEmail.value,
      exercise: { // <-- Единственное число!
        name: nameExer.value,
        date: new Date().toISOString(),
        logs: []
      }
    };

    try {
      const response = await saveExercise(payload);
      console.log('Упражнение успешно добавлено:', response.data);

      // Обновляем локальный список (если API вернет новое упражнение)
      if (response.data && response.data.exercise) {
        exercises.value.push(response.data.exercise);
      }

      nameExer.value = "";
      flagAccardion.value = false;
      await fetchUserExercises(userId.value); // Надежный способ обновить список

    } catch (error) {
      console.error('Ошибка при добавлении нового упражнения:', error.response ? error.response.data : error);
    }
  }
};
console.log('Фильтрованные элементы:', filteredItems.value);


const saveExercise = async (exerciseData) => {
  try {
    const response = await axios.post('http://localhost:3000/api/exercises', exerciseData, getBasicAuthConfig());
    console.log('Упражнение успешно сохранено:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при сохранении на сервере', error.response.data);
    throw error;
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
              <button @click.stop="del(item._id)">del</button>
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






