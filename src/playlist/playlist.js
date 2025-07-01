import { getBefitAiResult } from '../befit-ai/modules/storage-befit-ai.js';
import { youtube_AI_API_KEY } from "../../assets/js/config.js";

let nextPageToken = '';
let currentQuery = '';
let currentSlideIndex = 0;

// 슬라이드 버튼
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
nextBtn?.addEventListener('click', () => {
    currentSlideIndex++;
    updateAutoSection();
});
prevBtn?.addEventListener('click', () => {
    currentSlideIndex--;
    updateAutoSection();
});

function updateAutoSection() {
    const slider = document.getElementById('autoResults');
    const videoItems = slider.querySelectorAll('.video-item');
    const totalSlides = videoItems.length;

    if (currentSlideIndex < 0) currentSlideIndex = totalSlides - 1;
    if (currentSlideIndex >= totalSlides) currentSlideIndex = 0;

    const offset = currentSlideIndex * 100;
    slider.style.transform = `translateX(-${offset}%)`;
    slider.style.width = '100%';
    videoItems.forEach(item => {
        item.style.flex = `0 0 100%`;
    });
}

// ✅ 자동 추천 전용 영상 불러오기 (duration 사용)
function fetchAutoVideos(query, duration = 30) {
    const container = document.getElementById('autoResults');
    document.getElementById('autoResultsContainer').style.display = 'block';

    let durationFilter = '';
    if (duration >= 40) {
        durationFilter = '&videoDuration=long';
    } else if (duration >= 10) {
        durationFilter = '&videoDuration=medium';
    } else {
        durationFilter = '&videoDuration=short';
    }

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&regionCode=KR&relevanceLanguage=ko&key=${youtube_AI_API_KEY}${durationFilter}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            nextPageToken = data.nextPageToken || '';
            container.innerHTML = '';

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    if (item.id && item.id.videoId) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'video-item';
                        wrapper.innerHTML = `
                            <iframe src="https://www.youtube.com/embed/${item.id.videoId}" allowfullscreen></iframe>
                        `;
                        container.appendChild(wrapper);
                    }
                });
                updateAutoSection();
            } else {
                container.innerHTML = '<p>추천 영상을 찾을 수 없습니다.</p>';
            }
        })
        .catch(error => console.error('❌ 자동 영상 불러오기 실패:', error));
}

function searchVideosFromAIData(aiData) {
    if (!aiData || !aiData.training || aiData.training.length === 0) return;

    const user = aiData.user;
    const firstDay = aiData.training[0];
    const parts = [...new Set(firstDay.routine.map(ex => ex.part))];
    const duration = aiData.workoutTime ?? 60;
    const gender = user.gender ?? '';
    const goal = user.goal ?? '';
    const period = user.days ?? user.period ?? '';

    const query = `${gender} ${parts.join(' ')} 운동 ${duration}분 ${goal} 루틴`.trim();
    currentQuery = query;
    nextPageToken = '';
    fetchAutoVideos(query, duration); // 자동만 duration 적용
}

document.addEventListener('DOMContentLoaded', () => {
    const aiData = getBefitAiResult();

    if (aiData) {
        const user = aiData.user;
        const firstDay = aiData.training[0];
        const workoutTime = aiData.workoutTime ?? 60;
        const workoutTimeDisplay = `${workoutTime}분`;
        const period = user.days ?? user.period ?? '';
        const parts = [...new Set(firstDay.routine.map(ex => ex.part))];

        const keywords = [
            user.age ? `${user.age}세` : null,
            user.gender ?? null,
            period ? `${period}일` : null,
            workoutTimeDisplay,
            ...parts
        ].filter(Boolean);

        const keywordHTML = keywords.map(k => `<span class="tag">${k}</span>`).join('');
        const resultDisplay = document.getElementById('result-display');
        resultDisplay.innerHTML = keywordHTML;
        resultDisplay.style.display = 'flex';
        resultDisplay.style.flexWrap = 'wrap';
        resultDisplay.style.justifyContent = 'center';
        resultDisplay.style.gap = '10px';
        resultDisplay.style.maxWidth = '720px';
        resultDisplay.style.margin = '0 auto';

        searchVideosFromAIData(aiData);
    } else {
        document.querySelector('h1').textContent = "저장된 AI 결과가 없습니다.";
    }
});

// 수동 검색 관련은 기존 그대로 유지
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        tag.classList.toggle('active');
    });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.querySelectorAll('.tag.active').forEach(tag => tag.classList.remove('active'));
    document.getElementById('duration').value = 30;
    document.getElementById('keyword').value = '';
    document.getElementById('manualResults').innerHTML = '';
    document.getElementById('manualResultsContainer').style.display = 'none';
    nextPageToken = '';
    currentQuery = '';
});

document.getElementById('searchBtn').addEventListener('click', () => {
    const container = document.getElementById('manualResultsContainer');
    if (container) container.style.display = 'block';

    const query = buildQuery();
    currentQuery = query;
    nextPageToken = '';
    fetchManualVideos(query); // duration 없이 수동은 그대로
});

function fetchManualVideos(query, pageToken = '') {
    const container = document.getElementById('manualResults');

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&regionCode=KR&relevanceLanguage=ko&key=${youtube_AI_API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            nextPageToken = data.nextPageToken || '';
            container.innerHTML = '';

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    if (item.id && item.id.videoId) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'video-item';
                        wrapper.innerHTML = `
                            <iframe src="https://www.youtube.com/embed/${item.id.videoId}" allowfullscreen></iframe>
                        `;
                        container.appendChild(wrapper);
                    }
                });
            } else {
                container.innerHTML = '<p>추천 영상을 찾을 수 없습니다.</p>';
            }
        })
        .catch(error => console.error('❌ 수동 영상 불러오기 실패:', error));
}

function getSelectedText(id) {
    const active = document.querySelector(`#${id} .tag.active`);
    return active ? active.innerText : '';
}

function buildQuery() {
    const part = getSelectedText('bodyPart');
    const style = getSelectedText('style');
    const duration = document.getElementById('duration').value;
    const keyword = document.getElementById('keyword').value;

    let query = '';
    if (part) query += `${part} `;
    if (style) query += `${style} `;
    if (duration) query += `${duration}분 운동 `;
    if (keyword) query += `${keyword} `;
    query += '운동 따라하기';

    return query;
}
