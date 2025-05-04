# goal_breakdown/services.py
from datetime import datetime
from firebase_admin import firestore
from llm_model.llm_services import generate_structured_output
import logging


def validate_goal_data(data):
    """強化版數據驗證"""
    required_fields = ['eventName', 'eventDeadLine', 'eventMode', 'eventDescription']
    if not all(field in data for field in required_fields):
        raise ValueError('缺少必要欄位')

    try:
        # 驗證日期格式並轉換為datetime對象
        deadline = datetime.strptime(data['eventDeadLine'], "%Y-%m-%d")
        if deadline < datetime.now():
            raise ValueError("截止日期不得早於當前日期")
    except ValueError:
        raise ValueError("日期格式必須為 YYYY-MM-DD 且為有效日期")

    return True

def create_goal_breakdown_service(user_id, data):
    """同步處理流程（完整版）"""

    try:
        created_at = datetime.utcnow()
        # 階段 1：強化驗證
        validate_goal_data(data)

        # 階段 2：呼叫 LLM 生成任務
        llm_response = generate_structured_output(
            event_name=data['eventName'],
            event_deadline=data['eventDeadLine'],
            created_at=created_at,  # 傳入創建時間
            event_description=data['eventDescription']
        )

        # 處理 LLM 錯誤
        if 'error' in llm_response:
            logging.error(f"LLM Error: {llm_response['error']}")
            raise ValueError(f"任務生成失敗: {llm_response['error']}")

        # 階段 3：準備 Firestore 數據
        db = firestore.client()
        batch = db.batch()

        # 建立主文檔
        main_doc_ref = db.collection(f'users/{user_id}/goalBreakdown').document()
        main_data = {
            'eventName': data['eventName'],
            'eventDeadLine': datetime.strptime(data['eventDeadLine'], "%Y-%m-%d"),
            'eventMode': data['eventMode'],
            'eventDescription': data['eventDescription'],
            'createdAt': firestore.SERVER_TIMESTAMP,
            'totalTasks': len(llm_response.get('tasks', []))
        }
        batch.set(main_doc_ref, main_data)

        # 建立tasks子集合
        tasks = llm_response.get('tasks', [])
        for index, task in enumerate(tasks, 1):
            # 驗證任務結構
            required_task_fields = ['task_name', 'due_date', 'priority']
            if not all(field in task for field in required_task_fields):
                raise ValueError(f"任務 #{index} 缺少必要字段")

            # 轉換日期格式
            try:
                due_date = datetime.strptime(task['due_date'], "%Y-%m-%d")
                if due_date > main_data['eventDeadLine']:
                    raise ValueError(f"任務 #{index} 的截止日期不得晚於目標截止日期")
            except ValueError:
                raise ValueError(f"任務 #{index} 的日期格式無效")

            # 建立任務文檔
            task_doc_ref = main_doc_ref.collection('tasks').document(f'task{index:03}')
            task_data = {
                'task_name': task['task_name'],
                'due_date': due_date,
                'priority': task['priority'].lower(),
                'dependencies': task.get('dependencies', []),
                'status': 'pending',
                'order': index,
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            batch.set(task_doc_ref, task_data)

        # 提交批次寫入
        batch.commit()

        return {
            'id': main_doc_ref.id,
            'taskCount': len(tasks),
            'firstTaskDue': tasks[0]['due_date'] if tasks else None
        }, 201

    except ValueError as e:
        logging.warning(f"Validation Error: {str(e)}")
        return {'error': str(e)}, 400
    except Exception as e:
        logging.error(f"Server Error: {str(e)}", exc_info=True)
        return {'error': f'伺服器錯誤: {str(e)}'}, 500
