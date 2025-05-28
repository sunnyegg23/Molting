from datetime import datetime
from firebase_admin import firestore
from datetime import datetime, timedelta
from llm_model.llm_services import generate_tasks_for_habit_building
import logging

def validate_habit_data(data):
    required_fields = ['name','frequency','intensity']
    if not all(field in data for field in required_fields):
        raise ValueError('缺少必要欄位')

    # 頻率與強度只能是 low,medium,high
    if data['frequency'] not in ['low','medium','high']:
        raise ValueError('頻率設定不正確')
    if data['intensity'] not in ['low','medium','high']:
        raise ValueError('頻率設定不正確')
    
    # 名稱設定不能空白
    if not data['name'].strip():
        raise ValueError('名稱不可為空')
    
    return True

def create_habit_building_service(user_id, data):
    try:
        validate_habit_data(data)

        db = firestore.client()
        habit_building_ref = db.collection(f'users/{user_id}/habit_building')  # CollectionReference



        # 找出目前 habit_building 中最大的 ID 序號
        existing_docs = habit_building_ref.stream()

        max_index = 0
        for doc in existing_docs:
            doc_id = doc.id
            if doc_id.startswith("buildinghabit"): 
                try:
                    index = int(doc_id.replace("buildinghabit",""))
                    if index > max_index:
                        max_index = index
                except ValueError:
                    continue

        new_index = max_index + 1
        habit_id = f"buildinghabit{new_index:02}"  # 例如：buildinghabit01, buildinghabit02, ...


        #  設定建立時間與截止日 ( 21天? 養成一個習慣)
        created_at = datetime.now()
        deadline = (created_at + timedelta(days=21)).strftime('%Y-%m-%d')
        # 寫入資料
        habit_building_data = {
            'name': data['name'],
            'frequency': data['frequency'],
            'intensity': data['intensity'],
            'createAt' : created_at

        }

        # 用 document(habit_id) 建立特定 ID 的 document
        habit_doc_ref = habit_building_ref.document(habit_id)
        habit_doc_ref.set(habit_building_data)
        
       # 呼叫 LLM 拆解任務
        task_result = generate_tasks_for_habit_building(
            habit_name=data['name'],
            frequency=data['frequency'],
            intensity=data['intensity'],
            created_at=created_at,
            deadline=deadline
        )
        if 'error' in task_result:
            return {'error': task_result['error']}, 500

        # 寫入任務到子集合 tasks
        tasks_ref = habit_doc_ref.collection('tasks')
        for i, task in enumerate(task_result.get('tasks', []), start=1):
            task_id = f"task{str(i).zfill(2)}"
            tasks_ref.document(task_id).set(task)

        return {'id': habit_id, 'message': '習慣與任務建立成功'}, 201
    
    except ValueError as e:
        logging.warning(f"Validation Error: {str(e)}")
        return {'error': str(e)}, 400
    except Exception as e:
        logging.error(f"Service Error: {str(e)}", exc_info=True)
        return {'error': '伺服器錯誤'}, 500
    
def get_habits_with_tasks_service(user_id):
    try:
        db = firestore.client()
        habits_ref = db.collection(f'users/{user_id}/habit_building')
        habit_docs = habits_ref.stream()

        habit_list = []

        for doc in habit_docs:
            habit_data = doc.to_dict()
            habit_id = doc.id

            # 讀取對應的 tasks 子集合
            tasks_ref = habits_ref.document(habit_id).collection('tasks')
            task_docs = tasks_ref.stream()
            tasks = [{**task_doc.to_dict(), 'id': task_doc.id} for task_doc in task_docs]

            habit_list.append({
                'id': habit_id,
                'name': habit_data.get('name'),
                'frequency': habit_data.get('frequency'),
                'intensity': habit_data.get('intensity'),
                'createAt': habit_data.get('createAt'),
                'tasks': tasks
            })

        return {'habits': habit_list}, 200

    except Exception as e:
        logging.error(f"Fetch Habits Error: {str(e)}", exc_info=True)
        return {'error': '伺服器錯誤'}, 500

