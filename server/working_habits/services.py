# working_habits/services.py
from firebase_admin import firestore
from datetime import datetime
import uuid

def create_working_habit(user_id, working_habit_data):
    """
    建立工作習慣記錄
    
    :param user_id: 使用者ID
    :param working_habit_data: 習慣資料
    :return: 成功與否的訊息與習慣ID
    """
    db = firestore.client()
    # 獲取用戶文檔引用
    user_ref = db.collection('users').document(user_id)
    
    # 獲取用戶文檔當前數據
    user_doc = user_ref.get()
    
    # 生成唯一ID作為習慣的鍵
    habit_id = str(uuid.uuid4())
    
    # 確保working_habits欄位存在
    if user_doc.exists:
        user_data = user_doc.to_dict()
        working_habits = user_data.get('working_habits', {})
    else:
        # 如果用戶文檔不存在，創建一個空的文檔
        working_habits = {}
        user_ref.set({})
    
    # 添加新習慣到用戶的working_habits欄位
    working_habits[habit_id] = working_habit_data
    
    # 更新用戶文檔
    user_ref.update({
        'working_habits': working_habits
    })
    
    return {
        'message': f'工作習慣建立成功',
        'habit_id': habit_id
    }

def get_working_habits(user_id):
    """
    獲取使用者的所有工作習慣
    
    :param user_id: 使用者ID
    :return: 工作習慣列表
    """
    db = firestore.client()
    # 獲取用戶文檔
    user_doc = db.collection('users').document(user_id).get()
    
    result = []
    
    if user_doc.exists:
        user_data = user_doc.to_dict()
        working_habits = user_data.get('working_habits', {})
        
        # 將字典轉換為列表，每個習慣添加ID
        for habit_id, habit_data in working_habits.items():
            habit_data['id'] = habit_id
            result.append(habit_data)
    
    return result

def update_working_habit(user_id, habit_id, working_habit_data):
    """
    更新工作習慣
    
    :param user_id: 使用者ID
    :param habit_id: 習慣ID
    :param working_habit_data: 要更新的習慣資料
    :return: 成功與否的訊息
    """
    db = firestore.client()
    # 獲取用戶文檔引用
    user_ref = db.collection('users').document(user_id)
    
    # 獲取用戶文檔
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return {'error': f'找不到用戶 {user_id}'}
    
    user_data = user_doc.to_dict()
    working_habits = user_data.get('working_habits', {})
    
    # 檢查習慣ID是否存在
    if habit_id not in working_habits:
        return {'error': f'找不到習慣 {habit_id}'}
    
    # 更新習慣數據
    existing_habit = working_habits[habit_id]
    # 保留原有數據並更新新數據
    existing_habit.update(working_habit_data)
    
    # 更新用戶文檔
    user_ref.update({
        f'working_habits.{habit_id}': existing_habit
    })
    
    return {'message': f'習慣更新成功'}

def create_habit_develop(user_id, data):
    """
    在habitsDevelop集合中建立習慣
    
    :param user_id: 使用者ID
    :param data: 習慣資料
    :return: 建立的習慣ID
    """
    db = firestore.client()
    habit_ref = db.collection('users').document(user_id).collection('habitsDevelop').document()
    habit_ref.set(data)
    return {"id": habit_ref.id}