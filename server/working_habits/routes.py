# working_habits/routes.py
from flask import Blueprint, request, jsonify
from working_habits import services
import logging

# 建立藍圖
working_habits_bp = Blueprint('working_habits', __name__)

@working_habits_bp.route('/habits', methods=['POST'])
def create_habits():
    # 從前端POST請求中讀取資料
    data = request.get_json()
    # 從data裡面拿到user_id 指哪個使用者下面存資料的 ID
    user_id = data.get('user_id')
    # 從data 拿到真正要寫進資料庫的習慣內容（也就是欄位資料）
    working_habit_data = data.get('working_habit_data')
    
    # 檢查必要欄位
    if not user_id or not working_habit_data:
        return jsonify({'error': '缺少必要欄位 user_id 或 working_habit_data'}), 400
    
    try:
        result = services.create_working_habit(user_id, working_habit_data)
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"建立習慣錯誤: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@working_habits_bp.route('/habits', methods=['GET'])
def retrieve_habits():
    user_id = request.args.get('user_id')  # 從 URL 取得 ?user_id=xxxx
    # 如果沒有提供 user_id，回傳錯誤訊息
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    
    try:
        result = services.get_working_habits(user_id)
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"獲取習慣錯誤: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@working_habits_bp.route('/habits', methods=['PUT'])
def update_habits():
    data = request.get_json()

    # 取得需要的參數
    user_id = data.get('user_id')       # 使用者ID
    habit_id = data.get('habit_id')     # 要更新的習慣ID
    working_habit_data = data.get('working_habit_data') # 要更新的欄位內容（字典）

    # 檢查必要欄位
    if not user_id or not habit_id or not working_habit_data:
        return jsonify({'error': '缺少必要欄位 user_id, habit_id 或 working_habit_data'}), 400

    try:
        result = services.update_working_habit(user_id, habit_id, working_habit_data)
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"更新習慣錯誤: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@working_habits_bp.route('/users/<user_id>/habits', methods=['POST'])
def create_habit(user_id):
    try:
        data = request.json
        result = services.create_habit_develop(user_id, data)
        return jsonify(result), 201
    except Exception as e:
        logging.error(f"建立開發習慣錯誤: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400