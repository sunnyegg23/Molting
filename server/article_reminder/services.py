# article_reminder/services.py
from firebase_admin import firestore
from datetime import datetime

def validate_article_data(data):
    required_fields = ['eventName', 'eventDeadLine', 'eventMode']
    if not all(field in data for field in required_fields):
        raise ValueError('Missing required fields')
    return True

def create_article_reminder_service(user_id, data):
    try:
        validate_article_data(data)
        db = firestore.client()  # 在函數內獲取 client
        reminders_ref = db.collection(f'users/{user_id}/articleReminders')
        deadline_str = data['eventDeadLine']  # 例如 "2025-05-03"
        deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
        new_doc = reminders_ref.add({
            'eventName': data['eventName'],
            'eventDeadLine': deadline_date,
            'eventMode': data['eventMode']
        })
        return {'id': new_doc[1].id}, 201
    except ValueError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        return {'error': f'Server error: {str(e)}'}, 500


def get_all_article_reminders_service(user_id):
    """
    獲取特定用戶的所有文章提醒

    :param user_id: 用戶ID
    :return: 文章提醒列表及狀態碼
    """
    try:
        db = firestore.client()  # 在函數內獲取 client
        reminders_ref = db.collection(f'users/{user_id}/articleReminders')
        reminders = reminders_ref.stream()

        result = []
        for reminder in reminders:
            reminder_data = reminder.to_dict()
            # 將 Firestore 時間戳轉換為 ISO 格式字符串
            if 'eventDeadLine' in reminder_data and isinstance(reminder_data['eventDeadLine'], datetime):
                reminder_data['eventDeadLine'] = reminder_data['eventDeadLine'].strftime('%Y-%m-%d')

            # 添加文檔 ID 作為提醒 ID
            reminder_data['id'] = reminder.id
            result.append(reminder_data)

        return {'reminders': result}, 200
    except Exception as e:
        return {'error': f'獲取提醒失敗: {str(e)}'}, 500