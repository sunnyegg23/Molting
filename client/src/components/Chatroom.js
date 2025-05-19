// Chatroom.js
import React, { useState, useRef, useEffect } from 'react';
import '../css/Chatroom.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Chatroom({ onClose, goalInfo = null }) {
    const [messages, setMessages] = useState([
        { id: 1, text: '你好！有什麼我能幫助你的嗎？', sender: 'bot', time: new Date() }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const messagesEndRef = useRef(null);

    // 固定的用戶ID
    const USER_ID = "user123";
    // API 基礎路徑
    const API_BASE_URL = 'http://localhost:5000/api';

    // 自動滾動到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 發送初始化消息，提供當前目標上下文
    useEffect(() => {
        // 如果目標信息發生變化，且不是第一次載入（已有聊天記錄）
        if (goalInfo && messages.length > 1) {
            const goalChangeMessage = {
                id: Date.now(),
                text: `您現在正在查看「${goalInfo.eventName}」目標，截止日期為 ${goalInfo.eventDeadLine}。我可以回答與此目標相關的任何問題，或幫您規劃任務。`,
                sender: 'bot',
                time: new Date()
            };

            setMessages(prev => [...prev, goalChangeMessage]);
        }
    }, [goalInfo?.id]); // 只在目標ID變化時觸發

    // 發送訊息
    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        // 添加用戶訊息到UI
        const userMessage = {
            id: messages.length + 1,
            text: newMessage,
            sender: 'user',
            time: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        // 添加用戶訊息到聊天歷史
        const updatedHistory = [
            ...chatHistory,
            { role: 'user', content: newMessage }
        ];

        setChatHistory(updatedHistory);
        setNewMessage('');
        setIsLoading(true);

        try {
            // 準備API請求數據
            const requestData = {
                message: newMessage,
                chat_history: chatHistory.slice(-10) // 只發送最近10條記錄，避免過長
            };

            // 如果有目標信息，使用特定的任務助手API
            let endpoint = `${API_BASE_URL}/users/${USER_ID}/chat`;

            if (goalInfo) {
                endpoint = `${API_BASE_URL}/users/${USER_ID}/chat/task-helper`;
                requestData.goal_name = goalInfo.eventName;
                requestData.goal_deadline = goalInfo.eventDeadLine;

                if (goalInfo.tasks && Array.isArray(goalInfo.tasks)) {
                    requestData.tasks = goalInfo.tasks;
                }
            }

            console.log('正在呼叫聊天API:', endpoint, requestData);

            // 呼叫API
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            console.log('API回應:', data);

            // 檢查API回應
            if (data.status === 'success') {
                // 添加機器人回覆到UI
                const botReply = {
                    id: messages.length + 2,
                    text: data.response,
                    sender: 'bot',
                    time: new Date()
                };

                setMessages(prev => [...prev, botReply]);

                // 添加機器人回覆到聊天歷史
                setChatHistory([
                    ...updatedHistory,
                    { role: 'assistant', content: data.response }
                ]);
            } else {
                // 處理錯誤
                const errorReply = {
                    id: messages.length + 2,
                    text: `抱歉，我遇到了問題：${data.error || '無法連接到伺服器'}`,
                    sender: 'bot',
                    time: new Date()
                };

                setMessages(prev => [...prev, errorReply]);
            }
        } catch (error) {
            console.error('聊天API請求錯誤:', error);

            // 添加錯誤訊息到UI
            const errorReply = {
                id: messages.length + 2,
                text: '抱歉，伺服器連接失敗。請稍後再試。',
                sender: 'bot',
                time: new Date()
            };

            setMessages(prev => [...prev, errorReply]);
        } finally {
            setIsLoading(false);
        }
    };

    // 按下 Enter 鍵發送訊息
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // 格式化時間
    const formatTime = (date) => {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="chatroom-container">
            <div className="chatroom-header">
                <h3>
                    {goalInfo ? (
                        <>智能助手 - {goalInfo.eventName}</>
                    ) : (
                        <>智能助手</>
                    )}
                </h3>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="messages-container">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                    >
                        <div className="message-content">
                            {message.sender === 'bot' ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.text}
                                </ReactMarkdown>
                            ) : (
                                message.text
                            )}
                        </div>
                        <div className="message-time">{formatTime(message.time)}</div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot-message">
                        <div className="message-content typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
                <input
                    type="text"
                    placeholder="輸入訊息..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="message-input"
                    autoFocus
                    disabled={isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    className="send-button"
                    disabled={newMessage.trim() === '' || isLoading}
                >
                    發送
                </button>
            </div>
        </div>
    );
}

export default Chatroom;