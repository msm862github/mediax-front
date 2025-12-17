
# MediaX Frontend

مستودع واجهة المستخدم لـ MediaX — تطبيق واجهة ثابت (Vanilla JS, HTML, CSS) مع RTL ودعم عربي.

## المزايا
- صفحات HTML ثابتة مع حقن ديناميكي للمحتوى عبر `js/main.js`
- محاكاة API بسيطة محفوظة في `localStorage` عبر `js/api.js`
- بيانات تجريبية في `data/sample_contents.json`
- اعتمادية على `live-server` لتطوير سريع

## تشغيل محلي
تأكد أن لديك Node.js مثبت ثم:

```bash
npm install
npm run dev
```

افتح `http://localhost:3000` أو العنوان الذي يظهر في الطرفية.

## بنية المشروع
- `index.html`, `movies.html`, `series.html`, ... — صفحات المحتوى
- `css/` — أنماط
- `js/` — سكربتات (main, details, auth, ...)
- `data/sample_contents.json` — بيانات تجريبية

## عمل مع المشروع
- لإضافة عناصر تجريبية، حرّر `data/sample_contents.json`.
- السكربت `js/main.js` سيقوم تلقائياً بحقن البطاقات في الحاويات `.content-cards` و `.content-grid`.
- المفضلة/قائمة المشاهدة مُحاكيتان بواسطة `js/api.js` الذي يستخدم `localStorage`.
