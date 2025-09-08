/**
 * 愛式メディカルリンパ®復習クイズシステム - 生徒用JavaScript
 */

class QuizApp {
    constructor() {
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.selectedLevel = null;
        this.isQuizActive = false;
        this.startTime = null;
        
        this.init();
    }

    /**
     * アプリケーションの初期化
     */
    async init() {
        try {
            await dataManager.loadQuestions();
            this.setupEventListeners();
            this.showLevelSelection();
        } catch (error) {
            this.showError('問題データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // レベル選択ボタン
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                this.startQuiz(level);
            });
        });

        // 選択肢クリック
        eventManager.on('optionSelected', (data) => {
            this.handleOptionSelect(data.optionIndex);
        });

        // 次の問題ボタン
        eventManager.on('nextQuestion', () => {
            this.nextQuestion();
        });

        // クイズ再開始
        eventManager.on('restartQuiz', () => {
            this.restartQuiz();
        });
    }

    /**
     * クイズを再開始
     */
    restartQuiz() {
        console.debug('[restartQuiz] クイズを再開始します');
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.selectedLevel = null;
        this.isQuizActive = false;
        this.startTime = null;
        this.showLevelSelection();
    }

    /**
     * レベル選択画面を表示
     */
    showLevelSelection() {
        this.isQuizActive = false;
        Utils.toggleElement('.level-selection', true);
        Utils.toggleElement('.quiz-container', false);
        Utils.toggleElement('.results-container', false);
        
        // 統計情報を更新
        this.updateLevelStats();
    }

    /**
     * レベル別統計情報を更新
     */
    updateLevelStats() {
        const stats = dataManager.getDifficultyStats();
        
        // レベルボタンに問題数を表示
        document.querySelectorAll('.level-btn').forEach(btn => {
            const level = btn.dataset.level;
            const count = stats[level] || 0;
            const currentText = btn.textContent.split('（')[0];
            btn.textContent = `${currentText}（${count}問）`;
        });
    }

    /**
     * クイズを開始
     * @param {string} level - 選択されたレベル
     */
    async startQuiz(level) {
        this.selectedLevel = level;
        this.startTime = new Date();
        
        // レベルに対応する承認済み問題を取得
        const allQuestions = dataManager.questions;
        const levelQuestions = Utils.filterQuestionsByDifficulty(allQuestions, level)
            .filter(question => question.approved !== false); // 承認済み問題のみ
        
        if (levelQuestions.length === 0) {
            this.showError(`${level}の承認済み問題が見つかりません。`);
            return;
        }

        if (levelQuestions.length < CONFIG.QUESTIONS_PER_LEVEL) {
            this.showError(`${level}の承認済み問題が${CONFIG.QUESTIONS_PER_LEVEL}問未満です（現在${levelQuestions.length}問）。`);
            return;
        }

        // ランダムに10問選択
        this.currentQuestions = Utils.getRandomItems(levelQuestions, CONFIG.QUESTIONS_PER_LEVEL);
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.isQuizActive = true;

        // UI切り替え
        Utils.toggleElement('.level-selection', false);
        Utils.toggleElement('.quiz-container', true);
        Utils.toggleElement('.results-container', false);

        // 最初の問題を表示
        this.displayCurrentQuestion();
    }

    /**
     * 現在の問題を表示
     */
    displayCurrentQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.showResults();
            return;
        }

        const question = this.currentQuestions[this.currentQuestionIndex];
        const questionNumber = this.currentQuestionIndex + 1;
        const totalQuestions = this.currentQuestions.length;

        // プログレスバー更新
        const progress = (questionNumber / totalQuestions) * 100;
        Utils.setText('.question-number', `問題 ${questionNumber}`);
        Utils.setText('.total-questions', `/ ${totalQuestions}`);
        document.querySelector('.progress-fill').style.width = `${progress}%`;

        // 問題情報表示
        Utils.setText('.lecture-code', question.lecture_code);
        Utils.setText('.difficulty-badge', question.difficulty);
        Utils.setText('.question-title', question.title);
        Utils.setText('.question-text', question.question);

        // 選択肢表示
        this.displayOptions(question.options);

        // 解説と関連動画を非表示
        Utils.toggleElement('.explanation', false);
        Utils.toggleElement('.video-link', false);
        Utils.toggleElement('.next-btn', false);
    }

    /**
     * 選択肢を表示
     * @param {Array} options - 選択肢の配列
     */
    displayOptions(options) {
        const container = document.querySelector('.options-container');
        container.innerHTML = '';

        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => {
                eventManager.emit('optionSelected', { optionIndex: index });
            });
            container.appendChild(optionElement);
        });
    }

    /**
     * 選択肢選択時の処理
     * @param {number} optionIndex - 選択された選択肢のインデックス
     */
    handleOptionSelect(optionIndex) {
        console.debug('[handleOptionSelect] 開始', {optionIndex, currentQuestionIndex: this.currentQuestionIndex});
        
        const question = this.currentQuestions[this.currentQuestionIndex];
        const selectedOption = question.options[optionIndex];
        const isCorrect = selectedOption === question.correct_answer;

        // 回答を記録
        this.userAnswers.push({
            question: question,
            selectedAnswer: selectedOption,
            isCorrect: isCorrect,
            timeSpent: new Date() - this.startTime
        });

        console.debug('[handleOptionSelect] 回答記録', {selectedOption, isCorrect});

        // 選択肢の状態を更新
        this.updateOptionsDisplay(optionIndex, isCorrect, question.correct_answer);

        // 解説と関連動画を表示
        this.showExplanation(question);

        // 次の問題ボタンを必ず表示（正誤に関係なく）
        const nextButton = document.querySelector('.next-btn');
        if (nextButton) {
            nextButton.style.display = 'block';
            nextButton.disabled = false;
            console.debug('[handleOptionSelect] 次の問題ボタンを表示');
        } else {
            console.error('[handleOptionSelect] 次の問題ボタンが見つかりません');
        }
        
        Utils.toggleElement('.next-btn', true);
    }

    /**
     * 選択肢の表示を更新
     * @param {number} selectedIndex - 選択されたインデックス
     * @param {boolean} isCorrect - 正解かどうか
     * @param {string} correctAnswer - 正解の選択肢
     */
    updateOptionsDisplay(selectedIndex, isCorrect, correctAnswer) {
        const options = document.querySelectorAll('.option');
        
        options.forEach((option, index) => {
            option.classList.add('disabled');
            
            if (index === selectedIndex) {
                option.classList.add(isCorrect ? 'correct' : 'incorrect');
                option.classList.add('selected');
            }
            
            // 正解の選択肢をハイライト
            if (option.textContent === correctAnswer) {
                option.classList.add('correct');
            }
        });
    }

    /**
     * 解説を表示
     * @param {Object} question - 問題オブジェクト
     */
    showExplanation(question) {
        const explanationElement = document.querySelector('.explanation');
        const videoLinkElement = document.querySelector('.video-link');

        // 解説表示
        Utils.setHTML('.explanation', `
            <h4>解説</h4>
            <p>${question.explanation}</p>
        `);
        Utils.toggleElement('.explanation', true);

        // 関連動画リンクは最後のまとめで表示するため、ここでは非表示
        Utils.toggleElement('.video-link', false);
    }

    /**
     * 次の問題に進む
     */
    nextQuestion() {
        console.debug('[nextQuestion] 開始', {currentQuestionIndex: this.currentQuestionIndex, totalQuestions: this.currentQuestions.length});
        
        // 連打防止
        const nextButton = document.querySelector('.next-btn');
        if (nextButton) {
            nextButton.disabled = true;
        }
        
        this.currentQuestionIndex++;
        
        // 最後の問題かチェック
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            console.debug('[nextQuestion] 全問題完了、結果表示へ');
            this.showResults();
        } else {
            console.debug('[nextQuestion] 次の問題を表示', {nextIndex: this.currentQuestionIndex});
            this.displayCurrentQuestion();
        }
    }

    /**
     * 結果を表示
     */
    showResults() {
        this.isQuizActive = false;
        const endTime = new Date();
        const totalTime = Math.round((endTime - this.startTime) / 1000);

        // UI切り替え
        Utils.toggleElement('.quiz-container', false);
        Utils.toggleElement('.results-container', true);

        // スコア計算
        const correctAnswers = this.userAnswers.filter(answer => answer.isCorrect).length;
        const totalQuestions = this.userAnswers.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);

        // 結果表示
        Utils.setText('.score-number', `${score}点`);
        Utils.setText('.score-text', `${correctAnswers}問正解 / ${totalQuestions}問中`);

        // 統計表示
        this.displayResultStats(correctAnswers, totalQuestions, totalTime);

        // 間違えた問題を表示
        this.displayWrongQuestions();
    }

    /**
     * 結果統計を表示
     * @param {number} correct - 正解数
     * @param {number} total - 総問題数
     * @param {number} time - 所要時間（秒）
     */
    displayResultStats(correct, total, time) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const timeText = `${minutes}分${seconds}秒`;

        Utils.setText('.correct-count', correct);
        Utils.setText('.total-count', total);
        Utils.setText('.time-spent', timeText);
        Utils.setText('.accuracy-rate', `${Math.round((correct / total) * 100)}%`);
    }

    /**
     * 間違えた問題を表示
     */
    displayWrongQuestions() {
        const wrongAnswers = this.userAnswers.filter(answer => !answer.isCorrect);
        const container = document.querySelector('.wrong-questions-list');

        if (wrongAnswers.length === 0) {
            Utils.setHTML('.wrong-questions', `
                <h3>🎉 全問正解おめでとうございます！</h3>
                <p>素晴らしい成績です。引き続き学習を頑張ってください。</p>
            `);
            return;
        }

        container.innerHTML = '';
        wrongAnswers.forEach((answer, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'wrong-question-item';
            
            // 関連動画リンクの表示判定
            const videoLinkHtml = (answer.question.url && answer.question.url !== 'None' && answer.question.url.trim() !== '') 
                ? `<a href="${answer.question.url}" target="_blank" class="video-link">📹 関連動画で復習する</a>`
                : '';
            
            questionElement.innerHTML = `
                <div class="wrong-question-text">${answer.question.question}</div>
                <div class="wrong-question-answer">
                    <span style="color: #dc3545;">あなたの回答:</span> ${answer.selectedAnswer}<br>
                    <span style="color: #28a745;">正解:</span> ${answer.question.correct_answer}
                </div>
                ${videoLinkHtml}
            `;
            container.appendChild(questionElement);
        });
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
        
        // 5秒後に自動削除
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }
}

// アプリケーション初期化
let quizApp;

eventManager.on('domReady', () => {
    quizApp = new QuizApp();
});

// グローバル関数（HTMLのonclick属性から呼び出される）
function nextQuestion() {
    console.debug('[nextQuestion] グローバル関数が呼び出されました');
    if (quizApp) {
        quizApp.nextQuestion();
    } else {
        console.error('[nextQuestion] quizAppが初期化されていません');
    }
}

function selectLevel(level) {
    console.debug('[selectLevel] グローバル関数が呼び出されました', {level});
    if (quizApp) {
        quizApp.selectLevel(level);
    } else {
        console.error('[selectLevel] quizAppが初期化されていません');
    }
}

function restartQuiz() {
    console.debug('[restartQuiz] グローバル関数が呼び出されました');
    if (quizApp) {
        quizApp.restartQuiz();
    } else {
        console.error('[restartQuiz] quizAppが初期化されていません');
    }
}

