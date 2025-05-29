import React, { useState } from 'react';
import '../css/HabitsBuilding.css';

export default function HabitsBuilding({ onClose }) {
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState('medium');
    const [intensity, setIntensity] = useState('medium');

    const handleCreate = async () => {
        if (!name || !frequency || !intensity) {
            alert('請填寫所有欄位');
            return;
        }

        const userId = "user123"; // 根據實際情況修改
        const url = `http://localhost:5000/api/users/${userId}/habit_building`;

        const payload = {
            name,
            frequency,
            intensity
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('習慣建立成功！');
                onClose();
            } else {
                const err = await res.json();
                alert('建立失敗：' + (err.error || res.status));
            }
        } catch (e) {
            alert('網路錯誤');
        }
    };

    return (
        <div className="habits-modal">
            <div className="habits-container">
                <button className="habits-close-btn" onClick={onClose}>×</button>
                <div className="habits-header">
                    <div className="habits-title">習慣名稱：</div>
                    <input
                        className="habits-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="例如：每天喝水 2000ml"
                    />
                </div>

                <div className="habits-row">
                    <div className="habits-title">頻率：</div>
                    <select
                        className="habits-input"
                        value={frequency}
                        onChange={e => setFrequency(e.target.value)}
                    >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                    </select>
                </div>

                <div className="habits-row">
                    <div className="habits-title">強度：</div>
                    <select
                        className="habits-input"
                        value={intensity}
                        onChange={e => setIntensity(e.target.value)}
                    >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                    </select>
                </div>

                <div className="habits-desc">
                    系統將依照你的設定幫你拆解成每日小任務，幫助你 21 天養成這個習慣。
                </div>

                <button className="habits-create-btn" onClick={handleCreate}>建立習慣</button>
            </div>
        </div>
    );
}
