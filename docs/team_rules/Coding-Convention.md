# 코딩 및 프로젝트 구조 규칙

> [↩ 전체 규칙으로 돌아가기](BeFit-Team-Rules.md)

본 문서는 코드 작성 시의 네이밍 규칙과 프로젝트 디렉토리 구조를 정의합니다.

작성자: [왕택준](https://github.com/TJK98)

---

## 1. 네이밍 규칙

### 개인 작업 식별용 네이밍

각자 작성한 HTML 요소나 CSS 클래스, JS 함수/변수에서 충돌을 방지하고 소스 파악을 쉽게 하기 위해, 이름 뒤에 이니셜 또는 페이지명을 하이픈(-)으로 구분하여 덧붙입니다.

#### 예시

| 항목     | 규칙 예시                                        |
|--------|----------------------------------------------|
| ID     | `id="form-tj"`, `id="input-dy"`              |
| class  | `class="btn-hs"`, `class="section-playlist"` |
| JS 함수 | `function handleSubmit-tj()`                 |
| 변수명   | `const userInput-dj = ...`                   |

**이니셜 예시**:
- `tj` (택준), befit-ai
- `dy` (다영), playlist
- `hs` (현수), infermedica
- `dj` (동준), shopping

---

## 2. 디렉토리 구조 예시
```
BeFit/
├── .gitignore # Git 추적 제외 파일 설정
├── index.html # 메인 페이지
├── README.md # 프로젝트 소개 문서
│
├── assets/ # 공통 정적 리소스 디렉토리
│ ├── css/ # 메인 CSS 파일
│ ├── img/ # 프로젝트 이미지 리소스
│ └── js/ # 메인 JS 파일 및 환경설정(config.js 등)
│
├── docs/ # 프로젝트 산출/문서 자료
│
├── src/ # 기능별(페이지별) 소스코드 디렉토리
│ ├── befit-ai/
│ ├── infermedica/
│ ├── playlist/
│ └── shopping/

```