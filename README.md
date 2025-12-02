# Youth Portal & Micro-Internships MVP

Production-ready MVP для порталу молоді, де підлітки можуть знаходити та проходити короткі мікро-стажування (3-6 тижнів), організовані НУО.

## Технологічний стек

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API routes + Server Actions
- **Database**: PostgreSQL з Prisma ORM
- **Auth**: NextAuth.js
- **Testing**: Jest + React Testing Library

## Вимоги

- Node.js 18 або вище
- PostgreSQL база даних
- npm або yarn

## Повна інструкція з запуску

### Крок 1: Клонування репозиторію

```bash
git clone https://github.com/IvanShynkarenko/App_Youth_portal.git
cd App_Youth_portal
```

### Крок 2: Встановлення залежностей

```bash
npm install
```

### Крок 3: Налаштування бази даних PostgreSQL

#### Варіант A: Локальна PostgreSQL (macOS)

1. Переконайтеся, що PostgreSQL встановлений та запущений:
```bash
# Перевірка статусу
brew services list | grep postgresql
# Або запустіть вручну
brew services start postgresql
```

2. Створіть базу даних:
```bash
createdb youth_portal
```

3. Перевірте, який користувач PostgreSQL використовується:
```bash
whoami
# Запам'ятайте це ім'я користувача (наприклад, "johny")
```

#### Варіант B: Docker (рекомендовано)

Якщо у вас немає локальної PostgreSQL, використовуйте Docker:

```bash
docker-compose up -d postgres
```

Це запустить PostgreSQL в контейнері.

### Крок 4: Налаштування змінних оточення

1. Створіть файл `.env` в корені проекту:

```bash
cp .env.example .env
```

2. Відредагуйте `.env` файл:

**Для macOS (локальна PostgreSQL):**
```env
DATABASE_URL="postgresql://ВАШЕ_ІМ'Я_КОРИСТУВАЧА@localhost:5432/youth_portal"
NEXTAUTH_SECRET="ваш-секретний-ключ-тут"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**Для Docker:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/youth_portal"
NEXTAUTH_SECRET="ваш-секретний-ключ-тут"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

3. Згенеруйте секретний ключ для NextAuth:

```bash
openssl rand -base64 32
```

Скопіюйте результат та вставте в `NEXTAUTH_SECRET`.

### Крок 5: Налаштування бази даних

1. Згенеруйте Prisma Client:
```bash
npm run db:generate
```

2. Створіть схему бази даних:
```bash
npm run db:push
```

3. Заповніть базу даних тестовими даними:
```bash
npm run db:seed
```

### Крок 6: Запуск додатку

#### Режим розробки:
```bash
npm run dev
```

Додаток буде доступний за адресою: **http://localhost:3000**

#### Production режим:
```bash
npm run build
npm start
```

### Крок 7: Доступ до додатку

Відкрийте браузер та перейдіть на: **http://localhost:3000**

## Тестові облікові записи

Після виконання `npm run db:seed` ви можете увійти з такими обліковими записами:

- **Admin**: 
  - Email: `admin@ngo.org`
  - Password: `password123`

- **Mentor**: 
  - Email: `mentor@company.com`
  - Password: `password123`

- **Student**: 
  - Email: `andriy@example.com`
  - Password: `password123`

## Запуск через Docker (повний стек)

Якщо ви хочете запустити все через Docker:

```bash
docker-compose up -d
```

Це запустить:
- PostgreSQL базу даних
- Next.js додаток

Додаток буде доступний на **http://localhost:3000**

## Корисні команди

```bash
# Розробка
npm run dev              # Запуск dev сервера
npm run build            # Збірка для production
npm start                # Запуск production сервера

# База даних
npm run db:generate      # Генерація Prisma Client
npm run db:push          # Синхронізація схеми з БД
npm run db:migrate       # Створення міграції
npm run db:seed          # Заповнення тестовими даними
npm run db:studio        # Відкрити Prisma Studio (GUI для БД)

# Тестування
npm test                 # Запуск тестів
npm run test:watch       # Тести в режимі спостереження

# Лінтинг
npm run lint             # Перевірка коду
```

## Структура проекту

```
├── app/                    # Next.js App Router сторінки
│   ├── (auth)/            # Маршрути авторизації
│   ├── (dashboard)/       # Захищені маршрути дашбордів
│   │   ├── dashboard/     # Студентський дашборд
│   │   ├── mentor/        # Дашборд ментора
│   │   └── admin/         # Адмін панель
│   ├── api/               # API маршрути
│   ├── internships/       # Публічні сторінки стажувань
│   └── applications/      # Статус заявок
├── components/            # React компоненти
│   ├── ui/                # Переіспользувані UI компоненти
│   └── navbar.tsx        # Навігація
├── lib/                   # Утиліти та сервіси
│   ├── auth.ts           # Конфігурація NextAuth
│   ├── prisma.ts         # Prisma клієнт
│   └── utils.ts          # Допоміжні функції
├── prisma/                # Prisma схема та міграції
│   ├── schema.prisma     # Схема бази даних
│   └── seed.ts           # Скрипт заповнення даними
└── __tests__/             # Тестові файли
```

## Ролі користувачів

1. **Student (Студент)**: Подача заявок на стажування, відстеження прогресу, подання завдань
2. **Mentor (Ментор)**: Перегляд роботи студентів, надання зворотного зв'язку
3. **Admin (Адміністратор)**: Управління стажуваннями, заявками та менторами

## Ключові функції

- Публічний список стажувань з пошуком/фільтрацією
- Коротка форма заявки (мінімум бюрократії)
- Прозоре відстеження статусу заявки
- Тижневі плани завдань з поданням артефактів
- Система зворотного зв'язку від менторів
- Адмін панель з аналітикою

## Вирішення проблем

### Помилка доступу до бази даних

**Помилка**: `User 'postgres' was denied access`

**Рішення**: 
1. Перевірте ваше ім'я користувача: `whoami`
2. Оновіть `DATABASE_URL` в `.env` файлі:
   ```env
   DATABASE_URL="postgresql://ВАШЕ_ІМ'Я@localhost:5432/youth_portal"
   ```
3. Переконайтеся, що база даних створена: `createdb youth_portal`

### Порт 3000 вже зайнятий

**Рішення**: 
- Зупиніть інший процес на порту 3000
- Або змініть порт в `package.json` скрипті `dev`

### Помилки Prisma

**Рішення**:
```bash
npm run db:generate
npm run db:push
```

## Розробка

### Додавання нових функцій

1. Оновіть Prisma схему в `prisma/schema.prisma`
2. Запустіть `npm run db:push` для синхронізації
3. Створіть API маршрути в `app/api/`
4. Додайте UI компоненти в `components/`

### Тестування

Тести знаходяться в `__tests__/` директорії. Запустіть:

```bash
npm test
```

## Ліцензія

MIT

## Підтримка

Якщо виникли питання або проблеми, створіть issue в репозиторії.
