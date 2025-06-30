// 유튜브 API 키 하루 제한 있음 
const API_KEY = 'API키 입력';
let nextPageToken = '';  // 페이지 토큰 초기화
let currentQuery = '';  // 현재 쿼리 초기화

document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        tag.classList.toggle('active');
    });
});

function getSelectedText(id) {
    const active = document.querySelector(`#${id} .tag.active`);
    return active ? active.innerText : '';
}

function clearFilters() {
    document.querySelectorAll('.tag.active').forEach(tag => tag.classList.remove('active'));
    document.getElementById('duration').value = 30;
    document.getElementById('keyword').value = '';
    document.getElementById('results').innerHTML = '';  // 결과 비우기
    document.getElementById('videoContainer').style.display = 'none';  // 비디오 컨테이너 숨기기
    nextPageToken = '';  // 페이지 토큰 초기화
    currentQuery = '';   // 쿼리 초기화
}

function buildQuery() {
    const part = getSelectedText('bodyPart');  // 운동 부위
    const style = getSelectedText('style');    // 운동 스타일
    const duration = document.getElementById('duration').value;  // 운동 시간
    const keyword = document.getElementById('keyword').value;    // 키워드

    let query = '';

    if (part) query += `${part} `;
    if (style) query += `${style} `;
    if (duration) query += `${duration}분 운동 `;
    if (keyword) query += `${keyword} `;

    query += '운동 따라하기';

    console.log('Generated Query:', query);  // 쿼리 출력
    return query;
}

function searchVideos() {
    const query = buildQuery();  // 새로 만든 쿼리
    currentQuery = query;       // 현재 쿼리 업데이트
    nextPageToken = '';         // 페이지 토큰 초기화
    fetchVideos(query);         // 새로운 쿼리로 비디오 검색
}

function fetchVideos(query, pageToken = '') {
    document.getElementById('videoContainer').style.display = 'block';  // 비디오 컨테이너 표시
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&regionCode=KR&relevanceLanguage=ko&key=${API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    console.log('Request URL:', url);  // 요청 URL 확인
    fetch(url)
        .then(res => res.json())
        .then(data => {
            console.log('API Response:', data);  // API 응답 확인
            nextPageToken = data.nextPageToken || '';  // 다음 페이지 토큰 업데이트
            const container = document.getElementById('results');
            container.innerHTML = '';  // 기존 결과 비우기

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    if (item.id && item.id.videoId) {  // videoId가 있을 때만
                        console.log('Rendering Video:', item.id.videoId);  // 비디오 아이디 확인
                        const wrapper = document.createElement('div');
                        wrapper.className = 'video-item';
                        wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.id.videoId}" allowfullscreen></iframe>`;
                        container.appendChild(wrapper);
                    } else {
                        console.log('No videoId:', item);  // videoId가 없을 때 로그
                    }
                });
            } else {
                container.innerHTML = '<p>No videos found.</p>';  // 비디오 없을 때 표시
            }
        })
        .catch(error => console.error('Error fetching videos:', error));  // 오류 출력
}
