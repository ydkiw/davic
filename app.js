import config from "../config.js"; // config.js에서 config 객체를 가져옵니다.


async function getCompletion(text) {
    const apiUrl = "https://api.minigpt4o.com/v1/generate";
    const { API_KEY } = config; // API_KEY를 구조 분해 할당으로 가져옵니다.
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: text,
        max_tokens: 100
      })
    });
  
    const data = await response.json();
    return data.choices[0].text;
  }

  async function generate() {
    const prompt = document.getElementById("prompt").value;
    const output = document.getElementById("output");
  
    if (!prompt) return;
  
    const completion = await getCompletion(prompt);
    output.innerText = completion;
  }

  const startScreen = document.getElementById('start-screen');
    const gameUI = document.getElementById('game-ui');
    const dialogueText = document.getElementById('dialogue-text');
    const optionsDiv = document.getElementById('keyword-options');
    const endButton = document.getElementById('end-button');

    let storyText = "미대생이 대학교에서 야작을 하고 있다."; // 초기 스토리 시작
    let objectionCount = 0;
    const maxObjections = 5;
    let passageCount = 0; // 대사 넘길 횟수
    const maxPassages = 3; // 엔터 키로 대사 넘길 수 있는 횟수 제한
    let keywordSelections = 0; // 키워드 선택 횟수

    // GPT-4o 미니 API 호출
    async function continueStory(prompt, isEnding = false) {
        try {
          const modelPrompt = isEnding ? `${prompt} 이야기의 결말을 지어줘.` : prompt;
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}` // API 키 입력
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "system", content: "너는 이야기 교수님이야." }, { role: "user", content: modelPrompt }],
              max_tokens: 100,
              n: 1,
              stop: null,
              temperature: 0.7
            })
          });

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error("Story generation error: ", error);
        return "스토리를 불러오는데 문제가 발생했습니다.";
      }
    }

    // 키워드 무작위 생성 요청
    async function generateRandomKeywords() {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}` // API 키 입력
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "세 가지 키워드를 무작위로 생성해줘." }],
            max_tokens: 50,
            n: 1,
            stop: null,
            temperature: 0.7
          })
        });

        const data = await response.json();
        const keywordText = data.choices[0].message.content;
        return keywordText.split(','); // 키워드를 쉼표로 구분하여 배열로 반환
      } catch (error) {
        console.error("Keyword generation error: ", error);
        return ["문제 발생", "재시도", "오류"]; // 문제가 발생했을 경우 기본 키워드 제공
      }
    }

    // 키워드 선택지 표시
    async function showKeywordOptions() {
      const keywords = await generateRandomKeywords(); // AI로부터 키워드 생성
      optionsDiv.innerHTML = ''; // 기존 키워드 제거
      keywords.forEach(keyword => {
        const button = document.createElement('button');
        button.innerText = keyword.trim(); // 키워드 버튼 생성
        button.onclick = () => chooseKeyword(keyword.trim());
        optionsDiv.appendChild(button);
      });
      optionsDiv.style.display = 'block';
    }

    // 키워드 선택 후 이야기 전개
    async function chooseKeyword(keyword) {
      storyText += `\n\n선택된 키워드: ${keyword}`;
      dialogueText.innerText = `선택된 키워드: ${keyword}로 이야기가 계속됩니다...`;
      const newStory = await continueStory(storyText + ` 선택된 키워드: ${keyword}`);
      storyText += "\n" + newStory;
      dialogueText.innerText = newStory;
      optionsDiv.style.display = 'none';
      keywordSelections++;

      // 3번 키워드를 선택하면 추가 문장 3개 생성 후 "마무리" 버튼 표시
      if (keywordSelections === 3) {
        for (let i = 0; i < 3; i++) {
          const additionalStory = await continueStory(storyText);
          storyText += "\n" + additionalStory;
          dialogueText.innerText = additionalStory;
        }
        endButton.style.display = 'block'; // 마무리 버튼 표시
      }

      passageCount = 0; // 대사 넘길 횟수 초기화
    }

    // 대사 넘기기 기능
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && passageCount < maxPassages) {
        const nextPassage = await continueStory(storyText);
        dialogueText.innerText = nextPassage;
        storyText += "\n" + nextPassage;
        passageCount++;
        if (passageCount === maxPassages) {
          // 대사를 다 넘겼으면 키워드 선택 화면으로 전환
          showKeywordOptions();
        }
      }
    });

    // 게임 시작 화면에서 Enter 누르면 게임 시작
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && startScreen.style.display !== 'none') {
        startScreen.style.display = 'none';
        gameUI.style.display = 'block';
      }
    });

    // 마무리 버튼 클릭 시 스토리 요약 창 표시
    endButton.onclick = () => {
      const summaryWindow = window.open("", "Story Summary", "width=600,height=400");
      summaryWindow.document.write("<h1>스토리 요약</h1><pre>" + storyText + "</pre>");
      summaryWindow.document.close();
    };