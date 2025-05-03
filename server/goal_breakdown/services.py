# goal_breakdown/services.py
from firebase_admin import firestore
from datetime import datetime

def validate_goal_data(data):
    required_fields = ['eventName', 'eventDeadLine', 'eventMode','eventDescription']
    if not all(field in data for field in required_fields):
        raise ValueError('Missing required fields')
    return True

def create_goal_breakdown_service(user_id, data):
    try:
        validate_goal_data(data)
        db = firestore.client()  # 在函數內獲取 client
        breakdown_ref = db.collection(f'users/{user_id}/goalBreakdown')
        deadline_str = data['eventDeadLine']  # 例如 "2025-05-03"
        deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
        new_doc = breakdown_ref.add({
            'eventName': data['eventName'],
            'eventDeadLine': deadline_date,
            'eventMode': data['eventMode'],
            'eventDescription': data['eventDescription'],
        })
        return {'id': new_doc[1].id}, 201
    except ValueError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        return {'error': f'Server error: {str(e)}'}, 500
