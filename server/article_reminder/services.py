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
