import os
import json
import requests
from typing import List, Dict, Any, Optional, TypedDict, Annotated
from datetime import datetime
from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI
from langchain.tools import Tool
from langchain_community.tools import DuckDuckGoSearchRun
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
import logging

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 載入環境變數
load_dotenv()

# API 基礎 URL
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000/api")


class AgentState(TypedDict):
    """定義 Agent 的狀態結構"""
    messages: Annotated[List[dict], "對話訊息列表"]
    user_input: str
    current_step: str
    tool_calls: List[dict]
    final_response: str
    user_id: str
    error: Optional[str]


class TaskManagementLangGraphAgent:
    """基於 LangGraph 的任務管理 Agent"""

    def __init__(self, user_id: str):
        """初始化 Agent"""
        self.user_id = user_id

        # 初始化 Mistral LLM
        self.llm = ChatMistralAI(
            mistral_api_key=os.getenv("MISTRAL_API_KEY"),
            model="open-mistral-nemo",
            temperature=0.1,
            max_retries=2,
        )

        # 初始化工具
        self.tools = self._initialize_tools()

        # 創建工具節點（替代 ToolExecutor）
        self.tool_node = ToolNode(self.tools)

        # 建立工具名稱映射
        self.tool_map = {tool.name: tool for tool in self.tools}

        # 創建圖
        self.graph = self._create_graph()

        # 使用記憶體保存器
        self.memory = MemorySaver()

        # 編譯圖
        self.app = self.graph.compile(checkpointer=self.memory)

    def _initialize_tools(self) -> List[Tool]:
        """初始化所有可用的工具"""
        tools = []

        # 1. 網路搜尋工具
        search = DuckDuckGoSearchRun()
        tools.append(
            Tool(
                name="web_search",
                func=search.run,
                description="搜尋網路資訊。輸入：搜尋關鍵字"
            )
        )

        # 2. 獲取所有目標
        tools.append(
            Tool(
                name="get_all_goals",
                func=self._get_all_goals,
                description="獲取用戶的所有目標。輸入：無需輸入，直接使用空字串"
            )
        )

        # 3. 獲取目標詳情
        tools.append(
            Tool(
                name="get_goal_detail",
                func=self._get_goal_detail,
                description="獲取特定目標的詳情。輸入：目標名稱"
            )
        )

        # 4. 獲取任務列表
        tools.append(
            Tool(
                name="get_tasks",
                func=self._get_tasks,
                description="獲取特定目標的任務。輸入：目標名稱"
            )
        )

        # 5. 創建目標
        tools.append(
            Tool(
                name="create_goal",
                func=self._create_goal_wrapper,
                description="創建新目標。輸入：目標名稱,描述,截止日期（例如：學習英文,通過多益考試,2025-12-31）"
            )
        )

        # 6. 創建文章提醒
        tools.append(
            Tool(
                name="create_article_reminder",
                func=self._create_article_reminder_wrapper,
                description="創建文章提醒。輸入：文章名稱,截止日期"
            )
        )

        # 7. 分析任務
        tools.append(
            Tool(
                name="analyze_task",
                func=self._analyze_task_wrapper,
                description="分析任務並提供建議。輸入：目標名稱,任務名稱"
            )
        )

        return tools

    def _create_graph(self) -> StateGraph:
        """創建 LangGraph 工作流程圖"""

        # 創建狀態圖
        workflow = StateGraph(AgentState)

        # 添加節點
        workflow.add_node("analyze_input", self._analyze_input)
        workflow.add_node("call_tools", self._call_tools)
        workflow.add_node("generate_response", self._generate_response)
        workflow.add_node("handle_error", self._handle_error)

        # 設置起始點
        workflow.set_entry_point("analyze_input")

        # 添加邊和條件邊
        workflow.add_conditional_edges(
            "analyze_input",
            self._should_use_tools,
            {
                "use_tools": "call_tools",
                "direct_response": "generate_response",
                "error": "handle_error"
            }
        )

        workflow.add_conditional_edges(
            "call_tools",
            self._after_tools,
            {
                "continue": "generate_response",
                "error": "handle_error"
            }
        )

        # 設置結束點
        workflow.add_edge("generate_response", END)
        workflow.add_edge("handle_error", END)

        return workflow

    def _analyze_input(self, state: AgentState) -> AgentState:
        """分析用戶輸入，決定需要使用哪些工具"""
        user_input = state["user_input"].lower()

        # 更新狀態
        state["current_step"] = "analyzing_input"
        state["messages"].append({
            "type": "system",
            "content": f"分析用戶輸入: {state['user_input']}"
        })

        # 預設的工具調用列表
        tool_calls = []

        # 分析用戶意圖並決定要調用的工具
        if any(keyword in user_input for keyword in ["顯示", "查看", "所有", "目標", "列表"]):
            tool_calls.append({
                "tool": "get_all_goals",
                "input": ""
            })
        elif "創建" in user_input and "目標" in user_input:
            # 需要進一步處理用戶輸入來提取參數
            state["current_step"] = "need_create_goal_params"
        elif "創建" in user_input and ("文章" in user_input or "提醒" in user_input):
            state["current_step"] = "need_create_reminder_params"
        elif "分析" in user_input and "任務" in user_input:
            state["current_step"] = "need_analyze_task_params"
        elif any(keyword in user_input for keyword in ["詳情", "詳細", "detail"]):
            state["current_step"] = "need_goal_name"
        elif "任務" in user_input:
            state["current_step"] = "need_goal_name_for_tasks"
        elif any(keyword in user_input for keyword in ["搜尋", "search", "查詢"]):
            # 提取搜尋關鍵字
            search_query = user_input.replace("搜尋", "").replace("search", "").strip()
            tool_calls.append({
                "tool": "web_search",
                "input": search_query
            })

        state["tool_calls"] = tool_calls
        return state

    def _should_use_tools(self, state: AgentState) -> str:
        """決定是否需要使用工具"""
        if state.get("error"):
            return "error"

        if state["tool_calls"]:
            return "use_tools"

        if state["current_step"] in ["need_create_goal_params", "need_create_reminder_params",
                                     "need_analyze_task_params", "need_goal_name", "need_goal_name_for_tasks"]:
            return "direct_response"

        return "direct_response"

    def _call_tools(self, state: AgentState) -> AgentState:
        """執行工具調用"""
        state["current_step"] = "calling_tools"

        try:
            for tool_call in state["tool_calls"]:
                tool_name = tool_call["tool"]
                tool_input = tool_call["input"]

                logger.info(f"調用工具: {tool_name} with input: {tool_input}")

                # 直接執行工具函數
                if tool_name in self.tool_map:
                    result = self.tool_map[tool_name].func(tool_input)

                    # 記錄工具執行結果
                    state["messages"].append({
                        "type": "tool_result",
                        "tool": tool_name,
                        "input": tool_input,
                        "result": result
                    })
                else:
                    state["error"] = f"未知的工具: {tool_name}"
                    return state

        except Exception as e:
            logger.error(f"工具執行錯誤: {str(e)}")
            state["error"] = f"工具執行錯誤: {str(e)}"

        return state

    def _after_tools(self, state: AgentState) -> str:
        """工具執行後的決策"""
        if state.get("error"):
            return "error"
        return "continue"

    def _generate_response(self, state: AgentState) -> AgentState:
        """生成最終回應"""
        state["current_step"] = "generating_response"

        try:
            # 根據不同的狀態生成不同的回應
            if state["current_step"] == "need_create_goal_params":
                state["final_response"] = """要創建目標，請提供以下資訊：

**格式：** 創建目標：[目標名稱],[描述],[截止日期]

**範例：** 創建目標：學習Python,掌握基礎程式設計,2025-12-31
"""
            elif state["current_step"] == "need_create_reminder_params":
                state["final_response"] = """要創建文章提醒，請提供以下資訊：

**格式：** 創建提醒：[文章名稱],[截止日期]

**範例：** 創建提醒：閱讀AI論文,2025-06-30
"""
            elif state["current_step"] == "need_analyze_task_params":
                state["final_response"] = """要分析任務，請提供以下資訊：

**格式：** 分析任務：[目標名稱],[任務名稱]

**範例：** 分析任務：學習Python,完成基礎語法
"""
            elif state["current_step"] == "need_goal_name":
                state["final_response"] = "請提供您想查看詳情的目標名稱。"
            elif state["current_step"] == "need_goal_name_for_tasks":
                state["final_response"] = "請提供您想查看任務的目標名稱。"
            else:
                # 從工具結果生成回應
                tool_results = [msg for msg in state["messages"] if msg["type"] == "tool_result"]

                if tool_results:
                    # 合併所有工具結果
                    combined_results = []
                    for result in tool_results:
                        combined_results.append(f"**{result['tool']} 結果：**\n{result['result']}")

                    state["final_response"] = "\n\n".join(combined_results)
                else:
                    # 使用 LLM 生成回應
                    context = f"用戶問題: {state['user_input']}\n\n"
                    if state["messages"]:
                        context += "對話歷史:\n"
                        for msg in state["messages"]:
                            context += f"- {msg['type']}: {msg['content']}\n"

                    # 使用 LLM 生成自然語言回應
                    llm_response = self.llm.invoke(f"""
你是一個任務管理助手。請根據以下資訊回答用戶問題：

{context}

請用繁體中文回答，並且要具體和有幫助。
""")

                    state["final_response"] = llm_response.content

        except Exception as e:
            logger.error(f"生成回應時發生錯誤: {str(e)}")
            state["error"] = f"生成回應失敗: {str(e)}"

        return state

    def _handle_error(self, state: AgentState) -> AgentState:
        """處理錯誤情況"""
        error_msg = state.get("error", "未知錯誤")
        state["final_response"] = f"抱歉，處理您的請求時發生錯誤：{error_msg}"
        return state

    # 以下是工具函數的實現（保持與原代碼相同的邏輯）
    def _get_all_goals(self, input_str: str = "") -> str:
        """獲取所有目標及其任務"""
        try:
            logger.info(f"正在獲取用戶 {self.user_id} 的所有目標...")

            response = requests.get(
                f"{API_BASE_URL}/users/{self.user_id}/goal_breakdown_all",
                timeout=60
            )

            if response.status_code == 200:
                data = response.json()
                goals = data.get('goals', [])

                if not goals:
                    return "您目前沒有設定任何目標。建議您創建一個新目標來開始！"

                # 格式化輸出
                result = f"📋 **您目前有 {len(goals)} 個目標：**\n\n"
                for i, goal in enumerate(goals, 1):
                    result += f"**{i}. {goal['eventName']}**\n"
                    result += f"   🆔 ID: {goal['id']}\n"
                    result += f"   📅 截止日期: {goal['eventDeadLine'][:10]}\n"
                    result += f"   📝 任務數量: {len(goal.get('tasks', []))}\n"

                    # 列出前3個任務
                    tasks = goal.get('tasks', [])
                    if tasks:
                        result += "   🎯 任務預覽:\n"
                        for j, task in enumerate(tasks[:3], 1):
                            priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(task.get('priority', 'low'),
                                                                                          '⚪')
                            result += f"     {j}. {priority_emoji} {task['task_name']}\n"
                        if len(tasks) > 3:
                            result += f"     ➕ 還有 {len(tasks) - 3} 個任務\n"
                    result += "\n"

                return result
            else:
                return f"❌ 獲取目標失敗，狀態碼：{response.status_code}"

        except Exception as e:
            logger.error(f"獲取目標時發生錯誤: {str(e)}")
            return f"❌ 獲取目標時發生錯誤：{str(e)}"

    def _get_goal_detail(self, goal_identifier: str) -> str:
        """獲取特定目標的詳細資訊"""
        try:
            # 先獲取所有目標來找到對應的ID
            all_goals_response = requests.get(
                f"{API_BASE_URL}/users/{self.user_id}/goal_breakdown_all",
                timeout=60
            )

            if all_goals_response.status_code == 200:
                goals = all_goals_response.json().get('goals', [])
                target_goal_id = None

                # 搜尋匹配的目標
                for goal in goals:
                    if (goal['eventName'].lower() == goal_identifier.lower() or
                            goal_identifier.lower() in goal['eventName'].lower()):
                        target_goal_id = goal['id']
                        break

                if not target_goal_id:
                    return f"❌ 找不到名稱包含 '{goal_identifier}' 的目標。"

                # 獲取詳細資訊
                response = requests.get(
                    f"{API_BASE_URL}/users/{self.user_id}/goal_breakdown/{target_goal_id}",
                    timeout=60
                )

                if response.status_code == 200:
                    goal = response.json()

                    result = f"🎯 **目標詳情：{goal['eventName']}**\n\n"
                    result += f"📝 **描述：** {goal.get('eventDescription', '無描述')}\n"
                    result += f"📅 **截止日期：** {goal['eventDeadLine'][:10]}\n"
                    result += f"🗓️ **建立時間：** {goal['createdAt'][:10]}\n"
                    result += f"📊 **總任務數：** {goal.get('totalTasks', 0)}\n"

                    # 顯示學習資源
                    learning_links = goal.get('learningLinks', [])
                    if learning_links:
                        result += "\n📚 **相關學習資源：**\n"
                        for link in learning_links:
                            result += f"• [{link['title']}]({link['url']})\n"

                    return result
                else:
                    return f"❌ 獲取目標詳情失敗：{response.text}"
            else:
                return "❌ 無法獲取目標列表"

        except Exception as e:
            logger.error(f"獲取目標詳情時發生錯誤: {str(e)}")
            return f"❌ 獲取目標詳情時發生錯誤：{str(e)}"

    def _get_tasks(self, goal_identifier: str) -> str:
        """獲取特定目標的任務列表"""
        try:
            # 先獲取所有目標來找到對應的ID
            all_goals_response = requests.get(
                f"{API_BASE_URL}/users/{self.user_id}/goal_breakdown_all",
                timeout=60
            )

            if all_goals_response.status_code == 200:
                goals = all_goals_response.json().get('goals', [])
                target_goal = None

                # 搜尋匹配的目標
                for goal in goals:
                    if (goal['eventName'].lower() == goal_identifier.lower() or
                            goal_identifier.lower() in goal['eventName'].lower()):
                        target_goal = goal
                        break

                if not target_goal:
                    return f"❌ 找不到名稱包含 '{goal_identifier}' 的目標。"

                tasks = target_goal.get('tasks', [])
                if not tasks:
                    return f"📋 目標「{target_goal['eventName']}」目前沒有任何任務。"

                # 依優先級排序
                priority_order = {'high': 0, 'medium': 1, 'low': 2}
                tasks.sort(key=lambda x: (priority_order.get(x.get('priority', 'low'), 3),
                                          x.get('due_date', '')))

                result = f"📋 **目標「{target_goal['eventName']}」的任務列表：**\n\n"
                for i, task in enumerate(tasks, 1):
                    priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(
                        task.get('priority', 'low'), '⚪'
                    )
                    result += f"**{i}. {priority_emoji} {task['task_name']}**\n"
                    result += f"   📅 截止日期: {task['due_date'][:10]}\n"
                    result += f"   🎯 優先級: {task['priority']}\n"
                    result += f"   ⭐ 狀態: {task.get('status', 'pending')}\n"
                    if task.get('dependencies'):
                        result += f"   🔗 依賴: {', '.join(task['dependencies'])}\n"
                    result += "\n"

                return result
            else:
                return "❌ 無法獲取目標列表"

        except Exception as e:
            logger.error(f"獲取任務時發生錯誤: {str(e)}")
            return f"❌ 獲取任務時發生錯誤：{str(e)}"

    def _create_goal_wrapper(self, input_str: str) -> str:
        """創建目標的包裝函數"""
        try:
            parts = [p.strip() for p in input_str.split(',')]

            if len(parts) < 3:
                return "❌ 請提供完整資訊：目標名稱,描述,截止日期"

            data = {
                'eventName': parts[0],
                'eventDescription': parts[1],
                'eventDeadLine': parts[2],
                'eventMode': 'ai'
            }

            response = requests.post(
                f"{API_BASE_URL}/users/{self.user_id}/goal_breakdown",
                json=data,
                timeout=60
            )

            if response.status_code == 201:
                result = response.json()
                return f"✅ **成功創建目標：{data['eventName']}**\n🆔 目標ID: {result['id']}\n📝 任務數量: {result['taskCount']}"
            else:
                return f"❌ 創建目標失敗：{response.text}"

        except Exception as e:
            return f"❌ 創建目標失敗：{str(e)}"

    def _create_article_reminder_wrapper(self, input_str: str) -> str:
        """創建文章提醒的包裝函數"""
        try:
            parts = [p.strip() for p in input_str.split(',')]

            if len(parts) < 2:
                return "❌ 請提供完整資訊：文章名稱,截止日期"

            data = {
                'eventName': parts[0],
                'eventDeadLine': parts[1],
                'eventMode': 'manual'
            }

            response = requests.post(
                f"{API_BASE_URL}/users/{self.user_id}/article_reminders",
                json=data,
                timeout=60
            )

            if response.status_code == 201:
                result = response.json()
                return f"✅ **成功創建文章提醒：{data['eventName']}**\n🆔 提醒ID: {result['id']}"
            else:
                return f"❌ 創建文章提醒失敗：{response.text}"

        except Exception as e:
            return f"❌ 創建文章提醒失敗：{str(e)}"

    def _analyze_task_wrapper(self, input_str: str) -> str:
        """分析任務的包裝函數"""
        try:
            parts = [p.strip() for p in input_str.split(',')]

            if len(parts) < 2:
                return "❌ 請提供完整資訊：目標名稱,任務名稱"

            goal_name = parts[0]
            task_name = parts[1]

            # 先獲取所有目標
            all_goals_response = requests.get(
                f"{API_BASE_URL}/users/{self.user_id}/goal_breakdown_all",
                timeout=60
            )

            if all_goals_response.status_code != 200:
                return "❌ 無法獲取目標列表"

            goals = all_goals_response.json().get('goals', [])
            target_goal = None

            # 尋找匹配的目標
            for goal in goals:
                if (goal['eventName'].lower() == goal_name.lower() or
                        goal_name.lower() in goal['eventName'].lower()):
                    target_goal = goal
                    break

            if not target_goal:
                return f"❌ 找不到名稱包含「{goal_name}」的目標"

            # 從目標中找到對應的任務
            tasks = target_goal.get('tasks', [])
            target_task = None

            for task in tasks:
                if (task['task_name'].lower() == task_name.lower() or
                        task_name.lower() in task['task_name'].lower()):
                    target_task = task
                    break

            if not target_task:
                return f"❌ 在目標「{target_goal['eventName']}」中找不到名為「{task_name}」的任務"

            # 建構分析結果
            priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(
                target_task.get('priority', 'low'), '⚪'
            )

            result = f"🔍 **任務分析：{target_task['task_name']}**\n\n"
            result += f"🎯 **所屬目標：** {target_goal['eventName']}\n"
            result += f"{priority_emoji} **優先級：** {target_task['priority']}\n"
            result += f"📅 **截止日期：** {target_task['due_date'][:10]}\n\n"

            # 添加簡單的分析建議
            result += "💡 **執行建議：**\n"
            if target_task['priority'] == 'high':
                result += "• 這是高優先級任務，建議優先處理\n"
            result += f"• 請在 {target_task['due_date'][:10]} 前完成\n"
            result += "• 建議將大任務分解成小步驟\n"
            result += "• 設定每日進度檢查點\n"

            return result

        except Exception as e:
            return f"❌ 分析任務失敗：{str(e)}"

    def run(self, user_input: str) -> Dict[str, Any]:
        """運行 LangGraph Agent"""
        try:
            # 準備初始狀態
            initial_state = {
                "messages": [],
                "user_input": user_input,
                "current_step": "start",
                "tool_calls": [],
                "final_response": "",
                "user_id": self.user_id,
                "error": None
            }

            # 創建線程配置（用於記憶體）
            config = {"configurable": {"thread_id": f"user_{self.user_id}"}}

            # 執行圖
            result = self.app.invoke(initial_state, config)

            return {
                "response": result.get("final_response", "抱歉，無法處理您的請求"),
                "status": "error" if result.get("error") else "success",
                "error": result.get("error")
            }

        except Exception as e:
            logger.error(f"LangGraph Agent 執行錯誤: {str(e)}")
            return {
                "response": f"抱歉，處理您的請求時發生錯誤：{str(e)}",
                "status": "error",
                "error": str(e)
            }


# 全局實例管理
_agent_instances = {}


def get_langgraph_agent(user_id: str) -> TaskManagementLangGraphAgent:
    """獲取特定用戶的 LangGraph Agent 實例"""
    global _agent_instances
    if user_id not in _agent_instances:
        _agent_instances[user_id] = TaskManagementLangGraphAgent(user_id)
    return _agent_instances[user_id]


def process_langgraph_request(user_id: str, user_input: str) -> Dict[str, Any]:
    """處理 LangGraph Agent 請求的主要入口"""
    agent = get_langgraph_agent(user_id)
    return agent.run(user_input)


# 測試函數
if __name__ == "__main__":
    # 測試代碼
    test_user_id = "test_user_123"
    agent = TaskManagementLangGraphAgent(test_user_id)

    test_cases = [
        "顯示我所有的目標",
        "創建目標：學習LangGraph,掌握圖狀態機,2025-12-31",
        "查看學習Python的詳情",
        "分析任務：學習Python,完成基礎語法"
    ]

    for test_input in test_cases:
        print(f"\n{'=' * 50}")
        print(f"測試輸入: {test_input}")
        print(f"{'=' * 50}")

        result = agent.run(test_input)
        print(f"狀態: {result['status']}")
        print(f"回應: {result['response']}")

        if result.get('error'):
            print(f"錯誤: {result['error']}")

        print(f"{'=' * 50}\n")