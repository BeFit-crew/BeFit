import config from "../../assets/js/config.js";
import { getBefitAiResult } from "../befit-ai/befit-ai.js";


// ========== 전역 변수 및 상수 ========== //
let startItemDj = 1; // 검색 시작위치 변수
let currentQueryDj = ""; // 현재 검색어를 저장하는 변수

// ========== DOM 요소 참조 ========== //
const inputDj = document.querySelector('.input-dj');
const searchBtnDj = document.querySelector('.search-btn-dj');
const productListDj = document.querySelector('.product-list-dj');
const recommendQueryListDj = document.querySelector('.recommend-list-dj');
const loadMoreBtnDj = document.querySelector('.load-more-btn-dj');

// ========== 핵심 로직 함수 정의 ========== //

/**
 * @description 새로운 검색을 시작하는 함수. 상태 초기화
 */
function initiateNewSearchDj() {
  const query = inputDj.value.trim();
  if (!query) {
    alert('검색어를 입력해주세요.');
    return;
  }
  startItemDj = 1; // 검색 시작 위치를 1로 초기화
  currentQueryDj = query; // 현재 검색어를 저장
  productListDj.innerHTML = ''; // ★★★ 새로운 검색이므로 기존 목록을 완전히 비움
  loadMoreBtnDj.classList.add('hidden-dj'); // 더보기 버튼 일단 숨김
  fetchAndDisplayProductsDj(); // API 요청 함수 호출
}

/**
 * @description 상품 더보기 클릭시 상품 8개 추가로 보여주기
 */
function loadMoreProductDj() {
  startItemDj += 8;
  fetchAndDisplayProductsDj(); // API 요청 함수만 호출
}

/**
 * @description 추천검색어 클릭시 검색이 되는 기능
 * @param e - 클릭시 이벤트 객체
 */
function searchRecommendQueryDj(e) {
  // 클릭된 요소가 li가 맞는지 확인
  if (e.target.matches('.recommend-list-item-dj')) {
    inputDj.value = e.target.textContent;
    initiateNewSearchDj(); // 추천 검색어도 새로운 검색이므로 이 함수를 호출
  }
}

/**
 * @description Ai가 보내준 추천 검색어를 list에 ui로 표시
 * @param queries - AI의 답변을 배열로 받은 파라미터
 */
function displayRecommendQueryDj(queries) {
  recommendQueryListDj.innerHTML = '';
  queries.forEach(query => {
    const queryListHTML = `
      <li class="recommend-list-item-dj">${query}</li>
    `;
    recommendQueryListDj.insertAdjacentHTML('beforeend', queryListHTML);
  });
}

/**
 * @description AI에게 질문하려고 적어둔 프롬프트
 * @returns {string} - AI에게 질문할 최종 프롬프트
 */
function generatePromptDj() {
  // DOMContentLoaded 없이 직접 함수를 호출하여 데이터를 가져옵니다.
  const aiData = getBefitAiResult();

  if (aiData && aiData.diet && aiData.training) {
    // 중첩된 배열의 모든 항목을 가져오기 위해 flatMap을 사용합니다.
    const meals = aiData.diet.flatMap(day => day.meals.map(meal => meal.menu).flat()).join(', ');
    const exercises = aiData.training.flatMap(day => day.routine.map(r => r.exercise)).join(', ');

    // 사용자의 알러지, 제한 음식, 선호 사항을 프롬프트에 반영합니다.
    const allergies = aiData.user.foodAllergies || '없음';
    const restrictions = aiData.user.restrictedFoods || '없음';
    const preferences = aiData.user.preferences || '없음';
    const preferredWorkout = aiData.user.preferredWorkout || '없음';

    const prompt = `
당신은 세계 최고의 상품 판매원입니다. 아래 사용자 정보를 바탕으로 운동, 건강, 식단과 관련된 제품 5개를 추천해주세요.

[사용자 정보]
- 음식 알러지: ${allergies}
- 제외해야 할 음식: ${restrictions}
- 선호하는 음식: ${preferences}
- 선호하는 운동: ${preferredWorkout}
- 추천 식단 메뉴: ${meals}
- 추천 운동 종류: ${exercises}

[요청 사항]
1.  위 사용자 정보를 모두 종합적으로 고려하여 가장 관련성 높은 상품 5개를 추천하세요.
2.  알러지 및 제외 음식과 관련된 상품은 반드시 제외해야 합니다.
3.  "닭가슴살 쉐이크 아령 요가매트 폼롤러" 와 같이, 각 상품 이름을 띄어쓰기 하나로 구분하여 한 줄로만 응답해주세요.
4.  '여성용', '남성용' 같은 단어는 상품명에서 제외해주세요.
5.  추가 질문 시에는 이전에 추천했던 상품은 제외하고 새로운 상품을 추천해주세요.

[출력 형식]
(상품1) (상품2) (상품3) (상품4) (상품5)`;
    return prompt;

  } else {
    // aiData가 없을 경우의 기본 프롬프트
    const prompt = `
당신은 세계 최고의 상품 판매원입니다. 운동과 건강, 식단에 관련된 제품을 5개 추천해주세요. (예: 아령, 쉐이크, 러닝화, 피망, 닭가슴살)
출력 형식은 "아령 쉐이크 러닝화" 같이 단어 사이에 띄어쓰기 하나씩만 넣어주세요. 상품명에 '여성용', '남성용' 같은 단어는 빼주세요.
추가로 질문 시 방금 답변한 상품들은 제외하고 다른 상품들로 채워주세요.

[출력 형식]
(상품1) (상품2) (상품3) (상품4) (상품5)`;
    return prompt;
  }
}

/**
 * @description AI에게 추천검색어를 받아오는 함수
 */
function  getRecommendQueryFromAiDj() {
  const prompt = generatePromptDj();
  const payload = { contents: [ { parts: [{text: prompt}] } ] };
  const requestData = JSON.stringify(payload);
  const xhr = new XMLHttpRequest();

  xhr.open('POST', config.AI_API_URL);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.addEventListener('load', e => {
    if (xhr.status === 200) {
      const responseData = JSON.parse(xhr.responseText);
      const queryText = responseData.candidates[0].content.parts[0].text;
      const queries = queryText.split(" ");
      displayRecommendQueryDj(queries);
    } else {
      console.error('API Error:', xhr.status, xhr.responseText);
      recommendQueryListDj.textContent = '추천검색어를 가져오는 데 실패했습니다.';
    }
  });
  xhr.addEventListener('error', e => {
    recommendQueryListDj.textContent = '네트워크 오류가 발생했습니다.';
  });
  xhr.send(requestData);
}
/**
 * @description API 요청 및 결과 표시만 하는 함수
 */
function fetchAndDisplayProductsDj() {
  if (!currentQueryDj) return; // 검색어가 없으면 실행 중지

  const xhr = new XMLHttpRequest();
  const url = `https://cors-anywhere.herokuapp.com/https://openapi.naver.com/v1/search/shop.json?query=${encodeURI(currentQueryDj)}&display=8&start=${startItemDj}`;

  xhr.open('GET', url, true);
  xhr.setRequestHeader(`X-Naver-Client-Id`, config.NAVER_CLIENT_ID);
  xhr.setRequestHeader(`X-Naver-Client-Secret`, config.NAVER_CLIENT_SECRET);

  xhr.addEventListener('load', e => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const data = JSON.parse(xhr.responseText);
      displayResultsDj(data.items); // 결과를 화면에 표시하는 함수 호출

      // 더 보여줄 상품이 있으면 '더보기' 버튼을 표시
      if (data.items && data.items.length > 0) {
        loadMoreBtnDj.classList.remove('hidden-dj');
      } else {
        loadMoreBtnDj.classList.add('hidden-dj');
        if (startItemDj > 1) { // 첫 페이지가 아닐 때만 메시지 표시
          alert('더 이상 상품이 없습니다.');
        }
      }
    } else {
      alert(`상품을 불러오는 데 실패했습니다.(서버오류)`);
    }
  });

  xhr.send();
}

/**
 * @description json으로 변환된 결과값을 카드형식으로 리스트에 출력
 * @param items - 서버에서 받아온 검색결과
 */
function displayResultsDj(items) {
  if ((!items || items.length === 0) && startItemDj === 1) {
    productListDj.innerHTML = '<p>검색 결과가 없습니다.</p>';
    loadMoreBtnDj.classList.add('hidden-dj');
    return;
  }

  items.forEach(item => {
    const formattedPrice = Number(item.lprice).toLocaleString();
    const productCardHTML = `
      <li class="product-list-item-dj">
        <div class="product-card-dj">
          <a href="${item.link}" target="_blank" class="a-dj">
            <img src="${item.image}" alt="${item.title}" class="product-img-dj">
            <p class="product-name-dj">${item.title}</p>
            <p class="product-maker-dj">${item.mallName || '정보 없음'}</p>
            <p class="product-price-dj">${formattedPrice}원</p>
          </a>
        </div>
      </li>
    `;
    productListDj.insertAdjacentHTML('beforeend', productCardHTML);
  });
}

// ========== 이벤트 리스너 설정  ========== //

// 검색버튼
searchBtnDj.addEventListener('click', initiateNewSearchDj); // 새로운 검색 함수 호출
inputDj.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    initiateNewSearchDj(); // 새로운 검색 함수 호출
  }
});

// ai추천 검색어
recommendQueryListDj.addEventListener('click', searchRecommendQueryDj);

// 상품 더보기
loadMoreBtnDj.addEventListener('click', loadMoreProductDj);


// ========== 실행 코드 ========== //
getRecommendQueryFromAiDj(); // AI의 추천검색어 화면에 표시