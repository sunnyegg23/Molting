# Molting: INTELLIGENT GOAL BREAKDOWN & TASK SCHEDULING APP
---

## 專案背景與目標

Molting 是一款智慧型行事曆與生產力管理網站，協助使用者根據工作習慣與截止日期，將大型目標拆解為可管理的每日任務。

---

## 目標

- 自動將複雜目標分解為結構化的每日任務
- 根據使用者工作習慣提供個人化任務規劃
- 推薦符合使用者目標的學習資源

---

## 系統架構與技術使用

- **前端**：React.js、HTML、CSS
- **後端**：Flask (Python) 模組化架構
- **資料庫**：Firebase Firestore（NoSQL 文件型資料庫）
- **AI 整合**：Mistral LLM API 用於智慧任務分解
- **對話式 AI**：聊天系統，具備AI Agent能力
- **搜尋**：Google Custom Search Engine 推薦資源
- **API 整合**：RESTful 端點，支援 AI agent function calling

---

## 主要功能

- **個人化管理**：根據使用者工作習慣、精力與頻率偏好自動調整
- **自動任務分解**：LLM 協助將大型目標拆解為每日小任務
- **對話式聊天機器人**：與系統對話，探索目標並最佳化任務
- **資源推薦**：智慧搜尋，推薦有助於達成目標的學習資源
- **文件儲存**：儲存使用者想要閱讀或參考的文件、文章與資料

---

## 前後端架構

### Frontend (React)
- HomePage → Goal UI & Habit UI
- WorkingHabitsPage → WorkingHabits
- RESTful API Calls

### Backend (Flask)
- `/routes` → `/services` → `/llm_model`

### AI & 整合
- **Mistral LLM**：目標分解為任務
- **Google CSE API**：學習資源推薦
- **Firebase Firestore**：
  - `users/{userId}/goal_breakdown/tasks/`
  - `users/{userId}/habit_building/tasks/`
  - ...

---

> Molting 讓目標管理與日常規劃變得智慧且個人化，助你高效實現每一個目標。

## Project Structure
```
client/
    public/圖片們放這
    src/
        components/所有頁面不管你是小組件還是page都放這
        css/上述對應頁面小組件或是page的css
    App.css
    App.js
    index.css
    index.js
server/
    app.py
    requirements.txt
```

## Frontend
1. 前端在client這個資料夾
```
cd client
```
2. 請run以下指令以開啟前端伺服器
```
npm start
```

## Backend
1. 後端在server這個資料夾
```
cd server
```
2. 下載套件時請run以下指令
```
pip install -r requirements.txt
```
3. 請run以下指令以開啟後端伺服器
```
python app.py
```

## Swagger
1. 開啟伺服器後進入這個網址可以看到api文件長相
```
http://localhost:5000/swagger
```

