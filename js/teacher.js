/**
 * 愛式メディカルリンパ®復習クイズシステム - 講師用JavaScript
 */

class TeacherApp {
    constructor() {
        this.allQuestions = [];
        this.filteredQuestions = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.hasChanges = false;
        this.filters = {
            difficulty: '',
            program: '',
            search: '',
            approval: ''
        };
        
        this.init();
    }

    /**
     * アプリケーションの初期化
     */
    async init() {
        try {
            await this.loadQuestions();
            this.setupEventListeners();
            this.updateStats();
            this.populateFilters();
            this.applyFilters();
        } catch (error) {
            this.showError('問題データの読み込みに失敗しました。');
        }
    }

    /**
     * 問題データを読み込み
     */
    async loadQuestions() {
        this.allQuestions = await dataManager.loadQuestions();
        
        // 承認フィールドが存在しない問題に初期値を設定
        this.allQuestions.forEach(question => {
            if (question.approved === undefined) {
                question.approved = true; // デフォルトで承認済み
            }
        });
        
        console.log(`問題データを読み込みました: ${this.allQuestions.length}問`);
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // フィルター関連
        document.getElementById('difficultyFilter').addEventListener('change', () => {
            this.filters.difficulty = document.getElementById('difficultyFilter').value;
            this.applyFilters();
        });

        document.getElementById('approvalFilter').addEventListener('change', () => {
            this.filters.approval = document.getElementById('approvalFilter').value;
            this.applyFilters();
        });

        document.getElementById('programFilter').addEventListener('change', () => {
            this.filters.program = document.getElementById('programFilter').value;
            this.applyFilters();
        });

        // 検索（デバウンス付き）
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', Utils.debounce(() => {
            this.filters.search = searchInput.value;
            this.applyFilters();
        }, 300));

        // 表示件数変更
        document.getElementById('itemsPerPage').addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.displayQuestions();
            this.updatePagination();
        });

        // ページ離脱前の警告
        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                e.preventDefault();
                e.returnValue = '未保存の変更があります。ページを離れますか？';
            }
        });
    }

    /**
     * 統計情報を更新
     */
    updateStats() {
        const difficultyStats = dataManager.getDifficultyStats();
        const approvedCount = this.allQuestions.filter(q => q.approved === true).length;
        const unapprovedCount = this.allQuestions.filter(q => q.approved === false).length;
        
        Utils.setText('#totalQuestions', this.allQuestions.length);
        Utils.setText('#approvedCount', approvedCount);
        Utils.setText('#unapprovedCount', unapprovedCount);
        Utils.setText('#beginnerCount', difficultyStats[CONFIG.DIFFICULTIES.BEGINNER] || 0);
        Utils.setText('#intermediateCount', difficultyStats[CONFIG.DIFFICULTIES.INTERMEDIATE] || 0);
        Utils.setText('#advancedCount', difficultyStats[CONFIG.DIFFICULTIES.ADVANCED] || 0);
    }

    /**
     * フィルター選択肢を設定
     */
    populateFilters() {
        // プログラムフィルター
        const programCodes = [...new Set(this.allQuestions.map(q => q.program_code))].sort();
        const programFilter = document.getElementById('programFilter');
        
        programCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            programFilter.appendChild(option);
        });
    }

    /**
     * フィルターを適用
     */
    applyFilters() {
        this.filteredQuestions = this.allQuestions.filter(question => {
            const matchesDifficulty = !this.filters.difficulty || question.difficulty === this.filters.difficulty;
            const matchesProgram = !this.filters.program || question.program_code === this.filters.program;
            const matchesSearch = !this.filters.search || this.searchInQuestion(question, this.filters.search);
            const matchesApproval = !this.filters.approval || 
                (this.filters.approval === 'approved' && question.approved === true) ||
                (this.filters.approval === 'unapproved' && question.approved === false);

            return matchesDifficulty && matchesProgram && matchesSearch && matchesApproval;
        });

        Utils.setText('#filteredCount', this.filteredQuestions.length);
        this.currentPage = 1;
        this.displayQuestions();
        this.updatePagination();
    }

    /**
     * 問題内検索
     * @param {Object} question - 問題オブジェクト
     * @param {string} searchText - 検索テキスト
     * @returns {boolean} マッチするかどうか
     */
    searchInQuestion(question, searchText) {
        const lowerSearchText = searchText.toLowerCase();
        return question.question.toLowerCase().includes(lowerSearchText) ||
               question.title.toLowerCase().includes(lowerSearchText) ||
               question.explanation.toLowerCase().includes(lowerSearchText);
    }

    /**
     * フィルターをリセット
     */
    resetFilters() {
        document.getElementById('difficultyFilter').value = '';
        document.getElementById('approvalFilter').value = '';
        document.getElementById('programFilter').value = '';
        document.getElementById('searchInput').value = '';
        
        this.filters = { difficulty: '', program: '', search: '', approval: '' };
        this.applyFilters();
    }

    /**
     * 問題を表示
     */
    displayQuestions() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const questionsToShow = this.filteredQuestions.slice(startIndex, endIndex);

        const questionsList = document.getElementById('questionsList');
        questionsList.innerHTML = '';

        if (questionsToShow.length === 0) {
            questionsList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    該当する問題が見つかりません。
                </div>
            `;
            return;
        }

        questionsToShow.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = this.createQuestionHTML(question, startIndex + index);
            questionsList.appendChild(questionDiv);
        });
    }

    /**
     * 問題のHTMLを作成
     * @param {Object} question - 問題オブジェクト
     * @param {number} globalIndex - グローバルインデックス
     * @returns {string} 問題のHTML
     */
    createQuestionHTML(question, globalIndex) {
        const optionsHtml = question.options.map(option => {
            const isCorrect = option === question.correct_answer;
            return `<div class="option-item ${isCorrect ? 'correct' : ''}">${option}</div>`;
        }).join('');

        const approvalBadge = question.approved ? 
            '<span class="approval-badge approved">✅ 承認済み</span>' : 
            '<span class="approval-badge unapproved">❌ 未承認</span>';

        const approvalButton = question.approved ? 
            `<button class="btn btn-warning btn-small" onclick="toggleApproval(${globalIndex})">未承認にする</button>` :
            `<button class="btn btn-success btn-small" onclick="toggleApproval(${globalIndex})">承認する</button>`;

        return `
            <div class="question-header">
                <div class="question-meta">
                    <span class="lecture-code">${question.lecture_code}</span>
                    <span class="difficulty-badge difficulty-${question.difficulty}">${question.difficulty}</span>
                    ${approvalBadge}
                </div>
                <div class="question-actions">
                    ${approvalButton}
                    <button class="btn btn-edit btn-small" onclick="editQuestion(${globalIndex})">問題を編集</button>
                    <button class="btn btn-edit btn-small" onclick="editAnswers(${globalIndex})">解答を編集</button>
                    <button class="btn btn-edit btn-small" onclick="editExplanation(${globalIndex})">解説を編集</button>
                </div>
            </div>
            <div class="question-title">${question.title}</div>
            <div class="question-text">${question.question}</div>
            <div class="options-list">${optionsHtml}</div>
            <div class="explanation"><strong>解説:</strong> ${question.explanation}</div>
            <a href="${question.url}" target="_blank" class="video-link">
                📹 関連動画を見る
            </a>
        `;
    }

    /**
     * 問題文を編集
     * @param {number} index - 問題のインデックス
     */
    editQuestion(index) {
        const question = this.filteredQuestions[index];
        const newQuestion = prompt('問題文を編集してください:', question.question);
        
        if (newQuestion && newQuestion !== question.question) {
            this.updateQuestionData(question, 'question', newQuestion);
            this.displayQuestions();
            this.showSaveStatus('問題文を更新しました', 'success');
        }
    }

    /**
     * 解答を編集（選択肢と正解を統合編集）
     * @param {number} index - 問題のインデックス
     */
    editAnswers(index) {
        const question = this.filteredQuestions[index];
        const currentOptions = [...question.options];
        const currentCorrectAnswer = question.correct_answer;
        
        console.log('=== 4つの選択肢編集開始 ===');
        console.log('問題:', question.lecture_code);
        console.log('現在の選択肢:', currentOptions);
        console.log('現在の正解:', currentCorrectAnswer);
        
        // 確実に4つの選択肢を編集
        const newOptions = [];
        let hasChanges = false;
        
        // 選択肢を1つずつ編集（必ず4つ）
        for (let i = 0; i < 4; i++) {
            const currentOption = currentOptions[i] || `選択肢${i + 1}`;
            
            console.log(`--- 選択肢 ${i + 1} の編集開始 ---`);
            console.log(`現在の値: "${currentOption}"`);
            
            // より明確なプロンプトメッセージ
            const promptTitle = `【${i + 1}/4】選択肢 ${i + 1} を編集`;
            const promptMessage = `${promptTitle}\n\n現在の選択肢:\n"${currentOption}"\n\n新しい選択肢を入力してください:\n（空白の場合は現在の値を保持）`;
            
            let newOption;
            let attempts = 0;
            
            // 入力を確実に取得
            do {
                newOption = prompt(promptMessage, currentOption);
                attempts++;
                
                if (newOption === null) {
                    console.log('編集がキャンセルされました');
                    if (confirm('編集をキャンセルしますか？\n「いいえ」を選択すると編集を続行します。')) {
                        return;
                    } else {
                        // 続行する場合は現在の値を使用
                        newOption = currentOption;
                        break;
                    }
                }
                
                if (attempts > 3) {
                    console.log('入力試行回数が上限に達しました');
                    newOption = currentOption;
                    break;
                }
                
            } while (newOption === null);
            
            // 空文字の場合は現在の値を使用
            const finalOption = (newOption && newOption.trim()) ? newOption.trim() : currentOption;
            
            console.log(`入力値: "${newOption}"`);
            console.log(`最終値: "${finalOption}"`);
            
            if (finalOption !== currentOption) {
                hasChanges = true;
                console.log(`変更検出: "${currentOption}" → "${finalOption}"`);
            }
            
            newOptions.push(finalOption);
        }
        
        console.log('=== 編集完了 ===');
        console.log('新しい選択肢:', newOptions);
        console.log('変更あり:', hasChanges);
        
        // バリデーション
        if (newOptions.length !== 4) {
            console.error('選択肢の数が4つではありません:', newOptions.length);
            alert('エラー: 選択肢は4つ必要です。');
            return;
        }
        
        // 空の選択肢チェック
        const emptyOptions = newOptions.filter(option => !option || !option.trim());
        if (emptyOptions.length > 0) {
            console.error('空の選択肢があります:', emptyOptions);
            alert('空の選択肢があります。すべての選択肢に内容を入力してください。');
            return;
        }
        
        // 重複チェック
        const uniqueOptions = [...new Set(newOptions)];
        if (uniqueOptions.length !== 4) {
            console.error('重複する選択肢があります');
            alert('選択肢に重複があります。すべて異なる選択肢にしてください。');
            return;
        }
        
        console.log('バリデーション: 成功');
        
        // 正解を選択
        let optionsDisplay = '【正解を選択してください】\n\n編集後の選択肢:\n';
        newOptions.forEach((option, i) => {
            optionsDisplay += `${i + 1}. ${option}\n`;
        });
        optionsDisplay += '\n正解の番号を入力してください (1, 2, 3, 4):';
        
        // 現在の正解の番号を取得
        const currentCorrectIndex = currentOptions.indexOf(currentCorrectAnswer);
        const defaultNumber = (currentCorrectIndex >= 0) ? (currentCorrectIndex + 1).toString() : '1';
        
        console.log('--- 正解選択 ---');
        console.log('現在の正解インデックス:', currentCorrectIndex);
        console.log('デフォルト番号:', defaultNumber);
        
        const correctNumber = prompt(optionsDisplay, defaultNumber);
        
        if (correctNumber === null) {
            console.log('正解選択がキャンセルされました');
            alert('正解選択がキャンセルされました。');
            return;
        }
        
        const correctIndex = parseInt(correctNumber.trim()) - 1;
        console.log('入力された番号:', correctNumber);
        console.log('正解インデックス:', correctIndex);
        
        if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= 4) {
            console.error('無効な正解番号:', correctNumber);
            alert('正解の番号が無効です。1から4の間で入力してください。');
            return;
        }
        
        const newCorrectAnswer = newOptions[correctIndex];
        console.log('新しい正解:', newCorrectAnswer);
        
        // 変更を適用
        if (hasChanges || newCorrectAnswer !== currentCorrectAnswer) {
            // 元の問題データを更新
            const originalQuestion = this.dataManager.questions.find(q => q.lecture_code === question.lecture_code);
            if (originalQuestion) {
                originalQuestion.options = [...newOptions];
                originalQuestion.correct_answer = newCorrectAnswer;
                console.log('元データ更新完了');
            }
            
            // フィルタされた問題データも更新
            question.options = [...newOptions];
            question.correct_answer = newCorrectAnswer;
            console.log('フィルタデータ更新完了');
            
            // 画面を更新
            this.displayQuestions();
            this.showSaveStatus('4つの選択肢すべてを更新しました', 'success');
            
            console.log('=== 更新完了 ===');
            console.log('最終選択肢:', question.options);
            console.log('最終正解:', question.correct_answer);
            
            alert('4つの選択肢すべてを更新しました！');
        } else {
            console.log('変更はありませんでした');
            alert('変更はありませんでした。');
        }
    }

    /**
     * 解説を編集
     * @param {number} index - 問題のインデックス
     */
    editExplanation(index) {
        const question = this.filteredQuestions[index];
        const newExplanation = prompt('解説を編集してください:', question.explanation);
        
        if (newExplanation && newExplanation !== question.explanation) {
            this.updateQuestionData(question, 'explanation', newExplanation);
            this.displayQuestions();
            this.showSaveStatus('解説を更新しました', 'success');
        }
    }

    /**
     * 問題データを更新
     * @param {Object} question - 更新する問題
     * @param {string} field - 更新するフィールド
     * @param {*} value - 新しい値
     */
    updateQuestionData(question, field, value) {
        // 元の配列からも更新
        const originalIndex = this.allQuestions.findIndex(q => 
            q.lecture_code === question.lecture_code && 
            q.question === question.question
        );
        
        if (originalIndex !== -1) {
            this.allQuestions[originalIndex][field] = value;
            question[field] = value;
            this.hasChanges = true;
        }
    }

    /**
     * すべての変更を保存
     */
    saveAllChanges() {
        if (!this.hasChanges) {
            this.showSaveStatus('変更がありません', 'success');
            return;
        }

        const success = dataManager.saveChanges();
        
        if (success) {
            this.hasChanges = false;
            this.showSaveStatus('変更を保存しました', 'success');
            console.log('問題データを保存しました');
        } else {
            this.showSaveStatus('保存に失敗しました', 'error');
        }
    }

    /**
     * 保存状況を表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ（success/error）
     */
    showSaveStatus(message, type) {
        const statusDiv = document.getElementById('saveStatus');
        statusDiv.textContent = message;
        statusDiv.className = `save-status ${type}`;
        
        setTimeout(() => {
            statusDiv.className = 'save-status';
        }, 3000);
    }

    /**
     * ページネーションを更新
     */
    updatePagination() {
        const totalPages = Math.ceil(this.filteredQuestions.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // 前のページボタン
        const prevButton = this.createPaginationButton('前へ', this.currentPage > 1, () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.displayQuestions();
                this.updatePagination();
            }
        });
        pagination.appendChild(prevButton);

        // ページ番号ボタン
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = this.createPaginationButton(
                i.toString(), 
                true, 
                () => {
                    this.currentPage = i;
                    this.displayQuestions();
                    this.updatePagination();
                }
            );
            
            if (i === this.currentPage) {
                pageButton.classList.add('current-page');
            }
            
            pagination.appendChild(pageButton);
        }

        // 次のページボタン
        const nextButton = this.createPaginationButton('次へ', this.currentPage < totalPages, () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.displayQuestions();
                this.updatePagination();
            }
        });
        pagination.appendChild(nextButton);

        // ページ情報
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        pageInfo.style.margin = '0 15px';
        pageInfo.style.color = '#666';
        pagination.appendChild(pageInfo);
    }

    /**
     * ページネーションボタンを作成
     * @param {string} text - ボタンテキスト
     * @param {boolean} enabled - 有効かどうか
     * @param {Function} onClick - クリックハンドラ
     * @returns {HTMLElement} ボタン要素
     */
    createPaginationButton(text, enabled, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = !enabled;
        if (enabled) {
            button.addEventListener('click', onClick);
        }
        return button;
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 20px;
            text-align: center;
            border: 1px solid #f5c6cb;
        `;
        errorElement.textContent = message;
        
        document.body.insertBefore(errorElement, document.body.firstChild);
        
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }
}

// アプリケーション初期化
let teacherApp;

eventManager.on('domReady', () => {
    teacherApp = new TeacherApp();
});

// グローバル関数（HTML内のonclickイベント用）
function applyFilters() {
    if (teacherApp) {
        teacherApp.applyFilters();
    }
}

function resetFilters() {
    if (teacherApp) {
        teacherApp.resetFilters();
    }
}

function saveAllChanges() {
    if (teacherApp) {
        teacherApp.saveAllChanges();
    }
}

function editQuestion(index) {
    if (teacherApp) {
        teacherApp.editQuestion(index);
    }
}

function editAnswers(index) {
    if (teacherApp) {
        teacherApp.editAnswers(index);
    }
}

function editExplanation(index) {
    if (teacherApp) {
        teacherApp.editExplanation(index);
    }
}


// 承認関連のグローバル関数
function toggleApproval(index) {
    if (teacherApp) {
        const question = teacherApp.filteredQuestions[index];
        question.approved = !question.approved;
        teacherApp.hasChanges = true;
        teacherApp.updateStats();
        teacherApp.displayQuestions();
        teacherApp.showSaveStatus(
            question.approved ? '問題を承認しました' : '問題を未承認にしました', 
            'success'
        );
    }
}

// 一括承認・未承認機能（修正版）
async function bulkApprove() {
    console.debug('[bulkApprove] 開始');
    
    if (!teacherApp) {
        console.error('[bulkApprove] teacherAppが未初期化');
        return;
    }
    
    const targetQuestions = teacherApp.filteredQuestions;
    const count = targetQuestions.length;
    
    if (count === 0) {
        teacherApp.showSaveStatus('承認する問題がありません', 'warning');
        return;
    }
    
    if (!confirm(`表示中の${count}問をすべて承認しますか？`)) {
        return;
    }
    
    // ボタンを無効化（二重クリック防止）
    const button = document.querySelector('button[onclick="bulkApprove()"]');
    if (button) {
        button.disabled = true;
        button.textContent = '処理中...';
    }
    
    try {
        console.debug('[bulkApprove]', {count, ids: targetQuestions.map(q => q.id)});
        
        // 楽観的更新
        const originalStates = targetQuestions.map(q => ({id: q.id, approved: q.approved}));
        
        targetQuestions.forEach(question => {
            question.approved = true;
        });
        
        teacherApp.hasChanges = true;
        teacherApp.updateStats();
        teacherApp.displayQuestions();
        
        // 実際の保存処理（既存のsaveAllChanges関数を利用）
        await teacherApp.saveAllChanges();
        
        teacherApp.showSaveStatus(`${count}問を一括承認しました`, 'success');
        
    } catch (error) {
        console.error('[bulkApprove] エラー:', error);
        
        // ロールバック
        const originalStates = targetQuestions.map(q => ({id: q.id, approved: false}));
        originalStates.forEach(state => {
            const question = targetQuestions.find(q => q.id === state.id);
            if (question) question.approved = state.approved;
        });
        
        teacherApp.updateStats();
        teacherApp.displayQuestions();
        teacherApp.showSaveStatus('一括承認に失敗しました', 'error');
        
    } finally {
        // ボタンを再有効化
        if (button) {
            button.disabled = false;
            button.textContent = '✅ 表示中の問題を一括承認';
        }
    }
}

async function bulkUnapprove() {
    console.debug('[bulkUnapprove] 開始');
    
    if (!teacherApp) {
        console.error('[bulkUnapprove] teacherAppが未初期化');
        return;
    }
    
    const targetQuestions = teacherApp.filteredQuestions;
    const count = targetQuestions.length;
    
    if (count === 0) {
        teacherApp.showSaveStatus('未承認にする問題がありません', 'warning');
        return;
    }
    
    if (!confirm(`表示中の${count}問をすべて未承認にしますか？`)) {
        return;
    }
    
    // ボタンを無効化（二重クリック防止）
    const button = document.querySelector('button[onclick="bulkUnapprove()"]');
    if (button) {
        button.disabled = true;
        button.textContent = '処理中...';
    }
    
    try {
        console.debug('[bulkUnapprove]', {count, ids: targetQuestions.map(q => q.id)});
        
        // 楽観的更新
        const originalStates = targetQuestions.map(q => ({id: q.id, approved: q.approved}));
        
        targetQuestions.forEach(question => {
            question.approved = false;
        });
        
        teacherApp.hasChanges = true;
        teacherApp.updateStats();
        teacherApp.displayQuestions();
        
        // 実際の保存処理
        await teacherApp.saveAllChanges();
        
        teacherApp.showSaveStatus(`${count}問を一括未承認にしました`, 'warning');
        
    } catch (error) {
        console.error('[bulkUnapprove] エラー:', error);
        
        // ロールバック
        const originalStates = targetQuestions.map(q => ({id: q.id, approved: true}));
        originalStates.forEach(state => {
            const question = targetQuestions.find(q => q.id === state.id);
            if (question) question.approved = state.approved;
        });
        
        teacherApp.updateStats();
        teacherApp.displayQuestions();
        teacherApp.showSaveStatus('一括未承認に失敗しました', 'error');
        
    } finally {
        // ボタンを再有効化
        if (button) {
            button.disabled = false;
            button.textContent = '❌ 表示中の問題を一括未承認';
        }
    }
}

async function approveAll() {
    console.debug('[approveAll] 開始');
    
    if (!teacherApp) {
        console.error('[approveAll] teacherAppが未初期化');
        return;
    }
    
    const count = teacherApp.allQuestions.length;
    
    if (!confirm(`全${count}問を承認しますか？`)) {
        return;
    }
    
    // ボタンを無効化
    const button = document.querySelector('button[onclick="approveAll()"]');
    if (button) {
        button.disabled = true;
        button.textContent = '処理中...';
    }
    
    try {
        console.debug('[approveAll]', {count});
        
        teacherApp.allQuestions.forEach(question => {
            question.approved = true;
        });
        
        teacherApp.hasChanges = true;
        teacherApp.updateStats();
        teacherApp.applyFilters();
        
        await teacherApp.saveAllChanges();
        
        teacherApp.showSaveStatus(`${count}問を全承認しました`, 'success');
        
    } catch (error) {
        console.error('[approveAll] エラー:', error);
        teacherApp.showSaveStatus('全承認に失敗しました', 'error');
        
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = '✅ 全問題を一括承認';
        }
    }
}

async function unapproveAll() {
    console.debug('[unapproveAll] 開始');
    
    if (!teacherApp) {
        console.error('[unapproveAll] teacherAppが未初期化');
        return;
    }
    
    const count = teacherApp.allQuestions.length;
    
    if (!confirm(`全${count}問を未承認にしますか？`)) {
        return;
    }
    
    // ボタンを無効化
    const button = document.querySelector('button[onclick="unapproveAll()"]');
    if (button) {
        button.disabled = true;
        button.textContent = '処理中...';
    }
    
    try {
        console.debug('[unapproveAll]', {count});
        
        teacherApp.allQuestions.forEach(question => {
            question.approved = false;
        });
        
        teacherApp.hasChanges = true;
        teacherApp.updateStats();
        teacherApp.applyFilters();
        
        await teacherApp.saveAllChanges();
        
        teacherApp.showSaveStatus(`${count}問を全未承認にしました`, 'warning');
        
    } catch (error) {
        console.error('[unapproveAll] エラー:', error);
        teacherApp.showSaveStatus('全未承認に失敗しました', 'error');
        
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = '❌ 全問題を一括未承認';
        }
    }
}

