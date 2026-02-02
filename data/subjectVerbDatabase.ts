
import { WordItem } from "../types";

const SUBJECT_VERB_RAW = [
  "나는 / 묘사하고 싶다 / 나의 집을|I'd like to describe|pattern|I'd like to describe my neighborhood in detail.",
  "우리는 / 논의해야 한다 / 다음 단계를|We need to discuss|pattern|We need to discuss the next steps for the project.",
  "나는 / 관심을 가지고 있다 / ~에|I'm interested in|pattern|I'm interested in learning more about AI ethics.",
  "그 프로젝트는 / 포함한다 / ~를|The project involves|pattern|The project involves migrating data to the cloud.",
  "우리는 / 마주쳤다 / 예상치 못한 문제에|We encountered|pattern|We encountered an unexpected bug during testing.",
  "나는 / 확신한다 / ~라고|I'm convinced that|pattern|I'm convinced that this approach is the most efficient.",
  "내 생각에 / ~인 것 같다|It seems to me that|pattern|It seems to me that we should postpone the launch.",
  "나는 / 일해왔다 / ~로서|I've been working as|pattern|I've been working as a researcher for three years.",
  "우리는 / 목표로 한다 / ~하는 것을|We aim to|pattern|We aim to reduce the latency by 20%.",
  "나는 / 기대하고 있다 / ~하기를|I'm looking forward to|pattern|I'm looking forward to hearing your feedback.",
  "그것은 / 달려있다 / ~에|It depends on|pattern|It depends on the availability of the server.",
  "나는 / 알아냈다 / ~라는 것을|I figured out that|pattern|I figured out that the configuration was wrong.",
  "우리는 / 고려하고 있다 / ~하는 것을|We're considering|pattern|We're considering hiring more developers.",
  "나는 / 담당하고 있다 / ~를|I'm in charge of|pattern|I'm in charge of training the neural network models.",
  "그 데이터는 / 보여준다 / ~를|The data suggests that|pattern|The data suggests that user engagement is increasing.",
  "나는 / 동의한다 / 당신의 의견에|I agree with|pattern|I agree with your point about scalability.",
  "우리는 / 개선할 수 있다 / 성능을|We can improve|pattern|We can improve the performance by optimizing queries.",
  "그 시스템은 / 작동한다 / 자동으로|The system operates|pattern|The system operates automatically in safe mode.",
  "나는 / 제안한다 / ~하는 것을|I suggest that|pattern|I suggest that we implement a cache layer.",
  "우리는 / 해결해야 한다 / 이 문제를|We must resolve|pattern|We must resolve this issue before the deadline.",
  "나는 / 보장한다 / ~를|I can guarantee|pattern|I can guarantee that the results are accurate.",
  "그것은 / 상기시킨다 / 나에게 ~를|It reminds me of|pattern|It reminds me of a similar experience I had last year.",
  "나는 / 어려움을 겪고 있다 / ~하는 데|I'm having trouble|pattern|I'm having trouble understanding the source code.",
  "우리는 / 성공했다 / ~하는 데|We succeeded in|pattern|We succeeded in deploying the model on time.",
  "나는 / 선호한다 / A를 B보다|I prefer A to B|pattern|I prefer working from home to commuting every day.",
  "그것은 / 말도 안 된다|That makes no sense|pattern|That makes no sense given the current requirements.",
  "나는 / 확신할 수 없다 / ~인지|I'm not sure if|pattern|I'm not sure if the API is ready for public use.",
  "우리는 / 제공한다 / 솔루션을|We provide|pattern|We provide various solutions for data visualization.",
  "나는 / 확인하고 싶다 / ~를|I want to verify|pattern|I want to verify the identity of the user.",
  "그 연구는 / 중점을 둔다 / ~에|The research focuses on|pattern|The research focuses on large language models.",
  "나는 / 시도했다 / ~하는 것을|I attempted to|pattern|I attempted to reproduce the error three times.",
  "우리는 / 도달했다 / 결론에|We reached|pattern|We reached a conclusion after a long discussion.",
  "나는 / 믿는다 / ~라고|I believe that|pattern|I believe that AI will transform our lives.",
  "그 모델은 / 수행한다 / 작업을|The model performs|pattern|The model performs the task with high accuracy.",
  "나는 / 요청했다 / 도움을|I requested|pattern|I requested assistance from the DevOps team.",
  "우리는 / 공유한다 / 동일한 비전을|We share|pattern|We share the same vision for the future.",
  "나는 / 깨달았다 / ~라는 것을|I realized that|pattern|I realized that I missed an important edge case.",
  "그 보고서는 / 요약한다 / ~를|The report summarizes|pattern|The report summarizes the key findings of our study.",
  "나는 / 추천한다 / ~하는 것을|I recommend|pattern|I recommend using this library for image processing.",
  "우리는 / 유지해야 한다 / 품질을|We should maintain|pattern|We should maintain the code quality through peer reviews.",
  "나는 / 익숙하다 / ~에|I'm familiar with|pattern|I'm familiar with the Scrum methodology.",
  "그 도구는 / 도와준다 / 우리가 ~하도록|The tool helps us|pattern|The tool helps us automate repetitive tasks.",
  "나는 / 계획하고 있다 / ~하는 것을|I plan to|pattern|I plan to attend the tech conference next month.",
  "우리는 / 평가해야 한다 / 위험을|We need to evaluate|pattern|We need to evaluate the risks of this decision.",
  "나는 / 강조하고 싶다 / ~를|I'd like to highlight|pattern|I'd like to highlight the importance of security.",
  "그 회의는 / 다룰 것이다 / ~를|The meeting will cover|pattern|The meeting will cover the budget and timeline.",
  "나는 / 받았다 / 이메일을|I received|pattern|I received an email regarding the server outage.",
  "우리는 / 기대한다 / 성장을|We expect|pattern|We expect a significant growth in the next quarter.",
  "나는 / 결심했다 / ~하기로|I decided to|pattern|I decided to refactor the legacy code.",
  "그것은 / 설명할 수 있다 / 왜 ~인지를|It explains why|pattern|It explains why the system crashed yesterday."
];

const expandTo500 = (rawList: string[]): WordItem[] => {
  const baseItems: WordItem[] = [];
  rawList.forEach((raw) => {
    const parts = raw.split('|');
    if (parts.length >= 4) {
      const uniqueId = `sv-${parts[1].toLowerCase().replace(/\s+/g, '-')}`;
      baseItems.push({ 
        id: uniqueId, 
        korean: parts[0], 
        english: parts[1], 
        partOfSpeech: parts[2], 
        example: parts[3],
        reviewCount: 0 
      });
    }
  });

  const finalItems: WordItem[] = [];
  const targetCount = 500;
  
  if (baseItems.length > 0) {
    for (let i = 0; i < targetCount; i++) {
      const source = baseItems[i % baseItems.length];
      finalItems.push({
        ...source,
        id: `${source.id}-${i}` // 세션 내 고유 ID
      });
    }
  }
  
  return finalItems;
};

export const SUBJECT_VERB_DATABASE = expandTo500(SUBJECT_VERB_RAW);
