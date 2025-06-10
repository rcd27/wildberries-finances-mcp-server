# WB Finances MCP Server

MCP сервер для работы с API Wildberries Finances.
- Описаны все ручки из OpenAPI спецификации, выставлены как `Tool` (src/tools/api)
- Добавлены некоторые "кастомные" `Tool`ы (src/tools/custom)

## Установка

```bash
npm install
```

## Настройка

1. Создайте файл `.env` в корневой директории проекта(по примеру .env.example)
2. Добавьте следующие переменные окружения:
   ```
   WB_FINANCES_OAUTH_TOKEN=your_oauth_token_here
   NODE_ENV=development
   ```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

## Использование

Сервер предоставляет следующие инструменты:

- `getReportDetailByPeriod` - Получение детализации по еженедельным отчётам реализации
- `getTotalCommissionByPeriod` - Подсчёт отчислений в пользу WB + НДС за период
- `getDocumentCategories` - Получение категорий документов
- `getDocumentList` - Получение списка документов
- `downloadDocument` - Загрузка одного документа
- `downloadDocumentsAll` - Загрузка нескольких документов
- `generateWeeklyReport` - Генерация еженедельного отчёта

## Безопасность

- API ключ должен храниться в переменных окружения
- Не включайте файл `.env` в систему контроля версий
- Используйте разные API ключи для разработки и продакшена 