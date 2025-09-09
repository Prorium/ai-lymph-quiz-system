/**
 * 愛式メディカルリンパ®復習クイズシステム - 共通JavaScript関数
 */

// 共通設定
const CONFIG = {
    QUESTIONS_PER_LEVEL: 10,
    DATA_FILE: 'quiz_questions.json',
    DIFFICULTIES: {
        BEGINNER: '初級',
        INTERMEDIATE: '中級',
        ADVANCED: '上級'
    },
    PROGRAM_RANGES: {
        BEGINNER: { start: 1, end: 30 },
        INTERMEDIATE: { start: 31, end: 70 },
        ADVANCED: { start: 71, end: 90 }
    }
};

// ユーティリティ関数
const Utils = {
    /**
     * 配列をシャッフルする
     * @param {Array} array - シャッフルする配列
     * @returns {Array} シャッフルされた配列
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * 配列からランダムに指定数の要素を選択（より均等な分散）
     * @param {Array} array - 選択元の配列
     * @param {number} count - 選択する数
     * @returns {Array} 選択された要素の配列
     */
    getRandomItems(array, count) {
        if (array.length <= count) {
            return this.shuffleArray(array);
        }
        
        // より均等な分散のため、配列を複数回シャッフルして選択
        const result = [];
        const availableIndices = Array.from({length: array.length}, (_, i) => i);
        
        // Fisher-Yates シャッフルを使用してより良いランダム性を確保
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const selectedIndex = availableIndices.splice(randomIndex, 1)[0];
            result.push(array[selectedIndex]);
        }
        
        // 最終的にもう一度シャッフルして順序もランダムに
        return this.shuffleArray(result);
    },

    /**
     * 難易度に基づいて問題をフィルタリング
     * @param {Array} questions - 全問題の配列
     * @param {string} difficulty - 難易度
     * @returns {Array} フィルタリングされた問題の配列
     */
    filterQuestionsByDifficulty(questions, difficulty) {
        return questions.filter(q => q.difficulty === difficulty);
    },

    /**
     * プログラム番号に基づいて問題をフィルタリング
     * @param {Array} questions - 全問題の配列
     * @param {string} programCode - プログラムコード (例: "PG01")
     * @returns {Array} フィルタリングされた問題の配列
     */
    filterQuestionsByProgram(questions, programCode) {
        return questions.filter(q => q.program_code === programCode);
    },

    /**
     * 検索テキストに基づいて問題をフィルタリング
     * @param {Array} questions - 全問題の配列
     * @param {string} searchText - 検索テキスト
     * @returns {Array} フィルタリングされた問題の配列
     */
    searchQuestions(questions, searchText) {
        if (!searchText) return questions;
        
        const lowerSearchText = searchText.toLowerCase();
        return questions.filter(q => 
            q.question.toLowerCase().includes(lowerSearchText) ||
            q.title.toLowerCase().includes(lowerSearchText) ||
            q.explanation.toLowerCase().includes(lowerSearchText)
        );
    },

    /**
     * 日付をフォーマット
     * @param {Date} date - フォーマットする日付
     * @returns {string} フォーマットされた日付文字列
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    /**
     * ローカルストレージにデータを保存
     * @param {string} key - キー
     * @param {*} data - 保存するデータ
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('ローカルストレージへの保存に失敗:', error);
            return false;
        }
    },

    /**
     * ローカルストレージからデータを取得
     * @param {string} key - キー
     * @returns {*} 取得したデータ
     */
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('ローカルストレージからの読み込みに失敗:', error);
            return null;
        }
    },

    /**
     * 要素を表示/非表示
     * @param {string|HTMLElement} element - 要素またはセレクタ
     * @param {boolean} visible - 表示するかどうか
     */
    toggleElement(element, visible) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.display = visible ? 'block' : 'none';
        }
    },

    /**
     * 要素のテキストを設定
     * @param {string|HTMLElement} element - 要素またはセレクタ
     * @param {string} text - 設定するテキスト
     */
    setText(element, text) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.textContent = text;
        }
    },

    /**
     * 要素のHTMLを設定
     * @param {string|HTMLElement} element - 要素またはセレクタ
     * @param {string} html - 設定するHTML
     */
    setHTML(element, html) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.innerHTML = html;
        }
    },

    /**
     * デバウンス関数
     * @param {Function} func - 実行する関数
     * @param {number} wait - 待機時間（ミリ秒）
     * @returns {Function} デバウンスされた関数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// データ管理クラス
class DataManager {
    constructor() {
        this.questions = [];
        this.isLoaded = false;
    }

    /**
     * 問題データを読み込み
     * @returns {Promise<Array>} 問題データの配列
     */
    async loadQuestions() {
        if (this.isLoaded) {
            return this.questions;
        }

        try {
            console.log('問題データを読み込み中...');
            const response = await fetch(CONFIG.DATA_FILE);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.questions = data.questions || [];
            this.isLoaded = true;
            
            console.log(`問題データを読み込みました: ${this.questions.length}問`);
            return this.questions;
            
        } catch (error) {
            console.error('問題データの読み込みに失敗しました:', error);
            throw error;
        }
    }

    /**
     * 難易度別の問題数を取得
     * @returns {Object} 難易度別の問題数
     */
    getDifficultyStats() {
        const stats = {
            [CONFIG.DIFFICULTIES.BEGINNER]: 0,
            [CONFIG.DIFFICULTIES.INTERMEDIATE]: 0,
            [CONFIG.DIFFICULTIES.ADVANCED]: 0
        };

        this.questions.forEach(q => {
            if (stats.hasOwnProperty(q.difficulty)) {
                stats[q.difficulty]++;
            }
        });

        return stats;
    }

    /**
     * プログラム別の問題数を取得
     * @returns {Object} プログラム別の問題数
     */
    getProgramStats() {
        const stats = {};
        this.questions.forEach(q => {
            const program = q.program_code;
            stats[program] = (stats[program] || 0) + 1;
        });
        return stats;
    }

    /**
     * 問題を更新
     * @param {number} index - 更新する問題のインデックス
     * @param {Object} updatedQuestion - 更新後の問題データ
     */
    updateQuestion(index, updatedQuestion) {
        if (index >= 0 && index < this.questions.length) {
            this.questions[index] = { ...this.questions[index], ...updatedQuestion };
        }
    }

    /**
     * 変更をローカルストレージに保存
     */
    saveChanges() {
        const dataToSave = {
            questions: this.questions,
            metadata: {
                total_questions: this.questions.length,
                last_updated: new Date().toISOString(),
                updated_by: 'quiz_system'
            }
        };

        return Utils.saveToLocalStorage('quiz_questions_edited', dataToSave);
    }
}

// イベント管理クラス
class EventManager {
    constructor() {
        this.events = {};
    }

    /**
     * イベントリスナーを追加
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * イベントを発火
     * @param {string} event - イベント名
     * @param {*} data - イベントデータ
     */
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    /**
     * イベントリスナーを削除
     * @param {string} event - イベント名
     * @param {Function} callback - 削除するコールバック関数
     */
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

// グローバルインスタンス
const dataManager = new DataManager();
const eventManager = new EventManager();

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
    console.log('愛式メディカルリンパ®復習クイズシステム初期化完了');
    eventManager.emit('domReady');
});

// エクスポート（モジュール環境での使用を想定）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        Utils,
        DataManager,
        EventManager,
        dataManager,
        eventManager
    };
}

