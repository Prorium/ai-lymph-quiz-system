# 愛式メディカルリンパ®復習クイズシステム（モジュラー構成版）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

愛式メディカルリンパ®の公式復習クイズシステムです。HTML、CSS、JavaScriptを分離したモジュラー構成で、メンテナンスと拡張が容易になっています。

## 🌟 特徴

- **📁 モジュラー構成**: HTML、CSS、JavaScriptを分離して管理
- **🎯 3段階レベル**: 初級・中級・上級の難易度設定
- **📚 豊富な問題数**: 363問の厳選された問題
- **🎥 動画連携**: Teachableプラットフォームとの完全統合
- **✏️ 完全編集機能**: 講師による4つの選択肢すべての編集が可能
- **🎨 公式デザイン**: 愛式メディカルリンパ®の公式トンマナ準拠

## 📁 プロジェクト構成

```
ai-lymph-quiz-modular/
├── index.html              # 生徒用クイズアプリ（メインページ）
├── teacher.html            # 講師用管理画面
├── quiz_questions.json     # 問題データベース（363問）
├── css/                    # スタイルシート
│   ├── common.css          # 共通スタイル
│   ├── student.css         # 生徒用専用スタイル
│   └── teacher.css         # 講師用専用スタイル
├── js/                     # JavaScript
│   ├── common.js           # 共通関数・ユーティリティ
│   ├── student.js          # 生徒用アプリロジック
│   └── teacher.js          # 講師用アプリロジック
├── assets/                 # アセット
│   └── ai-logo.png         # 愛式メディカルリンパ®公式ロゴ
├── README.md               # プロジェクト説明書
└── LICENSE                 # ライセンス情報
```

## 🎯 機能詳細

### 📱 生徒用アプリ（index.html）

#### レベル選択システム
- **初級**: PG1-30（84問）- 基礎的な知識の確認
- **中級**: PG31-70（156問）- 応用的な理解の深化
- **上級**: PG71-90（123問）- 発展的な知識の習得

#### クイズ機能
- 各レベルから10問をランダム選択
- 即座のフィードバック（正解・不正解表示）
- 詳細な解説付き
- 関連動画へのダイレクトリンク

### 👨‍🏫 講師用管理画面（teacher.html）

#### 問題管理
- **一覧表示**: 363問すべての確認
- **フィルター機能**: 難易度・プログラム別絞り込み
- **検索機能**: 問題文での全文検索
- **ページネーション**: 効率的な問題閲覧

#### 完全編集機能 ✨**NEW**
- **問題文編集**: リアルタイム編集
- **4つの選択肢編集**: すべての選択肢を個別に編集可能
- **正解設定**: 編集後の選択肢から正解を選択
- **解説編集**: 詳細解説の修正
- **変更保存**: ローカルストレージでの保存

## 🛠️ 技術仕様

### ファイル構成の利点

#### CSS分離
- **common.css**: 全体共通のスタイル、CSS変数、ユーティリティクラス
- **student.css**: 生徒用アプリ専用のスタイル
- **teacher.css**: 講師用管理画面専用のスタイル

#### JavaScript分離
- **common.js**: 共通関数、データ管理、イベント管理
- **student.js**: クイズロジック、レベル選択、結果表示
- **teacher.js**: 問題管理、編集機能、フィルタリング

### 主要クラス

#### 共通クラス（common.js）
```javascript
// データ管理
class DataManager {
    async loadQuestions()      // 問題データ読み込み
    getDifficultyStats()       // 難易度別統計
    updateQuestion()           // 問題更新
    saveChanges()             // 変更保存
}

// イベント管理
class EventManager {
    on(event, callback)        // イベントリスナー追加
    emit(event, data)         // イベント発火
    off(event, callback)      // イベントリスナー削除
}

// ユーティリティ関数
const Utils = {
    shuffleArray()            // 配列シャッフル
    getRandomItems()          // ランダム選択
    filterQuestions()         // 問題フィルター
    debounce()               // デバウンス
}
```

#### 生徒用クラス（student.js）
```javascript
class QuizApp {
    startQuiz(level)          // クイズ開始
    displayCurrentQuestion()   // 問題表示
    handleOptionSelect()      // 選択肢選択処理
    showResults()            // 結果表示
}
```

#### 講師用クラス（teacher.js）
```javascript
class TeacherApp {
    applyFilters()           // フィルター適用
    displayQuestions()       // 問題一覧表示
    editAnswers()           // 4つの選択肢すべてを編集 ✨NEW
    saveAllChanges()         // 全変更保存
}
```

## 🚀 セットアップ

### 1. ファイル配置
```bash
# プロジェクトディレクトリに全ファイルを配置
ai-lymph-quiz-modular/
├── index.html
├── teacher.html
├── quiz_questions.json
├── css/
├── js/
└── assets/
```

### 2. ローカルサーバー起動
```bash
# Python使用
python3 -m http.server 8080

# Node.js使用
npx http-server -p 8080

# Live Server（VS Code拡張）
# VS Codeでindex.htmlを開き、Live Server拡張を使用
```

### 3. アクセス
- 生徒用: `http://localhost:8080/`
- 講師用: `http://localhost:8080/teacher.html`

## 🔧 開発・カスタマイズ

### CSS変数の活用
```css
/* common.cssで定義されたCSS変数 */
:root {
    --primary-color: #b8860b;
    --beginner-color: #2e7d32;
    --intermediate-color: #f57c00;
    --advanced-color: #c2185b;
    /* ... その他の変数 */
}
```

### 新機能の追加

#### 1. 新しいCSS追加
```css
/* css/custom.css */
.new-feature {
    /* 新機能のスタイル */
}
```

#### 2. 新しいJavaScript機能
```javascript
// js/extensions.js
class NewFeature {
    // 新機能の実装
}
```

#### 3. HTMLに追加
```html
<!-- 新しいCSSとJSを読み込み -->
<link rel="stylesheet" href="css/custom.css">
<script src="js/extensions.js"></script>
```

### 設定変更

#### 問題数の変更
```javascript
// js/common.js
const CONFIG = {
    QUESTIONS_PER_LEVEL: 15, // デフォルト: 10問
    // ...
};
```

#### 新しい難易度の追加
```javascript
// 1. common.jsで設定追加
const CONFIG = {
    DIFFICULTIES: {
        BEGINNER: '初級',
        INTERMEDIATE: '中級',
        ADVANCED: '上級',
        EXPERT: '上級者' // 新しい難易度
    }
};

// 2. common.cssでスタイル追加
.difficulty-上級者 {
    background: #4a148c;
    color: white;
}
```

## 📊 データ構造

### 問題データ（quiz_questions.json）
```json
{
  "questions": [
    {
      "id": "unique_id",
      "title": "レクチャータイトル",
      "question": "問題文",
      "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correct_answer": "正解の選択肢",
      "explanation": "詳細な解説",
      "difficulty": "初級|中級|上級",
      "program_code": "PG01",
      "lecture_code": "PG01-1",
      "url": "https://ailymphatic.com/courses/course/lectures/12345"
    }
  ]
}
```

## 🎨 デザインシステム

### カラーパレット
- **プライマリー**: `#b8860b` (ゴールド)
- **初級**: `#2e7d32` (グリーン)
- **中級**: `#f57c00` (オレンジ)
- **上級**: `#c2185b` (ピンク)

### タイポグラフィ
- **フォントファミリー**: 'Hiragino Sans', 'Yu Gothic', 'Meiryo'
- **サイズ**: 0.85rem〜2.2rem（レスポンシブ対応）

### スペーシング
- **XS**: 5px
- **SM**: 10px
- **MD**: 15px
- **LG**: 20px
- **XL**: 30px
- **XXL**: 40px

## 🔒 セキュリティ

- **XSS対策**: 入力値のサニタイズ
- **データ検証**: 問題データの整合性チェック
- **ローカルストレージ**: 機密情報は保存しない

## 📈 パフォーマンス

- **モジュラー読み込み**: 必要なファイルのみ読み込み
- **CSS最適化**: 共通スタイルの再利用
- **JavaScript最適化**: イベント駆動型アーキテクチャ
- **画像最適化**: 適切なサイズとフォーマット

## 🤝 コントリビューション

### 開発フロー
1. フォークを作成
2. フィーチャーブランチを作成
3. 適切なファイルに変更を加える
4. テストを実行
5. Pull Requestを作成

### コーディング規約
- **CSS**: BEM記法推奨
- **JavaScript**: ES6+構文使用
- **HTML**: セマンティックマークアップ

## 📝 更新履歴

### v2.0.0 (2025-08-23)
- **4つの選択肢完全編集機能**: 講師用ページで全選択肢を編集可能
- **編集フロー改善**: 確実な4つ選択肢編集システム
- **バリデーション強化**: 重複・空文字チェック
- **ユーザビリティ向上**: 詳細なプロンプトとエラーハンドリング

### **編集機能の使い方**
1. 講師用ページで「解答を編集」をクリック
2. 選択肢1〜4を順番に編集（変更不要なら元の値のまま）
3. 正解の番号（1-4）を選択
4. 変更が保存され、画面が更新される

### v1.0.0 (2025-08-20)
- **初回リリース**: 基本的なクイズ機能
- **レベル選択**: 初級・中級・上級
- **問題管理**: 363問の問題データベース
- **動画連携**: Teachableプラットフォーム統合

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/your-username/ai-lymph-quiz-system/issues)
- **Email**: support@ailymphatic.com

---

**愛式メディカルリンパ®復習クイズシステム（モジュラー構成版）**  
© 2025 愛式メディカルリンパ®. All rights reserved.

