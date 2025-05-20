# goal_breakdown/services.py
from datetime import datetime
from firebase_admin import firestore
from llm_model.llm_services import generate_structured_output
from llm_server.google_search import get_learning_links_from_google
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
        
        # 使用 eventName + eventDescription 組成搜尋查詢
        query = f"{data['eventName']} {data['eventDescription']}"
        learning_links = get_learning_links_from_google(query, max_results=3)
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
            'totalTasks': len(llm_response.get('tasks', [])),
            "learningLinks":learning_links
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



def get_tasks_service(user_id, goal_id):
    """取得特定目標分解下的所有任務"""
    try:
        db = firestore.client()

        # 構建 tasks 子集合的參考路徑
        tasks_ref = db.collection(f'users/{user_id}/goalBreakdown/{goal_id}/tasks')

        # 執行查詢
        docs = tasks_ref.stream()

        # 轉換資料格式
        tasks = []
        for doc in docs:
            task_data = doc.to_dict()

            # 轉換 Firestore Timestamp 為 ISO 字串
            if 'due_date' in task_data:
                task_data['due_date'] = task_data['due_date'].isoformat()
            if 'createdAt' in task_data:
                task_data['createdAt'] = task_data['createdAt'].isoformat()

            tasks.append({
                'id': doc.id,
                **task_data
            })

        return {'tasks': tasks}, 200

    except Exception as e:
        logging.error(f"Service Error: {str(e)}", exc_info=True)
        return {'error': f'資料庫查詢失敗: {str(e)}'}, 500


def get_all_goals_service(user_id):
    """獲取用戶所有目標及其任務"""
    try:
        db = firestore.client()

        # 獲取所有目標
        goals_ref = db.collection(f'users/{user_id}/goalBreakdown')
        goals_docs = goals_ref.stream()

        goals = []
        for doc in goals_docs:
            goal_data = doc.to_dict()
            goal_id = doc.id

            # 轉換時間戳為ISO字符串
            for field in ['eventDeadLine', 'createdAt']:
                if field in goal_data and goal_data[field]:
                    goal_data[field] = goal_data[field].isoformat()

            # 獲取該目標下的所有任務
            tasks_ref = db.collection(f'users/{user_id}/goalBreakdown/{goal_id}/tasks')
            tasks_docs = tasks_ref.stream()

            tasks = []
            for task_doc in tasks_docs:
                task_data = task_doc.to_dict()

                # 轉換時間戳為ISO字符串
                for field in ['due_date', 'createdAt']:
                    if field in task_data and task_data[field]:
                        task_data[field] = task_data[field].isoformat()

                tasks.append({
                    'id': task_doc.id,
                    **task_data
                })

            # 將目標和任務合併
            goals.append({
                'id': goal_id,
                **goal_data,
                'tasks': tasks
            })

        return {'goals': goals}, 200

    except Exception as e:
        logging.error(f"Service Error: {str(e)}", exc_info=True)
        return {'error': f'資料庫查詢失敗: {str(e)}'}, 500


def get_goal_service(user_id, goal_id):
    """獲取特定目標的詳細信息"""
    try:
        db = firestore.client()

        # 獲取目標文檔
        goal_doc = db.collection(f'users/{user_id}/goalBreakdown').document(goal_id).get()

        if not goal_doc.exists:
            return {'error': '目標不存在'}, 404

        # 獲取數據
        goal_data = goal_doc.to_dict()

        # 轉換時間戳為ISO字符串
        for field in ['eventDeadLine', 'createdAt']:
            if field in goal_data and goal_data[field]:
                goal_data[field] = goal_data[field].isoformat()

        # 返回數據
        return goal_data, 200

    except Exception as e:
        logging.error(f"Service Error: {str(e)}", exc_info=True)
        return {'error': f'資料庫查詢失敗: {str(e)}'}, 500