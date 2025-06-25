# What is Molting?
Molting is an intelligent calendar and productivity app designed to help users break down large goals into manageable daily tasks based on their working habits, energy levels, and deadlines. 
# Project Structure

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

