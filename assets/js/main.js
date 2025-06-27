/* index.html의 js 입니다. */

// 우상단 토글 버튼 클릭
const toggleBtn = document.querySelector('.aside-toggle-btn-main');
const asideWrapper = document.querySelector('.aside-wrapper-main');

toggleBtn.addEventListener('click', function () {
    asideWrapper.classList.toggle('open');
});