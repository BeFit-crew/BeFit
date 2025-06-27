# 🤖 AI 분석 결과 공유 및 활용 가이드 (ES 모듈 방식)

이 문서는 `befit-ai` 프로젝트의 AI 분석 결과를 다른 페이지에서 **모던 자바스크립트 방식(`import`/`export`)**으로 쉽게 가져와 사용하는 방법을 안내합니다.

## 📌 핵심 원리

ES 모듈 시스템을 사용하면, 변수나 함수를 필요한 파일끼리만 안전하게 주고받을 수 있습니다.

1.  **데이터 생산 (A 페이지: `befit-ai.js`)**: AI 분석 페이지에서 결과가 생성되면, 브라우저의 공용 저장소(`localStorage`)에 데이터를 저장합니다.
2.  **함수 수출 (`export`)**: `befit-ai.js` 파일에서, `localStorage`의 데이터를 꺼내주는 `getBefitAiResult()` 함수를 다른 파일이 사용할 수 있도록 `export` 키워드로 내보냅니다.
3.  **함수 수입 (`import`)**: 데이터를 사용하고 싶은 팀원의 JS 파일에서, `export`된 `getBefitAiResult()` 함수를 `import` 키워드로 가져와 사용합니다.

> **[참고] `export`의 두 가지 방식과 우리의 선택**
>
> 1.  **`Named Export` (이름 지정 수출):** `export function myFunction() {}` 처럼 고유한 이름을 붙여 내보냅니다. 한 파일에서 여러 개를 내보낼 수 있으며, 가져올 때 `{ myFunction }` 처럼 **정확한 이름**을 써야 해서 코드가 명확합니다. **=> 우리가 사용할 방식입니다.**
>
> 2.  **`Default Export` (기본값 수출):** `export default function() {}` 처럼 파일의 '대표' 선수 하나를 지정합니다. 파일 당 **하나만** 가능하며, 가져올 때 `import myFunc from ...` 처럼 **원하는 이름으로 자유롭게** 가져올 수 있습니다.
>
> **왜 `Named Export`를 선택했나요?**
> `import { getBefitAiResult } from ...` 코드를 보면, "아, `getBefitAiResult`라는 함수를 가져오는구나" 하고 즉시 알 수 있어 **가독성과 유지보수**에 더 유리하기 때문입니다.

---

## 📌 시작 전 필수 체크리스트

-   **AI 분석 실행:** 데이터를 사용하기 전에, 반드시 AI 분석 페이지(`befit-ai.html`)에 방문하여 **한 번 이상 분석을 실행**해야 합니다. (동일한 브라우저 기준)
-   **`import` 경로 확인:** `import { ... } from '../경로/to/befit-ai.js'` 코드에서 **파일 경로를 자신의 JS 파일 위치에 맞게 정확히 수정**해야 합니다.
-   **모듈 타입 설정:** JS 파일을 불러오는 `<script>` 태그에는 반드시 **`type="module"` 속성을 추가**해야 합니다.

---

## 🙋‍♂️ 데이터 생산자 (AI 분석 페이지 담당)

AI 분석 페이지(`befit-ai.js`)를 담당하는 개발자는 아래 작업을 한 번만 수행하면 됩니다.

### 📋 작업 내용

`befit-ai.js` 파일의 **맨 마지막 부분**을 `export`를 사용하는 아래 코드로 작성하거나 수정합니다.

```javascript
// befit-ai.js 파일의 맨 마지막 부분

/**
 * [공유용 함수] 로컬 저장소에서 AI 데이터를 객체로 가져오는 함수.
 * ES 모듈의 export를 사용해 다른 스크립트에서 import하여 사용할 수 있게 합니다.
 */
export function getBefitAiResult() {
    const STORAGE_KEY = 'befit_ai_result';
    const savedDataString = localStorage.getItem(STORAGE_KEY);

    if (savedDataString) {
        try {
            // 성공적으로 데이터를 파싱하면 객체를 반환
            return JSON.parse(savedDataString);
        } catch (e) {
            console.error("공유 데이터 파싱 실패:", e);
            // 데이터가 손상되었으면 null 반환
            return null;
        }
    }
    // 저장된 데이터가 없으면 null 반환
    return null;
}
```

---

## 👩‍💻 데이터 소비자 (AI 데이터 활용 담당)

AI 분석 결과를 자신의 페이지에 가져와 사용해야 하는 팀원은 아래 절차를 따릅니다.

### ✅ 1. HTML 파일에 스크립트 추가하기

자신이 작업하는 HTML 파일의 `<head>` 섹션 안에 아래와 같이 스크립트를 추가합니다.

**⚠️ 매우 중요:** `import`/`export`를 사용하려면 `<script>` 태그에 **`type="module"` 속성을 반드시 추가**해야 합니다.

```html
<!-- 예시: team-member-page.html -->

<head>
    <meta charset="UTF-8">
    <title>팀원 페이지</title>
    <!-- CSS 등 다른 head 요소들 -->

    <!-- [필수] 모듈 타입으로 자신의 스크립트 파일을 불러옵니다. -->
    <script type="module" src="자신의/js/파일.js"></script>
</head>

<body>
    <h1>AI 데이터 활용 페이지</h1>
    <div id="result-display"></div>
    <!-- ... 자신의 페이지 내용 ... -->
</body>
```
> **참고:** `type="module"`은 자동으로 `defer` 속성을 포함하므로, 페이지의 모든 내용이 준비된 후 스크립트가 안전하게 실행됩니다.

### ✅ 2. 자신의 JS 파일에서 데이터 사용하기

자신의 JS 파일 맨 위에서 `getBefitAiResult` 함수를 `import`하여 사용할 수 있습니다.

```javascript
// 예시: 자신의/js/파일.js

// 1. [핵심] befit-ai.js에서 export된 함수를 { } 안에 넣어 import 합니다.
// 자신의 js 파일 위치에 따라 경로 조정 (실패 시 404, 모듈 오류 발생)
import { getBefitAiResult } from '../경로/to/befit-ai.js';


// 2. DOM이 완전히 로드된 후에 메인 로직을 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    console.log("팀원 페이지의 스크립트가 실행되었습니다.");

    // 3. import한 함수를 호출하여 AI 결과 객체를 가져옵니다.
    const aiData = getBefitAiResult();

    // 4. 데이터가 있는지 확인하고, 있으면 활용합니다.
    if (aiData) {
        // 성공! 이제 aiData는 순수한 자바스크립트 객체입니다.
        console.log("성공적으로 가져온 AI 데이터:", aiData);

        // --- 데이터 활용 예시 ---
        
        // 예시 1: 사용자 정보를 제목에 표시하기
        const user = aiData.user;
        document.querySelector('h1').textContent = `${user.age}세 ${user.gender} 사용자를 위한 분석 결과`;

        // 예시 2: 첫날 운동 루틴을 div에 표시하기
        const resultDisplay = document.getElementById('result-display');
        const firstDayTraining = aiData.training[0];
        resultDisplay.innerHTML = `
            <h3>${firstDayTraining.day}일차 운동 루틴</h3>
            <ul>
                ${firstDayTraining.routine.map(exercise => 
                    `<li>${exercise.part} - ${exercise.exercise}: ${exercise.set}</li>`
                ).join('')}
            </ul>
        `;

    } else {
        // 데이터가 없을 경우 (아직 AI 분석이 실행되지 않음)
        console.log("가져올 AI 데이터가 없습니다. AI 분석 페이지를 먼저 실행해주세요.");
        document.querySelector('h1').textContent = "저장된 AI 결과가 없습니다.";
    }
});
```