import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'primereact/calendar';
import { useParams, useNavigate } from 'react-router-dom';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import moment from 'moment';
import '../css/Calendar.css';
import Navbar from '..//components/Navbar';
import FloatingMenu from "./FloatingMenu";
import Chatroom from './Chatroom';
import { Toast } from 'primereact/toast';

function CalendarPage() {
    const toast = useRef(null);
    const { goalId } = useParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [tasksByDate, setTasksByDate] = useState({});
    const [goalInfo, setGoalInfo] = useState(null);
    const [allGoals, setAllGoals] = useState([]);
    const [selectedGoalId, setSelectedGoalId] = useState(goalId || null);
    const [allReminders, setAllReminders] = useState([]);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [allHabits, setAllHabits] = useState([]);
    const [selectedHabitId, setSelectedHabitId] = useState(null);
    const [habitInfo, setHabitInfo] = useState(null);
    const [groupedItems, setGroupedItems] = useState({
        goals: [],
        reminders: [],
        habits: []
    });
    const [debugInfo, setDebugInfo] = useState({
        apiCalls: [],
        responseData: null
    });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isInitialLoad = useRef(true);
    const isChangingGoal = useRef(false);
    const fetchAllGoalsRef = useRef(false);

    const API_BASE_URL = 'http://localhost:5000/api';

    // 創建全屏遮罩的函數
    const createRefreshingOverlay = (message) => {
        const existingOverlay = document.querySelector('.page-refreshing');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        const overlay = document.createElement('div');
        overlay.className = 'page-refreshing';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const text = document.createElement('p');
        text.textContent = message;

        overlay.appendChild(spinner);
        overlay.appendChild(text);

        return overlay;
    };

    const showOverlay = (message) => {
        document.body.style.pointerEvents = 'none';
        document.body.appendChild(createRefreshingOverlay(message));
    };

    const hideOverlay = () => {
        const overlay = document.querySelector('.page-refreshing');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        document.body.style.pointerEvents = 'auto';
    };

    const fetchAllReminders = async (userId) => {
        try {
            const url = `${API_BASE_URL}/users/${userId}/article_reminders`;
            console.log('正在獲取所有文章提醒:', url);

            const response = await fetch(url);
            const responseData = await response.json();

            console.log('獲取的文章提醒數據:', responseData);

            if (!response.ok) {
                throw new Error(`文章提醒列表獲取失敗: ${response.status}`);
            }

            const remindersData = responseData.reminders || [];
            const processedReminders = remindersData.map(reminder => ({
                ...reminder,
                type: 'reminder'
            }));

            return processedReminders;
        } catch (error) {
            console.error('獲取文章提醒列表失敗:', error);
            return [];
        }
    };

    const fetchAllHabits = async (userId, setStateDirectly = true) => {
        const url = `${API_BASE_URL}/users/${userId}/habit_building`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取所有習慣:', url);

            const response = await fetch(url);
            const responseData = await response.json();

            console.log('獲取的習慣數據:', responseData);
            if (setStateDirectly) {
                setDebugInfo(prev => ({ ...prev, responseData }));
            }

            if (!response.ok) {
                throw new Error(`習慣列表獲取失敗: ${response.status}`);
            }

            const habitsData = responseData.habits || [];
            const processedHabits = habitsData.map(habit => ({
                ...habit,
                type: 'habit'
            }));

            if (setStateDirectly) {
                setAllHabits(processedHabits);
                setGroupedItems(prev => ({ ...prev, habits: processedHabits }));
            }

            return processedHabits;
        } catch (error) {
            console.error('獲取習慣列表失敗:', error);
            if (setStateDirectly) {
                setAllHabits([]);
                setGroupedItems(prev => ({ ...prev, habits: [] }));
            }
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const userId = "user123";
                console.log('初始加載執行，goalId:', goalId);
                isInitialLoad.current = true;

                const [goalsData, remindersData, habitsData] = await Promise.all([
                    fetchAllGoals(userId, false),
                    fetchAllReminders(userId),
                    fetchAllHabits(userId, false)
                ]);

                const allItems = [
                    ...goalsData.map(goal => ({ ...goal, type: 'goal' })),
                    ...remindersData,
                    ...habitsData
                ];

                const groupedItems = {
                    goals: goalsData,
                    reminders: remindersData,
                    habits: habitsData
                };

                setAllGoals(goalsData);
                setAllReminders(remindersData);
                setAllHabits(habitsData);
                setGroupedItems(groupedItems);

                if (goalId) {
                    const selectedGoal = goalsData.find(goal => goal.id === goalId);
                    if (selectedGoal) {
                        handleSelectedGoal(selectedGoal, userId);
                    } else if (allItems.length > 0) {
                        handleFirstItem(allItems, userId);
                    }
                } else if (allItems.length > 0) {
                    handleFirstItem(allItems, userId);
                }
            } catch (error) {
                console.error('資料獲取錯誤:', error);
            } finally {
                setLoading(false);
                isInitialLoad.current = false;
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!isInitialLoad.current && goalId && !isChangingGoal.current) {
            console.log('URL 參數 goalId 改變:', goalId);

            const fetchData = async () => {
                try {
                    setLoading(true);
                    const userId = "user123";
                    await fetchGoalData(userId, goalId);
                } catch (error) {
                    console.error('資料獲取錯誤:', error);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [goalId]);

    const fetchAllGoals = async (userId, setStateDirectly = true) => {
        if (fetchAllGoalsRef.current && setStateDirectly) {
            console.log('防止重複請求 fetchAllGoals');
            return [];
        }

        fetchAllGoalsRef.current = true;

        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown_all`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取所有目標:', url);

            const response = await fetch(url);
            const responseData = await response.json();

            console.log('獲取的目標數據:', responseData);
            if (setStateDirectly) {
                setDebugInfo(prev => ({ ...prev, responseData }));
            }

            if (!response.ok) {
                throw new Error(`目標列表獲取失敗: ${response.status}`);
            }

            const goalsData = responseData.goals || [];

            if (setStateDirectly) {
                setAllGoals(goalsData);
                setGroupedItems(prev => ({ ...prev, goals: goalsData }));

                if (goalId) {
                    const selectedGoal = goalsData.find(goal => goal.id === goalId);
                    if (selectedGoal) {
                        console.log('根據 URL 參數選擇目標:', selectedGoal.id);
                        handleSelectedGoal(selectedGoal, userId);
                    } else if (goalsData.length > 0) {
                        handleFirstItem(goalsData, userId);
                    }
                } else if (goalsData.length > 0) {
                    handleFirstItem(goalsData, userId);
                }
            }

            return goalsData;
        } catch (error) {
            console.error('獲取目標列表失敗:', error);
            if (setStateDirectly) {
                setAllGoals([]);
                setGroupedItems(prev => ({ ...prev, goals: [] }));
            }
            return [];
        } finally {
            fetchAllGoalsRef.current = false;
        }
    };

    const handleSelectedHabit = (habit, userId) => {
        console.log('選擇習慣:', habit.id);
        setHabitInfo(habit);
        setSelectedHabitId(habit.id);
        setSelectedGoalId(null);
        setSelectedReminder(null);
        setGoalInfo(null);
        setAllTasks([]);
        setTasksByDate({});

        if (habit.tasks && Array.isArray(habit.tasks)) {
            processTasksData(habit.tasks);
        }
    };

    const handleFirstItem = (items, userId) => {
        const firstItem = items[0];
        console.log('選擇第一個項目:', firstItem.id);

        if (firstItem.type === 'goal') {
            setGoalInfo(firstItem);
            setSelectedGoalId(firstItem.id);
            setSelectedHabitId(null);
            setSelectedReminder(null);

            if (firstItem.tasks && Array.isArray(firstItem.tasks)) {
                processTasksData(firstItem.tasks);
            } else {
                fetchGoalTasks(userId, firstItem.id);
            }
        } else if (firstItem.type === 'reminder') {
            setSelectedReminder(firstItem);
            setSelectedGoalId(null);
            setSelectedHabitId(null);
            setGoalInfo(null);
            setAllTasks([]);
            setTasksByDate({});
        } else if (firstItem.type === 'habit') {
            handleSelectedHabit(firstItem, userId);
        }
    };

    const handleSelectedGoal = (goal, userId) => {
        console.log('選擇目標:', goal.id);
        setGoalInfo(goal);
        setSelectedGoalId(goal.id);
        setSelectedReminder(null);
        setSelectedHabitId(null);
        setHabitInfo(null);

        if (goal.tasks && Array.isArray(goal.tasks)) {
            processTasksData(goal.tasks);
        } else {
            fetchGoalTasks(userId, goal.id);
        }
    };

    const handleSelectedReminder = (reminder) => {
        console.log('選擇提醒:', reminder.id);
        setSelectedReminder(reminder);
        setSelectedGoalId(null);
        setSelectedHabitId(null);
        setGoalInfo(null);
        setHabitInfo(null);
        setAllTasks([]);
        setTasksByDate({});
    };

    const fetchGoalTasks = async (userId, goalId) => {
        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}/tasks`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取任務:', url);

            const tasksResponse = await fetch(url);
            const tasksData = await tasksResponse.json();

            console.log('獲取的任務數據:', tasksData);

            if (!tasksResponse.ok) {
                throw new Error(`任務資料取得失敗: ${tasksResponse.status}`);
            }

            processTasksData(tasksData.tasks || []);
        } catch (error) {
            console.error('獲取任務失敗:', error);
            setAllTasks([]);
            setTasksByDate({});
        }
    };

    const fetchGoalData = async (userId, goalId) => {
        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}`;
        setDebugInfo(prev => ({
            ...prev,
            apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString() }]
        }));

        try {
            console.log('正在獲取目標詳情:', url);

            const goalResponse = await fetch(url);
            const goalData = await goalResponse.json();

            console.log('獲取的目標詳情:', goalData);

            if (!goalResponse.ok) {
                throw new Error(`目標資料取得失敗: ${goalResponse.status}`);
            }

            setGoalInfo(goalData);
            await fetchGoalTasks(userId, goalId);

            if (fetchAllGoalsRef.current === false) {
                await fetchAllGoals(userId);
            }
        } catch (error) {
            console.error('API 請求失敗:', error);
            setError('無法獲取目標數據，請稍後再試或聯繫系統管理員');
        }
    };

    const processTasksData = (tasks) => {
        if (!Array.isArray(tasks)) {
            console.error('無效的任務資料:', tasks);
            return;
        }

        console.log('處理任務數據:', tasks);

        const tasksList = [];
        const tasksGroupedByDate = {};

        tasks.forEach(task => {
            if (task.due_date || task.dueDate) {
                const dateKey = moment(task.due_date || task.dueDate).format('YYYY-MM-DD');

                if (!tasksGroupedByDate[dateKey]) {
                    tasksGroupedByDate[dateKey] = [];
                }

                const taskObj = {
                    id: task.id,
                    name: task.task_name || task.title,
                    date: dateKey,
                    priority: task.priority,
                    status: task.status || 'pending',
                    order: task.order || 0
                };

                tasksGroupedByDate[dateKey].push(taskObj);
                tasksList.push(taskObj);
            }
        });

        Object.keys(tasksGroupedByDate).forEach(date => {
            tasksGroupedByDate[date].sort((a, b) => a.order - b.order);
        });

        console.log('處理後的任務數據:', { tasksList, tasksByDate: tasksGroupedByDate });

        setAllTasks(tasksList);
        setTasksByDate(tasksGroupedByDate);
    };

    const handleGoalChange = (newGoalId) => {
        console.log('手動切換目標:', newGoalId);

        const selectedGoal = allGoals.find(goal => goal.id === newGoalId);
        if (selectedGoal) {
            isChangingGoal.current = true;

            setGoalInfo(selectedGoal);
            setSelectedGoalId(newGoalId);
            setSelectedHabitId(null);
            setHabitInfo(null);

            if (selectedGoal.tasks && Array.isArray(selectedGoal.tasks)) {
                processTasksData(selectedGoal.tasks);
            } else {
                const userId = "user123";
                fetchGoalTasks(userId, newGoalId);
            }

            navigate(`/calendar/${newGoalId}`, { replace: true });

            setTimeout(() => {
                isChangingGoal.current = false;
            }, 500);
        }
    };

    const updateTaskStatus = async (userId, goalId, taskId, newStatus) => {
        const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${goalId}/tasks/${taskId}`;
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || '更新失敗');
            }

            console.log('狀態更新成功', result);
            return true;
        } catch (error) {
            console.error('更新任務狀態錯誤:', error.message);
            toast.current.show({ severity: 'error', summary: '錯誤', detail: `更新任務狀態失敗：${error.message}` });
            return false;
        }
    };

    const deleteGoal = async () => {
        try {
            if (!selectedGoalId) {
                toast.current.show({
                    severity: 'error',
                    summary: '錯誤',
                    detail: '沒有選擇目標可供刪除'
                });
                return;
            }

            const userId = "user123";
            const url = `${API_BASE_URL}/users/${userId}/goal_breakdown/${selectedGoalId}`;
            console.log('正在刪除目標:', url);

            if (!window.confirm(`確定要刪除目標「${goalInfo?.eventName}」及其所有任務嗎？此操作不可恢復。`)) {
                return;
            }

            setIsDeleting(true);
            showOverlay('正在刪除目標...');

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseData = await response.json();
            console.log('刪除目標響應:', responseData);

            if (!response.ok) {
                throw new Error(responseData.error || `刪除目標失敗: ${response.status}`);
            }

            toast.current.show({
                severity: 'success',
                summary: '成功',
                detail: '目標及其所有任務已成功刪除'
            });

            hideOverlay();

            setGoalInfo(null);
            setAllTasks([]);
            setTasksByDate({});
            setSelectedGoalId(null);

            const updatedGoals = await fetchAllGoals(userId, false);
            setGroupedItems(prev => ({ ...prev, goals: updatedGoals }));

            showOverlay('頁面重新整理中...');

            setTimeout(() => {
                hideOverlay();
                if (updatedGoals.length > 0) {
                    handleFirstItem(updatedGoals, userId);
                    navigate(`/calendar/${updatedGoals[0].id}`, { replace: true });
                } else {
                    navigate('/calendar', { replace: true });
                }
            }, 800);
        } catch (error) {
            console.error('刪除目標時發生錯誤:', error);
            toast.current.show({
                severity: 'error',
                summary: '錯誤',
                detail: `刪除目標失敗：${error.message}`
            });
            hideOverlay();
        } finally {
            setIsDeleting(false);
            hideOverlay();
        }
    };

    const testApiConnection = async () => {
        try {
            const userId = "user123";
            const url = `${API_BASE_URL}/users/${userId}/goal_breakdown_all`;

            console.log('測試API連接:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('API測試響應:', data);
            toast.current.show({ severity: 'info', summary: 'API測試', detail: `API連接測試結果:\n${JSON.stringify(data, null, 2)}` });

            setDebugInfo(prev => ({
                ...prev,
                testResponse: data,
                apiCalls: [...prev.apiCalls, { endpoint: url, time: new Date().toISOString(), result: 'test' }]
            }));
        } catch (error) {
            console.error('API測試錯誤:', error);
            toast.current.show({ severity: 'error', summary: 'API測試錯誤', detail: `API測試錯誤: ${error.message}` });
        }
    };

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const formattedDate = moment(date).format("YYYY-MM-DD");
    const todayTasks = tasksByDate[formattedDate] || [];

    if (loading) {
        return (
            <div className="CalendarPage">
                <Navbar />
                <div className="calendar-content">
                    <div className="floating-menu-wrapper">
                        <FloatingMenu toastRef={toast} />
                    </div>
                    <div className="loading-container">
                        <p>載入中...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="CalendarPage">
                <Navbar />
                <div className="calendar-content">
                    <div className="floating-menu-wrapper">
                        <FloatingMenu toastRef={toast} />
                    </div>
                    <div className="error-container">
                        <p>錯誤：{error}</p>
                        <button onClick={() => window.location.reload()} style={{ marginRight: '10px' }}>
                            重試
                        </button>
                        <button onClick={testApiConnection} style={{ background: '#4a5568' }}>
                            測試API連接
                        </button>
                        <div style={{ marginTop: '20px', textAlign: 'left', fontSize: '12px' }}>
                            <details>
                                <summary>調試信息</summary>
                                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (allGoals.length === 0 && allHabits.length === 0 && allReminders.length === 0) {
        return (
            <div className="CalendarPage">
                <Navbar />
                <div className="floating-menu-wrapper">
                    <FloatingMenu toastRef={toast} />
                </div>
                <div className="calendar-content">
                    <div className="no-tasks-container">
                        <p>您目前沒有任何目標、習慣或提醒。</p>
                        <p>請點擊右上角的「+ 新增事務」按鈕開始創建。</p>
                        <button
                            onClick={testApiConnection}
                            className="api-test-button"
                        >
                            測試API連接
                        </button>
                        <div className="debug-info">
                            <details>
                                <summary>調試信息</summary>
                                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toast ref={toast} />
            <div className="CalendarPage">
                <Navbar />
                <div className="calendar-content">
                    <div className="top-controls">
                        <div className="floating-menu-wrapper">
                            <FloatingMenu toastRef={toast} />
                        </div>
                        <div className="item-selector">
                            <select
                                value={selectedGoalId || (selectedReminder ? `reminder-${selectedReminder.id}` : (selectedHabitId ? `habit-${selectedHabitId}` : ''))}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.startsWith('reminder-')) {
                                        const reminderId = value.replace('reminder-', '');
                                        const reminder = allReminders.find(r => r.id === reminderId);
                                        if (reminder) {
                                            handleSelectedReminder(reminder);
                                        }
                                    } else if (value.startsWith('habit-')) {
                                        const habitId = value.replace('habit-', '');
                                        const habit = allHabits.find(h => h.id === habitId);
                                        if (habit) {
                                            handleSelectedHabit(habit, "user123");
                                        }
                                    } else {
                                        const goal = allGoals.find(g => g.id === value);
                                        if (goal) {
                                            handleSelectedGoal(goal, "user123");
                                        }
                                    }
                                }}
                            >
                                <option value="" disabled>選擇項目</option>
                                {groupedItems.goals.length > 0 && (
                                    <optgroup label="目標">
                                        {groupedItems.goals.map(goal => (
                                            <option key={`goal-${goal.id}`} value={goal.id}>
                                                {goal.eventName} (截止: {moment(goal.eventDeadLine).format('YYYY-MM-DD')})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {groupedItems.reminders.length > 0 && (
                                    <optgroup label="記事提醒">
                                        {groupedItems.reminders.map(reminder => (
                                            <option key={`reminder-${reminder.id}`} value={`reminder-${reminder.id}`}>
                                                {reminder.eventName} (截止: {reminder.eventDeadLine})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {groupedItems.habits.length > 0 && (
                                    <optgroup label="習慣養成">
                                        {groupedItems.habits.map(habit => (
                                            <option key={`habit-${habit.id}`} value={`habit-${habit.id}`}>
                                                {habit.name} (頻率: {habit.frequency})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                    </div>

                        <div className="calendar-container">
                            <div className="calendar-flex-container">
                                <div className="calendar-box">
                                    <Calendar
                                        style={{ width: "100%", height: "100%" }}
                                        value={date}
                                        onChange={(e) => setDate(e.value)}
                                        inline
                                        dateTemplate={(dateObj) => {
                                            const formattedDate = moment(new Date(dateObj.year, dateObj.month, dateObj.day)).format('YYYY-MM-DD');
                                            const hasTasks = tasksByDate[formattedDate] && tasksByDate[formattedDate].length > 0;

                                            return (
                                                <span className={hasTasks ? 'has-task' : ''}>
                                                    {dateObj.day}
                                                    {hasTasks &&
                                                        <span className="task-count">
                                                            {tasksByDate[formattedDate].length}
                                                        </span>
                                                    }
                                                </span>
                                            );
                                        }}
                                    />
                                </div>
                                <div className="date-display">
                                    <h1>{moment(date).format("MM/DD")}</h1>
                                    <div className='task-display'>
                                        {todayTasks.length === 0 ? (
                                            <p style={{ color: "#989898", marginLeft: "10px" }}>本日無任務</p>
                                        ) : (
                                            <div>
                                                {todayTasks.map((task, idx) => (
                                                    <div
                                                        key={task.id || idx}
                                                        className={`task-card priority-${task.priority}`}
                                                        onClick={async () => {
                                                            if (selectedGoalId) {
                                                                const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                                                const success = await updateTaskStatus("user123", selectedGoalId, task.id, newStatus);
                                                                if (success) {
                                                                    const updatedTasks = allTasks.map(t =>
                                                                        t.id === task.id ? { ...t, status: newStatus } : t
                                                                    );
                                                                    const updatedByDate = { ...tasksByDate };
                                                                    if (updatedByDate[task.date]) {
                                                                        updatedByDate[task.date] = updatedByDate[task.date].map(t =>
                                                                            t.id === task.id ? { ...t, status: newStatus } : t
                                                                        );
                                                                    }
                                                                    setAllTasks(updatedTasks);
                                                                    setTasksByDate(updatedByDate);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <div className="task-card-header">
                                                            <p className="task-card-title">{task.name}</p>
                                                            <span className={`task-status-badge status-${task.status}`}>
                                                                {task.status === 'pending' ? '待辦' :
                                                                    task.status === 'in-progress' ? '進行中' :
                                                                        task.status === 'completed' ? '已完成' :
                                                                            task.status === 'delayed' ? '延期' : task.status}
                                                            </span>
                                                        </div>
                                                        <p className="task-priority">
                                                            優先級: {task.priority === 'high' ? '高' :
                                                                task.priority === 'medium' ? '中' : '低'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "20px" }}>
                                <div className="upcoming-tasks-header">
                                    <h3 className="section-title">即將到來的任務</h3>
                                    {selectedGoalId && !selectedReminder && !selectedHabitId && (
                                        <button
                                            onClick={deleteGoal}
                                            disabled={isDeleting}
                                            className={`delete-goal-button delete-goal-button-container ${isDeleting ? 'deleting' : ''}`}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <div className="delete-goal-spinner"></div>
                                                    <span>刪除中...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="delete-goal-button-text">刪除目標</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="scroller">
                                    {allTasks.length === 0 ? (
                                        <div style={{ padding: "10px" }}>
                                            <p>此項目尚無任務</p>
                                        </div>
                                    ) : (
                                        allTasks
                                            .filter(task => moment(task.date).isSameOrAfter(moment(), 'day'))
                                            .sort((a, b) => moment(a.date).diff(moment(b.date)))
                                            .slice(0, 10)
                                            .map((task, index) => (
                                                <section key={index}>
                                                    <div
                                                        key={task.id || index}
                                                        className={`upcoming-task-card border-priority-${task.priority}`}
                                                    >
                                                        <div className="upcoming-task-header">
                                                            <span className="upcoming-task-title">
                                                                {task.name}
                                                            </span>
                                                            <span className={`task-status-badge status-${task.status}`}>
                                                                {task.status === 'pending' ? '待辦' :
                                                                    task.status === 'in-progress' ? '進行中' :
                                                                        task.status === 'completed' ? '已完成' :
                                                                            task.status === 'delayed' ? '延期' : task.status}
                                                            </span>
                                                        </div>
                                                        <p className="upcoming-task-date">
                                                            期限: {moment(task.date).format("MM/DD")}
                                                        </p>
                                                        <p className="upcoming-task-priority">
                                                            <span className={`priority-dot priority-dot-${task.priority}`}></span>
                                                            {task.priority === 'high' ? '高優先級' :
                                                                task.priority === 'medium' ? '中優先級' : '低優先級'}
                                                        </p>
                                                    </div>
                                                </section>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="chat-button" onClick={toggleChat}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" fill="white" />
                            <path d="M7 9h10M7 12h7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>

                    {isChatOpen && <Chatroom onClose={toggleChat} goalInfo={goalInfo} />}
                </div>
            </>
        );
    }

    export default CalendarPage;