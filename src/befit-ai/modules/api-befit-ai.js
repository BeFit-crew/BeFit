// /src/befit-ai/modules/api-befit-ai.js

/**
 * @file BeFit AI 기능의 외부 API 통신을 전담하는 모듈입니다.
 * @description 이 파일은 사용자의 입력을 바탕으로 Gemini AI에게 보낼 프롬프트를 생성하고,
 *              실제로 API를 호출하여 그 응답을 받아오는 역할을 합니다.
 *              API URL, 프롬프트 구조, API 호출 방식 등 서버와의 모든 상호작용은 이 파일에서 관리됩니다.
 */


// [의존성] 외부 설정 파일에서 Gemini API의 URL을 가져옵니다.
import { befit_AI_API_URL } from '../../../assets/js/config.js';

/**
 * Gemini AI에게 전달할 상세한 프롬프트(명령어) 문자열을 생성합니다.
 * 이 함수의 목표는 사용자의 입력을 바탕으로 AI가 일관된 고품질 JSON 데이터를 생성하도록 유도하는 것입니다.
 * @param {Object} data - 사용자가 폼에 입력한 데이터 객체.
 * @returns {string} - AI에게 전달될 최종 프롬프트 문자열.
 */
export function buildPrompt(data) {
    // [중요] AI의 과부하를 방지하고 일주일 단위의 반복 가능한 계획을 받기 위해, 목표 기간이 7일을 넘더라도 계획은 최대 7일치만 요청합니다.
    const planDays = Math.min(data.days, 7);

    // [코드 패턴] 사용자가 직접 수치를 입력했는지, 아니면 '수준'을 선택해 자동 계산되었는지 명확히 표시하는 텍스트를 생성합니다.
    const fatMassText = data.fatRate
        ? `${data.fatRate}% (${data.fatLevel ? `수준 '${data.fatLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.fatLevel || '미입력');
    const muscleMassText = data.skeletalMuscleMass
        ? `${data.skeletalMuscleMass}kg (${data.muscleLevel ? `수준 '${data.muscleLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.muscleLevel || '미입력');
    const activityText = data.activityCal
        ? `${data.activityCal}kcal (${data.activityLevel ? `수준 '${data.activityLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.activityLevel || '미입력');
    const targetFatText = data.targetFatRate
        ? `${data.targetFatRate}% (${data.targetFatLevel ? `수준 '${data.targetFatLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.targetFatLevel || '미입력');
    const targetMuscleText = data.targetSkeletalMuscleMass
        ? `${data.targetSkeletalMuscleMass}kg (${data.targetSkeletalMuscleMassLevel ? `수준 '${data.targetSkeletalMuscleMassLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.targetSkeletalMuscleMassLevel || '미입력');

    // 사용자가 희망 운동 시간을 입력하지 않았을 경우, 기본값을 설정합니다.
    const workoutFrequencyText = data.preferredWorkoutTime || "주 7회";
    // '하루 60분' 같은 텍스트에서 숫자만 추출하고, 실패 시 기본값 60을 사용합니다.
    const workoutTimeNumber = data.preferredWorkoutTime ? (data.preferredWorkoutTime.match(/\d+/)?.[0] || 60) : 60;

    // [핵심] AI에게 전달할 프롬프트 템플릿입니다. 백틱(`)을 사용한 템플릿 리터럴 문법입니다.
    return `당신은 전문 트레이너이자 영양사입니다.

다음 사용자 정보를 바탕으로,
- 건강 식단(diet)
- 운동 루틴(training)
- 목표 및 변화 분석(analysis)
- 하루 평균 운동 소요 시간(workoutTime)

을 반드시 아래 **JSON** 구조로만 응답하세요.

**[계획 생성 중요 규칙]**
- 사용자가 반복해서 수행할 수 있는 **${planDays}일치** 대표 계획을 생성합니다.
- 사용자의 희망 운동 빈도(**${workoutFrequencyText}**)를 반드시 준수하여 운동일을 배정하세요.
- 운동이 없는 날은 **"휴식"**으로 명확히 표시해야 합니다.

**[중요] JSON 구조 예시**
// 이 예시 구조는 AI가 따라야 할 명확한 '스키마' 역할을 합니다.
// AI가 이 구조를 정확히 따르도록 유도하여, 우리가 원하는 포맷의 데이터를 안정적으로 받을 수 있게 합니다.
{
  "user": {
    "gender": "${data.gender || '입력하지 않음'}",
    "age": ${data.age},
    "height": ${data.height},
    "weight": ${data.weight},
    "fatRate": ${data.fatRate || null},
    "skeletalMuscleMass": ${data.skeletalMuscleMass || null},
    "activityCal": ${data.activityCal || null},
    "bmr": ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual},
    "targetWeight": ${data.targetWeight || null},
    "targetFatRate": ${data.targetFatRate || null},
    "targetSkeletalMuscleMass": ${data.targetSkeletalMuscleMass || null},
    "days": ${data.days},
    "limitations": "${data.limitations || '없음'}",
    "foodAllergies": "${data.foodAllergies || '없음'}",
    "restrictedFoods": "${data.restrictedFoods || '없음'}",
    "preferences": "${data.preferences || '없음'}",
    "preferredWorkout": "${data.preferredWorkout || '없음'}",
    "preferredWorkoutTime": "${workoutFrequencyText}"
  },
  "diet": [
    {
      "day": 1,
      "meals": [ { "type": "아침", "menu": ["닭가슴살"], "kcal": 400 } ]
    }
  ],
  "training": [
    {
      "day": 1,
      "routine": [ { "part": "가슴", "exercise": "벤치프레스", "set": "3 x 10" } ]
    },
    {
      "day": 2,
      "routine": [ { "part": "휴식", "exercise": "충분한 수면과 스트레칭", "set": "휴식" } ]
    }
  ],
  "analysis": {
    "goalWeight": null,
    "goalFatRate": null,
    "goalSkeletalMuscle": null,
    "expectedChange": "목표 달성 요약"
  },
  "workoutTime": ${workoutTimeNumber}
}

// 사용자 정보를 다시 한번 명시적으로 제공하여 AI가 컨텍스트를 잃지 않도록 합니다.
[사용자 정보]
- 성별: ${data.gender || '입력하지 않음'}
- 나이: ${data.age}
- 키: ${data.height}cm
- 몸무게: ${data.weight}kg
- 체지방률: ${fatMassText}
- 골격근량: ${muscleMassText}
- 활동 칼로리: ${activityText}
- 기초대사량: ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual}kcal
- 목표 체중: ${data.targetWeight || '미입력'}kg
- 목표 체지방률: ${targetFatText}
- 목표 골격근량: ${targetMuscleText}
- 목표 일수: ${data.days}일
- 건강 특이사항: ${data.limitations || '없음'}
- 음식 알러지: ${data.foodAllergies || '없음'}
- 제외할 음식: ${data.restrictedFoods || '없음'}
- 먹고 싶은 음식: ${data.preferences || '없음'}
- 선호 운동: ${data.preferredWorkout || '없음'}
- 운동 희망 시간 및 빈도: ${workoutFrequencyText}

**[최종 지시]**
// AI가 실수를 저지르기 쉬운 부분들을 다시 한번 강조하여 오류를 방지합니다.
- 반드시 day1부터 day${planDays}까지 모두 채운 JSON 배열로 응답하세요.
- **운동이 없는 날의 routine**은 \`[{"part": "휴식", "exercise": "가벼운 산책 또는 스트레칭", "set": "휴식"}]\` 과 같이 명확하게 '휴식'으로 채워주세요.
- 마크다운, 설명문, 코드블록(\`\`\`) 없이 순수 JSON만 반환하세요.

[위 사용자 정보와 구조로 ${planDays}일치 식단·운동·분석·운동시간을 한국어로 상세히 채워주세요]`;
}

/**
 * 생성된 프롬프트를 Gemini API 서버로 비동기 전송하고, 응답 텍스트를 반환합니다.
 * 'async' 키워드는 이 함수가 비동기적으로 동작하며, 'await'을 사용할 수 있음을 의미합니다.
 * @param {string} prompt - buildPrompt 함수로부터 생성된 프롬프트 문자열.
 * @returns {Promise<string|null>} - 성공 시 AI가 생성한 텍스트를, 실패 시 null을 반환하는 프로미스 객체.
 */
export async function callGeminiAPI(prompt) {
    // [중요] try...catch 문은 API 통신 중 발생할 수 있는 네트워크 오류, 서버 오류 등을 잡아내기 위한 필수적인 구문입니다.
    try {
        // 'await' 키워드는 fetch 요청이 완료될 때까지 코드 실행을 기다리게 합니다.
        // 이를 통해 UI가 멈추는 것을 방지하고, 응답을 받은 후에 다음 코드를 실행할 수 있습니다.
        const response = await fetch(befit_AI_API_URL, {
            method: 'POST', // 데이터를 서버로 전송하기 위해 POST 메소드 사용
            headers: {
                'Content-Type': 'application/json', // 전송하는 데이터의 형식이 JSON임을 명시
            },
            // 'body'에는 실제 전송할 데이터를 담습니다. JavaScript 객체를 JSON 문자열로 변환해야 합니다.
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            })
        });

        // 'response.ok'는 HTTP 상태 코드가 200-299 범위에 있는지 확인합니다. (예: 404 Not Found, 500 Server Error 등은 false)
        if (!response.ok) {
            // 요청이 성공하지 않았을 경우, 에러 객체를 생성하여 catch 블록으로 보냅니다.
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }

        // 서버로부터 받은 JSON 응답을 JavaScript 객체로 파싱합니다. 이 과정도 비동기이므로 await을 사용합니다.
        const json = await response.json();

        // [핵심] Optional Chaining(?.)과 Nullish Coalescing(??)을 사용한 안전한 데이터 접근
        // 만약 응답 구조가 예상과 달라 'candidates'나 'content' 등이 없을 경우, 에러를 발생시키는 대신 null을 반환합니다.
        // ?. : 중간 경로에 있는 속성이 null이나 undefined이면 즉시 undefined를 반환하여 TypeError를 방지합니다.
        // ?? : 왼쪽 값이 null 또는 undefined일 경우에만 오른쪽 값(null)을 사용합니다.
        return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;

    } catch (error) {
        // 네트워크 문제나 위에서 throw한 에러가 여기서 잡힙니다.
        console.error("Gemini API 호출 오류:", error);
        // 잡힌 에러를 다시 던져서, 이 함수를 호출한 상위 핸들러(예: befit-ai.js의 handleFormSubmit)가
        // 에러 상황을 인지하고 사용자에게 오류 메시지를 보여줄 수 있게 합니다.
        throw error;
    }
}