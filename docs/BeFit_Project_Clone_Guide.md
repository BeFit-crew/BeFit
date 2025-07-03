
# 📦 BeFit AI 프로젝트 클론 및 환경설정 가이드

본 문서는 BeFit AI 프로젝트를 클론하여 로컬에서 정상적으로 개발 및 실행하기 위한
환경 설정 방법과 필수 유의사항을 안내합니다.

---

## 1. 프로젝트 클론 및 환경설정 절차

### 1-1. 필수 파일(config.js) 생성

`assets/js` 디렉토리 하위에 **`config.js`** 파일을 생성합니다.

### 1-2. `.gitignore` 보안 설정

API 키가 외부에 유출되지 않도록, 아래 내용을 `.gitignore`에 반드시 추가해 주세요.

```
config.js
assets/js/config.js
assets/js/config.*.js
config.local.js
```

---

## 2. config.js 예시 코드

아래 코드를 `assets/js/config.js`에 복사한 후  
각자 발급받은 API 키를 **`''`** 부분에 입력하세요.

```javascript
// Gemini API 키 (절대 유출 금지)
const befit_AI_API_KEY = '';
export const befit_AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${befit_AI_API_KEY}`;

// YouTube API 키 (절대 유출 금지)
export const youtube_AI_API_KEY = '';

// (선택) 추가 Gemini API 키
export const API_KEY_HS = "";

// Naver, Gemini 등 통합 config 객체
const config = {
  // Gemini API 키 (절대 유출 금지)
  AI_API_KEY: '',
  AI_API_URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`,

  // Naver 검색 API 키 (절대 유출 금지)
  NAVER_CLIENT_ID: '',
  NAVER_CLIENT_SECRET: '',
};

export default config;
```

> ⚠️ **주의:**  
> API 키 등 민감 정보는 커밋, 공유, 공개 저장소 업로드를 절대 금지합니다.

---

## 3. API 키 발급 안내

각 키는 아래 공식 페이지에서 직접 발급받으실 수 있습니다.

- **Google Gemini API**  
  [https://ai.google.dev/](https://ai.google.dev/)  
  (Google Cloud Platform 회원가입 및 프로젝트 생성 후 키 발급)

- **YouTube Data API**  
  [https://console.cloud.google.com/apis/library/youtube.googleapis.com](https://console.cloud.google.com/apis/library/youtube.googleapis.com)  
  (Google Cloud Platform에서 API 사용 설정 후 키 발급)

- **Naver Developers (쇼핑/검색 등)**  
  [https://developers.naver.com/](https://developers.naver.com/)  
  (네이버 개발자센터 회원가입 후 앱 등록 및 Client ID/Secret 발급)  
  ※ Naver 검색 API를 사용할 때는  
  [CORS 프록시](https://cors-anywhere.herokuapp.com/corsdemo)에서 임시 서버 등록 후 사용 가능합니다.

---

## 4. 문의 및 지원

> 궁금한 점은 언제든 GitHub Issue, 댓글, 혹은 메일로 문의 바랍니다.

[GitHub Repository 바로가기](https://github.com/BeFit-crew/BeFit)

이메일: [wtj1998@naver.com](mailto:wtj1998@naver.com)

---

> 본 가이드를 반드시 참고하여 안전하게 프로젝트를 실행해 주세요.