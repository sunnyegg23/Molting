# app.py 修改後程式碼
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# 第一步：初始化 Firebase
cred = credentials.Certificate("molting-llm-firebase-adminsdk-fbsvc-f5642adbc4.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ====test====

import requests
import os
from mistralai import Mistral
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("MISTRAL_API_KEY")
model = "open-mistral-7b"
client = Mistral(api_key=api_key)

# ====test====
# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 第二步：初始化 Flask
app = Flask(__name__)
CORS(app)

# 第三步：導入藍圖（此時 Firebase 已初始化）

from article_reminder.routes import article_bp
from goal_breakdown.routes import breakdown_bp
from chat_bot.routes import chat_bp
from ai_agent.routes import agent_bp
from habits_building.routes import habit_building_bp
from file_manage.routes import upload_bp
from working_habits.routes import working_habits_bp

# from learning_resource.routes import resource_bp
app.register_blueprint(article_bp, url_prefix='/api')
app.register_blueprint(breakdown_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(agent_bp, url_prefix='/api')
app.register_blueprint(habit_building_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(working_habits_bp, url_prefix='/api')

# app.register_blueprint(resource_bp, url_prefix='/api')
    
# ====test====

@app.route('/api/schedule', methods=['POST'])
def generate_schedule():
    data = request.get_json()

    required_fields = ['user_type', 'current_working_F', 'ideal_working_f', 'learning_type', 'optional']
    if not all(field in data for field in required_fields):
        return jsonify({'error': '缺少必要欄位'}), 400

    prompt = f"""
你是一位時間管理與行為心理學專家。請根據下列使用者資料，幫他規劃出「今日的任務清單」，格式需包含時間區段、任務名稱與簡要目的。

使用者類型：{data['user_type']}
目前做事頻率：{data['current_working_F']}
理想做事頻率：{data['ideal_working_f']}
學習偏好：{data['learning_type']}
額外資訊：{data['optional']}

請以工作日為基礎規劃，時間從早上 9 點至晚上 9 點。
"""

    try:
        response = client.chat.complete(
            model = model,
            messages = [{"role": "user", "content": prompt}]
        )
        message = response.choices[0].message.content
        return jsonify({'schedule': message}), 200

    except Exception as e:
        return jsonify({'error': f'呼叫 Mistral SDK 失敗: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)